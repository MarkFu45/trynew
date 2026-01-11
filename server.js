import 'dotenv/config';
import express from 'express';
import multer from 'multer';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import Tesseract from 'tesseract.js';

console.log('DEBUG: ARK_API_KEY:', process.env.ARK_API_KEY ? '已设置' : '未设置');
console.log('DEBUG: USE_MOCK:', process.env.USE_MOCK);

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const upload = multer({ storage: multer.memoryStorage() });

app.use(cors());
app.use(express.json());

// 静态文件服务
app.use(express.static(path.join(__dirname, 'public')));

// 主页路由（可选，直接静态文件即可）
app.get('/', (_req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// 工具：简单校验图片类型与大小
function validateFiles(files) {
  if (!files || files.length < 5) {
    return '请至少上传5张图片';
  }
  if (files.length > 30) {
    return '最多只能上传30张图片';
  }
  for (const f of files) {
    if (f.size > 10 * 1024 * 1024) return `文件 ${f.originalname} 超过10MB`;
    const ok = ['image/jpeg', 'image/png', 'image/webp'].includes(f.mimetype);
    if (!ok) return `文件 ${f.originalname} 格式不支持（仅jpg/png/webp）`;
  }
  return null;
}

// 模拟生成分析结果（缺少密钥或本地开发）
function mockAnalyze(files, notes) {
  const tags = files.slice(0, 5).map((f) => path.parse(f.originalname).name);
  return {
    persona: {
      traits: ['理性', '爱运动'],
      interests: [
        { tag: '跑步', confidence: 0.82 },
        { tag: '美食', confidence: 0.76 }
      ],
      style: { social: '偏内向', humor: '中等' }
    },
    plan: {
      days: 10,
      steps: [
        { day: 1, message: '轻松问候+共同点话题' },
        { day: 3, message: '围绕其兴趣的轻话题延展' },
        { day: 7, message: '提议轻量线下活动（咖啡/慢跑）' }
      ]
    },
    talks: [
      { tone: '自然', text: '嗨，最近看到你分享的跑步路线，感觉好专业！' },
      { tone: '活泼', text: '你上次的美食打卡看起来太诱人了，在哪家？' }
    ],
    risks: ['避免过度询问隐私', '尊重节奏与边界'],
    meta: { cost_ms: 1200, source: 'mock', tags, notes }
  };
}

// Favicon handler to prevent 404s
app.get('/favicon.ico', (req, res) => res.status(204).end());

// API route
app.post('/api/analyze', upload.array('images', 9), async (req, res) => {
    try {
        const { notes } = req.body;
        const files = req.files || [];
        
        console.log(`Received ${files.length} files. Notes: ${notes}`);

        // Construct input text
        const fileNames = files.map(f => f.originalname).join(', ');
        // Temporarily disabled OCR to prevent crashes
        // const ocrTexts = await performOCR(files); 
        const ocrTexts = []; 
        
        // Convert files to base64 images for the API
        const imageInputs = files.map(file => {
            const base64 = file.buffer.toString('base64');
            const mimeType = file.mimetype;
            return {
                type: 'input_image',
                image_url: `data:${mimeType};base64,${base64}`
            };
        });

        // Limit to 5 images to prevent payload too large issues
        const selectedImages = imageInputs.slice(0, 5);

        let systemPrompt = "你是一位精通心理学和社交关系的朋友圈分析师。请根据用户提供的朋友圈内容（图片、用户备注等），分析其性格特质、潜在需求，并给出高情商的聊天建议和行动指南。输出必须是严格的JSON格式，包含 personality (string), chat_suggestions (array of strings), action_guide (array of strings)。";
        
        let userContent = [];
        // Add images first
        userContent.push(...selectedImages);
        
        // Add text prompt
        let textPrompt = `我上传了${files.length}张朋友圈截图。文件名是：${fileNames}。\n`;
        if (notes) textPrompt += `我的额外备注：${notes}\n`;
        userContent.push({
            type: 'input_text',
            text: textPrompt
        });

        let apiResult = null;
        let apiError = null;

        if (process.env.USE_MOCK !== '1') {
            try {
                apiResult = await callDoubao({ userContent, systemPrompt });
            } catch (e) {
                console.error("API Call Failed:", e.message);
                apiError = e.message;
            }
        }

        if (apiResult) {
            res.json({ analysis: apiResult });
        } else {
            console.log("Falling back to Mock Data...");
            const responseData = { 
                analysis: mockAnalyze(files, notes),
                meta: {
                    isMock: true,
                    warning: apiError ? `API调用失败 (${apiError})，已切换至演示数据。请检查 API Key 或 Model 状态。` : "已切换至演示数据。"
                }
            };
            
            // Special handling for "ModelNotOpen" error to give helpful advice
            if (apiError && (apiError.includes("ModelNotOpen") || apiError.includes("NotFound"))) {
                responseData.meta.warning = "API调用失败：模型 ID 错误或未开通。请检查 .env 中的 ARK_MODEL_ID，并确保在火山引擎控制台已开通该模型。";
            }
            
            res.json(responseData);
        }

    } catch (error) {
        console.error('Server Error:', error);
        res.status(500).json({ error: '服务器内部错误' });
    }
});

async function callDoubao({ userContent, systemPrompt }) {
    const apiKey = process.env.ARK_API_KEY;
    const modelId = process.env.ARK_MODEL_ID || 'ep-20260111165056-bcb5j';
    
    // Use /api/v3/responses endpoint as per user's curl
    const url = 'https://ark.cn-beijing.volces.com/api/v3/responses';
    
    const body = {
        model: modelId,
        input: [
            {
                role: 'system',
                content: [
                    { type: 'input_text', text: systemPrompt }
                ]
            },
            {
                role: 'user',
                content: userContent // Now an array of mixed image/text objects
            }
        ]
        // Removed 'parameters' field as it caused 400 InvalidParameter error
    };

    console.log(`Calling API: ${url} with model ${modelId}`);

    const resp = await fetch(url, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(body)
    });

    const respText = await resp.text();
    
    if (!resp.ok) {
        // Try to parse error message
        try {
            const errJson = JSON.parse(respText);
            if (errJson.error && errJson.error.message) {
                throw new Error(`${errJson.error.code}: ${errJson.error.message}`);
            }
        } catch (e) {
            // If parsing fails, just throw text
        }
        throw new Error(`API Error ${resp.status}: ${respText.substring(0, 200)}`);
    }

    const data = JSON.parse(respText);
    // Parse response from /responses endpoint
    let content = "";
    if (data.output && data.output.length > 0) {
        // Find the message part in output array
        const msgPart = data.output.find(item => item.type === 'message');
        if (msgPart && msgPart.content && msgPart.content.length > 0) {
            content = msgPart.content[0].text;
        }
    } else if (data.choices && data.choices.length > 0 && data.choices[0].message) {
         // Fallback for chat/completions format if API behavior changes
         content = data.choices[0].message.content;
    }
    
    if (!content) {
          console.warn("Unexpected API response structure:", JSON.stringify(data).substring(0, 200));
          throw new Error("Invalid API response structure: No content found");
     }

     try {
         // Attempt to extract JSON from Markdown code blocks if present
         const jsonMatch = content.match(/```json\n([\s\S]*?)\n```/) || content.match(/```([\s\S]*?)```/);
         if (jsonMatch && jsonMatch[1]) {
             content = jsonMatch[1];
         }
         return JSON.parse(content);
     } catch (e) {
         console.warn("Failed to parse JSON from AI response, returning raw text wrapped");
        return {
            personality: content,
            chat_suggestions: ["解析失败，原始回复：", content],
            action_guide: []
        };
    }
}

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`H5 server running at http://localhost:${port}/`);
});