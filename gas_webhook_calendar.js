// ====== 環境變數設定 ======
// 請將您的 LINE Channel Access Token 貼在下方
const LINE_CHANNEL_ACCESS_TOKEN = "YOUR_LINE_CHANNEL_ACCESS_TOKEN";

// 您的公用 Google Calendar ID (通常是公務信箱地址，或特定日曆ID)
const CALENDAR_ID = "YOUR_CALENDAR_ID@group.calendar.google.com";

// ==========================================
// 模組二：LINE Webhook 與 推播功能
// ==========================================

// 接收 LINE Messaging API webhook (家長傳送訊息或點擊按鈕)
function doPost(e) {
  try {
    const eventData = JSON.parse(e.postData.contents).events[0];
    const replyToken = eventData.replyToken;
    const userId = eventData.source.userId;
    
    // 如果是按下 Flex Message 選單傳回來的資料 (通常設計為 Postback)
    if (eventData.type === 'postback') {
      const data = eventData.postback.data; 
      // 假設 data 格式為 "action=select_time&studentId=12345&time=2024-05-10 10:00"
      const params = parseQueryString(data);
      
      if (params.action === 'select_time') {
        const selectedTime = params.time;
        const studentId = params.studentId;
        
        // 1. 將確認後的時間寫回 Google Sheet，變更狀態為 "4-家長已回覆"
        updateSheetTimeAndStatus(studentId, selectedTime);
        
        // 2. 回覆家長確認訊息
        replyMessage(replyToken, `已為您確認會議時間：\n${selectedTime}\n系統將為您建立會議並產生連結，請稍候。`);
        
        // 3. 自動建立日曆與 Meet 連結 (可選在此處執行或另寫排程執行)
        // createCalendarEventAndMeet(studentId, selectedTime);
      }
    }
    
    // 開發階段：若收到文字，可把 User ID 傳回給使用者，方便手動綁定
    if (eventData.type === 'message' && eventData.message.type === 'text') {
      const text = eventData.message.text;
      if (text === '綁定') {
        replyMessage(replyToken, `您的 LINE User ID 是：\n${userId}\n請將此ID提供給管理者輸入至系統。`);
      }
    }
  } catch (err) {
    console.error(err);
  }
  return ContentService.createTextOutput("OK");
}

function parseQueryString(queryString) {
  var query = {};
  var pairs = (queryString[0] === '?' ? queryString.substr(1) : queryString).split('&');
  for (var i = 0; i < pairs.length; i++) {
    var pair = pairs[i].split('=');
    query[decodeURIComponent(pair[0])] = decodeURIComponent(pair[1] || '');
  }
  return query;
}

// 發送 LINE 訊息
function replyMessage(replyToken, text) {
  const url = 'https://api.line.me/v2/bot/message/reply';
  const options = {
    'headers': {
      'Content-Type': 'application/json; charset=UTF-8',
      'Authorization': 'Bearer ' + LINE_CHANNEL_ACCESS_TOKEN
    },
    'method': 'post',
    'payload': JSON.stringify({
      'replyToken': replyToken,
      'messages': [{'type': 'text', 'text': text}]
    })
  };
  UrlFetchApp.fetch(url, options);
}

// ==========================================
// 更新 Google Sheet 狀態
// ==========================================
function updateSheetTimeAndStatus(studentId, selectedTime) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  const data = sheet.getDataRange().getValues();
  
  for (let i = 1; i < data.length; i++) {
    // 假設 B 欄是學號 (index 1)
    if (data[i][1] == studentId) {
      // 假設 J 欄是確認開會時間 (index 9)
      sheet.getRange(i + 1, 10).setValue(selectedTime);
      // 假設 A 欄是狀態 (index 0)
      sheet.getRange(i + 1, 1).setValue("4-家長已回覆");
      break;
    }
  }
}

// ==========================================
// 模組三：建立 Google Calendar 與 Meet 連結
// ==========================================
function _testCreateCalendar() {
  // 開發人員測試用函式
  // createCalendarEventAndMeet("TEST_ID", "2024-05-10 10:00");
}
