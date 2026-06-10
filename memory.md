# Claude Code 使用记忆

> tony（产品经理，基本不写代码，常用中文）的 AiTutor 项目记忆文件。
> 每次启动请先读这里；每次大改动后请更新这里。

## 项目概况

- **项目**：AiTutor —— 基于 StepFun Realtime API 的实时语音 AI 助手
- **技术栈**：Next.js 16 + React 19 + TypeScript + Tailwind CSS + Framer Motion
- **运行方式**：`cd web && npm run dev:all`（Next 在 3003 端口，WebSocket 代理在 3004 端口，两个都要开）
- **API Key**：在应用设置里填 StepFun API Key，存在浏览器本机

## 产品方法论（tony 的要求）

- 核心是"简单"：专注一个功能做到极致，不做加法
- 三段论：预测 → 单点击穿 → All-in

## 重大改动记录

### 2026-06-10 移动端全双工多模态助手重设计（分支 claude/mobile-ai-assistant-redesign-ggednq）

把首页重塑为单屏移动端产品，设计语言「墨夜·暖珀」：

- **路由调整**：`/` = 新助手（唯一主角是琥珀语音球）；旧知识导师移到 `/tutor`；`/realtime-voice` 保留
- **全双工**：会话期间麦克风常开，服务端 VAD 检测说话，AI 回答时开口即打断（底层 `interrupt()` 早已支持）
- **多模态**：语音 + 文字（新增 `StepFunRealtimeClient.sendText()`，走同一 Realtime 通道）+ 图片（`lib/assistant/vision.ts` 调 step-1v-8k，图片压到 1280px 再传）
- **新代码**：`web/lib/assistant/useAssistant.ts`（核心 Hook）、`web/components/assistant/`（VoiceOrb / MessageStream / InputDock / SettingsSheet）
- **设计**：深墨暖黑底 + 琥珀语音球（呼吸/涟漪/闪烁/脉动随状态变化，音量实时驱动球体），Fraunces 标识字，移动端安全区适配
- **顺手修复**：
  - `package-lock.json` 原指向 npmmirror 镜像（本环境 403），已改回官方 registry 重新生成；安装需 `npm install --legacy-peer-deps`（framer-motion@10 与 React 19 的既有 peer 冲突）
  - `next.config.js` 里 mermaid/cytoscape 的遗留 webpack 配置导致 Next 16 Turbopack 构建失败，已清空
  - 删除死代码：`PersonaSelector.tsx`（引用了不存在的导出，阻塞构建）、`stepfun-realtime 2.ts`（意外的重复文件）

## 已知注意事项

- 本地依赖安装命令：`npm install --legacy-peer-deps`
- 语音功能需要 ws-proxy-server.js（3004 端口）在跑，且目前写死 `localhost:3004`，上线前要改
- 图片理解直接从浏览器调 StepFun chat/completions（与旧知识卡片功能同一方式）
- 知识卡片、学科系统等旧功能都在 `/tutor` 页面，没有删除
