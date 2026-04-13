function getUiSafe_() {
  try { return DocumentApp.getUi(); }
  catch (e) { return null; }
}

function alertSafe_(title, msg) {
  var ui = getUiSafe_();
  if (ui) ui.alert(title, msg, ui.ButtonSet.OK);
  else Logger.log('[' + title + '] ' + msg);
}

function hexToRgb01_(hex) {
  hex = hex.replace('#', '');

  var r = parseInt(hex.substring(0, 2), 16) / 255;
  var g = parseInt(hex.substring(2, 4), 16) / 255;
  var b = parseInt(hex.substring(4, 6), 16) / 255;

  return { red: r, green: g, blue: b };
}
// function safeTrim_(s) {
//   return (s || '').replace(/\s+/g, ' ').trim();
// }

// function safeCallNumber_(fn) {
//   try {
//     return fn();
//   } catch (e) {
//     return 'ERR';
//   }
// }

// function safeCallValue_(fn) {
//   try {
//     return fn();
//   } catch (e) {
//     return 'ERR';
//   }
// }

function applyStyle_(textEl, opts) {
  if (!textEl) return;
  var txt = textEl.getText();
  if (!txt || txt.length === 0) return;

  textEl.setFontFamily(opts.fontFamily);
  textEl.setFontSize(opts.fontSize);
  textEl.setForegroundColor(opts.color);
  textEl.setBold(!!opts.bold);
  textEl.setUnderline(!!opts.underline);
}

function setBodySpacing_(p) {
  try { p.setSpacingBefore(0); p.setSpacingAfter(4); p.setLineSpacing(1.0); } catch (e) {}
}
function setHeadingSpacing_(p) {
  try { p.setSpacingBefore(14); p.setSpacingAfter(8); p.setLineSpacing(1.0); } catch (e) {}
}
function setTightSpacing_(p) {
  try { p.setSpacingBefore(0); p.setSpacingAfter(0); p.setLineSpacing(1.0); } catch (e) {}
}

function getUsablePageWidth_(body, config) {
  try {
    var w = body.getPageWidth() - body.getMarginLeft() - body.getMarginRight();
    var pad = (config && typeof config.tableWidthPadding === 'number')
      ? config.tableWidthPadding
      : 10;
    return (w > 20) ? (w - pad) : 450;
  } catch (e) {
    return 450;
  }
}
