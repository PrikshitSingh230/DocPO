function showAbout() {
  alertSafe_('DocPo',
    'Formats your Google Doc:\n' +
    '- Heading styles auto-detected by text pattern\n' +
    '- Tables fit to text width\n' +
    '- Images classified safely before formatting\n' +
    '- Optional footnote placeholder conversion\n' +
    '- Bullet spacing cleaned up\n' +
    '- Horizontal rules removed'
  );
}

function showSettingsDialog() {
  var ui = getUiSafe_();
  if (!ui) return;

  var tpl = HtmlService.createTemplateFromFile('settings');
  tpl.config = CONFIG;

  var html = tpl.evaluate()
    .setWidth(720)
    .setHeight(860);

  ui.showModalDialog(html, 'DocPo settings');
}

function include(filename) {
  return HtmlService.createHtmlOutputFromFile(filename).getContent();
}


// ─────────────────────────────────────────────────────────────
//  PROPOSAL MENU — shows choice: Format or View Prompt
// ─────────────────────────────────────────────────────────────
function showProposalMenu() {
  var ui = getUiSafe_();
  if (!ui) return;
 
  var html = HtmlService.createHtmlOutput(
    '<style>' +
    'body{font-family:Arial,sans-serif;font-size:13px;padding:18px;margin:0;color:#1a1a1a}' +
    'h3{margin:0 0 6px;color:#4b4d9f;font-size:15px}' +
    'p{margin:0 0 16px;font-size:12px;color:#666;line-height:1.5}' +
    '.btn{display:block;width:100%;padding:10px;margin-bottom:10px;border:none;border-radius:5px;font-size:13px;font-weight:600;cursor:pointer;text-align:left}' +
    '.btn-primary{background:#4b4d9f;color:#fff}' +
    '.btn-primary:hover{background:#3a3b80}' +
    '.btn-secondary{background:#f0f0f0;color:#333;border:1px solid #ddd}' +
    '.btn-secondary:hover{background:#e4e4e4}' +
    '</style>' +
    '<h3>Proposal Document</h3>' +
    '<p>Format your document or copy the AI prompt to generate correctly structured content in any chatbot.</p>' +
    '<button id="formatBtn" class="btn btn-primary" onclick="format()">▶ Format this Proposal</button>' +
    '<button class="btn btn-secondary" onclick="prompt()">⧉ Copy AI Prompt for Content Generation</button>' +
    '<div id="status" style="margin-top:10px;font-size:12px;color:#666;min-height:18px;"></div>' +
    '<script>' +
    'function format(){' +
    '  var btn=document.getElementById("formatBtn");' +
    '  var status=document.getElementById("status");' +
    '  btn.disabled=true;' +
    '  btn.textContent="Formatting...";' +
    '  status.textContent="DocPo is formatting the document. Please wait...";' +
    '  google.script.run' +
    '    .withSuccessHandler(function(){' +
    '      status.textContent="Formatting complete.";'+
    '      btn.textContent="✓ Done";' +
    '      setTimeout(function(){google.script.host.close();},700);' +
    '    })' +
    '    .withFailureHandler(function(err){' +
    '      btn.disabled=false;' +
    '      btn.textContent="▶ Format this Proposal";' +
    '      status.textContent="DocPo error: " + (err && err.message ? err.message : err);' +
    '      alert("DocPo error: " + (err && err.message ? err.message : err));' +
    '    })' +
    '    .runDocPo();' +
    '}' + 
    'function prompt(){google.script.run.withSuccessHandler(function(){google.script.host.close();}).showProposalPrompt();}' +
    '<\/script>'
  ).setWidth(380).setHeight(220);
 
  ui.showModalDialog(html, 'DocPo — Proposal');
}

