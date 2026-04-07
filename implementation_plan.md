# IEP 會議自動化排程系統 (IEP Meeting Automation)

## 目標與背景

建立一個以 Google Sheet 為核心的自動化系統，幫助特教團隊自動比對教師空堂、透過 LINE 詢問家長時間、自動建立 Google Calendar/Meet 會議，並利用 RPA 自動完成校內無 API 的「不調代課系統」請假作業。這將大幅減少行政溝通與人工作業時間。

---

## 系統架構設計

為了解決不同系統的限制（如 LINE 需要 Webhook、代課系統需要本地端操作），建議採用 **Google Apps Script (GAS) + 本機 Python 腳本 + Power Automate Desktop (PAD)** 的混合架構。

### 1. 控制中心：Google 試算表 (Google Sheet) 與 GAS
這將是整個專案的大腦與資料庫：
- **操作介面**：所有學生的 IEP 排程進度都一目了然。
- **自動化選單/功能**：在選單列加入自訂按鈕（如：「寄送LINE時間調查」、「建立Google日曆」）。
- **LINE 通訊中樞**：利用 GAS 接收家長的 LINE 回覆 (Webhook)，並將確認的時間寫回試算表。

### 2. 視覺 AI 辨識：Python + Gemini Vision
解決課表與比對問題：
- 老師的課表截圖統一放在指定的 Google Drive 資料夾或本機資料夾。
- 本機端的 Python 程式讀取圖片後，透過 Gemini Vision AI 提取文字表格，並根據演算法自動比對出「導師」與「輔導老師」的共同空堂時間。
- 將找出能開會的幾個備選時段寫入 Google Sheet。

### 3. 本機 RPA 自動化：Python + Google 搭配 Power Automate Desktop
解決校內系統不提供 API 的痛點：
- 使用 Windows 內建的 Power Automate Desktop (PAD) 錄製登入「不調代課系統」及填表動作。
- 當試算表狀態變更為「家長時間已確認」時，本機端的 Python 自動化程式會觸發 PAD 流程，將教師與確認好的時間當作變數帶入，由 RPA 機器人模擬鍵盤滑鼠自動送出表單。

---

## 預期工作流程拆解 (Proposed Changes)

我們將把專案拆分為以下四個主要模組來實作：

### 模組一：Google Sheet 控制樞紐設計
- 設計試算表欄位（例如：學生姓名、導師、輔導老師、家長LINE_ID、共同空堂備選、最終確認時間、狀態...等）。
- 配置 Google Apps Script 環境以讀寫表格。

### 模組二：Google Calendar 與 LINE 推播 (GAS)
- 在 GAS 中實作建立日曆活動與 Meet 連結的功能。
- 整合 LINE Messaging API。
- 實作「發送包含備選時間的按鈕訊息 (Flex Message 或 選單)」給家長。
- 實作接收家長點擊回覆後，自動更新 Sheet 狀態為「已確認」的功能。

### 模組三：課表 OCR 智慧比對 (Python)
- `[NEW] ocr_matcher.py`: 撰寫 Python 腳本串接 Gemini Vision API。
- 實作課表圖片解析與雙方空堂交集演算法。
- 實作與 Google Sheet 資料的讀寫同步機制，將比對結果填補進試算表。

### 模組四：不調代課系統 RPA 作業 (Windows PAD)
- 協助您設計 PAD 的輸入變數與錄製動作。
- `[NEW] rpa_trigger.py`: 撰寫腳本監聽 Google Sheet 的狀態變化，若進入特定狀態，即利用命令列 (CLI) 啟動 PAD 流程並帶入參數。

---

## 設計決策紀錄 (Design Decisions)
- **家長綁定機制:** 已知學生學號與對應家長，建立由開發者於系統（Google Sheet）中直接綁定關聯的機制。
- **本機執行環境:** 確認使用使用者的 Windows 電腦作為常駐程式環境，以執行 Python 輪詢腳本與 PAD 自動化。
- **圖檔來源:** 教師課表截圖統一存放在 Google Drive 資料夾，程式將串接 Google Drive 讀取圖片以進行 OCR 處理。

## 驗證計畫 (Verification Plan)
- **OCR 測試:** 以實際課表截圖測試 AI 判斷正確率與空堂抓取的準確度。
- **LINE 互動測試:** 使用開發者的個人 LINE 帳號模擬家長完成綁定、收發按鈕與時段確認流程。
- **排程功能測試:** 驗證 Google 日曆/Meet 自動建立功能。
- **RPA 模擬:** 使用免洗或測試時段演練登入系統與點擊。
