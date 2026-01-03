# 🎤 DeepTutor Voice AI - 快速启动指南

## ✨ 项目已完成

我已经为你创建了一个优雅的实时语音 AI 交互应用！

## 🎨 设计特色

### 深空极简主义美学
- **深黑背景** (#0a0a0a) 营造高端科技感
- **动态渐变色彩** - 青色到紫罗兰的流畅过渡
- **独特字体组合** - Syncopate (标题) + Sora (正文)
- **粒子背景** - 微妙的科技感粒子漂浮效果
- **呼吸式麦克风** - 根据状态变化的动态按钮

### 核心交互元素
1. **中央大圆形麦克风按钮** (160x160px)
   - 点击开始/停止录音
   - 状态变化时的缩放和颜色过渡
   - 动态波纹扩散效果

2. **智能状态指示器**
   - ○ 空闲: 灰色
   - ◐ 连接中: 黄色闪烁
   - ◉ 聆听中: 青色发光
   - ◎ 思考中: 紫色发光 + 旋转动画
   - ♦ 说话中: 绿色

3. **音频可视化**
   - 40 条动态音频波形
   - 随音频强度实时跳动

4. **设置面板**
   - 侧滑式面板设计
   - API Key 配置
   - 语言选择（中文/English）

## 🚀 启动应用

### 1. 安装依赖（已完成）
```bash
cd web
npm install
```

### 2. 启动开发服务器
```bash
npm run dev
```

### 3. 访问应用
打开浏览器访问: **http://localhost:3000**

### 4. 配置 API Key
1. 点击右上角 ⚙️ 设置图标
2. 输入你的 [StepFun API Key](https://platform.stepfun.com)
3. 选择语言（中文/English）
4. 关闭设置面板

### 5. 开始对话
点击中央的 **麦克风按钮** 开始实时语音交互！

## 📂 项目结构

```
web/
├── app/
│   ├── realtime-voice/page.tsx    # 主页面
│   ├── globals.css                 # 全局样式（含发光效果）
│   └── layout.tsx                  # 根布局
├── components/realtime-voice/
│   ├── MicrophoneButton.tsx        # 麦克风按钮（核心交互）
│   ├── StatusIndicator.tsx         # 状态指示器
│   ├── AudioVisualizer.tsx         # 音频波形可视化
│   ├── ParticleBackground.tsx      # 粒子背景效果
│   └── SettingsPanel.tsx           # 设置面板
├── lib/
│   └── stepfun-realtime.ts         # StepFun WebSocket 客户端
├── types/
│   └── voice.ts                    # TypeScript 类型定义
└── [配置文件]
```

## 🎯 下一步工作

当前版本已完成 **UI 界面** 和 **基础架构**。

待完成的核心功能：
1. **StepFun Realtime API 完整集成**
   - WebSocket 连接管理
   - 音频流传输
   - 事件处理

2. **音频录制与播放**
   - 实时音频采集
   - 音频播放
   - 音频格式转换

3. **对话历史记录**
   - 消息列表显示
   - 历史记录保存

4. **个性化设置**
   - 声音选择
   - 语速调节
   - 音量控制

## 💡 设计亮点

### 参考了 unmute.sh 的精华
- ✅ 极简布局设计
- ✅ 大按钮作为主要交互
- ✅ 清晰的状态反馈
- ✅ 优雅的动画过渡

### 独特的创新
- 🌟 深空主题 + 动态粒子
- 🌟 呼吸式波纹效果
- 🌟 全息风格发光文字
- 🌟 流畅的状态切换动画

## 🔧 技术栈

- **Next.js 14** (App Router)
- **React 18** + TypeScript
- **Tailwind CSS** (自定义主题)
- **Framer Motion** (动画)
- **Lucide React** (图标)

## 📝 注意事项

- 需要麦克风权限
- 需要 StepFun API Key
- 建议使用 Chrome/Edge 浏览器（最佳 Web Audio API 支持）

## 🎉 享受你的实时语音 AI 体验！

---

**设计理念**: 专注于核心功能，做到极致简单
**美学方向**: 深空极简主义 - 科技感与优雅并存
