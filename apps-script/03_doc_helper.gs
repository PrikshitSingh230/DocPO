function getBody_() {
  var doc = DocumentApp.getActiveDocument();
  try {
    return doc.getActiveTab().asDocumentTab().getBody();
  } catch (e) {
    return doc.getBody();
  }
}

function getActiveTabInfo_() {
  var doc = DocumentApp.getActiveDocument();
  var tab = null;
  try {
    tab = doc.getActiveTab();
  } catch (e) {}
  return {
    doc: doc,
    docId: doc.getId(),
    tab: tab,
    tabId: tab ? tab.getId() : null
  };
}
