function removeHorizontalRules_(body) {
  var HR = DocumentApp.ElementType.HORIZONTAL_RULE;

  for (var i = body.getNumChildren() - 1; i >= 0; i--) {
    var el = body.getChild(i);
    if (el.getType() !== DocumentApp.ElementType.PARAGRAPH) continue;

    var para = el.asParagraph();
    for (var j = para.getNumChildren() - 1; j >= 0; j--) {
      if (para.getChild(j).getType() === HR) {
        try { para.removeChild(para.getChild(j)); } catch (e) {}
      }
    }
  }
}

function cleanupBulletGaps_(body) {
  var LI = DocumentApp.ElementType.LIST_ITEM;
  var PARA = DocumentApp.ElementType.PARAGRAPH;

  for (var i = body.getNumChildren() - 2; i >= 1; i--) {
    var cur = body.getChild(i);
    if (cur.getType() !== PARA) continue;
    if (cur.asParagraph().getText().trim() !== '') continue;

    if (body.getChild(i - 1).getType() === LI &&
        body.getChild(i + 1).getType() === LI) {
      try { body.removeChild(cur); } catch (e) {}
    }
  }
}
