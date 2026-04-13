function forceVisibleTableBordersWithDocsApi_(body, config) {
  try {
    var doc = DocumentApp.getActiveDocument();
    var docId = doc.getId();

    var borderColorHex = (config && config.tableBorderColor) || '#000000';
    var borderWidthPt = Number((config && config.tableBorderWidth) || 1.5);
    var rgb = hexToRgb01_(borderColorHex);

    var docJson = Docs.Documents.get(docId);
    var content = (docJson.body && docJson.body.content) || [];
    var requests = [];

    for (var i = 0; i < content.length; i++) {
      var el = content[i];
      if (!el.table || !el.startIndex) continue;

      requests.push({
        updateTableCellStyle: {
          tableStartLocation: {
            index: el.startIndex
          },
          tableCellStyle: {
            borderTop: {
              width: { magnitude: borderWidthPt, unit: 'PT' },
              dashStyle: 'SOLID',
              color: { color: { rgbColor: rgb } }
            },
            borderBottom: {
              width: { magnitude: borderWidthPt, unit: 'PT' },
              dashStyle: 'SOLID',
              color: { color: { rgbColor: rgb } }
            },
            borderLeft: {
              width: { magnitude: borderWidthPt, unit: 'PT' },
              dashStyle: 'SOLID',
              color: { color: { rgbColor: rgb } }
            },
            borderRight: {
              width: { magnitude: borderWidthPt, unit: 'PT' },
              dashStyle: 'SOLID',
              color: { color: { rgbColor: rgb } }
            }
          },
          fields: 'borderTop,borderBottom,borderLeft,borderRight'
        }
      });
    }

    Logger.log('forceVisibleTableBordersWithDocsApi_: tables=' + requests.length);

    if (requests.length > 0) {
      Docs.Documents.batchUpdate({ requests: requests }, docId);
      Logger.log('forceVisibleTableBordersWithDocsApi_: batchUpdate success');
    }
  } catch (e) {
    Logger.log('forceVisibleTableBordersWithDocsApi_ FAILED: ' + e);
    Logger.log(e && e.stack ? e.stack : 'no stack');
    throw e;
  }
}

function hexToRgb01_(hex) {
  hex = (hex || '#000000').replace('#', '');
  if (hex.length !== 6) {
    return { red: 0, green: 0, blue: 0 };
  }

  var r = parseInt(hex.substring(0, 2), 16) / 255;
  var g = parseInt(hex.substring(2, 4), 16) / 255;
  var b = parseInt(hex.substring(4, 6), 16) / 255;

  return { red: r, green: g, blue: b };
}
