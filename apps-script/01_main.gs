function installDocPo() {
  var triggers = ScriptApp.getProjectTriggers();
  for (var i = 0; i < triggers.length; i++) {
    if (triggers[i].getHandlerFunction() === 'onOpen') {
      ScriptApp.deleteTrigger(triggers[i]);
    }
  }
  ScriptApp.newTrigger('onOpen')
    .forDocument(DocumentApp.getActiveDocument())
    .onOpen()
    .create();
  alertSafe_('DocPo installed', 'Reload your Google Doc to see the DocPo menu.');
}

function runDocPo() {
  try {
    formatDocument_(CONFIG);
  } catch (e) {
    throw e;
  }
}

function runDocPoWithConfig(cfg) {
  try {
    formatDocument_(mergeConfig_(CONFIG, cfg || {}));
  } catch (e) {
    throw e;
  }
}

function formatDocument_(config) {
  var ui = getUiSafe_();

  if (ui) {
    var resp = ui.alert(
      'DocPo: format document?',
      'This will reformat all paragraphs, tables and images.\n' +
      'Tip: File > Version history > Name current version to back up first.\n\nContinue?',
      ui.ButtonSet.YES_NO
    );
    if (resp !== ui.Button.YES) return;
  }

  try {
    var body = getBody_();
    var effectiveConfig = mergeConfig_(CONFIG, config || {});

    var ctx = {
      config: effectiveConfig,
      body: body,
      targetWidth: getUsablePageWidth_(body, effectiveConfig)
    };

    removeHorizontalRules_(body);
    repairMixedInlineImageParagraphs_(effectiveConfig);
    repairPositionedImagesToInlineParagraphs_(effectiveConfig);

    if (effectiveConfig.enableFootnotes) {
      processFootnotePlaceholdersWithDocsApi_(effectiveConfig);
    }

    walkContainer_(body, ctx, false, false);
    cleanupBulletGaps_(body);

    alertSafe_('DocPo', 'Document formatted successfully!');
  } catch (e) {
    Logger.log('DocPo fatal: ' + (e.stack || e));
    alertSafe_('DocPo error', e.message + '\n\nSee Logs for details.');
    throw e;
  }
}
