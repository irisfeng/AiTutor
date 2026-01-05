# AiTutor - 实时 AI 语音助手

> 基于 StepFun Realtime API 的实时语音交互应用

## ✨ 特性

- 🎤 **实时语音识别**：基于服务端 VAD 的智能语音检测
- 🤖 **自然对话**：流畅的 AI 语音交互体验
- 🎯 **打断支持**：随时可打断 AI 回复，实现自然对话流程
- 📝 **对话历史**：优雅的对话记录展示
- 🎨 **精美 UI**：深空极简主义设计风格

## 🚀 快速开始

### 环境要求

- Node.js 18+
- npm 或 yarn

### 安装

```bash
cd web
npm install
```

### 配置

1. 在设置中输入 StepFun API Key
2. 选择语音语言（中文/英文）

### 运行

```bash
# 启动 WebSocket 代理服务器
node server.js

# 新开终端，启动 Next.js 开发服务器
npm run dev
```

访问 [http://localhost:3000/realtime-voice](http://localhost:3000/realtime-voice)

### 构建

```bash
npm run build
npm start
```

## 🛠️ 技术栈

- **前端框架**：Next.js 14 (App Router)
- **UI 框架**：React 18
- **样式**：Tailwind CSS
- **动画**：Framer Motion
- **语言**：TypeScript
- **实时通信**：WebSocket + StepFun Realtime API

## 📖 使用说明

1. 点击右上角设置图标，配置 API Key
2. 点击麦克风按钮开始对话
3. 对话历史会自动显示在下方
4. 可随时打断 AI 回复，继续对话

## 📝 版本历史

查看 [CHANGELOG.md](./CHANGELOG.md)

## 🔮 未来规划

查看 [HISTORY_ASSISTANT_PLAN.md](./HISTORY_ASSISTANT_PLAN.md)

## 📄 许可证

MIT License

---

Powered by [StepFun Realtime API](https://platform.stepfun.com)
