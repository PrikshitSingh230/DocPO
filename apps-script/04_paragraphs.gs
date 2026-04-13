function walkContainer_(container, ctx, insideTable, isHeader) {
  var n = container.getNumChildren();
  var PARA = DocumentApp.ElementType.PARAGRAPH;
  var LI   = DocumentApp.ElementType.LIST_ITEM;
  var TBL  = DocumentApp.ElementType.TABLE;

  for (var i = 0; i < n; i++) {
    var child = container.getChild(i);
    var type = child.getType();

    if (type === PARA) {
      formatParagraph_(child.asParagraph(), ctx, insideTable, isHeader);
    } else if (type === LI) {
      formatListItem_(child.asListItem(), ctx, insideTable, isHeader);
    } else if (type === TBL) {
      formatTable_(child.asTable(), ctx);
    }
  }
}

function formatParagraph_(para, ctx, insideTable, isHeader) {
  var config = ctx.config;

  resizeAndNormalizeImages_(para, ctx.targetWidth, config);

  var clean = (para.getText() || '').trim();

  if (paragraphHasOnlyImage_(para)) {
    para.setHeading(DocumentApp.ParagraphHeading.NORMAL);
    para.setAlignment(DocumentApp.HorizontalAlignment.CENTER);
    setTightSpacing_(para);
    return;
  }

  if (insideTable) {
    para.setHeading(DocumentApp.ParagraphHeading.NORMAL);
    para.setAlignment(
      isHeader
        ? DocumentApp.HorizontalAlignment.CENTER
        : DocumentApp.HorizontalAlignment.LEFT
    );
    applyStyle_(para.editAsText(), {
      fontFamily: config.fontFamily,
      fontSize: config.bodyFontSize,
      color: config.bodyColor,
      bold: isHeader,
      underline: false
    });
    setTightSpacing_(para);
    return;
  }

  var level = detectLevel_(clean);

  if (level === 1) {
    para.setHeading(DocumentApp.ParagraphHeading.HEADING1);
    para.setAlignment(DocumentApp.HorizontalAlignment.LEFT);
    applyStyle_(para.editAsText(), {
      fontFamily: config.fontFamily,
      fontSize: config.h1Size,
      color: config.h1Color,
      bold: config.h1Bold,
      underline: config.h1Underline
    });
    setHeadingSpacing_(para);
    return;
  }

  if (level === 2) {
    para.setHeading(DocumentApp.ParagraphHeading.HEADING2);
    para.setAlignment(DocumentApp.HorizontalAlignment.LEFT);
    applyStyle_(para.editAsText(), {
      fontFamily: config.fontFamily,
      fontSize: config.h2Size,
      color: config.h2Color,
      bold: config.h2Bold,
      underline: config.h2Underline
    });
    setHeadingSpacing_(para);
    return;
  }

  if (level === 3) {
    para.setHeading(DocumentApp.ParagraphHeading.HEADING3);
    para.setAlignment(DocumentApp.HorizontalAlignment.LEFT);
    applyStyle_(para.editAsText(), {
      fontFamily: config.fontFamily,
      fontSize: config.h3Size,
      color: config.h3Color,
      bold: config.h3Bold,
      underline: config.h3Underline
    });
    setHeadingSpacing_(para);
    return;
  }

  para.setHeading(DocumentApp.ParagraphHeading.NORMAL);
  para.setAlignment(DocumentApp.HorizontalAlignment.JUSTIFY);
  applyStyle_(para.editAsText(), {
    fontFamily: config.fontFamily,
    fontSize: config.bodyFontSize,
    color: config.bodyColor,
    bold: false,
    underline: false
  });
  setBodySpacing_(para);
}

function formatListItem_(item, ctx, insideTable, isHeader) {
  var config = ctx.config;

  resizeAndNormalizeImages_(item, ctx.targetWidth, config);

  if (listItemHasOnlyImage_(item)) {
    item.setAlignment(DocumentApp.HorizontalAlignment.CENTER);
    setTightSpacing_(item);
    return;
  }

  item.setAlignment(
    insideTable
      ? (isHeader
          ? DocumentApp.HorizontalAlignment.CENTER
          : DocumentApp.HorizontalAlignment.LEFT)
      : DocumentApp.HorizontalAlignment.JUSTIFY
  );

  applyStyle_(item.editAsText(), {
    fontFamily: config.fontFamily,
    fontSize: config.bodyFontSize,
    color: config.bodyColor,
    bold: insideTable && isHeader,
    underline: false
  });

  setTightSpacing_(item);
}

function detectLevel_(text) {
  if (!text) return 0;
  var lower = text.toLowerCase();

  for (var i = 0; i < H1_KEYWORDS.length; i++) {
    var kw = H1_KEYWORDS[i];
    if (lower === kw || lower.indexOf(kw + ' ') === 0 || lower.indexOf(kw + ':') === 0) {
      return 1;
    }
  }

  if (/^\d+\.\s+[A-Z]/.test(text) && !/^\d+\.\d+/.test(text)) return 1;
  if (/^\d+\.\d+\.\d+\s+[A-Za-z]/.test(text)) return 3;
  if (/^\d+\.\d+\s+[A-Za-z]/.test(text)) return 2;

  return 0;
}
