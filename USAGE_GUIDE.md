# 🎤 DeepTutor Voice AI - 使用指南

## ✨ 已完成功能

### ✅ 核心功能
- **完整的 StepFun Realtime API 集成**
  - WebSocket 连接管理
  - 会话创建和配置
  - Server VAD（语音活动检测）
  - 双向音频流传输

- **实时音频处理**
  - 麦克风音频采集（24kHz PCM16）
  - 音频数据编码和传输（Base64）
  - AI 音频接收和播放
  - 实时文字转录显示

- **优雅的 UI 界面**
  - 深空极简主义设计
  - 动态粒子背景
  - 呼吸式麦克风按钮
  - 智能状态指示器
  - 音频波形可视化

---

## 🚀 快速开始

### 1. 启动应用

```bash
cd web
npm run dev
```

访问: **http://localhost:3000**

### 2. 配置 API Key

1. 点击右上角 **⚙️ 设置图标**
2. 输入你的 [StepFun API Key](https://platform.stepfun.com)
3. 选择语言（中文/English）
4. 关闭设置面板

### 3. 开始对话

1. 点击中央的 **🎤 麦克风按钮**
2. 允许麦克风权限
3. 开始说话
4. 等待 AI 响应并播放语音

---

## 📋 功能说明

### 状态指示

| 状态 | 图标 | 说明 |
|------|------|------|
| 空闲 | ○ | 待机状态，等待用户操作 |
| 连接中 | ◐ | 正在连接 StepFun 服务器 |
| 聆听中 | ◉ | 正在接收你的语音 |
| 思考中 | ◎ | AI 正在处理和生成回复 |
| 说话中 | ♦ | AI 正在播放语音回复 |

### 音频格式

- **输入格式**: PCM16, 24kHz, 单声道
- **输出格式**: PCM16, 24kHz, 单声道
- **编码方式**: Base64

### 支持的音色

#### 中文音色
- `linjiajiejie` - 林佳佳佳（默认）

#### 英语音色
- `alloy` - Alloy（默认）

---

## 🔧 技术实现

### API 集成

#### WebSocket 连接
```
wss://api.stepfun.com/v1/realtime?authorization=<API_KEY>
```

#### 会话配置
```typescript
{
  type: 'session.update',
  session: {
    modalities: ['text', 'audio'],
    instructions: '系统提示词',
    voice: 'linjiajiejie',
    input_audio_format: 'pcm16',
    output_audio_format: 'pcm16',
    turn_detection: {
      type: 'server_vad'
    }
  }
}
```

#### 音频传输
```typescript
{
  type: 'input_audio_buffer.append',
  audio: '<Base64编码的PCM16音频数据>'
}
```

### 音频处理流程

1. **采集阶段**
   - 使用 `AudioContext` 获取麦克风音频
   - 通过 `ScriptProcessorNode` 实时处理音频流
   - 采样率: 24kHz

2. **编码阶段**
   - Float32Array → PCM16 (Int16)
   - PCM16 → Base64 字符串

3. **传输阶段**
   - 通过 WebSocket 发送到 StepFun 服务器
   - Server VAD 自动检测语音起止

4. **接收阶段**
   - 接收 Base64 编码的音频数据
   - 解码为 PCM16
   - 转换为 AudioBuffer
   - 队列播放

---

## 📂 项目结构

```
web/
├── app/
│   ├── realtime-voice/
│   │   └── page.tsx              # 主页面（含音频处理逻辑）
│   ├── globals.css               # 全局样式
│   └── layout.tsx                # 根布局
├── components/realtime-voice/
│   ├── MicrophoneButton.tsx      # 麦克风按钮
│   ├── StatusIndicator.tsx       # 状态指示器
│   ├── AudioVisualizer.tsx       # 音频可视化
│   ├── ParticleBackground.tsx    # 粒子背景
│   └── SettingsPanel.tsx         # 设置面板
├── lib/
│   └── stepfun-realtime.ts       # StepFun API 客户端（300+ 行）
└── types/
    └── voice.ts                  # TypeScript 类型定义
```

---

## 🐛 故障排查

### 问题：无法连接

**可能原因**:
- API Key 不正确
- 网络连接问题
- API 配额用尽

**解决方案**:
1. 检查 API Key 是否正确
2. 打开浏览器控制台查看错误信息
3. 访问 [StepFun 控制台](https://platform.stepfun.com) 查看配额

### 问题：没有声音

**可能原因**:
- 麦克风权限未授予
- 音频格式不匹配
- 音量太小

**解决方案**:
1. 检查浏览器麦克风权限
2. 确认系统音量已打开
3. 尝试使用 Chrome/Edge 浏览器

### 问题：音频延迟高

**可能原因**:
- 网络延迟
- 音频缓冲队列积压

**解决方案**:
1. 检查网络连接
2. 刷新页面重新连接
3. 关闭其他占用带宽的应用

---

## 💡 使用技巧

### 1. 获得更好的语音识别效果
- 在安静的环境中使用
- 距离麦克风 20-30cm
- 语速适中，吐字清晰

### 2. 优化对话体验
- 使用简洁的语言
- 一次一个问题
- 等待 AI 回复完成后再继续

### 3. 自定义系统提示词
修改 `stepfun-realtime.ts` 中的 `instructions` 字段来调整 AI 的行为：
```typescript
instructions: '你是一个专业的编程助手，擅长解答技术问题。'
```

---

## 🎯 下一步计划

### 短期优化
- [ ] 添加对话历史记录显示
- [ ] 支持中断 AI 说话
- [ ] 添加音量调节
- [ ] 优化音频缓冲策略

### 中期功能
- [ ] 多轮对话历史管理
- [ ] 自定义音色选择
- [ ] 语速调节
- [ ] 导出对话记录

### 长期规划
- [ ] 支持多语言实时翻译
- [ ] 语音情感识别
- [ ] 多人对话模式

---

## 📚 参考资源

### 官方文档
- [StepFun Realtime API 指南](https://platform.stepfun.com/docs/guide/realtime)
- [开启实时语音通话](https://platform.stepfun.com/docs/zh/api-reference/realtime/chat)
- [StepFun 开放平台](https://platform.stepfun.com)

### 设计参考
- [Unmute.sh](https://unmute.sh) - 语音交互设计灵感
- [Step-Realtime-Console](https://github.com/stepfun-ai/Step-Realtime-Console) - 官方 Demo

---

## 📄 许可证

MIT License

---

**Created with ❤️ by DeepTutor Team**

**最后更新**: 2025-12-30
