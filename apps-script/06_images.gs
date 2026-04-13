//─────────────────────────────────────────────────────────────
//  IMAGE RESIZING + NORMALIZATION (CLASSIFICATION-FIRST)
// ─────────────────────────────────────────────────────────────
function resizeAndNormalizeImages_(containerEl, targetWidth, config) {
  if (!config || !config.formatStandaloneLandscapeImages) return;

  var type = safeCallValue_(function() { return containerEl.getType(); });
  var body = getBody_();

  if (type === DocumentApp.ElementType.PARAGRAPH) {
    var para = containerEl.asParagraph();
    var imgs = getInlineImagesInParagraph_(para);

    if (imgs.length === 1 && shouldFormatStandaloneLandscapeImage_(para, imgs[0], body, config)) {
      formatStandaloneImageParagraph_(para, imgs[0], body, config);
    }

  } else if (type === DocumentApp.ElementType.LIST_ITEM) {
    var item = containerEl.asListItem();
    var listImgs = getInlineImagesInListItem_(item);

    if (listImgs.length === 1 && shouldFormatStandaloneLandscapeImageInListItem_(item, listImgs[0], body, config)) {
      formatStandaloneListItemImage_(item, listImgs[0], body, config);
    }
  }

  // IMPORTANT:
  //  not blindly normalize positioned images here.
  // They are handled only in repairPositionedImagesToInlineParagraphs_(config).
}

function normalizePositionedImages_(containerEl, targetWidth, config) {
  // intentionally disabled
  // old behavior was destructive:
  // - resized all positioned images
  // - forced ABOVE_TEXT
  // - reset offsets
}

function paragraphHasOnlyImage_(para) {
  var hasImage = false;

  try {
    for (var i = 0; i < para.getNumChildren(); i++) {
      var child = para.getChild(i);

      if (child.getType() === DocumentApp.ElementType.INLINE_IMAGE) {
        hasImage = true;
      } else if (child.getType() === DocumentApp.ElementType.TEXT) {
        var t = safeTrim_(child.asText().getText());
        if (t !== '') return false;
      } else if (child.getType() === DocumentApp.ElementType.INLINE_DRAWING) {
        hasImage = true;
      }
    }
  } catch (e) {}

  return hasImage;
}

function listItemHasOnlyImage_(item) {
  var hasImage = false;

  try {
    for (var i = 0; i < item.getNumChildren(); i++) {
      var child = item.getChild(i);

      if (child.getType() === DocumentApp.ElementType.INLINE_IMAGE) {
        hasImage = true;
      } else if (child.getType() === DocumentApp.ElementType.TEXT) {
        var t = safeTrim_(child.asText().getText());
        if (t !== '') return false;
      } else if (child.getType() === DocumentApp.ElementType.INLINE_DRAWING) {
        hasImage = true;
      }
    }
  } catch (e) {}

  return hasImage;
}

function fitImageToTargetWidth_(img, targetWidth) {
  try {
    var w = img.getWidth();
    var h = img.getHeight();
    if (!(w > 0 && h > 0)) return;

    var ratio = h / w;
    var newWidth = Math.round(targetWidth);
    var newHeight = Math.round(newWidth * ratio);

    img.setWidth(newWidth);
    img.setHeight(newHeight);
  } catch (e) {
    Logger.log('fitImageToTargetWidth_: ' + e);
  }
}

