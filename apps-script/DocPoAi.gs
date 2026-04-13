// ============================================================
//  DocPo AI v3.0 — Google Apps Script
//  Full chatbot inside Google Docs
//  - Persistent chat with memory
//  - Multi-file Drive context
//  - Live document read + edit
//  - Fixed selection replace
//  - Long-form content generation
// ============================================================

var DOCPOAI_VERSION = '1.0';
var PROP_API_KEY    = 'DOCPOAI_GEMINI_KEY';
var PROP_UNDO       = 'DOCPOAI_UNDO';
var PROP_CONTEXT    = 'DOCPOAI_DRIVE_CONTEXT';

// ─────────────────────────────────────────────────────────────
//  MENU
// ─────────────────────────────────────────────────────────────
function onOpen() {
  try {
    var ui = DocumentApp.getUi();

    ui.createMenu('🐼DocPo')
      .addItem('Format this Proposal', 'showLoaderSidebar')
      // .addItem('AI Prompt', 'showProposalPrompt')
      .addItem('Format this RFP  |  Prompt  — coming soon', 'showRFPComingSoon')
      .addSeparator()
      .addItem('Settings', 'showSettingsDialog')
      .addItem('About', 'showAbout')
      .addToUi();

    ui.createMenu('DocPo AI')
      .addItem('Open AI Assistant', 'showDocPoAISidebar')
      .addSeparator()
      .addItem('Set API Key', 'showApiKeyPrompt')
      .addItem('About DocPo AI', 'showDocPoAIAbout')
      .addToUi();

  } catch (e) {
    Logger.log('onOpen error: ' + e.message);
  }
}

function showDocPoAIAbout() {
  DocumentApp.getUi().alert(
    'DocPo AI v' + DOCPOAI_VERSION,
    'AI-powered content assistant for Google Docs.\n\n' +
    '- Full chat with conversation memory\n' +
    '- Multi-file Drive context\n' +
    '- Live document read and edit\n' +
    '- Footnote placeholder auto-conversion\n' +
    '- Undo last AI edit\n\n' +
    'Powered by Groq (Llama 3.3 70B).',
    DocumentApp.getUi().ButtonSet.OK
  );
}

// ─────────────────────────────────────────────────────────────
//  SIDEBAR
// ─────────────────────────────────────────────────────────────
function showDocPoAISidebar() {
  var html = HtmlService
    .createHtmlOutputFromFile('DocPoAI_Sidebar')
    .setTitle('DocPo AI')
    .setWidth(380);
  DocumentApp.getUi().showSidebar(html);
}

// ─────────────────────────────────────────────────────────────
//  API KEY
// ─────────────────────────────────────────────────────────────
function showApiKeyPrompt() {
  var ui = DocumentApp.getUi();
  var res = ui.prompt(
    'Groq API Key',
    'Paste your Groq API key (get free at console.groq.com):',
    ui.ButtonSet.OK_CANCEL
  );
  if (res.getSelectedButton() === ui.Button.OK) {
    var key = res.getResponseText().trim();
    if (key) {
      PropertiesService.getScriptProperties().setProperty(PROP_API_KEY, key);
      ui.alert('API key saved. Reload the sidebar.');
    }
  }
}

function getApiKey() {
  return PropertiesService.getScriptProperties().getProperty(PROP_API_KEY) || '';
}

function hasApiKey() {
  return !!getApiKey();
}

// ─────────────────────────────────────────────────────────────
//  LIVE DOCUMENT READER
//  Always reads current document content for context
// ─────────────────────────────────────────────────────────────
function getDocumentContent() {
  try {
    var body = getBody_();
    var text = body.getText();
    // Return up to 12000 chars of the current document as context
    return {
      success: true,
      content: text.substring(0, 12000),
      length: text.length,
      truncated: text.length > 12000
    };
  } catch (e) {
    return { success: false, content: '', error: e.message };
  }
}

