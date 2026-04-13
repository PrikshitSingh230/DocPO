function processFootnotePlaceholdersWithDocsApi_(config) {
  if (!config || !config.enableFootnotes) return 0;

  var info = getActiveTabInfo_();
  var docId = info.docId;
  var tabId = info.tabId;

  var docJson = Docs.Documents.get(docId, { includeTabsContent: true });
  var tabDoc = getActiveTabDocumentJson_(docJson, tabId);
  if (!tabDoc || !tabDoc.body || !tabDoc.body.content) return 0;

  var placeholders = [];
  collectFootnotePlaceholdersFromContent_(tabDoc.body.content, placeholders);

  if (placeholders.length === 0) return 0;

  placeholders.sort(function(a, b) { return b.startIndex - a.startIndex; });

  var createRequests = [];
  for (var i = 0; i < placeholders.length; i++) {
    var p = placeholders[i];

    createRequests.push({
      deleteContentRange: {
        range: {
          startIndex: p.startIndex,
          endIndex: p.endIndex,
          tabId: tabId
        }
      }
    });

    createRequests.push({
      createFootnote: {
        location: {
          index: p.startIndex,
          tabId: tabId
        }
      }
    });
  }

  var createResp = Docs.Documents.batchUpdate({ requests: createRequests }, docId);
  var replies = (createResp && createResp.replies) || [];

  var insertRequests = [];
  var placeholderIdx = 0;

  for (var r = 0; r < replies.length; r++) {
    var reply = replies[r];
    if (reply && reply.createFootnote) {
      var footnoteId = reply.createFootnote.footnoteId;
      var noteText = placeholders[placeholderIdx].noteText;

      var fontFamily = config.footnoteFontFamily || config.fontFamily;
      var fontColorHex = config.footnoteColor || config.bodyColor;
      var rgb = hexToRgb01_(fontColorHex);

      insertRequests.push({
        insertText: {
          endOfSegmentLocation: {
            segmentId: footnoteId,
            tabId: tabId
          },
          text: noteText
        }
      });

      insertRequests.push({
        updateTextStyle: {
          range: {
            startIndex: 0,
            endIndex: noteText.length,
            segmentId: footnoteId,
            tabId: tabId
          },
          textStyle: {
            fontSize: {
              magnitude: config.footnoteFontSize || 9,
              unit: 'PT'
            },
            weightedFontFamily: {
              fontFamily: fontFamily
            },
            foregroundColor: {
              color: {
                rgbColor: rgb
              }
            }
          },
          fields: 'fontSize,weightedFontFamily,foregroundColor'
        }
      });

      placeholderIdx++;
    }
  }

  if (insertRequests.length > 0) {
    Docs.Documents.batchUpdate({ requests: insertRequests }, docId);
  }

  Logger.log('Footnotes created: ' + insertRequests.length);
  return insertRequests.length;
}

function getActiveTabDocumentJson_(docJson, activeTabId) {
  if (!docJson) return null;

  if (!docJson.tabs || !activeTabId) {
    return docJson;
  }

  function walkTabs_(tabs) {
    for (var i = 0; i < tabs.length; i++) {
      var t = tabs[i];
      if (t.tabProperties && t.tabProperties.tabId === activeTabId) {
        return t.documentTab || null;
      }
      var childTabs = (t.childTabs || []);
      var found = walkTabs_(childTabs);
      if (found) return found;
    }
    return null;
  }

  return walkTabs_(docJson.tabs);
}

function collectFootnotePlaceholdersFromContent_(content, out) {
  if (!content) return;

  for (var i = 0; i < content.length; i++) {
    var el = content[i];

    if (el.paragraph) {
      collectFootnotesFromParagraphJson_(el.paragraph, out);
    }

    if (el.table) {
      var rows = el.table.tableRows || [];
      for (var r = 0; r < rows.length; r++) {
        var cells = rows[r].tableCells || [];
        for (var c = 0; c < cells.length; c++) {
          collectFootnotePlaceholdersFromContent_(cells[c].content || [], out);
        }
      }
    }
  }
}

function collectFootnotesFromParagraphJson_(paragraph, out) {
  if (!paragraph || !paragraph.elements) return;

  var style = paragraph.paragraphStyle || {};
  var namedStyleType = style.namedStyleType || 'NORMAL_TEXT';

  if (namedStyleType === 'HEADING_1' ||
      namedStyleType === 'HEADING_2' ||
      namedStyleType === 'HEADING_3' ||
      namedStyleType === 'HEADING_4' ||
      namedStyleType === 'HEADING_5' ||
      namedStyleType === 'HEADING_6' ||
      namedStyleType === 'TITLE' ||
      namedStyleType === 'SUBTITLE') {
    return;
  }

  var re = /\{\[footnote\],\[(?:'([^']+)'|"([^"]+)"|([^\]]+))\]\}/g;

  for (var i = 0; i < paragraph.elements.length; i++) {
    var pe = paragraph.elements[i];
    if (!pe.textRun || !pe.textRun.content) continue;

    var text = pe.textRun.content;
    var m;

    while ((m = re.exec(text)) !== null) {
      var full = m[0];
      var noteText = safeTrim_(m[1] || m[2] || m[3] || '');
      if (!noteText) continue;

      out.push({
        noteText: noteText,
        startIndex: pe.startIndex + m.index,
        endIndex: pe.startIndex + m.index + full.length
      });
    }
  }
}
