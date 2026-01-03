# Memory - Tony 使用 Claude Code 的记忆

## 2025-12-30

### 初始化项目
- Tony 创建了 CLAUDE.md 文件，包含用户介绍、记忆管理和产品方法论
- Tony 是产品经理，基本不会写代码，正在探索 Claude Code 的用法
- 产品核心理念：追求极致简单，专注于一个功能做到极致

### DeepTutor 项目概况
- 项目名称：DeepTutor - AI 驱动的个性化学习助手
- 技术栈：Python 3.10+ (FastAPI) + Next.js 14 (TypeScript)
- 主要功能：6 个智能 Agent 模块（Solve、Question、Research、Guide、IdeaGen、Co-Writer）
- 启动方式：`python scripts/start_web.py`（前后端同时启动）

### DeepTutor 重要配置
- 后端端口：8001
- 前端端口：3782
- 配置文件：`config/main.yaml`（系统配置）和 `config/agents.yaml`（Agent 参数）

---

### StepFun Voice Chat 项目 ✨
- **创建时间**：2025-12-30 晚间
- **项目目录**：`stepfun-voice-chat/`
- **项目描述**：基于 StepFun Realtime API 的优雅实时语音交互应用
- **技术栈**：
  - Next.js 14 + TypeScript + React 18
  - Tailwind CSS（优雅深色主题，毛玻璃效果）
  - Framer Motion（流畅动画）
  - WaveSurfer.js（音频可视化）
  - StepFun Realtime API（实时语音）
- **核心功能**：
  1. 实时语音对话（按住说话，松开发送）
  2. AI 状态可视化（Listening/Speaking/Ready 三种状态）
  3. 音频波形实时展示
  4. 对话历史记录
  5. 灵活的设置面板（API Key、模型、音色等）
- **启动方式**：
  ```bash
  cd stepfun-voice-chat
  npm install      # 首次需要安装依赖
  npm run dev      # 启动开发服务器（端口 3788）
  ```
- **注意事项**：
  - 需要 WebSocket 中转服务器（端口 8080）
  - 参考 Demo：`Step-Realtime-Console-main`
  - 设置中需要填写 StepFun API Key
- **设计特点**：
  - 现代化深色主题，紫色/蓝色渐变配色
  - 毛玻璃（glass）效果，流畅的动画过渡
  - 响应式布局，移动端友好