// ─────────────────────────────────────────────────────────────
//  SELECTED TEXT
// ─────────────────────────────────────────────────────────────
function getSelectedText() {
  try {
    var doc = DocumentApp.getActiveDocument();
    var selection = doc.getSelection();
    if (!selection) return { found: false, text: '' };

    var elements = selection.getRangeElements();
    var text = '';
    for (var i = 0; i < elements.length; i++) {
      var el = elements[i];
      if (el.getElement().editAsText) {
        var t = el.getElement().asText();
        if (el.isPartial()) {
          text += t.getText().substring(
            el.getStartOffset(),
            el.getEndOffsetInclusive() + 1
          );
        } else {
          text += t.getText();
        }
        if (i < elements.length - 1) text += '\n';
      }
    }
    return { found: text.length > 0, text: text };
  } catch (e) {
    return { found: false, text: '', error: e.message };
  }
}

// ─────────────────────────────────────────────────────────────
//  REPLACE SELECTED TEXT — FIXED
//  Key fix: we use findText with a unique anchor from the
//  selected text rather than relying on selection being alive
// ─────────────────────────────────────────────────────────────
function replaceTextInDocument(originalText, newText) {
  try {
    var body = getBody_();

    if (!originalText || originalText.trim().length === 0) {
      return { success: false, error: 'Original text is empty.' };
    }

    // Build search anchors — try progressively shorter chunks
    // to find the text even if it spans multiple elements
    var anchors = [
      originalText.substring(0, 150),
      originalText.substring(0, 80),
      originalText.substring(0, 40),
    ];

    var found = null;
    var usedAnchor = '';

    for (var a = 0; a < anchors.length; a++) {
      var escaped = escapeRegex_(anchors[a].trim());
      if (!escaped) continue;
      found = body.findText(escaped);
      if (found) {
        usedAnchor = anchors[a].trim();
        break;
      }
    }

    if (!found) {
      return {
        success: false,
        error: 'Could not locate the text in the document. Make sure you clicked "Read selection" immediately before clicking Modify, without clicking elsewhere in the doc.'
      };
    }

    // We found the paragraph element containing the text
    var textEl = found.getElement().asText();
    var fullParaText = textEl.getText();
    var startOff = found.getStartOffset();

    // Find where in this element our full original text starts
    var exactIdx = fullParaText.indexOf(originalText.substring(0, 100));
    if (exactIdx >= 0) {
      startOff = exactIdx;
    }

    var endOff = startOff + originalText.length - 1;
    if (endOff >= fullParaText.length) {
      endOff = fullParaText.length - 1;
    }

    // Save undo state BEFORE modifying
    saveUndoState(originalText, newText, startOff);

    // Delete original and insert new
    textEl.deleteText(startOff, endOff);
    textEl.insertText(startOff, newText);

    return { success: true };
  } catch (e) {
    return { success: false, error: e.message };
  }
}

// ─────────────────────────────────────────────────────────────
//  UNDO
// ─────────────────────────────────────────────────────────────
function saveUndoState(originalText, newText, offset) {
  var state = JSON.stringify({
    original: originalText,
    replaced: newText,
    offset: offset || 0,
    ts: Date.now()
  });
  PropertiesService.getDocumentProperties().setProperty(PROP_UNDO, state);
}

function undoLastEdit() {
  try {
    var raw = PropertiesService.getDocumentProperties().getProperty(PROP_UNDO);
    if (!raw) return { success: false, error: 'Nothing to undo.' };

    var state = JSON.parse(raw);
    var body = getBody_();

    // Search for the replaced (new) text to undo it
    var searchStr = state.replaced.substring(0, 100).trim();
    var found = body.findText(escapeRegex_(searchStr));

    if (!found) {
      return { success: false, error: 'Cannot undo — the edited text has been modified again or could not be found.' };
    }

    var textEl = found.getElement().asText();
    var fullText = textEl.getText();
    var startIdx = fullText.indexOf(state.replaced.substring(0, 80));
    if (startIdx < 0) startIdx = found.getStartOffset();

    var endIdx = startIdx + state.replaced.length - 1;
    if (endIdx >= fullText.length) endIdx = fullText.length - 1;

    textEl.deleteText(startIdx, endIdx);
    textEl.insertText(startIdx, state.original);

    PropertiesService.getDocumentProperties().deleteProperty(PROP_UNDO);
    return { success: true };
  } catch (e) {
    return { success: false, error: e.message };
  }
}