// 
function showLoaderSidebar() {
  var html = HtmlService.createHtmlOutputFromFile('loaderSidebar')
    .setTitle('🐼 DocPo');
  DocumentApp.getUi().showSidebar(html);
}
 
 
// ─────────────────────────────────────────────────────────────
//  PROPOSAL PROMPT DIALOG
// ─────────────────────────────────────────────────────────────
function showProposalPrompt() {
  var ui = getUiSafe_();
  if (!ui) return;
 
  var prompt =
    'You are writing a formal government proposal or research document.\n\n' +

    'HEADINGS — use exactly these formats:\n' +
    '  Chapter heading:    Chapter 1: Title Case\n' +
    '  Section heading:    1.1: Title Case\n' +
    '  Subsection:         1.1.1: Title Case\n' +
    '  Max 3 levels.\n' +
    '  Always explicitly use the words "Chapter" and "Section" in headings.\n' +
    '  Never use markdown (#, ##) or bold formatting for headings.\n' +
    '  These keywords are auto-detected as chapter headings — use them exactly:\n' +
    '  Executive Summary, Introduction, Background, Conclusion, Overview, Appendix, References\n\n' +

    'BODY TEXT:\n' +
    '  Use formal, institutional, and professional language.\n' +
    '  Each paragraph must have at least 3–4 well-structured sentences.\n' +
    '  Avoid bullet points unless listing 4 or more discrete items.\n' +
    '  Avoid conversational tone, filler phrases, or generic AI-style expressions.\n' +
    '  STRICT RULE: Do not use em dashes (—) anywhere in the document.\n' +
    '  Do not use double hyphens (--) as a substitute.\n' +
    '  Use standard punctuation such as commas or full stops instead.\n' +
    '  Sentences should read naturally, with variation in structure and rhythm, as written by a professional human author.\n\n' +

    'DOCUMENT STRUCTURE (follow this order strictly):\n' +
    '  Executive Summary\n' +
    '  Chapter 1: Introduction\n' +
    '  Chapter 2: Background and Context\n' +
    '  Chapter 3: Problem Statement\n' +
    '  Chapter 4: Proposed Solution / Methodology\n' +
    '  Chapter 5: Implementation Plan\n' +
    '  Chapter 6: Team and Organisational Capacity\n' +
    '  Chapter 7: Budget Overview\n' +
    '  Chapter 8: Expected Outcomes and Impact\n' +
    '  Chapter 9: Conclusion\n' +
    '  References\n\n' +

    'STATISTICS AND CITATIONS — critical:\n' +
    '  Only cite official government sources: NITI Aayog, NSO, MOSPI, RBI, State/Central ministries.\n' +
    '  Or international bodies: World Bank, UNICEF, ADB, UNESCO, WHO, ILO, WEF, IMF, UNDP.\n' +
    '  Never cite news articles, blogs, NGO reports, Wikipedia, or think tanks.\n' +
    '  After every statistic or quoted fact, insert this placeholder exactly:\n' +
    '  {[footnote],[Source Name Year]}\n' +
    '  Example: The literacy rate stands at 77.7% {[footnote],[NSO 2022]} across rural districts.\n\n' +

    'TABLES:\n' +
    '  Use pipe | format.\n' +
    '  First row must be the header row.\n' +
    '  Maximum 5 columns.\n' +
    '  Keep cell content concise and factual.\n\n' +

    'OUTPUT RULES:\n' +
    '  Output only the document content.\n' +
    '  Do not include any preamble such as "Here is your document".\n' +
    '  Do not include closing remarks.\n' +
    '  Do not include page numbers, headers, or footers.\n' +
    '  Do not use markdown formatting of any kind.\n';
 
  var html = HtmlService.createHtmlOutput(
    '<style>' +
    'body{font-family:Arial,sans-serif;font-size:12px;padding:16px;margin:0;color:#1a1a1a}' +
    'h3{margin:0 0 4px;color:#4b4d9f;font-size:14px}' +
    'p{margin:0 0 10px;font-size:11.5px;color:#666}' +
    'textarea{width:100%;height:320px;font-size:11.5px;font-family:"Courier New",monospace;border:1px solid #ddd;border-radius:4px;padding:10px;resize:none;line-height:1.6;color:#1a1a1a;background:#fafafa;box-sizing:border-box}' +
    'button{margin-top:10px;width:100%;padding:9px;background:#4b4d9f;color:#fff;border:none;border-radius:4px;cursor:pointer;font-size:13px;font-weight:600}' +
    'button:hover{background:#3a3b80}' +
    '.note{font-size:11px;color:#888;margin-top:6px}' +
    '</style>' +
    '<h3>AI Prompt — Proposal Format</h3>' +
    '<p>Copy this and paste it at the start of any AI chat (Claude, ChatGPT, Gemini) before asking it to write content.</p>' +
    '<textarea id="pt" readonly>' + prompt + '</textarea>' +
    '<button onclick="copy()">Copy Prompt</button>' +
    '<p class="note">After copying, paste it in your AI chat, then describe what you want written. The output will be ready for DocPo to format.</p>' +
    '<script>' +
    'function copy(){' +
    'var t=document.getElementById("pt");' +
    't.select();' +
    'document.execCommand("copy");' +
    'document.querySelector("button").textContent="✓ Copied!";' +
    'setTimeout(function(){document.querySelector("button").textContent="Copy Prompt";},2000);' +
    '}' +
    '<\/script>'
  ).setWidth(560).setHeight(520);
 
  ui.showModalDialog(html, 'DocPo — Proposal AI Prompt');
}
 
 
// ─────────────────────────────────────────────────────────────
//  RFP — COMING SOON
// ─────────────────────────────────────────────────────────────
function showRFPComingSoon() {
  var ui = getUiSafe_();
  if (!ui) return;
 
  var html = HtmlService.createHtmlOutput(
    '<style>' +
    'body{font-family:Arial,sans-serif;font-size:13px;padding:24px;margin:0;color:#1a1a1a;text-align:center}' +
    '.icon{font-size:36px;margin-bottom:12px}' +
    'h3{margin:0 0 8px;color:#4b4d9f;font-size:15px}' +
    'p{margin:0 0 10px;font-size:12.5px;color:#666;line-height:1.6}' +
    '.tag{display:inline-block;background:#f0f0ff;color:#4b4d9f;border:1px solid #ccd;border-radius:20px;padding:3px 12px;font-size:12px;font-weight:600;margin-bottom:14px}' +
    'ul{text-align:left;font-size:12px;color:#555;line-height:1.8;padding-left:18px;margin:10px 0 0}' +
    '</style>' +
    '<div class="icon">⚙️</div>' +
    '<h3>RFP Format</h3>' +
    '<div class="tag">Coming Soon</div>' +
    '<p>The RFP document formatter and its AI prompt are currently being built.</p>' +
    '<p>When ready it will include:</p>' +
    '<ul>' +
    '<li>Scope of work structure</li>' +
    '<li>Evaluation criteria format</li>' +
    '<li>Eligibility and submission requirements</li>' +
    '<li>Terms and conditions sections</li>' +
    '<li>Dedicated AI prompt for RFP content generation</li>' +
    '</ul>'
  ).setWidth(360).setHeight(320);
 
  ui.showModalDialog(html, 'DocPo — RFP (Coming Soon)');
}
