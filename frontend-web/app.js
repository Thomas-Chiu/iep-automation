document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const apiKeyInput = document.getElementById('apiKey');
    const modelSelect = document.getElementById('modelSelect');
    const saveKeyBtn = document.getElementById('saveKeyBtn');
    const keyStatus = document.getElementById('keyStatus');
    
    const teacherDrop = document.getElementById('teacherDrop');
    const counselorDrop = document.getElementById('counselorDrop');
    const teacherFile = document.getElementById('teacherFile');
    const counselorFile = document.getElementById('counselorFile');
    const teacherPreview = document.getElementById('teacherPreview');
    const counselorPreview = document.getElementById('counselorPreview');
    
    const analyzeBtn = document.getElementById('analyzeBtn');
    const resultSection = document.getElementById('resultSection');
    const loading = document.getElementById('loading');
    const errorMsg = document.getElementById('errorMsg');
    const resultContent = document.getElementById('resultContent');
    const jsonWrapper = document.getElementById('jsonWrapper');
    const jsonOutput = document.getElementById('jsonOutput');

    // State Objects
    let teacherImage = { base64: null, mime: null };
    let counselorImage = { base64: null, mime: null };

    // Initialization: Load saved settings
    const savedKey = localStorage.getItem('iep_gemini_api_key');
    const savedModel = localStorage.getItem('iep_gemini_model');
    if (savedKey) apiKeyInput.value = savedKey;
    if (savedModel) modelSelect.value = savedModel;

    // Save Key & Model locally
    saveKeyBtn.addEventListener('click', () => {
        const key = apiKeyInput.value.trim();
        localStorage.setItem('iep_gemini_model', modelSelect.value);
        if (key) {
            localStorage.setItem('iep_gemini_api_key', key);
        }
        keyStatus.textContent = '✅ 設定已儲存！';
        setTimeout(() => keyStatus.textContent = '', 3000);
    });

    // Handle Drag & Drop UI logic
    const setupDropZone = (dropZone, fileInput, previewContainer, imageState) => {
        dropZone.addEventListener('click', () => fileInput.click());
        
        dropZone.addEventListener('dragover', (e) => {
            e.preventDefault();
            dropZone.classList.add('dragover');
        });
        
        dropZone.addEventListener('dragleave', () => dropZone.classList.remove('dragover'));
        
        dropZone.addEventListener('drop', (e) => {
            e.preventDefault();
            dropZone.classList.remove('dragover');
            if (e.dataTransfer.files.length) {
                processImageFile(e.dataTransfer.files[0], dropZone, previewContainer, imageState);
            }
        });
        
        fileInput.addEventListener('change', (e) => {
            if (e.target.files.length) {
                processImageFile(e.target.files[0], dropZone, previewContainer, imageState);
            }
        });
    };

    setupDropZone(teacherDrop, teacherFile, teacherPreview, teacherImage);
    setupDropZone(counselorDrop, counselorFile, counselorPreview, counselorImage);

    // Read file and update UI state
    function processImageFile(file, dropZone, previewContainer, imageState) {
        if (!file.type.startsWith('image/')) {
            alert('❌ 錯誤：請上傳有效的圖片檔 (.png 或 .jpg)！');
            return;
        }

        const reader = new FileReader();
        reader.onload = (e) => {
            // Update UI preview
            previewContainer.innerHTML = `<img src="${e.target.result}" alt="Preview">`;
            previewContainer.style.display = 'block';
            dropZone.classList.add('hidden'); // Hide drop zone once uploaded

            // Store base64 data for API (remove data:image/;base64, prefix)
            const base64str = e.target.result.split(',')[1];
            imageState.base64 = base64str;
            imageState.mime = file.type;

            checkBothImagesReady();
        };
        reader.readAsDataURL(file);
    }

    // Enable button if both images are present
    function checkBothImagesReady() {
        if (teacherImage.base64 && counselorImage.base64) {
            analyzeBtn.disabled = false;
        }
    }

    // API Call Process
    analyzeBtn.addEventListener('click', async () => {
        const apiKey = localStorage.getItem('iep_gemini_api_key') || apiKeyInput.value.trim();
        if (!apiKey) {
            alert('⚠️ 請先在上方設定並儲存您的 Gemini API 金鑰！');
            apiKeyInput.focus();
            return;
        }

        // Setup UI for loading
        resultSection.classList.remove('hidden');
        loading.classList.remove('hidden');
        errorMsg.classList.add('hidden');
        jsonWrapper.classList.add('hidden');
        resultContent.innerHTML = '';
        analyzeBtn.disabled = true;

        try {
            const apiResultText = await fetchGeminiMatching(apiKey);
            renderResult(apiResultText);
        } catch (err) {
            errorMsg.textContent = `❌ 比對失敗: ${err.message}`;
            errorMsg.classList.remove('hidden');
        } finally {
            loading.classList.add('hidden');
            analyzeBtn.disabled = false;
        }
    });

    // Fetch from Gemini API directly in browser
    async function fetchGeminiMatching(apiKey) {
        const targetModel = modelSelect.value || 'gemini-3-flash-preview';
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${targetModel}:generateContent?key=${apiKey}`;
        
        const promptText = `
        這裡有兩張學校老師的課表圖片。第一張是「導師」的課表，第二張是「輔導老師」的課表。
        為了確保 100% 精準比對不遺漏，請你「一步一步」思考並列出過程：
        步驟一：仔細辨識「導師」的課表，具體列出每一天（星期一到五）的第 1 到 8 節，哪些是真正的「空堂」（即沒有文字、完全沒有排課的格子）。
        步驟二：仔細辨識「輔導老師」的課表，具體列出每一天（星期一到五）的第 1 到 8 節，哪些是「空堂」。
        步驟三：嚴格交叉比對剛剛列出的清單，只有當某一天某一節「兩人確切都是空堂」時，才算成功。排除午休時間。

        過程思考完畢後，請你將最終所有的「共同空堂」列出來。
        最後，你必須從這些共同空堂中挑選「三個最適合安排開會的時段」，並務必在你的回覆最下方，用一個 markdown JSON 代碼區塊輸出這三個選項的字串陣列，格式如下：
        \`\`\`json
        ["星期一 第3節", "星期三 第2節", "星期四 第1節"]
        \`\`\`
        `;

        const payload = {
            contents: [{
                parts: [
                    { text: promptText },
                    { inline_data: { mime_type: teacherImage.mime, data: teacherImage.base64 } },
                    { inline_data: { mime_type: counselorImage.mime, data: counselorImage.base64 } }
                ]
            }]
        };

        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.error?.message || 'API 請求失敗，可能金鑰無效或達配額限制。');
        }

        return data.candidates[0].content.parts[0].text;
    }

    // Parse Markdown & Extract JSON
    function renderResult(text) {
        // Try to extract JSON
        const jsonMatch = text.match(/```json\n([\s\S]*?)\n```/);
        let markdownText = text;
        
        if (jsonMatch) {
            const jsonStr = jsonMatch[1];
            try {
                // Verify valid JSON
                JSON.parse(jsonStr);
                jsonOutput.textContent = jsonStr;
                jsonWrapper.classList.remove('hidden');
                // Remove JSON block from markdown output to keep it clean
                markdownText = text.replace(/```json\n[\s\S]*?\n```/, '').trim();
            } catch (e) {
                console.warn("JSON Parse Error:", e);
            }
        } 

        // Use marked to render Markdown if loaded, else fallback to standard text
        if (typeof marked !== 'undefined') {
            resultContent.innerHTML = marked.parse(markdownText);
        } else {
            resultContent.innerHTML = `<p>${markdownText.replace(/\n/g, '<br>')}</p>`;
        }
    }
});
