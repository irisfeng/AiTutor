# AiTutor - 全双工多模态 AI 助手

> 基于 StepFun Realtime API 的移动端多模态实时交互应用

## ✨ 特性

- 🔄 **全双工对话**：开口即说，AI 回答时随时打断，像和人说话一样自然
- 🎤 **实时语音**：会话期间麦克风常开，服务端 VAD 智能分轮
- ⌨️ **文字提问**：打字与语音走同一条实时通道
- 📷 **图片理解**：拍照/相册提问，视觉模型解答
- 🎨 **「墨夜·暖珀」设计**：深墨底色 + 琥珀语音球，移动端单屏体验

> 设计与产品说明见 [docs/MOBILE_REDESIGN.md](./docs/MOBILE_REDESIGN.md)；旧版知识导师在 `/tutor` 路由。

## 🚀 快速开始

### 环境要求

- Node.js 18+
- npm 或 yarn

### 安装

```bash
cd web
npm install --legacy-peer-deps
```

### 配置

1. 在设置中输入 StepFun API Key
2. 选择语音语言（中文/英文）

### 运行

```bash
# 同时启动 Next.js（3003）和 WebSocket 代理（3004）
npm run dev:all
```

访问 [http://localhost:3003](http://localhost:3003)（建议用手机尺寸的窗口体验）

### 构建

```bash
npm run build
npm start
```

## 🛠️ 技术栈

- **前端框架**：Next.js 16 (App Router)
- **UI 框架**：React 19
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
