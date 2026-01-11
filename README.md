# 朋友圈分析与交友建议 H5 —— 项目说明

版本：v0.1（草案）  
最后更新：2026-01-11

## 项目简介
这是一个移动端网页（H5）产品：用户上传 5 张及以上某人的朋友圈截图，系统通过 OCR 与豆包大模型（`doubao-seed-1.6-thinking`）进行分析，输出人物画像、聊天话术、行动计划与风险提醒。目标是在尊重与合规的前提下，帮助用户更自然地接近对方、提升关系质量。

重要说明：本产品仅提供建议，不保证形成情侣关系；请避免骚扰或越界行为。

## 快速上手（当前阶段）
- 当前原型已具备：前端单页上传与结果展示（`public/index.html`）、后端代理（`server.js`）调用 Ark `responses` 接口并返回 JSON。
- 阅读 `PRD.md` 了解功能范围与流程。

本地运行：
1) 安装依赖：`npm install`
2) 设置环境变量（macOS/zsh 示例）：
   - `export ARK_API_KEY="<你的key>"`
   - 可选：`export USE_MOCK=0`
3) 启动：`npm run start`，访问 `http://localhost:3000/`

## 功能概览
- 上传与校验：支持 5～30 张图片，大小/格式校验、拖拽上传。
- 预处理：本地压缩、EXIF 清理、OCR 文本提取。
- 分析：调用豆包模型生成人物画像、交友建议、行动计划、风险与边界提示。
- 展示与导出：报告页卡片化展示；一键复制话术；导出 PDF/长图。
- 隐私与合规：默认不长期保存图片；提供一键清除与同意说明。

## 拟定技术栈
- 前端：React/Vue（二选一），移动端适配。
- 后端：Node.js（Express）或 Serverless 作为安全代理调用模型与 OCR。
- 模型：豆包 Ark Responses（示例模型 `doubao-seed-1-8-251228`）。
- OCR：火山引擎 OCR 或开源方案（Tesseract.js）。

## 接口设计（规划）
- `POST /api/analyze`
  - 入参：`form-data`
    - `images[]`: 5～30 张朋友圈截图（jpg/png/webp），单张 ≤ 10MB
    - `notes`（可选）：用户备注（如共同兴趣）
  - 返回：`application/json`
    - `persona`: 人物画像（兴趣、风格、活跃时段等）
    - `plan`: 行动计划（天数与步骤）
    - `talks`: 开场与延展话术模板（多风格）
    - `risks`: 风险与边界提醒
    - `meta`: 调用耗时、来源等元信息

### 返回示例
```json
{
  "persona": {
    "traits": ["理性", "爱运动"],
    "interests": [{"tag": "跑步", "confidence": 0.82}],
    "style": {"social": "偏内向", "humor": "中等"}
  },
  "plan": {
    "days": 10,
    "steps": [{"day": 1, "message": "轻松问候+共同点话题"}]
  },
  "talks": [{"tone": "自然", "text": "嗨，前几天看到你发的..."}],
  "risks": ["避免过度询问隐私"],
  "meta": {"cost_ms": 3500}
}
```

## 模型调用思路（示例伪代码）
> 实际代码将集成后端安全代理，避免在前端暴露密钥。

```js
// Node.js 伪代码
import { chat } from "@volcengine/doubao-sdk"; // 示例，具体以官方文档为准

const prompt = buildPrompt({ ocrTexts, imageTags, userNotes });
const res = await chat({
  model: "doubao-seed-1.6-thinking",
  messages: [
    { role: "system", content: "你是温柔、合规的关系建议助手..." },
    { role: "user", content: prompt }
  ],
  response_format: { type: "json_object" }
});

return JSON.parse(res.output_text);
```

## 环境变量（规划）
- `ARK_API_KEY`：方舟 Ark 的 API Key（Bearer Token）
- `USE_MOCK`：`1` 使用本地模拟结果；不设置或为 `0` 则调用真实接口

## 隐私与合规
- 默认不在服务器持久化图片；如需云端分析，需用户显式同意。
- 一键清除上传与分析缓存。
- 仅输出建议与画像，不推断敏感隐私信息。
- 禁止骚扰、跟踪与任何违法用途。

## 项目结构（当前）
- `PRD.md`：完整需求与设计说明。
- `README.md`：项目概览与接口规划。

## 开发计划（摘要）
- M0：实现上传/OCR/模型分析与报告页静态展示。
- M1：一键复制话术、时间轴行动计划、导出能力。
- M2：聊天教练、A/B 话术与国际化。

## 常见问题（FAQ）
- Q：一定能成为男女朋友吗？
  - A：不保证结果。本工具仅帮助理解对方并给出更合适的互动建议。
- Q：我的图片会被保存吗？
  - A：默认不保存。若需云端分析，会弹窗征得你的同意。
- Q：分析不准怎么办？
  - A：上传更清晰、更多样的截图，并填写备注（共同兴趣与边界）。系统会给出置信度与保守建议。
