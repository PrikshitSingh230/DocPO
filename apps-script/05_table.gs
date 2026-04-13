function formatTable_(table, ctx) {
  var config = ctx.config;
  var rowCount = table.getNumRows();
  if (rowCount === 0) return;

  fitTableToTextWidth_(table, ctx.body, config);

  for (var r = 0; r < rowCount; r++) {
    var row = table.getRow(r);
    var isHeader = (r === 0);
    var cells = row.getNumCells();

    for (var c = 0; c < cells; c++) {
      var cell = row.getCell(c);

      try { cell.setVerticalAlignment(DocumentApp.VerticalAlignment.CENTER); } catch (e) {}

      if (isHeader) {
        try { cell.setBackgroundColor(config.tableHeaderBg); } catch (e) {}
      } else {
        try { cell.setBackgroundColor('#f2f2f2'); } catch (e) {}
      }

      walkContainer_(cell, ctx, true, isHeader);
    }
  }

  // Leave disabled until you rebuild table borders safely.
  // forceVisibleTableBordersWithDocsApi_(ctx.body, config);
}

function fitTableToTextWidth_(table, body, config) {
  if (!table || table.getNumRows() === 0) return;

  var cols = table.getRow(0).getNumCells();
  if (cols === 0) return;

  var usableWidth = getUsablePageWidth_(body, config);
  var colWidth = Math.floor(usableWidth / cols);

  for (var c = 0; c < cols; c++) {
    try {
      table.setColumnWidth(c, colWidth);
    } catch (e) {
      Logger.log('setColumnWidth failed for col ' + c + ': ' + e);
    }
  }
}
