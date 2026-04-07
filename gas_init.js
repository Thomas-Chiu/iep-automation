function onOpen() {
  const ui = SpreadsheetApp.getUi();
  ui.createMenu('IEP 自動化')
    .addItem('初始化試算表欄位', 'initSheetHeaders')
    .addToUi();
}

function initSheetHeaders() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  
  // 定義所有欄位
  const headers = [
    "狀態", 
    "學生學號", 
    "學生姓名", 
    "導師姓名", 
    "輔導老師姓名", 
    "家長 LINE ID", 
    "共同空堂備選1", 
    "共同空堂備選2", 
    "共同空堂備選3", 
    "確認開會時間", 
    "Google Meet 連結"
  ];
  
  // 寫入標題列並設定格式
  sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  sheet.getRange(1, 1, 1, headers.length).setFontWeight("bold").setBackground("#f3f3f3");
  sheet.setFrozenRows(1); // 凍結第一列

  // 建立「狀態」欄位的下拉選單 (Data Validation)
  const rule = SpreadsheetApp.newDataValidation()
    .requireValueInList([
      "0-初始建立", 
      "1-需比對空堂", 
      "2-已取得空堂",
      "3-待家長選擇", 
      "4-家長已回覆", 
      "5-日曆已建立", 
      "6-代課已完成"
    ], true)
    .build();
    
  // 套用下拉選單到 A2:A1000
  sheet.getRange(2, 1, 999, 1).setDataValidation(rule);
  
  SpreadsheetApp.getActiveSpreadsheet().toast('試算表欄位初始化完成！', '系統提示');
}