function escapeRegex_(str) {
  return (str || '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// ─────────────────────────────────────────────────────────────
//  INSERT AT CURSOR
// ─────────────────────────────────────────────────────────────
function insertAtCursor(text) {
  try {
    var doc = DocumentApp.getActiveDocument();
    var cursor = doc.getCursor();
    var body = getBody_();
    var lines = text.split('\n');

    if (cursor) {
      var bodyChild = cursor.getElement();
      while (bodyChild.getParent() &&
             bodyChild.getParent().getType() !== DocumentApp.ElementType.BODY_SECTION) {
        bodyChild = bodyChild.getParent();
      }
      var insertIndex = body.getChildIndex(bodyChild);
      if (insertIndex < 0) insertIndex = body.getNumChildren() - 1;

      var pos = insertIndex + 1;
      for (var i = 0; i < lines.length; i++) {
        var line = lines[i];
        if (line.trim() !== '') {
          var para = body.insertParagraph(pos, line);
          applyHeadingStyle_(para, line);
          pos++;
        } else if (i > 0 && i < lines.length - 1) {
          body.insertParagraph(pos, '');
          pos++;
        }
      }
    } else {
      body.appendParagraph('');
      for (var j = 0; j < lines.length; j++) {
        if (lines[j].trim() !== '') {
          var p = body.appendParagraph(lines[j]);
          applyHeadingStyle_(p, lines[j]);
        }
      }
    }

    return { success: true };
  } catch (e) {
    return { success: false, error: e.message };
  }
}

function applyHeadingStyle_(para, line) {
  var trimmed = line.trim();
  if (/^\d+\.\s+[A-Z]/.test(trimmed) && !/^\d+\.\d+/.test(trimmed)) {
    para.setHeading(DocumentApp.ParagraphHeading.HEADING1);
  } else if (/^\d+\.\d+\s+/.test(trimmed) && !/^\d+\.\d+\.\d+/.test(trimmed)) {
    para.setHeading(DocumentApp.ParagraphHeading.HEADING2);
  } else if (/^\d+\.\d+\.\d+\s+/.test(trimmed)) {
    para.setHeading(DocumentApp.ParagraphHeading.HEADING3);
  } else if (/^(Executive Summary|Introduction|Background|Conclusion|Overview|Appendix|References)\s*$/i.test(trimmed)) {
    para.setHeading(DocumentApp.ParagraphHeading.HEADING1);
  }
}

// ─────────────────────────────────────────────────────────────
//  DRIVE FILE BROWSER — returns list only, no content yet
// ─────────────────────────────────────────────────────────────
function getDriveFiles(searchQuery) {
  try {
    var mimes = [
      'application/vnd.google-apps.document',
      'application/pdf',
      'application/vnd.google-apps.spreadsheet',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ];

    var mimeFilter = '(' + mimes.map(function(m) {
      return 'mimeType="' + m + '"';
    }).join(' or ') + ') and trashed=false';

    if (searchQuery && searchQuery.trim()) {
      mimeFilter += ' and title contains "' + searchQuery.trim().replace(/"/g, '') + '"';
    }

    var iter = DriveApp.searchFiles(mimeFilter);
    var files = [];
    var count = 0;

    while (iter.hasNext() && count < 60) {
      var f = iter.next();
      var mime = f.getMimeType();
      var type = 'doc';
      if (mime === 'application/pdf') type = 'pdf';
      else if (mime.indexOf('spreadsheet') > -1) type = 'sheet';
      else if (mime.indexOf('wordprocessing') > -1) type = 'word';

      var updated = f.getLastUpdated();
      var dateStr = updated ? Utilities.formatDate(updated, Session.getScriptTimeZone(), 'dd MMM yy') : '';

      files.push({
        id: f.getId(),
        name: f.getName(),
        type: type,
        date: dateStr
      });
      count++;
    }

    return { success: true, files: files };
  } catch (e) {
    return { success: false, error: e.message };
  }
}

// ─────────────────────────────────────────────────────────────
//  LOAD SINGLE FILE CONTENT — called per file when user adds it
// ─────────────────────────────────────────────────────────────
function loadSingleFileContent(fileId, fileType, fileName) {
  try {
    var content = '';

    if (fileType === 'doc' || fileType === 'word') {
      var doc = DocumentApp.openById(fileId);
      content = doc.getBody().getText().substring(0, 10000);

    } else if (fileType === 'pdf') {
      var file = DriveApp.getFileById(fileId);
      var blob = file.getBlob();
      var resource = {
        title: 'tmp_docpoai_' + fileId,
        mimeType: 'application/vnd.google-apps.document'
      };
      var tmpDoc = Drive.Files.insert(resource, blob, { convert: true, ocr: true });
      content = DocumentApp.openById(tmpDoc.id).getBody().getText().substring(0, 10000);
      DriveApp.getFileById(tmpDoc.id).setTrashed(true);

    } else if (fileType === 'sheet') {
      var ss = SpreadsheetApp.openById(fileId);
      var sheets = ss.getSheets();
      var txt = '';
      for (var s = 0; s < Math.min(sheets.length, 3); s++) {
        var sh = sheets[s];
        var data = sh.getDataRange().getValues();
        txt += 'Sheet: ' + sh.getName() + '\n';
        for (var r = 0; r < Math.min(data.length, 80); r++) {
          txt += data[r].filter(function(c) { return c !== ''; }).join(' | ') + '\n';
        }
        txt += '\n';
      }
      content = txt.substring(0, 10000);
    }

    return {
      success: true,
      fileId: fileId,
      fileName: fileName,
      fileType: fileType,
      content: content,
      preview: content.substring(0, 200)
    };
  } catch (e) {
    return { success: false, fileId: fileId, fileName: fileName, error: e.message };
  }
}

// ─────────────────────────────────────────────────────────────
//  GROQ API — with long-form content support
// ─────────────────────────────────────────────────────────────
function callGroq(messages) {
  var apiKey = getApiKey();
  if (!apiKey) return { error: 'No API key. Go to DocPo AI → Set API Key.' };

  var payload = JSON.stringify({
    model: 'llama-3.3-70b-versatile',
    max_tokens: 8000,
    temperature: 0.7,
    messages: messages
  });

  var options = {
    method: 'post',
    contentType: 'application/json',
    headers: { 'Authorization': 'Bearer ' + apiKey },
    payload: payload,
    muteHttpExceptions: true
  };

  try {
    var response = UrlFetchApp.fetch('https://api.groq.com/openai/v1/chat/completions', options);
    var data = JSON.parse(response.getContentText());
    if (data.error) return { error: data.error.message };
    var text = data.choices && data.choices[0] ? data.choices[0].message.content : '';
    return { result: text };
  } catch (e) {
    return { error: e.message };
  }
}

// ─────────────────────────────────────────────────────────────
//  SYSTEM PROMPT
// ─────────────────────────────────────────────────────────────
function getSystemPrompt(docType, currentDocContent, driveFiles) {
  var base = [
    'You are DocPo AI — an expert document assistant embedded inside Google Docs.',
    'You help write, edit, and improve formal government proposals, research documents, RFPs, and related content.',

    '',
    '=== LIVE DOCUMENT CONTEXT ===',
    'The following is the current content of the document you are working in:',
    '---',
    currentDocContent || '(document is empty)',
    '---',
    '',
  ].join('\n');

  // Add Drive file contexts
  if (driveFiles && driveFiles.length > 0) {
    base += '=== REFERENCE FILES FROM DRIVE (' + driveFiles.length + ' file(s) loaded) ===\n';
    for (var i = 0; i < driveFiles.length; i++) {
      var f = driveFiles[i];
      base += '\n--- File ' + (i + 1) + ': ' + f.fileName + ' ---\n';
      base += (f.content || '(could not read content)') + '\n';
    }
    base += '\n';
  }

  base += [
    '=== OUTPUT FORMAT RULES (DocPo formatter will process your output) ===',
    '',
    'HEADINGS:',
    '  Chapter heading: "Chapter 1: Title Case"',
    '  Section heading: "1.1: Title Case"',
    '  Subsection heading: "1.1.1: Title Case"',
    '  Maximum 3 heading levels.',
    '  Always explicitly use the words "Chapter" and "Section" in numbered headings.',
    '  Keyword headings like "Executive Summary", "Introduction", "Background", "Conclusion", "Overview", "Appendix", and "References" may appear without numbering when appropriate.',
    '  Never use markdown # headers or **bold**.',
    '',
    'BODY TEXT:',
    '  Formal, institutional, policy-oriented prose.',
    '  Minimum 3-4 sentences per paragraph.',
    '  Minimize bullet points. Use them only for 4 or more clearly discrete items.',
    '  No casual language, no filler phrases, and no generic AI-style wording.',
    '  Write in a way that feels handcrafted by a professional human author.',
    '  Use natural sentence variation and controlled rhythm.',
    '',
    'WRITING CONSTRAINTS — STRICT:',
    '  Do not use em dashes (—) anywhere in the document.',
    '  Do not use double hyphens (--) as a substitute.',
    '  Use commas or full stops instead.',
    '  Avoid overly polished AI-signature transitions such as "Moreover", "Furthermore", "Additionally", and "In conclusion" unless truly necessary.',
    '  Avoid phrases that make the text sound obviously machine-written.',
    '',
    'CONTENT LENGTH — CRITICAL:',
    '  When asked to write a section: write a COMPLETE, DETAILED section — minimum 400-600 words per section.',
    '  When asked for 5 pages: that is approximately 2500 words — write the FULL amount, do not summarize.',
    '  When asked for a full proposal: write ALL sections completely, not placeholders or outlines.',
    '  Never truncate or summarize unless explicitly asked. Always write the complete requested content.',
    '',
    'STATISTICS AND CITATIONS:',
    '  ONLY cite: Government sources (NITI Aayog, NSO, MOSPI, RBI, State ministries),',
    '  OR: World Bank, UNICEF, ADB, UNESCO, WHO, ILO, WEF, IMF, UNDP.',
    '  NEVER cite: news, blogs, NGO reports, Wikipedia, think tanks.',
    '  After every statistic or quoted fact insert EXACTLY: {[footnote],[Source Name Year]}',
    '  Example: "...77.7% literacy {[footnote],[NSO 2022]} across..."',
    '',
    'TABLES:',
    '  Use | pipe format.',
    '  First row = header.',
    '  Keep table content concise and factual.',
    '',
    'DO NOT OUTPUT:',
    '  Markdown formatting.',
    '  Preambles like "Here is your..."',
    '  Closing remarks.',
    '  Page numbers.',
    '  Headers or footers.',
    '',
    'Output ONLY the document content, ready to be inserted directly.',
    '',
    '=== DOCUMENT EDITING CAPABILITIES ===',
    'When asked to modify, edit, rewrite, shorten, expand, or change tone of selected text:',
    '  - Return ONLY the replacement text',
    '  - No explanations or preamble',
    '  - Preserve all {[footnote],[Source]} placeholders',
    '  - Match the same formal, human, professional tone',
    '  - Do not introduce em dashes (—) or AI-signature phrasing',
  ].join('\n');

  // RFP placeholder
  if (docType === 'rfp') {
    // TODO: Replace with RFP-specific instructions
    // Structure: scope of work, evaluation criteria, eligibility, timelines, submission requirements
  }

  // RFP Response placeholder
  if (docType === 'rfp_response') {
    // TODO: Replace with RFP Response instructions
    // Structure: compliance matrix, technical approach, commercial bid, team composition
  }

  return base;
}

// ─────────────────────────────────────────────────────────────
//  MAIN CHAT FUNCTION
//  Full conversation with memory, doc context, drive context
// ─────────────────────────────────────────────────────────────
function sendChatMessage(params) {
  /*
    params = {
      message: string,               — user's message
      history: [],                   — full conversation history from sidebar
      docType: string,               — proposal | rfp | rfp_response | research
      driveFiles: [],                — array of {fileName, content} loaded files
      mode: 'chat'|'edit'|'generate',
      selectedText: string,          — if mode === 'edit'
      action: string                 — 'insert'|'replace'|null (what to do with response)
    }
  */
  try {
    // Get current document content fresh every call
    var docCtx = getDocumentContent();
    var currentDocContent = docCtx.content || '';

    // Build system prompt with all context
    var systemPrompt = getSystemPrompt(
      params.docType || 'proposal',
      currentDocContent,
      params.driveFiles || []
    );

    // If edit mode, prepend selected text context to message
    var userMessage = params.message;
    if (params.mode === 'edit' && params.selectedText) {
      userMessage = 'SELECTED TEXT IN DOCUMENT:\n"""\n' + params.selectedText + '\n"""\n\nINSTRUCTION: ' + params.message;
    }

    // Build full message array: system + history + new message
    var messages = [{ role: 'system', content: systemPrompt }];

    // Add conversation history (last 10 exchanges to stay within token limits)
    var history = params.history || [];
    var startIdx = Math.max(0, history.length - 20); // last 10 exchanges = 20 messages
    for (var i = startIdx; i < history.length; i++) {
      messages.push(history[i]);
    }

    // Add current message
    messages.push({ role: 'user', content: userMessage });

    // Call Groq
    var result = callGroq(messages);
    if (result.error) return result;

    var aiResponse = result.result;

    // Perform document action if requested
    var actionResult = null;
    if (params.action === 'insert') {
      actionResult = insertAtCursor(aiResponse);
    } else if (params.action === 'replace' && params.selectedText) {
      actionResult = replaceTextInDocument(params.selectedText, aiResponse);
    }

    return {
      result: aiResponse,
      action: params.action || null,
      actionSuccess: actionResult ? actionResult.success : null,
      actionError: actionResult ? actionResult.error : null,
      docLength: currentDocContent.length
    };

  } catch (e) {
    return { error: e.message };
  }
}

// ─────────────────────────────────────────────────────────────
//  FOOTNOTE PROCESSOR
// ─────────────────────────────────────────────────────────────
function processFootnotePlaceholders() {
  try {
    var doc = DocumentApp.getActiveDocument();
    var body = getBody_();
    var fullText = body.getText();

    var regex = /\{\[footnote\],\[([^\]]+)\]\}/g;
    var match;
    var footnotes = [];

    while ((match = regex.exec(fullText)) !== null) {
      footnotes.push({ placeholder: match[0], source: match[1] });
    }

    if (footnotes.length === 0) {
      return { success: true, count: 0, message: 'No footnote placeholders found.' };
    }

    var processed = 0;
    // Process in reverse order to preserve text positions
    for (var i = footnotes.length - 1; i >= 0; i--) {
      var fn = footnotes[i];
      var found = body.findText(escapeRegex_(fn.placeholder));
      if (!found) continue;

      try {
        var el = found.getElement();
        var start = found.getStartOffset();
        var position = doc.newPosition(el, start);
        var footnoteEl = doc.addFootnote(position);
        var fnParas = footnoteEl.getFootnoteContents().getParagraphs();
        if (fnParas.length > 0) {
          fnParas[0].setText(fn.source);
        } else {
          footnoteEl.getFootnoteContents().appendParagraph(fn.source);
        }

        // Re-find and remove placeholder after footnote insertion
        var reFound = body.findText(escapeRegex_(fn.placeholder));
        if (reFound) {
          var reEl = reFound.getElement().asText();
          reEl.deleteText(reFound.getStartOffset(), reFound.getEndOffsetInclusive());
        }
        processed++;
      } catch (fnErr) {
        Logger.log('Footnote error: ' + fnErr);
      }
    }

    return { success: true, count: processed };
  } catch (e) {
    return { success: false, error: e.message };
  }
}

// ─────────────────────────────────────────────────────────────
//  BODY HELPER
// ─────────────────────────────────────────────────────────────
function getBody_() {
  var doc = DocumentApp.getActiveDocument();
  try {
    return doc.getActiveTab().asDocumentTab().getBody();
  } catch (e) {
    return doc.getBody();
  }
}
