# 朋友圈分析与交友建议 (朋友圈五宫格)

## 项目简介
这是一个基于 AI 的 H5 应用，用户上传 5-9 张朋友圈截图，系统会自动分析其性格特质、潜在需求，并给出高情商的聊天建议和行动指南。

## 功能特点
- **图片上传**：支持拖拽上传，九宫格预览。
- **AI 分析**：利用火山引擎 Ark API (Doubao 模型) 进行深度图像/文本分析。
- **结果展示**：
  - **人物画像**：分析性格、社交风格、幽默感。
  - **高情商回复**：针对性的聊天话术建议。
  - **行动计划**：7天互动指南。
  - **风险提醒**：潜在的交往雷区。

## 技术栈
- **前端**：HTML5, CSS3, JavaScript (原生)
- **后端**：Node.js, Express
- **AI**：VolcEngine Ark API
- **OCR**：Tesseract.js (可选/已禁用)

## 快速开始

1. **安装依赖**
   ```bash
   npm install
   ```

2. **配置环境变量**
   在项目根目录创建 `.env` 文件：
   ```env
   ARK_API_KEY=your_api_key_here
   ARK_MODEL_ID=doubao-seed-1-6-250615
   ```

3. **启动服务器**
   ```bash
   npm start
   ```
   访问 http://localhost:3000

## 部署
本项目已配置为同步至 GitHub: https://github.com/MarkFu45/trynew.git

## 许可证
MIT
