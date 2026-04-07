# IEP 會議自動化排程系統 - 實作待辦清單

- `[/]` 模組一：Google Sheet 核心與 GAS 專案初始化
  - `[ ]` 建立專用的 Google 試算表 (Google Sheet) 作為系統資料庫
  - `[ ]` 定義試算表資料欄位 (包含：學號、姓名、家長LINE_ID、導師、輔導老師、空堂備選時間、確認開會時間、狀態等)
  - `[ ]` 在 Google 試算表中建立 Apps Script (GAS) 專案與基本設定

- `[/]` 模組二：通訊與日曆機制 (GAS)
  - `[x]` 實作 LINE Messaging API Webhook 接收功能
  - `[ ]` 實作向家長發送「時間選單」的功能 (Flex Message 或 Buttons Template)
  - `[x]` 解析家長回覆，並將最終選項更新至試算表狀態
  - `[ ]` 實作串接 Google Calendar API 自動建立會議、產生 Meet 連結並將結果填回試算表
  - `[ ]` 發送最終確認信與 Meet 連結給家長

- `[/]` 模組三：課表 OCR 智慧比對本機程式 (Python)
  - `[x]` 建置 Python 開發環境與安裝 `google-generativeai`, `google-api-python-client` 等套件
  - `[ ]` 實作 Google Drive API 下載/讀取課表截圖的模組
  - `[ ]` 整合 Gemini Vision API 解析課表圖片並轉化為結構化資料
  - `[ ]` 撰寫演算法：比對特定學生之導師與輔導老師雙方的共同空堂
  - `[ ]` 透過 Google Sheets API 將算出的空堂時間寫回指定的儲存格

- `[ ]` 模組四：不調代課系統 RPA 作業 (Python + Windows PAD)
  - `[ ]` 撰寫 Python `rpa_trigger.py` 腳本，定期輪詢 Google Sheet 檢查狀態為「家長已回覆」的項目
  - `[ ]` 利用 Power Automate Desktop 錄製登入與填單動作
  - `[ ]` 設定 PAD 的輸入變數 (時間、教師名稱/代碼)
  - `[ ]` 由 Python 呼叫命令列啟動 PAD 流程並帶入變數，完成自動表單填寫