function scaleImage_(img, targetWidth, config) {
  // backward-compatible wrapper
  if (!config || !config.resizeStandaloneImagesToTextWidth) return;
  fitImageToTargetWidth_(img, targetWidth);
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

function isLargeVisualBlock_(w, h, body, config) {
  var textWidth = getUsablePageWidth_(body, config);
  var minWidthFraction = (config && config.largeProtectedImageMinWidthFraction) || 0.45;
  var minHeight = (config && config.largeProtectedImageMinHeight) || 140;

  return (w >= textWidth * minWidthFraction) && (h >= minHeight);
}

function addImageBlockSpacing_(el, config) {
  try { el.setSpacingBefore((config && config.imageBlockSpacingBefore) || 10); } catch (e) {}
  try { el.setSpacingAfter((config && config.imageBlockSpacingAfter) || 10); } catch (e) {}
  try { el.setLineSpacing(1.0); } catch (e) {}
}

function paragraphHasLargeInlineImage_(para, body, config) {
  var imgs = getInlineImagesInParagraph_(para);
  if (!imgs || imgs.length === 0) return false;

  for (var i = 0; i < imgs.length; i++) {
    var w = safeCallNumber_(function() { return imgs[i].getWidth(); });
    var h = safeCallNumber_(function() { return imgs[i].getHeight(); });

    if (w !== 'ERR' && h !== 'ERR' && isLargeVisualBlock_(w, h, body, config)) {
      return true;
    }
  }

  return false;
}

function listItemHasLargeInlineImage_(item, body, config) {
  var imgs = getInlineImagesInListItem_(item);
  if (!imgs || imgs.length === 0) return false;

  for (var i = 0; i < imgs.length; i++) {
    var w = safeCallNumber_(function() { return imgs[i].getWidth(); });
    var h = safeCallNumber_(function() { return imgs[i].getHeight(); });

    if (w !== 'ERR' && h !== 'ERR' && isLargeVisualBlock_(w, h, body, config)) {
      return true;
    }
  }

  return false;
}

function paragraphHasLargePositionedImage_(para, body, config) {
  var imgs = [];
  try {
    imgs = para.getPositionedImages();
  } catch (e) {
    return false;
  }

  if (!imgs || imgs.length === 0) return false;

  for (var i = 0; i < imgs.length; i++) {
    var w = safeCallNumber_(function() { return imgs[i].getWidth(); });
    var h = safeCallNumber_(function() { return imgs[i].getHeight(); });

    if (w !== 'ERR' && h !== 'ERR' && isLargeVisualBlock_(w, h, body, config)) {
      return true;
    }
  }

  return false;
}

function listItemHasLargePositionedImage_(item, body, config) {
  var imgs = [];
  try {
    imgs = item.getPositionedImages();
  } catch (e) {
    return false;
  }

  if (!imgs || imgs.length === 0) return false;

  for (var i = 0; i < imgs.length; i++) {
    var w = safeCallNumber_(function() { return imgs[i].getWidth(); });
    var h = safeCallNumber_(function() { return imgs[i].getHeight(); });

    if (w !== 'ERR' && h !== 'ERR' && isLargeVisualBlock_(w, h, body, config)) {
      return true;
    }
  }

  return false;
}

function isProtectedSideLayout_(layout) {
  return (
    layout === DocumentApp.PositionedLayout.WRAP_TEXT ||
    layout === DocumentApp.PositionedLayout.BREAK_LEFT ||
    layout === DocumentApp.PositionedLayout.BREAK_RIGHT ||
    layout === DocumentApp.PositionedLayout.BREAK_BOTH
  );
}

function formatStandaloneImageParagraph_(para, img, body, config) {
  try {
    para.setAlignment(DocumentApp.HorizontalAlignment.CENTER);
  } catch (e) {}

  addImageBlockSpacing_(para, config);

  if (config && config.resizeStandaloneImagesToTextWidth) {
    var targetWidth = getUsablePageWidth_(body, config);
    fitImageToTargetWidth_(img, targetWidth);
  }
}

function formatStandaloneListItemImage_(item, img, body, config) {
  try {
    item.setAlignment(DocumentApp.HorizontalAlignment.CENTER);
  } catch (e) {}

  addImageBlockSpacing_(item, config);

  if (config && config.resizeStandaloneImagesToTextWidth) {
    var targetWidth = getUsablePageWidth_(body, config);
    fitImageToTargetWidth_(img, targetWidth);
  }
}


// ─────────────────────────────────────────────────────────────
//  IMAGE CLASSIFICATION HELPERS
// ─────────────────────────────────────────────────────────────
function getImageAspectClass_(w, h, config) {
  if (!(w > 0 && h > 0)) return 'unknown';

  var ratio = w / h;
  var landscapeMin = (config && config.standaloneLandscapeMinRatio) || 1.25;
  var portraitMax = (config && config.portraitMaxRatio) || 0.85;

  if (ratio >= landscapeMin) return 'landscape';
  if (ratio <= portraitMax) return 'portrait';
  return 'ambiguous';
}

function paragraphHasMeaningfulText_(para) {
  try {
    for (var i = 0; i < para.getNumChildren(); i++) {
      var child = para.getChild(i);

      if (child.getType() === DocumentApp.ElementType.TEXT) {
        var txt = safeTrim_(child.asText().getText());
        if (txt !== '') return true;
      }
    }
  } catch (e) {}

  return false;
}

function listItemHasMeaningfulText_(item) {
  try {
    for (var i = 0; i < item.getNumChildren(); i++) {
      var child = item.getChild(i);

      if (child.getType() === DocumentApp.ElementType.TEXT) {
        var txt = safeTrim_(child.asText().getText());
        if (txt !== '') return true;
      }
    }
  } catch (e) {}

  return false;
}

function getInlineImagesInParagraph_(para) {
  var out = [];

  try {
    for (var i = 0; i < para.getNumChildren(); i++) {
      var child = para.getChild(i);
      if (child.getType() === DocumentApp.ElementType.INLINE_IMAGE) {
        out.push(child.asInlineImage());
      }
    }
  } catch (e) {}

  return out;
}

function getInlineImagesInListItem_(item) {
  var out = [];

  try {
    for (var i = 0; i < item.getNumChildren(); i++) {
      var child = item.getChild(i);
      if (child.getType() === DocumentApp.ElementType.INLINE_IMAGE) {
        out.push(child.asInlineImage());
      }
    }
  } catch (e) {}

  return out;
}

function shouldFormatStandaloneLandscapeImage_(para, img, body, config) {
  if (!config || !config.formatStandaloneLandscapeImages) return false;
  if (!img) return false;

  var imgs = getInlineImagesInParagraph_(para);
  if (config.skipGroupedImages && imgs.length !== 1) {
    Logger.log('Image skipped: grouped-inline-paragraph');
    return false;
  }

  var w = safeCallNumber_(function() { return img.getWidth(); });
  var h = safeCallNumber_(function() { return img.getHeight(); });
  if (w === 'ERR' || h === 'ERR') {
    Logger.log('Image skipped: inline-size-read-error');
    return false;
  }

  var aspectClass = getImageAspectClass_(w, h, config);

  if (config.skipPortraitImages && aspectClass === 'portrait') {
    Logger.log('Image skipped: portrait-inline');
    return false;
  }

  if (aspectClass !== 'landscape') {
    Logger.log('Image skipped: non-landscape-inline-' + aspectClass);
    return false;
  }

  var hasText = paragraphHasMeaningfulText_(para);
  var largeBlock = isLargeVisualBlock_(w, h, body, config);

  // original safe case: image-only paragraph
  if (!hasText) return true;

  // upgraded case:
  // single landscape image, large enough to behave like a figure
  if (hasText) {
    Logger.log('Image skipped: inline-mixed-text-should-be-repaired-not-promoted');
    return false;
  }

  Logger.log('Image skipped: inline-not-standalone');
  return false;
}  

function shouldFormatStandaloneLandscapeImageInListItem_(item, img, body, config) {
  if (!config || !config.formatStandaloneLandscapeImages) return false;
  if (!img) return false;

  var imgs = getInlineImagesInListItem_(item);
  if (config.skipGroupedImages && imgs.length !== 1) {
    Logger.log('Image skipped: grouped-inline-list-item');
    return false;
  }

  var w = safeCallNumber_(function() { return img.getWidth(); });
  var h = safeCallNumber_(function() { return img.getHeight(); });
  if (w === 'ERR' || h === 'ERR') {
    Logger.log('Image skipped: inline-list-size-read-error');
    return false;
  }

  var aspectClass = getImageAspectClass_(w, h, config);

  if (config.skipPortraitImages && aspectClass === 'portrait') {
    Logger.log('Image skipped: portrait-inline-list-item');
    return false;
  }

  if (aspectClass !== 'landscape') {
    Logger.log('Image skipped: non-landscape-inline-list-item-' + aspectClass);
    return false;
  }

  var hasText = listItemHasMeaningfulText_(item);
  var largeBlock = isLargeVisualBlock_(w, h, body, config);

  if (!hasText) return true;

  if (hasText) {
    Logger.log('Image skipped: list-inline-mixed-text-should-be-repaired-not-promoted');
    return false;
  }

  Logger.log('Image skipped: list-inline-not-standalone');
  return false;
}

function shouldExtractMixedInlineImage_(para, img, body, config) {
  if (!config || !config.formatStandaloneLandscapeImages) return false;
  if (!img) return false;

  var imgs = getInlineImagesInParagraph_(para);
  if (config.skipGroupedImages && imgs.length !== 1) {
    Logger.log('Mixed image skipped: grouped');
    return false;
  }

  if (!paragraphHasMeaningfulText_(para)) {
    Logger.log('Mixed image skipped: no-meaningful-text');
    return false;
  }

  var w = safeCallNumber_(function() { return img.getWidth(); });
  var h = safeCallNumber_(function() { return img.getHeight(); });
  if (w === 'ERR' || h === 'ERR') {
    Logger.log('Mixed image skipped: size-read-error');
    return false;
  }

  var aspectClass = getImageAspectClass_(w, h, config);

  if (config.skipPortraitImages && aspectClass === 'portrait') {
    Logger.log('Mixed image skipped: portrait');
    return false;
  }

  if (aspectClass !== 'landscape') {
    Logger.log('Mixed image skipped: non-landscape-' + aspectClass);
    return false;
  }

  var textWidth = getUsablePageWidth_(body, config);
  var minFraction = (config && config.mixedInlineMinWidthFraction) || 0.55;

  if (w < textWidth * minFraction) {
    Logger.log('Mixed image skipped: too-small-for-extraction');
    return false;
  }

  return true;
}

function shouldConvertPositionedImageToInline_(hostEl, pimg, body, config) {
  if (!config || !config.formatStandaloneLandscapeImages) return false;
  if (!pimg) return false;

  var w = safeCallNumber_(function() { return pimg.getWidth(); });
  var h = safeCallNumber_(function() { return pimg.getHeight(); });
  if (w === 'ERR' || h === 'ERR') {
    Logger.log('Positioned image skipped: size-read-error');
    return false;
  }

  var aspectClass = getImageAspectClass_(w, h, config);

  if (config.skipPortraitImages && aspectClass === 'portrait') {
    Logger.log('Positioned image skipped: portrait');
    return false;
  }

  if (aspectClass !== 'landscape') {
    Logger.log('Positioned image skipped: non-landscape-' + aspectClass);
    return false;
  }

  var layout = safeCallValue_(function() { return pimg.getLayout(); });
  var largeBlock = isLargeVisualBlock_(w, h, body, config);

  // Never touch genuine side-wrapped layouts.
  if (config.skipWrappedPositionedImages && isProtectedSideLayout_(layout)) {
    Logger.log('Positioned image skipped: wrapped-or-side-layout');
    return false;
  }

  if (hostEl.getType() === DocumentApp.ElementType.PARAGRAPH) {
    var para = hostEl.asParagraph();
    var hasText = paragraphHasMeaningfulText_(para);
    var inlineCount = getInlineImagesInParagraph_(para).length;

    // Clean standalone anchor → safe convert
    if (!hasText && inlineCount === 0) {
      return true;
    }

    // Large visual block, not a side-wrap → promote to figure
    if (largeBlock && inlineCount === 0) {
      Logger.log('Positioned image promoted: large-visual-block');
      return true;
    }

    Logger.log('Positioned image skipped: paragraph-anchor-not-safe');
    return false;
  }

  if (hostEl.getType() === DocumentApp.ElementType.LIST_ITEM) {
    var item = hostEl.asListItem();
    var hasItemText = listItemHasMeaningfulText_(item);
    var inlineItemCount = getInlineImagesInListItem_(item).length;

    if (!hasItemText && inlineItemCount === 0) {
      return true;
    }

    if (largeBlock && inlineItemCount === 0) {
      Logger.log('Positioned image promoted: large-list-visual-block');
      return true;
    }

    Logger.log('Positioned image skipped: list-anchor-not-safe');
    return false;
  }

  return false;
}


// ─────────────────────────────────────────────────────────────
//  IMAGE REPAIR HELPERS
// ─────────────────────────────────────────────────────────────
function repairMixedInlineImageParagraphs_(config) {
  var body = getBody_();
  var repaired = 0;

  for (var i = body.getNumChildren() - 1; i >= 0; i--) {
    var child = body.getChild(i);
    if (child.getType() !== DocumentApp.ElementType.PARAGRAPH) continue;

    var para = child.asParagraph();
    repaired += splitMixedInlineImagesFromParagraph_(body, para, i, config);
  }

  Logger.log('repairMixedInlineImageParagraphs_: repaired=' + repaired);
}

function splitMixedInlineImagesFromParagraph_(body, para, bodyIndex, config) {
  if (!paragraphHasMeaningfulText_(para)) return 0;

  var inlineImages = getInlineImagesInParagraph_(para);
  if (inlineImages.length === 0) return 0;

  if (config.skipGroupedImages && inlineImages.length !== 1) {
    Logger.log('splitMixedInlineImagesFromParagraph_: skipped grouped images at paragraph index ' + bodyIndex);
    return 0;
  }

  var img = inlineImages[0];

  if (!shouldExtractMixedInlineImage_(para, img, body, config)) {
    return 0;
  }

  try {
    var blob = img.getBlob();

    var newPara = body.insertParagraph(bodyIndex + 1, '');
    var newImg = newPara.appendInlineImage(blob);

    para.removeChild(img);

    formatStandaloneImageParagraph_(newPara, newImg, body, config);

    Logger.log('splitMixedInlineImagesFromParagraph_: extracted 1 image at paragraph index ' + bodyIndex);
    return 1;
  } catch (e) {
    Logger.log('splitMixedInlineImagesFromParagraph_ failed at paragraph index ' + bodyIndex + ': ' + e);
    return 0;
  }
}

function repairPositionedImagesToInlineParagraphs_(config) {
  var body = getBody_();
  var repaired = 0;

  for (var i = body.getNumChildren() - 1; i >= 0; i--) {
    var child = body.getChild(i);

    if (child.getType() === DocumentApp.ElementType.PARAGRAPH) {
      repaired += convertPositionedImagesInParagraphToInline_(body, child.asParagraph(), i, config);
    } else if (child.getType() === DocumentApp.ElementType.LIST_ITEM) {
      repaired += convertPositionedImagesInListItemToInline_(body, child.asListItem(), i, config);
    }
  }

  Logger.log('repairPositionedImagesToInlineParagraphs_: repaired=' + repaired);
}

function convertPositionedImagesInParagraphToInline_(body, para, bodyIndex, config) {
  var positioned = [];
  try {
    positioned = para.getPositionedImages();
  } catch (e) {
    return 0;
  }

  if (!positioned || positioned.length === 0) return 0;

  if (config.skipGroupedImages && positioned.length !== 1) {
    Logger.log('convertPositionedImagesInParagraphToInline_: skipped grouped positioned images at paragraph index ' + bodyIndex);
    return 0;
  }

  var moved = 0;

  for (var j = positioned.length - 1; j >= 0; j--) {
    var img = positioned[j];

    if (!shouldConvertPositionedImageToInline_(para, img, body, config)) {
      continue;
    }

    try {
      var blob = img.getBlob();
      var id = safeCallValue_(function() { return img.getId(); });

      var newPara = body.insertParagraph(bodyIndex + 1, '');
      var newImg = newPara.appendInlineImage(blob);

      formatStandaloneImageParagraph_(newPara, newImg, body, config);

      if (id !== 'ERR' && id) {
        try {
          para.removePositionedImage(id);
        } catch (e) {
          Logger.log('Could not remove positioned image from paragraph index ' + bodyIndex + ': ' + e);
        }
      }

      moved++;
    } catch (e) {
      Logger.log('convertPositionedImagesInParagraphToInline_ failed at index ' + bodyIndex + ': ' + e);
    }
  }

  return moved;
}

function convertPositionedImagesInListItemToInline_(body, item, bodyIndex, config) {
  var positioned = [];
  try {
    positioned = item.getPositionedImages();
  } catch (e) {
    return 0;
  }

  if (!positioned || positioned.length === 0) return 0;

  if (config.skipGroupedImages && positioned.length !== 1) {
    Logger.log('convertPositionedImagesInListItemToInline_: skipped grouped positioned images at list item index ' + bodyIndex);
    return 0;
  }

  var moved = 0;

  for (var j = positioned.length - 1; j >= 0; j--) {
    var img = positioned[j];

    if (!shouldConvertPositionedImageToInline_(item, img, body, config)) {
      continue;
    }

    try {
      var blob = img.getBlob();
      var id = safeCallValue_(function() { return img.getId(); });

      var newPara = body.insertParagraph(bodyIndex + 1, '');
      var newImg = newPara.appendInlineImage(blob);

      formatStandaloneImageParagraph_(newPara, newImg, body, config);

      if (id !== 'ERR' && id) {
        try {
          item.removePositionedImage(id);
        } catch (e) {
          Logger.log('Could not remove positioned image from list item index ' + bodyIndex + ': ' + e);
        }
      }

      moved++;
    } catch (e) {
      Logger.log('convertPositionedImagesInListItemToInline_ failed at index ' + bodyIndex + ': ' + e);
    }
  }

  return moved;
}

function safeTrim_(s) {
  return (s || '').replace(/\s+/g, ' ').trim();
}

function safeCallNumber_(fn) {
  try {
    return fn();
  } catch (e) {
    return 'ERR';
  }
}

function safeCallValue_(fn) {
  try {
    return fn();
  } catch (e) {
    return 'ERR';
  }
}
