# StepFun Realtime API 互动语音实现指南

> **完整的技术实现文档** - 从零开始实现基于 StepFun Realtime API 的语音交互功能

**作者**: AI Tutor 团队
**日期**: 2026-01-08
**版本**: v1.0

---

## 📋 目录

1. [项目概述](#项目概述)
2. [系统架构](#系统架构)
3. [技术栈](#技术栈)
4. [核心概念](#核心概念)
5. [后端代理实现](#后端代理实现)
6. [前端实现](#前端实现)
7. [WebSocket 协议详解](#websocket-协议详解)
8. [音频处理流程](#音频处理流程)
9. [状态管理](#状态管理)
10. [错误处理](#错误处理)
11. [高级功能](#高级功能)
12. [最佳实践](#最佳实践)
13. [常见问题](#常见问题)

---

## 项目概述

### 什么是 StepFun Realtime API？

StepFun Realtime API 是阶跃星辰提供的**实时语音交互 API**，支持：
- 🎤 **实时语音识别**（ASR）- 将用户的语音实时转换为文字
- 🤖 **AI 对话生成** - 基于大语言模型的实时对话
- 🔊 **实时语音合成**（TTS）- 将 AI 回复实时转换为语音
- 🎯 **低延迟** - 端到端延迟 < 2 秒
- 🔄 **全双工** - 支持用户打断 AI 的回复

### 应用场景

- **智能客服** - 实时语音问答系统
- **语音助手** - 类似 Siri、Alexa 的智能助手
- **教育辅导** - AI 教师、历史课堂等
- **角色扮演** - 历史人物模拟、语言练习等

### 本文档涵盖的功能

本项目的 AI Tutor 历史版实现了以下功能：
- ✅ 实时语音对话
- ✅ 多模型智能切换（step-audio-2 / step-audio-2-mini）
- ✅ 历史人设系统（说书人、历史侦探、时间旅行者）
- ✅ 对话记录持久化
- ✅ 打断检测与处理
- ✅ 自动重连机制

---

## 系统架构

### 整体架构图

```
┌─────────────────────────────────────────────────────────┐
│                      浏览器前端                          │
│  ┌──────────────────────────────────────────────────┐  │
│  │  React 组件 (realtime-voice/page.tsx)          │  │
│  │  - 状态管理 (useState)                          │  │
│  │  - UI 渲染 (麦克风按钮、对话记录)               │  │
│  │  - 音频录制 (MediaRecorder API)                │  │
│  └──────────────────────────────────────────────────┘  │
│                          ↕                              │
│  ┌──────────────────────────────────────────────────┐  │
│  │  StepFunRealtimeClient                          │  │
│  │  - WebSocket 连接管理                           │  │
│  │  - 音频数据处理                                 │  │
│  │  - 事件监听与分发                               │  │
│  └──────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
                          ↕️ WebSocket
┌─────────────────────────────────────────────────────────┐
│                 Next.js 自定义服务器                     │
│  ┌──────────────────────────────────────────────────┐  │
│  │  WebSocket Proxy (server.js)                   │  │
│  │  - API Key 验证                                 │  │
│  │  - 消息转发                                     │  │
│  │  - 错误处理                                     │  │
│  └──────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
                          ↕️ WebSocket
┌─────────────────────────────────────────────────────────┐
│              StepFun Realtime API Server                 │
│  wss://api.stepfun.com/v1/realtime?model=step-audio-2   │
│                                                          │
│  • ASR (语音识别)                                        │
│  • LLM (对话生成)                                        │
│  • TTS (语音合成)                                        │
└─────────────────────────────────────────────────────────┘
```

### 数据流向

```
用户语音输入
  ↓
Float32Array (原始音频数据)
  ↓
PCM16 编码 (16位 PCM)
  ↓
Base64 编码
  ↓
WebSocket 发送 → input_audio_buffer.append
  ↓
StepFun API 处理 (ASR → LLM → TTS)
  ↓
WebSocket 返回 → response.audio.delta
  ↓
Base64 解码
  ↓
ArrayBuffer (PCM16 音频数据)
  ↓
AudioBuffer 转换
  ↓
Web Audio API 播放
  ↓
用户听到 AI 语音回复
```

---

## 技术栈

### 前端技术栈

| 技术 | 版本 | 用途 |
|------|------|------|
| **React** | 18.x | UI 框架 |
| **Next.js** | 14.x | 全栈框架 |
| **TypeScript** | 5.x | 类型安全 |
| **Framer Motion** | 11.x | 动画库 |
| **Lucide React** | 0.300.x | 图标库 |
| **react-i18next** | 最新 | 国际化 |

### 后端技术栈

| 技术 | 版本 | 用途 |
|------|------|------|
| **Node.js** | 18.x | 运行时 |
| **Next.js Custom Server** | 14.x | 自定义服务器 |
| **ws** | 8.x | WebSocket 库 |

### StepFun API

| API | 模型 | 用途 |
|-----|------|------|
| **Realtime API** | step-audio-2 | 高质量实时语音 |
| **Realtime API** | step-audio-2-mini | 快速实时语音 |

---

## 核心概念

### 1. VoiceState（语音状态）

```typescript
type VoiceState =
  | "idle"        // 空闲状态，等待用户操作
  | "connecting"  // 正在连接 WebSocket
  | "listening"   // 正在聆听用户说话
  | "thinking"    // AI 正在思考
  | "speaking";   // AI 正在说话
```

### 2. ConversationTurn（对话轮次）

```typescript
interface ConversationTurn {
  id: string;              // 唯一标识符
  timestamp: number;       // 时间戳
  userMessage?: string;    // 用户说的话（转录文字）
  aiResponse?: string;     // AI 的回复（文字内容）
}
```

### 3. WebSocket 事件类型

| 事件类型 | 方向 | 说明 |
|----------|------|------|
| `session.update` | C→S | 创建/更新会话配置 |
| `input_audio_buffer.append` | C→S | 发送音频数据 |
| `input_audio_buffer.clear` | C→S | 清除音频缓冲区 |
| `response.create` | C→S | 请求 AI 响应 |
| `session.created` | S→C | 会话创建成功 |
| `session.updated` | S→C | 会话更新成功 |
| `response.audio.delta` | S→C | AI 音频数据（流式） |
| `response.audio_transcript.delta` | S→C | AI 文字内容（流式） |
| `input_audio_buffer.speech_started` | S→C | 检测到用户开始说话 |
| `input_audio_buffer.speech_stopped` | S→C | 检测到用户停止说话 |
| `error` | S→C | 错误信息 |

---

## 后端代理实现

### 为什么需要代理服务器？

1. **API Key 安全** - 不在前端暴露 API Key
2. **CORS 问题** - 避免跨域问题
3. **消息转发** - 作为中间层转发 WebSocket 消息
4. **模型切换** - 动态指定使用的模型

### 服务器代码结构

**文件位置**: `/web/server.js`

```javascript
const { createServer } = require('http');
const { parse } = require('url');
const next = require('next');
const { WebSocketServer, WebSocket } = require('ws');

const dev = process.env.NODE_ENV !== 'production';
const hostname = 'localhost';
const port = 3000;

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  // 1. 创建 HTTP 服务器
  const server = createServer(async (req, res) => {
    await handle(req, res);
  });

  // 2. 创建 WebSocket 服务器
  const wss = new WebSocketServer({ noServer: true });

  // 3. 处理 WebSocket 连接
  wss.on('connection', (ws, request, clientApiKey) => {
    // 3.1 验证 API Key
    if (!apiKey) {
      ws.close(1008, 'API Key required');
      return;
    }

    // 3.2 连接到 StepFun API
    const stepfunWs = new WebSocket(
      `wss://api.stepfun.com/v1/realtime?model=${model}`,
      {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
        },
      }
    );

    // 3.3 消息转发：StepFun → 客户端
    stepfunWs.on('message', (data) => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(data.toString());
      }
    });

    // 3.4 消息转发：客户端 → StepFun
    ws.on('message', (data) => {
      if (stepfunWs.readyState === WebSocket.OPEN) {
        stepfunWs.send(data.toString());
      }
    });
  });

  // 4. 升级 HTTP 请求为 WebSocket
  server.on('upgrade', (request, socket, head) => {
    const { pathname, query } = parse(request.url, true);

    if (pathname === '/api/ws-proxy') {
      const apiKey = query.apiKey;

      if (!apiKey) {
        socket.write('HTTP/1.1 400 Bad Request\r\n\r\nMissing API Key');
        socket.destroy();
        return;
      }

      wss.handleUpgrade(request, socket, head, (ws) => {
        wss.emit('connection', ws, request, apiKey);
      });
    }
  });

  server.listen(port, () => {
    console.log(`> Ready on http://${hostname}:${port}`);
  });
});
```

### 代理服务器的工作流程

```
1. 前端请求: ws://localhost:3000/api/ws-proxy?apiKey=xxx&model=step-audio-2
   ↓
2. 服务器验证 API Key
   ↓
3. 服务器连接到 StepFun API: wss://api.stepfun.com/v1/realtime?model=step-audio-2
   ↓
4. 建立 WebSocket 双向通道
   ↓
5. 转发所有消息:
   前端 ←→ 代理服务器 ←→ StepFun API
```

---

## 前端实现

### 核心：StepFunRealtimeClient 类

**文件位置**: `/web/lib/stepfun-realtime.ts`

```typescript
export class StepFunRealtimeClient {
  private ws: WebSocket | null = null;              // WebSocket 连接
  private config: StepFunConfig;                    // 配置
  private audioContext: AudioContext | null = null; // 音频上下文
  private audioQueue: AudioBuffer[] = [];           // 音频队列
  private isPlaying: boolean = false;               // 是否正在播放

  // 构造函数
  constructor(config: StepFunConfig) {
    this.config = {
      model: 'step-audio-2',
      voice: 'qingchunsaonv',
      instructions: '...',
      ...config,
    };
  }

  // 连接 WebSocket
  async connect(
    onStateChange: (state: VoiceState) => void,
    onTranscript: (text: string) => void,
    onAudio: (audioData: ArrayBuffer) => void,
    onError?: (error: string) => void
  ): Promise<void> {
    // 实现细节见下文
  }

  // 发送音频数据
  sendAudio(audioData: Float32Array) {
    // 实现细节见下文
  }

  // 开始对话
  startConversation() {
    // 实现细节见下文
  }

  // 断开连接
  disconnect() {
    // 实现细节见下文
  }
}
```

### 1. 连接到 WebSocket

```typescript
async connect(
  onStateChange: (state: VoiceState) => void,
  onTranscript: (text: string) => void,
  onAudio: (audioData: ArrayBuffer) => void,
  onError?: (error: string) => void
): Promise<void> {
  return new Promise((resolve, reject) => {
    // 保存回调函数
    this.onStateChange = onStateChange;
    this.onTranscript = onTranscript;
    this.onAudio = onAudio;
    this.onError = onError;

    // 构建代理服务器 URL
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = window.location.host;
    const wsUrl = `${protocol}//${host}/api/ws-proxy?model=${this.currentModel}&apiKey=${encodeURIComponent(this.config.apiKey)}`;

    // 创建 WebSocket 连接
    this.ws = new WebSocket(wsUrl);
    this.audioContext = new AudioContext({ sampleRate: 24000 });

    // 监听连接成功事件
    this.ws.onopen = () => {
      console.log('✅ WebSocket connected');
      onStateChange('idle');

      // 连接成功后发送会话配置
      this.sendSessionUpdate();
      resolve();
    };

    // 监听消息事件
    this.ws.onmessage = async (event) => {
      try {
        const data = JSON.parse(event.data);
        await this.handleEvent(data);
      } catch (error) {
        console.error('Failed to parse message:', error);
      }
    };

    // 监听错误事件
    this.ws.onerror = (error) => {
      console.error('❌ WebSocket error:', error);
      onStateChange('idle');
      onError?.('连接失败，请检查网络或API Key');
    };

    // 监听关闭事件
    this.ws.onclose = (event) => {
      console.log('🔌 WebSocket closed:', event.code, event.reason);
      if (!this.isManualDisconnect && event.code !== 1000) {
        // 异常关闭，尝试重连
        this.attemptReconnect(onStateChange, onTranscript, onAudio, onError);
      } else {
        onStateChange('idle');
      }
    };
  });
}
```

### 2. 发送会话配置

```typescript
private sendSessionUpdate() {
  if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
    console.error('WebSocket not connected');
    return;
  }

  // 获取人设提示词
  const personaInstructions = getPersonaInstructions(
    this.currentPersona,
    this.userLanguage
  );

  // 构建会话配置消息
  const sessionUpdate = {
    event_id: this.generateEventId(),
    type: 'session.update',
    session: {
      modalities: ['text', 'audio'],           // 支持文字和音频
      instructions: personaInstructions,       // AI 指令
      voice: this.config.voice,                // 音色
      input_audio_format: 'pcm16',            // 输入音频格式
      output_audio_format: 'pcm16',           // 输出音频格式
      turn_detection: {
        type: 'server_vad',                    // 服务器端 VAD（语音活动检测）
      },
      model: this.currentModel,                // 使用的模型
    },
  };

  // 发送配置
  this.ws.send(JSON.stringify(sessionUpdate));
  console.log('✅ Session update sent');
}
```

### 3. 处理 WebSocket 事件

```typescript
private async handleEvent(event: any) {
  switch (event.type) {
    case 'session.created':
      console.log('✅ Session created:', event.session?.model);
      break;

    case 'session.updated':
      console.log('✅ Session updated');
      break;

    case 'input_audio_buffer.speech_started':
      // 用户开始说话
      console.log('🎤 Speech started');
      this.onStateChange?.('listening');

      // 打断检测：如果 AI 正在回复，立即停止
      if (this.isAiResponding || this.isPlaying || this.audioQueue.length > 0) {
        console.log('🛑 用户打断！AI正在响应，立即停止');
        this.interrupt();
      }
      break;

    case 'input_audio_buffer.speech_stopped':
      // 用户停止说话
      console.log('🤔 Speech stopped, thinking...');
      this.onStateChange?.('thinking');
      break;

    case 'response.audio.delta':
      // 收到 AI 音频数据
      this.isAiResponding = true;
      if (event.delta) {
        const audioData = this.base64ToArrayBuffer(event.delta);
        this.onAudio?.(audioData);
      }
      break;

    case 'response.audio_transcript.delta':
      // 收到 AI 文字内容
      this.isAiResponding = true;
      if (event.delta) {
        this.onTranscript?.(event.delta);
      }
      break;

    case 'response.audio.done':
    case 'response.audio_transcript.done':
      // AI 响应完成
      console.log('✅ Response done');
      this.isAiResponding = false;
      break;

    case 'error':
      // 错误处理
      console.error('❌ Server error:', event.error);
      this.onStateChange?.('idle');
      const errorMsg = event.error?.message || event.error?.type || '未知错误';
      this.onError?.(`API 错误: ${errorMsg}`);
      break;

    default:
      console.log('📄 Unhandled event type:', event.type);
  }
}
```

---

## WebSocket 协议详解

### 会话创建流程

```
1. 客户端连接: ws://localhost:3000/api/ws-proxy?apiKey=xxx&model=step-audio-2
   ↓
2. 代理服务器连接: wss://api.stepfun.com/v1/realtime?model=step-audio-2
   ↓
3. 客户端发送: session.update
   {
     "event_id": "event_1234567890_abc123",
     "type": "session.update",
     "session": {
       "modalities": ["text", "audio"],
       "instructions": "你是AI助手...",
       "voice": "qingchunsaonv",
       "input_audio_format": "pcm16",
       "output_audio_format": "pcm16",
       "turn_detection": { "type": "server_vad" }
     }
   }
   ↓
4. 服务器返回: session.created
   {
     "event_id": "event_1234567890_xyz456",
     "type": "session.created",
     "session": { ... }
   }
```

### 音频发送流程

```
1. 录音: MediaRecorder API 获取音频流
   ↓
2. 转换: Float32Array → PCM16 (Int16Array)
   ↓
3. 编码: PCM16 → Base64
   ↓
4. 发送: input_audio_buffer.append
   {
     "event_id": "event_1234567890_def789",
     "type": "input_audio_buffer.append",
     "audio": "base64_encoded_pcm16_audio_data"
   }
   ↓
5. 重复步骤 1-4，持续发送音频数据
```

### AI 响应流程

```
1. 服务器检测到用户停止说话: input_audio_buffer.speech_stopped
   ↓
2. 客户端请求 AI 响应: response.create
   {
     "event_id": "event_1234567890_ghi012",
     "type": "response.create"
   }
   ↓
3. 服务器流式返回音频: response.audio.delta (多次)
   {
     "event_id": "event_1234567890_jkl345",
     "type": "response.audio.delta",
     "delta": "base64_encoded_audio_chunk"
   }
   ↓
4. 服务器流式返回文字: response.audio_transcript.delta (多次)
   {
     "event_id": "event_1234567890_mno678",
     "type": "response.audio_transcript.delta",
     "delta": "AI回复的文字片段"
   }
   ↓
5. 响应完成: response.audio.done
   {
     "event_id": "event_1234567890_pqr901",
     "type": "response.audio.done"
   }
```

### 打断处理流程

```
用户正在说话 (input_audio_buffer.speech_started)
  ↓
检测到 AI 正在回复 (isAiResponding = true)
  ↓
立即停止:
  - 停止播放音频 (stopPlayback)
  - 清空音频队列 (audioQueue = [])
  - 清除音频缓冲 (input_audio_buffer.clear)
  ↓
状态切换: speaking → listening
```

---

## 音频处理流程

### 1. 录音（Float32 → PCM16）

```typescript
// 获取麦克风流
const stream = await navigator.mediaDevices.getUserMedia({
  audio: {
    channelCount: 1,          // 单声道
    sampleRate: 24000,        // 采样率 24kHz
    echoCancellation: true,   // 回声消除
    noiseSuppression: true,   // 降噪
    autoGainControl: true,    // 自动增益
  },
});

// 创建音频上下文
const audioContext = new AudioContext({ sampleRate: 24000 });
const source = audioContext.createMediaStreamSource(stream);

// 创建脚本处理器（实时获取音频数据）
const processor = audioContext.createScriptProcessor(4096, 1, 1);
processor.onaudioprocess = (e) => {
  const inputData = e.inputBuffer.getChannelData(0); // Float32Array

  // 发送音频数据
  if (clientRef.current && isRecordingRef.current) {
    clientRef.current.sendAudio(inputData);
  }
};

source.connect(processor);
processor.connect(audioContext.destination);
```

### 2. PCM16 编码

```typescript
// Float32 转 PCM16
private floatToPCM16(float32Array: Float32Array): ArrayBuffer {
  const arrayBuffer = new ArrayBuffer(float32Array.length * 2);
  const view = new DataView(arrayBuffer);

  for (let i = 0; i < float32Array.length; i++) {
    // 将 [-1, 1] 范围的浮点数转换为 [-32768, 32767] 的整数
    const sample = Math.max(-1, Math.min(1, float32Array[i]));
    view.setInt16(i * 2, sample < 0 ? sample * 0x8000 : sample * 0x7fff, true);
  }

  return arrayBuffer;
}
```

### 3. Base64 编码

```typescript
// ArrayBuffer 转 Base64
private arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return window.btoa(binary);
}
```

### 4. 发送音频数据

```typescript
sendAudio(audioData: Float32Array) {
  if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
    console.error('WebSocket not connected');
    return;
  }

  // 1. Float32 → PCM16
  const pcm16Data = this.floatToPCM16(audioData);

  // 2. PCM16 → Base64
  const base64Audio = this.arrayBufferToBase64(pcm16Data);

  // 3. 构建消息
  const message = {
    event_id: this.generateEventId(),
    type: 'input_audio_buffer.append',
    audio: base64Audio,
  };

  // 4. 发送
  this.ws.send(JSON.stringify(message));
}
```

### 5. 接收并播放音频

```typescript
// 监听音频数据
async onAudio(audioData: ArrayBuffer) {
  if (!this.audioContext) {
    console.error('AudioContext not initialized');
    return;
  }

  try {
    // 1. ArrayBuffer → AudioBuffer
    const pcm16Data = new DataView(audioData);
    const numberOfChannels = 1;
    const sampleRate = 24000;
    const frameCount = pcm16Data.byteLength / 2;

    const audioBuffer = this.audioContext.createBuffer(
      numberOfChannels,
      frameCount,
      sampleRate
    );

    const channelData = audioBuffer.getChannelData(0);
    for (let i = 0; i < frameCount; i++) {
      // PCM16 → Float32
      const sample = pcm16Data.getInt16(i * 2, true);
      channelData[i] = sample / 0x8000;
    }

    // 2. 添加到播放队列
    this.audioQueue.push(audioBuffer);

    // 3. 如果没有在播放，开始播放
    if (!this.isPlaying) {
      this.playNextAudio();
    }
  } catch (error) {
    console.error('Failed to play audio:', error);
  }
}

// 播放队列中的下一个音频
private playNextAudio() {
  if (this.audioQueue.length === 0) {
    this.isPlaying = false;
    this.onStateChange?.('idle');
    return;
  }

  this.isPlaying = true;
  this.onStateChange?.('speaking');

  const audioBuffer = this.audioQueue.shift()!;
  this.sourceNode = this.audioContext!.createBufferSource();
  this.sourceNode.buffer = audioBuffer;
  this.sourceNode.connect(this.audioContext!.destination);

  // 播放完成后继续播放下一个
  this.sourceNode.onended = () => {
    this.playNextAudio();
  };

  this.sourceNode.start();
}
```

---

## 状态管理

### 状态流转图

```
idle (空闲)
  ↓ 用户点击麦克风
connecting (连接中)
  ↓ WebSocket 连接成功
idle (空闲)
  ↓ 用户开始说话
listening (聆听中)
  ↓ 用户停止说话
thinking (思考中)
  ↓ AI 生成回复
speaking (AI 说话中)
  ↓ 播放完成
idle (空闲) ← 循环
```

### React 状态管理

```typescript
export default function RealtimeVoicePage() {
  // 1. 语音状态
  const [voiceState, setVoiceState] = useState<VoiceState>("idle");

  // 2. 录音状态
  const [isActive, setIsActive] = useState(false);

  // 3. AI 响应状态
  const [isAiResponding, setIsAiResponding] = useState(false);

  // 4. 当前对话轮次
  const [currentTurn, setCurrentTurn] = useState<Partial<ConversationTurn>>({});

  // 5. 历史对话
  const [conversations, setConversations] = useState<ConversationTurn[]>([]);

  // 6. 错误信息
  const [errorMessage, setErrorMessage] = useState<string>("");

  return (
    // UI 渲染
  );
}
```

### 状态变化回调

```typescript
await client.connect(
  // 状态变化回调
  (state) => {
    const prevState = voiceState;
    setVoiceState(state);

    // 检测打断：用户开始说话时，如果 AI 正在回答，则打断
    if (state === "listening" && prevState === "speaking") {
      console.log('🎤 检测到用户打断AI');
      clientRef.current.interrupt();
      setIsAiResponding(false);
    }

    // 对话结束，保存记录
    if (state === "idle" && isAiResponding) {
      if (currentTurn.userMessage || currentTurn.aiResponse) {
        setConversations((prev) => [...prev, {
          id: `turn-${Date.now()}`,
          timestamp: Date.now(),
          userMessage: currentTurn.userMessage,
          aiResponse: currentTurn.aiResponse,
        }]);
      }
      setCurrentTurn({});
      setIsAiResponding(false);
    }
  },

  // 文字转录回调
  (text) => {
    if (isAiResponding) {
      // AI 回复文字
      setCurrentTurn((prev) => ({
        ...prev,
        aiResponse: (prev.aiResponse || "") + text,
      }));
    } else {
      // 用户说话文字
      setCurrentTurn((prev) => ({
        ...prev,
        userMessage: (prev.userMessage || "") + text,
      }));
    }
  },

  // 音频数据回调
  async (audioData) => {
    await client.playAudio(audioData);
  },

  // 错误回调
  (error) => {
    setErrorMessage(error);
  }
);
```

---

## 错误处理

### 常见错误类型

| 错误类型 | 原因 | 解决方案 |
|----------|------|----------|
| **API Key 无效** | API Key 错误或过期 | 检查 API Key 配置 |
| **网络连接失败** | 无法连接到代理服务器 | 检查服务器是否启动 |
| **麦克风权限** | 浏览器未授权麦克风 | 在浏览器设置中允许麦克风权限 |
| **WebSocket 断开** | 网络不稳定或服务器重启 | 实现自动重连机制 |
| **音频格式错误** | 采样率不匹配 | 确保使用 24kHz 采样率 |

### 错误处理实现

```typescript
// 1. WebSocket 错误处理
this.ws.onerror = (error) => {
  console.error('❌ WebSocket error:', error);
  onStateChange('idle');
  onError?.('连接失败，请检查网络或API Key');
};

// 2. 服务器错误处理
case 'error':
  console.error('❌ Server error:', event.error);
  onStateChange('idle');
  const errorMsg = event.error?.message || event.error?.type || '未知错误';
  onError?.(`API 错误: ${errorMsg}`);
  break;

// 3. 麦克风权限错误处理
try {
  const stream = await navigator.mediaDevices.getUserMedia({
    audio: { sampleRate: 24000 },
  });
} catch (error) {
  console.error('Failed to get microphone:', error);
  alert('无法访问麦克风，请检查权限设置');
}

// 4. 错误提示 UI
<AnimatePresence>
  {errorMessage && (
    <motion.div
      className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-lg"
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
    >
      <div className="flex items-start gap-3">
        <svg className="w-5 h-5 text-red-400" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
        </svg>
        <div className="flex-1">
          <p className="text-sm text-red-200">{errorMessage}</p>
          <p className="text-xs text-red-300/70 mt-1">
            {errorMessage.includes("连接失败") ? "提示：请检查网络连接或API Key是否正确" : "系统将自动尝试重连..."}
          </p>
        </div>
        <button onClick={() => setErrorMessage("")}>✕</button>
      </div>
    </motion.div>
  )}
</AnimatePresence>
```

---

## 高级功能

### 1. 自动重连机制

```typescript
private reconnectAttempts: number = 0;
private maxReconnectAttempts: number = 3;
private reconnectDelay: number = 2000; // 2秒

private attemptReconnect(
  onStateChange: (state: VoiceState) => void,
  onTranscript: (text: string) => void,
  onAudio: (audioData: ArrayBuffer) => void,
  onError?: (error: string) => void
) {
  if (this.reconnectAttempts >= this.maxReconnectAttempts) {
    console.error('❌ Max reconnection attempts reached');
    onError?.('连接失败，请刷新页面重试');
    return;
  }

  this.reconnectAttempts++;

  setTimeout(async () => {
    try {
      console.log(`🔄 Reconnecting... (${this.reconnectAttempts}/${this.maxReconnectAttempts})`);

      // 重新创建 WebSocket 连接
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const host = window.location.host;
      const wsUrl = `${protocol}//${host}/api/ws-proxy?apiKey=${encodeURIComponent(this.config.apiKey)}`;

      this.ws = new WebSocket(wsUrl);

      // 重新绑定事件监听器
      this.ws.onopen = () => {
        console.log('✅ Reconnected successfully');
        this.reconnectAttempts = 0;
        onStateChange('idle');
        this.sendSessionUpdate();
      };

      this.ws.onmessage = async (event) => {
        const data = JSON.parse(event.data);
        await this.handleEvent(data);
      };

      // ... 其他事件监听器
    } catch (error) {
      console.error('Failed to reconnect:', error);
      this.attemptReconnect(onStateChange, onTranscript, onAudio, onError);
    }
  }, this.reconnectDelay);
}
```

### 2. 打断检测与处理

```typescript
// 标记 AI 是否正在响应
private isAiResponding: boolean = false;

// 检测到用户开始说话
case 'input_audio_buffer.speech_started':
  console.log('🎤 Speech started');

  // 如果 AI 正在响应，立即打断
  if (this.isAiResponding || this.isPlaying || this.audioQueue.length > 0) {
    console.log('🛑 用户打断！AI正在响应，立即停止');
    this.interrupt();
  } else {
    this.onStateChange?.('listening');
  }
  break;

// 打断函数
interrupt() {
  console.log('🛑 用户打断，停止播放');

  // 停止当前音频播放
  this.stopPlayback();

  // 清空音频队列
  this.audioQueue = [];

  // 清空音频缓冲
  this.clearAudioBuffer();

  // 通知状态变更
  this.onStateChange?.('listening');

  console.log('✅ 打断完成，等待用户输入');
}

stopPlayback() {
  if (this.sourceNode) {
    this.sourceNode.stop();
    this.sourceNode = null;
  }
  this.audioQueue = [];
  this.isPlaying = false;
}

clearAudioBuffer() {
  if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
    return;
  }

  const message = {
    event_id: this.generateEventId(),
    type: 'input_audio_buffer.clear',
  };

  this.ws.send(JSON.stringify(message));
}
```

### 3. 智能模型切换

```typescript
// 模型选择上下文
interface ModelSelectionContext {
  userQuery: string;
  conversationTurns: number;
  networkLatency: number;
  devicePerformance: 'low' | 'medium' | 'high';
  userPreferences: {
    dataSaver: boolean;
    preferredModel?: 'step-audio-2' | 'step-audio-2-mini';
  };
}

// 选择模型
selectModel(context: ModelSelectionContext): ModelSelectionResult {
  // 如果用户指定了模型，使用指定的模型
  if (context.userPreferences.preferredModel) {
    return {
      selectedModel: context.userPreferences.preferredModel,
      complexityScore: 50,
      reason: 'User preference',
    };
  }

  // 如果开启了省流量模式，使用 mini 模型
  if (context.userPreferences.dataSaver) {
    return {
      selectedModel: 'step-audio-2-mini',
      complexityScore: 40,
      reason: 'Data saver mode enabled',
    };
  }

  // 智能选择：根据复杂度、延迟、设备性能选择
  const complexityScore = this.analyzeComplexity(context.userQuery);

  if (complexityScore > 70) {
    return {
      selectedModel: 'step-audio-2',
      complexityScore,
      reason: 'High complexity query',
    };
  } else if (context.networkLatency > 300 || context.devicePerformance === 'low') {
    return {
      selectedModel: 'step-audio-2-mini',
      complexityScore,
      reason: 'High latency or low performance device',
    };
  } else {
    return {
      selectedModel: 'step-audio-2',
      complexityScore,
      reason: 'Balanced performance and quality',
    };
  }
}
```

### 4. 历史人设系统

```typescript
// 人设类型
export type PersonaType = 'storyteller' | 'detective' | 'time-traveler';

// 人设提示词生成
export function getPersonaInstructions(
  persona: PersonaType,
  language: 'zh' | 'en'
): string {
  const personas = {
    storyteller: {
      zh: '你是一位生动有趣的说书人，擅长用讲故事的方式讲述历史。你的语言生动形象，富有感染力，每次讲述不超过50字。请使用标准的普通话，语速适中，让学生仿佛置身于历史场景之中。',
      en: 'You are a lively storyteller who excels at narrating history through engaging stories. Use vivid language and make students feel like they are in the historical scene.'
    },
    detective: {
      zh: '你是一位历史侦探，擅长通过提问引导学生思考。你会不断提出启发性问题，帮助学生发现历史的真相。你的语言专业但不枯燥，每次回答不超过50字。',
      en: 'You are a history detective who guides students through thought-provoking questions. Help students discover historical truths through inquiry.'
    },
    'time-traveler': {
      zh: '你是一位来自未来的时间旅行者，亲眼见证了历史的发生。你会用第一人称的视角描述历史场景，让学生感受历史的真实。你的语言富有想象力，每次描述不超过50字。',
      en: 'You are a time traveler from the future who has witnessed history firsthand. Describe historical events with an immersive first-person perspective.'
    },
  };

  return personas[persona][language];
}

// 动态切换人设
updatePersona(persona: PersonaType): void {
  console.log(`🎭 切换人设: ${this.currentPersona} → ${persona}`);
  this.currentPersona = persona;
  this.config.persona = persona;

  // 重新发送会话更新（应用新人设）
  if (this.ws && this.ws.readyState === WebSocket.OPEN) {
    this.sendSessionUpdate();
    console.log('✅ 人设已更新，新会话已创建');
  }
}
```

### 5. 对话记录持久化

```typescript
// 保存对话记录到 localStorage
export function saveConversations(conversations: any[]): void {
  try {
    const data = {
      conversations,
      savedAt: Date.now(),
    };
    localStorage.setItem('aitutor_conversations', JSON.stringify(data));
  } catch (error) {
    console.error('Failed to save conversations:', error);
  }
}

// 从 localStorage 加载对话记录
export function loadConversations(): any[] {
  try {
    const dataStr = localStorage.getItem('aitutor_conversations');
    if (!dataStr) return [];

    const data = JSON.parse(dataStr);

    // 30天自动过期
    const thirtyDaysInMs = 30 * 24 * 60 * 60 * 1000;
    if (data.savedAt && Date.now() - data.savedAt > thirtyDaysInMs) {
      localStorage.removeItem('aitutor_conversations');
      return [];
    }

    return data.conversations || [];
  } catch (error) {
    console.error('Failed to load conversations:', error);
    return [];
  }
}

// 在 React 中使用
useEffect(() => {
  const savedConversations = loadConversations();
  if (savedConversations.length > 0) {
    setConversations(savedConversations);
  }
}, []);

// 对话结束时保存
setConversations((prev) => {
  const updated = [...prev, newConversation];
  saveConversations(updated);
  return updated;
});
```

---

## 最佳实践

### 1. 音频采样率

**必须使用 24kHz 采样率**，这是 StepFun API 的要求。

```typescript
const audioContext = new AudioContext({ sampleRate: 24000 });

const stream = await navigator.mediaDevices.getUserMedia({
  audio: {
    sampleRate: 24000,  // ✅ 正确
    // sampleRate: 48000, // ❌ 错误
    // sampleRate: 16000, // ❌ 错误
  },
});
```

### 2. 音频格式转换

WebSocket 发送的音频必须是 **PCM16** 格式（16 位有符号整数）。

```typescript
// Float32 (-1.0 ~ 1.0) → PCM16 (-32768 ~ 32767)
const sample = Math.max(-1, Math.min(1, float32Array[i]));
view.setInt16(i * 2, sample < 0 ? sample * 0x8000 : sample * 0x7fff, true);
```

### 3. 事件 ID 生成

每个事件都需要唯一的 `event_id`，用于追踪和调试。

```typescript
private generateEventId(): string {
  return `event_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}
```

### 4. 消息队列

由于 WebSocket 连接可能需要时间，发送消息时应该使用队列。

```typescript
const messageQueue = [];

// WebSocket 未就绪时，将消息加入队列
if (stepfunWs.readyState !== WebSocket.OPEN) {
  messageQueue.push(message);
} else {
  stepfunWs.send(message);
}

// 连接成功后，发送队列中的消息
stepfunWs.on('open', () => {
  if (messageQueue.length > 0) {
    messageQueue.forEach((msg) => stepfunWs.send(msg));
    messageQueue.length = 0;
  }
});
```

### 5. 资源清理

组件卸载时，必须清理所有资源。

```typescript
useEffect(() => {
  return () => {
    // 停止录音
    stopRecording();

    // 断开 WebSocket
    if (clientRef.current) {
      clientRef.current.disconnect();
    }

    // 关闭音频上下文
    if (audioContextRef.current) {
      audioContextRef.current.close();
    }
  };
}, []);
```

### 6. 错误边界

使用 React 错误边界捕获运行时错误。

```typescript
class ErrorBoundary extends React.Component {
  state = { hasError: false };

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return <div>出错了，请刷新页面</div>;
    }
    return this.props.children;
  }
}
```

### 7. 性能优化

#### 7.1 音频播放优化

使用音频队列减少卡顿：

```typescript
private audioQueue: AudioBuffer[] = [];

// 不要每收到一个音频片段就播放，而是加入队列
onAudio(audioData: ArrayBuffer) {
  const audioBuffer = this.convertToAudioBuffer(audioData);
  this.audioQueue.push(audioBuffer);

  if (!this.isPlaying) {
    this.playNextAudio();
  }
}

// 播放队列中的音频
playNextAudio() {
  if (this.audioQueue.length === 0) {
    this.isPlaying = false;
    return;
  }

  const audioBuffer = this.audioQueue.shift()!;
  const source = this.audioContext.createBufferSource();
  source.buffer = audioBuffer;
  source.connect(this.audioContext.destination);

  source.onended = () => {
    this.playNextAudio();
  };

  source.start();
}
```

#### 7.2 防抖和节流

对频繁触发的事件进行优化：

```typescript
import { debounce } from 'lodash';

// 防抖：保存对话记录
const saveConversationsDebounced = debounce((conversations) => {
  saveConversations(conversations);
}, 1000);

// 使用
setConversations((prev) => {
  const updated = [...prev, newConversation];
  saveConversationsDebounced(updated);
  return updated;
});
```

### 8. 安全性

#### 8.1 API Key 保护

**永远不要在前端暴露 API Key！**

```typescript
// ❌ 错误：在前端直接使用 API Key
const ws = new WebSocket(`wss://api.stepfun.com/v1/realtime?apiKey=${apiKey}`);

// ✅ 正确：通过代理服务器
const ws = new WebSocket(`ws://localhost:3000/api/ws-proxy?apiKey=${apiKey}`);
```

#### 8.2 输入验证

验证用户输入，防止注入攻击：

```typescript
function validateApiKey(apiKey: string): boolean {
  // API Key 应该以 "sk-" 开头
  return /^sk-/.test(apiKey);
}

if (!validateApiKey(apiKey)) {
  throw new Error('Invalid API Key format');
}
```

---

## 常见问题

### Q1: 为什么没有声音？

**可能原因**：
1. 音频上下文未创建
2. 用户未与页面交互（浏览器自动播放策略）
3. 采样率不匹配

**解决方案**：
```typescript
// 1. 检查 AudioContext
if (!this.audioContext) {
  console.error('AudioContext not initialized');
  return;
}

// 2. 在用户交互后初始化
button.onClick = async () => {
  await audioContext.resume(); // 恢复音频上下文
};

// 3. 确保采样率为 24kHz
const audioContext = new AudioContext({ sampleRate: 24000 });
```

### Q2: WebSocket 连接失败

**可能原因**：
1. 代理服务器未启动
2. API Key 无效
3. 网络问题

**解决方案**：
```typescript
// 检查代理服务器
fetch('http://localhost:3000/api/health')
  .then(res => res.json())
  .then(data => console.log('Server status:', data));

// 检查 API Key
if (!apiKey || !apiKey.startsWith('sk-')) {
  alert('请输入有效的 API Key');
  return;
}

// 查看 WebSocket 状态
console.log('WebSocket readyState:', this.ws?.readyState);
// 0: CONNECTING, 1: OPEN, 2: CLOSING, 3: CLOSED
```

### Q3: 音频断断续续

**可能原因**：
1. 网络延迟
2. 音频队列处理不当
3. 浏览器性能问题

**解决方案**：
```typescript
// 1. 增加音频队列缓冲
private audioQueue: AudioBuffer[] = [];
private MAX_QUEUE_SIZE = 10; // 最多缓存 10 个音频片段

onAudio(audioData: ArrayBuffer) {
  if (this.audioQueue.length >= this.MAX_QUEUE_SIZE) {
    console.warn('Audio queue full, dropping audio');
    return;
  }

  const audioBuffer = this.convertToAudioBuffer(audioData);
  this.audioQueue.push(audioBuffer);
}

// 2. 使用更快的模型
const client = new StepFunRealtimeClient({
  apiKey,
  preferredModel: 'step-audio-2-mini', // 使用 mini 模型
});

// 3. 关闭不必要的功能
const stream = await navigator.mediaDevices.getUserMedia({
  audio: {
    echoCancellation: false,  // 关闭回声消除
    noiseSuppression: false, // 关闭降噪
    autoGainControl: false,  // 关闭自动增益
  },
});
```

### Q4: 如何调试 WebSocket 消息？

**解决方案**：
```typescript
// 1. 打印所有收到的消息
this.ws.onmessage = (event) => {
  const data = JSON.parse(event.data);

  // 只对关键事件打印日志
  if (!event.type.includes('.delta')) {
    console.log('📥 Received event:', event.type);
    console.log('   Data:', data);
  }
};

// 2. 使用 Chrome DevTools
// 打开 DevTools → Network → WS 标签页 → 选择 WebSocket 连接 → 查看消息

// 3. 保存日志到文件
const logs = [];
this.ws.onmessage = (event) => {
  logs.push({
    timestamp: Date.now(),
    event: JSON.parse(event.data),
  });

  // 导出日志
  console.log('Logs:', JSON.stringify(logs, null, 2));
};
```

### Q5: 如何降低延迟？

**解决方案**：
```typescript
// 1. 使用 mini 模型（更快）
const client = new StepFunRealtimeClient({
  apiKey,
  preferredModel: 'step-audio-2-mini',
});

// 2. 减少音频数据大小
const bufferSize = 2048; // 减小缓冲区大小
const processor = audioContext.createScriptProcessor(bufferSize, 1, 1);

// 3. 启用数据压缩（如果 API 支持）
const sessionUpdate = {
  type: 'session.update',
  session: {
    // ...其他配置
    output_audio_encoding: 'pcm16', // 使用压缩格式
  },
};

// 4. 使用 CDN 加速
const ws = new WebSocket('wss://cdn.stepfun.com/v1/realtime');
```

---

## 总结

本文档详细介绍了如何使用 StepFun Realtime API 实现实时语音交互功能，包括：

### 核心内容
1. ✅ **系统架构** - 前端、代理服务器、StepFun API 的协作
2. ✅ **WebSocket 协议** - 消息格式、事件类型、数据流向
3. ✅ **音频处理** - 录音、编码、发送、接收、播放
4. ✅ **状态管理** - 语音状态、对话记录、错误处理
5. ✅ **高级功能** - 打断检测、模型切换、人设系统、持久化

### 关键代码
- `/web/server.js` - WebSocket 代理服务器
- `/web/lib/stepfun-realtime.ts` - 核心客户端类
- `/web/app/realtime-voice/page.tsx` - React 页面组件

### 最佳实践
- 使用代理服务器保护 API Key
- 24kHz 采样率、PCM16 编码
- 音频队列平滑播放
- 自动重连机制
- 打断检测与处理
- 对话记录持久化

### 下一步
- 集成 RAG 知识库，增强 AI 回答准确性
- 添加更多历史人设，丰富学习体验
- 实现知识卡片生成功能
- 添加多语言支持

---

**祝开发顺利！** 🎉

如有问题，请参考：
- [StepFun 官方文档](https://platform.stepfun.com)
- [WebSocket API 文档](https://developer.mozilla.org/en-US/docs/Web/API/WebSocket)
- [Web Audio API 文档](https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API)
