import os
import json
import base64
import requests
from dotenv import load_dotenv

# 載入 .env 檔案中的環境變數
load_dotenv()

# 取出金鑰
api_key = os.getenv("GEMINI_API_KEY")

def find_common_free_periods(teacher_img_path, counselor_img_path):
    if not api_key:
        print("❌ 找不到 GEMINI_API_KEY！\n請先將 .env.example 複製一份命名為 .env，並填入你的 Google Gemini API 金鑰。")
        return

    def get_mime_type(path):
        ext = os.path.splitext(path)[1].lower()
        if ext == '.png':
            return "image/png"
        return "image/jpeg"


    print("🚀 正在上傳課表圖片給 Gemini 進行 AI 視覺比對分析...")
    try:
        # 使用 REST API 的方式呼叫 Gemini，避開 Python 版本與 protobuf 的相容性問題
        url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key={api_key}"
        
        # 讀取圖片並轉為 Base64
        with open(teacher_img_path, "rb") as f1:
            img1_b64 = base64.b64encode(f1.read()).decode("utf-8")
        with open(counselor_img_path, "rb") as f2:
            img2_b64 = base64.b64encode(f2.read()).decode("utf-8")
            
        # 構建 Prompt 要求 Gemini 分析與比對
        prompt = """
        這裡有兩張學校老師的課表圖片。
        第一張是「導師」的課表。
        第二張是「輔導老師」的課表。

        請你仔細閱讀這兩張課表，並執行以下任務：
        1. 找出第一張圖片「導師」星期一到星期五的所有「空堂」（即課表上沒有寫課程的格子）。
        2. 找出第二張圖片「輔導老師」星期一到星期五的所有「空堂」。
        3. 交叉比對這兩份空堂，選出「雙方同時都是空堂」的時段。

        請注意，學校的節次通常為第 1 節到第 7 或 8 節，請排除午休時間的格子。
        請直接將你們找到的「共同空堂」，以明確的格式列出，例如：
        - 星期一：第 3 節, 第 5 節
        - 星期三：第 2 節

        並在最後，你必須從這些共同空堂中，為我挑選出「三個最適合安排開會的備選時段」，以 JSON 陣列格式輸出這三個時段的字串放在回答的最下方，格式一定要長這樣，不要加上其他多餘符號：
        ```json
        ["星期一 第3節", "星期三 第2節", "星期四 第1節"]
        ```
        如果在課表中能看到確切時間（例如 10:10-11:00），也可以直接寫在字串中。
        """

        payload = {
            "contents": [{
                "parts": [
                    {"text": prompt},
                    {
                        "inline_data": {
                            "mime_type": get_mime_type(teacher_img_path), 
                            "data": img1_b64
                        }
                    },
                    {
                        "inline_data": {
                            "mime_type": get_mime_type(counselor_img_path), 
                            "data": img2_b64
                        }
                    }
                ]
            }]
        }
        
        headers = {'Content-Type': 'application/json'}
        
        print("⏳ 等待 Gemini 回覆中，這包含複雜的視覺理解，可能需要 10-30 秒鐘的時間...")
        response = requests.post(url, headers=headers, json=payload)
        
        if response.status_code == 200:
            result = response.json()
            text = result["candidates"][0]["content"]["parts"][0]["text"]
            
            print("\n================ Gemini 分析結果 ================\n")
            print(text)
            print("\n=================================================\n")
            return text
        else:
            print(f"❌ API 請求失敗，狀態碼: {response.status_code}")
            print(response.text)

    except Exception as e:
        print(f"❌ 分析過程發生錯誤: {e}")

if __name__ == "__main__":
    print("\n=== IEP 共同空堂 AI 比對系統 (REST API版) ===")
    # 尋找支援的圖片格式
    def find_image(prefix):
        for ext in ['.png', '.jpg', '.jpeg']:
            if os.path.exists(f"{prefix}{ext}"):
                return f"{prefix}{ext}"
        return None
        
    t_path = find_image("teacher")
    c_path = find_image("counselor")
    
    # 檢查檔案是否存在
    if not t_path or not c_path:
        print("⚠️ 找不到課表圖片檔！請準備兩張課表截圖 (支援 .png 或 .jpg)：\n1. 導師課表 -> 請命名為 'teacher.png' 或 'teacher.jpg'\n2. 輔導老師課表 -> 請命名為 'counselor.png' 或 'counselor.jpg'")
        print("請將這兩張圖片放入 D:\\my-workspace\\iep-automation 資料夾中後，重新執行此程式。")
    else:
        print(f"💡 載入課表圖片：導師({t_path}), 輔導老師({c_path})")
        find_common_free_periods(t_path, c_path)
