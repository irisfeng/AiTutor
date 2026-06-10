import { VoiceState } from '@/types/voice';
import {
  AudioModelSelector,
  ModelSelectionContext,
  ModelSelectionResult,
  NetworkLatencyMeasurer,
  DevicePerformanceDetector,
} from './model-selector';
import { getModelAnalytics, ModelUsageRecord } from './model-analytics';
import { type SubjectType, getPersonaInstructions } from './prompts/personas';

/** 可用的实时语音模型（step-2.5-realtime 为 2026-05 发布的新一代） */
export type RealtimeModel = 'step-audio-2' | 'step-audio-2-mini' | 'step-2.5-realtime';

export interface StepFunConfig {
  apiKey: string;
  model?: string;
  voice?: string;
  instructions?: string;
  // 提示词来源：'subject' 用学科人设（旧页面默认），'custom' 用 instructions 字段
  promptMode?: 'subject' | 'custom';
  // 智能调度配置
  enableModelSelection?: boolean;
  dataSaver?: boolean;
  preferredModel?: RealtimeModel;
  // 学科配置
  subject?: SubjectType;
  userLanguage?: 'zh' | 'en';
}

export class StepFunRealtimeClient {
  private ws: WebSocket | null = null;
  private config: StepFunConfig;
  private onStateChange?: (state: VoiceState) => void;
  private onTranscript?: (text: string) => void;
  private onUserTranscript?: (text: string) => void; // 新增：用户转写文本回调
  private onAudio?: (audioData: ArrayBuffer) => void;
  private onError?: (error: string) => void; // 新增：错误回调
  private audioContext: AudioContext | null = null;
  private audioQueue: AudioBuffer[] = [];
  private isPlaying: boolean = false;
  private sourceNode: AudioBufferSourceNode | null = null;

  // 智能调度相关
  private modelSelector: AudioModelSelector;
  private latencyMeasurer: NetworkLatencyMeasurer;
  private performanceDetector: DevicePerformanceDetector;
  private conversationTurns: number = 0;
  private currentModel: RealtimeModel = 'step-audio-2';
  private lastUserQuery: string = '';
  private responseStartTime: number = 0;
  private selectedModelInfo: ModelSelectionResult | null = null;

  // 连接管理相关
  private reconnectAttempts: number = 0;
  private maxReconnectAttempts: number = 3;
  private reconnectDelay: number = 2000; // 2秒
  private isManualDisconnect: boolean = false;

  // 学科相关
  private currentSubject: SubjectType = 'history';
  private userLanguage: 'zh' | 'en' = 'zh';

  // 打断检测相关
  private isAiResponding: boolean = false; // AI是否正在生成或播放响应

  constructor(config: StepFunConfig) {
    this.config = {
      model: 'step-audio-2',
      voice: 'qingchunshaonv',
      instructions: '你是由阶跃星辰提供的AI聊天助手，你擅长中文，英文，以及多种其他语言的对话。请简洁友好地回答，每次回答不超过50字。请使用默认女声与用户交流。',
      enableModelSelection: true, // 默认启用智能调度
      dataSaver: false,
      subject: 'history', // 默认使用历史学科
      userLanguage: 'zh', // 默认中文
      ...config,
    };

    // 初始化学科和语言
    if (this.config.subject) {
      this.currentSubject = this.config.subject;
    }
    if (this.config.userLanguage) {
      this.userLanguage = this.config.userLanguage;
    }

    // 验证音色是否有效
    const validVoices = ['qingchunshaonv', 'wenrounansheng'];
    if (!validVoices.includes(this.config.voice || '')) {
      console.warn(`⚠️ Invalid voice: ${this.config.voice}`);
      console.warn(`🔄 Auto-changing to: qingchunshaonv`);
      this.config.voice = 'qingchunshaonv';
    }

    // 初始化智能调度组件
    this.modelSelector = new AudioModelSelector();
    this.latencyMeasurer = NetworkLatencyMeasurer.getInstance();
    this.performanceDetector = DevicePerformanceDetector.getInstance();

    // 如果用户指定了模型，则使用指定模型
    if (this.config.preferredModel) {
      this.currentModel = this.config.preferredModel;
    }
  }

  async connect(
    onStateChange: (state: VoiceState) => void,
    onTranscript: (text: string) => void,
    onAudio: (audioData: ArrayBuffer) => void,
    onError?: (error: string) => void, // 错误回调
    onUserTranscript?: (text: string) => void // 新增：用户转写文本回调
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      this.onStateChange = onStateChange;
      this.onTranscript = onTranscript;
      this.onUserTranscript = onUserTranscript; // 保存用户转写回调
      this.onAudio = onAudio;
      this.onError = onError; // 保存错误回调
      this.isManualDisconnect = false; // 重置手动断开标志

      try {
        // 连接到独立的 WebSocket 代理服务器（端口 3004）
        const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const wsHost = 'localhost:3004'; // 独立的 WebSocket 代理服务器
        // 🔑 在 URL 中添加模型参数
        const wsUrl = `${wsProtocol}//${wsHost}/ws-proxy?model=${this.currentModel}&apiKey=${encodeURIComponent(this.config.apiKey)}`;

        console.log('Connecting to WebSocket proxy:', wsUrl.replace(/apiKey=[^&]+/, 'apiKey=***'));
        console.log('Model (via URL):', this.currentModel);
        console.log('Using voice:', this.config.voice);

        this.ws = new WebSocket(wsUrl);
        this.audioContext = new AudioContext({ sampleRate: 24000 });

        this.ws.onopen = () => {
          console.log('✅ WebSocket connected to proxy');
          this.reconnectAttempts = 0; // 重置重连次数
          onStateChange('idle');

          // 连接成功后创建会话
          this.sendSessionUpdate();
          resolve();
        };

        this.ws.onmessage = async (event) => {
          try {
            const data = JSON.parse(event.data);
            await this.handleEvent(data);
          } catch (error) {
            console.error('Failed to parse message:', error);
          }
        };

        this.ws.onerror = (error) => {
          console.error('❌ WebSocket error:', error);
          onStateChange('idle');
          // 移除alert，使用回调通知
          this.onError?.('连接失败，请检查网络或API Key');
        };

        this.ws.onclose = (event) => {
          console.log('🔌 WebSocket closed:', event.code, event.reason);

          // 如果不是手动断开，尝试重连
          if (!this.isManualDisconnect && event.code !== 1000) {
            console.error('❌ Connection closed abnormally. Code:', event.code);
            console.log(`🔄 Attempting to reconnect (${this.reconnectAttempts + 1}/${this.maxReconnectAttempts})...`);

            this.attemptReconnect(onStateChange, onTranscript, onAudio, this.onError);
          } else {
            onStateChange('idle');
          }
        };
      } catch (error) {
        console.error('Failed to connect:', error);
        onStateChange('idle');
        reject(error);
      }
    });
  }

  private sendSessionUpdate() {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      console.error('WebSocket not connected');
      return;
    }

    // 提示词：custom 模式用调用方传入的 instructions（新版个人助理），否则用学科人设
    const instructions =
      this.config.promptMode === 'custom' && this.config.instructions
        ? this.config.instructions
        : getPersonaInstructions(this.currentSubject);

    const sessionUpdate = {
      event_id: this.generateEventId(),
      type: 'session.update',
      session: {
        modalities: ['text', 'audio'],
        instructions,
        voice: this.config.voice,
        input_audio_format: 'pcm16',
        output_audio_format: 'pcm16',
        turn_detection: {
          type: 'server_vad',
        },
        model: this.currentModel, // 使用当前选择的模型
      },
    };

    console.log('📤 Sending session update');
    console.log('   Model:', this.currentModel);
    console.log('   Subject:', this.currentSubject);
    console.log('   Voice:', this.config.voice);
    this.ws.send(JSON.stringify(sessionUpdate));
    console.log('✅ Session update sent');
  }

  private async handleEvent(event: any) {
    // 只对关键事件打印日志，避免流式事件刷屏
    if (!event.type.includes('.delta')) {
      console.log('📥 Received event:', event.type);
    }

    switch (event.type) {
      case 'session.created':
        console.log('✅ Session created:', event.session?.model);
        break;

      case 'session.updated':
        console.log('✅ Session updated:', event.session?.model);
        console.log('📋 Full session object:', JSON.stringify(event.session, null, 2));
        break;

      case 'input_audio_buffer.speech_started':
        console.log('🎤 Speech started');

        // 重要：如果AI正在响应，立即打断
        // isAiResponding: AI正在生成或播放音频
        // isPlaying: 音频正在播放
        // audioQueue.length > 0: 有音频在队列中等待播放
        if (this.isAiResponding || this.isPlaying || this.audioQueue.length > 0) {
          console.log('🛑 用户打断！AI正在响应，立即停止');
          this.interrupt();
        } else {
          this.onStateChange?.('listening');
        }
        break;

      case 'input_audio_buffer.speech_stopped':
        console.log('🤔 Speech stopped, thinking...');
        this.onStateChange?.('thinking');
        break;

      case 'conversation.item.input_audio_transcription.completed':
        // 用户语音转写完成
        const userTranscript = event.transcript || '';
        console.log('👤 User transcript:', userTranscript);
        if (userTranscript && this.onUserTranscript) {
          this.onUserTranscript(userTranscript);
        }
        break;

      case 'response.audio.delta':
        // 收到音频数据 - AI正在响应
        this.isAiResponding = true;
        if (event.delta) {
          const audioData = this.base64ToArrayBuffer(event.delta);
          this.onAudio?.(audioData);
        }
        break;

      case 'response.audio_transcript.delta':
        // 收到文字转录 - AI正在响应
        this.isAiResponding = true;
        if (event.delta) {
          this.onTranscript?.(event.delta);
        }
        break;

      case 'response.audio.done':
      case 'response.audio_transcript.done':
        console.log('✅ Response done');
        this.isAiResponding = false;
        // 记录使用数据
        this.trackUsage();
        break;

      case 'error':
        console.error('❌ Server error:', event.error);
        this.onStateChange?.('idle');
        const errorMsg = event.error?.message || event.error?.type || '未知错误';
        // 使用回调代替alert
        this.onError?.(`API 错误: ${errorMsg}`);
        break;

      default:
        console.log('📄 Unhandled event type:', event.type);
    }
  }

  sendAudio(audioData: Float32Array) {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      console.error('WebSocket not connected');
      return;
    }

    // 将 Float32Array 转换为 PCM16
    const pcm16Data = this.floatToPCM16(audioData);
    const base64Audio = this.arrayBufferToBase64(pcm16Data);

    const message = {
      event_id: this.generateEventId(),
      type: 'input_audio_buffer.append',
      audio: base64Audio,
    };

    this.ws.send(JSON.stringify(message));
  }

  /**
   * 发送文字消息（多模态：打字代替说话）
   * 创建文本对话项并立即请求 AI 响应
   */
  sendText(text: string) {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      console.error('WebSocket not connected');
      this.onError?.('尚未连接，请稍后再试');
      return;
    }

    this.ws.send(
      JSON.stringify({
        event_id: this.generateEventId(),
        type: 'conversation.item.create',
        item: {
          type: 'message',
          role: 'user',
          content: [{ type: 'input_text', text }],
        },
      })
    );

    this.ws.send(
      JSON.stringify({
        event_id: this.generateEventId(),
        type: 'response.create',
      })
    );

    this.responseStartTime = Date.now();
    this.setUserQuery(text);
  }

  startConversation() {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      console.error('WebSocket not connected');
      return;
    }

    const message = {
      event_id: this.generateEventId(),
      type: 'response.create',
    };

    this.ws.send(JSON.stringify(message));
    console.log('🚀 Conversation started');

    // 记录响应开始时间
    this.responseStartTime = Date.now();
  }

  /**
   * 设置用户查询文本（用于记录和分析，不再触发模型切换）
   */
  setUserQuery(query: string) {
    console.log('🎯 User query:', query);
    this.lastUserQuery = query;
    this.conversationTurns++;

    // 记录复杂度分析（但不切换模型）
    if (this.config.enableModelSelection && !this.config.preferredModel) {
      const context = this.buildSelectionContext();
      const result = this.modelSelector.selectModel(context);
      this.selectedModelInfo = result;

      console.log('📊 Complexity analysis:', {
        score: result.complexityScore,
        recommended: result.selectedModel,
        current: this.currentModel,
        note: 'Model will not switch during session',
      });
    }
  }

  /**
   * 构建模型选择上下文（仅用于分析）
   */
  private buildSelectionContext(): ModelSelectionContext {
    return {
      userQuery: this.lastUserQuery,
      conversationTurns: this.conversationTurns,
      networkLatency: this.latencyMeasurer.getAverageLatency(),
      devicePerformance: this.performanceDetector.detectPerformance(),
      userPreferences: {
        dataSaver: this.config.dataSaver || false,
        preferredModel: this.config.preferredModel,
      },
    };
  }

  /**
   * 获取当前使用的模型信息
   */
  getCurrentModel(): { model: string; info: ModelSelectionResult | null } {
    return {
      model: this.currentModel,
      info: this.selectedModelInfo,
    };
  }

  /**
   * 记录本次对话的使用数据
   */
  private trackUsage() {
    if (!this.selectedModelInfo) return;

    // 使用统计仅覆盖智能调度的两个旧模型，2.5 不参与
    const modelUsed = this.currentModel;
    if (modelUsed === 'step-2.5-realtime') return;

    const responseTime = Date.now() - this.responseStartTime;

    const record: ModelUsageRecord = {
      timestamp: Date.now(),
      modelUsed,
      complexityScore: this.selectedModelInfo.complexityScore,
      responseTime,
      networkLatency: this.latencyMeasurer.getAverageLatency(),
      devicePerformance: this.performanceDetector.detectPerformance(),
      reason: this.selectedModelInfo.reason,
    };

    const analytics = getModelAnalytics();
    analytics.trackModelUsage(record);

    console.log('📊 使用记录已保存:', {
      模型: this.currentModel,
      响应时间: `${responseTime}ms`,
      复杂度分数: this.selectedModelInfo.complexityScore,
    });
  }

  /**
   * 重置对话轮次
   */
  resetConversation() {
    this.conversationTurns = 0;
    this.lastUserQuery = '';
    this.selectedModelInfo = null;
  }

  /**
   * 切换学科
   */
  updateSubject(subject: SubjectType): void {
    console.log(`📚 切换学科: ${this.currentSubject} → ${subject}`);
    this.currentSubject = subject;
    this.config.subject = subject;

    // 重新发送会话更新（应用新学科）
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.sendSessionUpdate();
      console.log('✅ 学科已更新，新会话已创建');
    }
  }

  /**
   * 获取当前学科
   */
  getCurrentSubject(): SubjectType {
    return this.currentSubject;
  }

  /**
   * 获取当前语言
   */
  getUserLanguage(): 'zh' | 'en' {
    return this.userLanguage;
  }

  /**
   * 测量网络延迟（异步）
   */
  async measureNetworkLatency(): Promise<number> {
    return await this.latencyMeasurer.measureLatency();
  }

  clearAudioBuffer() {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      console.error('WebSocket not connected');
      return;
    }

    const message = {
      event_id: this.generateEventId(),
      type: 'input_audio_buffer.clear',
    };

    this.ws.send(JSON.stringify(message));
  }

  /**
   * 尝试重连
   */
  private attemptReconnect(
    onStateChange: (state: VoiceState) => void,
    onTranscript: (text: string) => void,
    onAudio: (audioData: ArrayBuffer) => void,
    onError?: (error: string) => void
  ) {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('❌ Max reconnection attempts reached');
      onError?.('连接失败，请刷新页面重试');
      onStateChange('idle');
      return;
    }

    this.reconnectAttempts++;

    setTimeout(async () => {
      try {
        console.log(`🔄 Reconnecting... (Attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})`);

        // 重新创建WebSocket连接
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const host = window.location.host;
        const wsUrl = `${protocol}//${host}/api/ws-proxy?apiKey=${encodeURIComponent(this.config.apiKey)}`;

        this.ws = new WebSocket(wsUrl);

        this.ws.onopen = () => {
          console.log('✅ Reconnected successfully');
          this.reconnectAttempts = 0;
          onStateChange('idle');
          this.sendSessionUpdate();
        };

        this.ws.onmessage = async (event) => {
          try {
            const data = JSON.parse(event.data);
            await this.handleEvent(data);
          } catch (error) {
            console.error('Failed to parse message:', error);
          }
        };

        this.ws.onerror = (error) => {
          console.error('❌ Reconnection error:', error);
          onStateChange('idle');
          onError?.('重连失败，请检查网络');
        };

        this.ws.onclose = (event) => {
          console.log('🔌 Reconnection closed:', event.code, event.reason);

          if (!this.isManualDisconnect && event.code !== 1000) {
            this.attemptReconnect(onStateChange, onTranscript, onAudio, onError);
          } else {
            onStateChange('idle');
          }
        };
      } catch (error) {
        console.error('Failed to reconnect:', error);
        this.attemptReconnect(onStateChange, onTranscript, onAudio, onError);
      }
    }, this.reconnectDelay);
  }

  disconnect() {
    this.isManualDisconnect = true; // 标记为手动断开

    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }
  }

  isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN;
  }

  // 工具方法：Float32 转 PCM16
  private floatToPCM16(float32Array: Float32Array): ArrayBuffer {
    const arrayBuffer = new ArrayBuffer(float32Array.length * 2);
    const view = new DataView(arrayBuffer);

    for (let i = 0; i < float32Array.length; i++) {
      const sample = Math.max(-1, Math.min(1, float32Array[i]));
      view.setInt16(i * 2, sample < 0 ? sample * 0x8000 : sample * 0x7fff, true);
    }

    return arrayBuffer;
  }

  // 工具方法：ArrayBuffer 转 Base64
  private arrayBufferToBase64(buffer: ArrayBuffer): string {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return window.btoa(binary);
  }

  // 工具方法：Base64 转 ArrayBuffer
  private base64ToArrayBuffer(base64: string): ArrayBuffer {
    const binaryString = window.atob(base64);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes.buffer;
  }

  // 工具方法：生成事件 ID
  private generateEventId(): string {
    return `event_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // 播放音频数据
  async playAudio(audioData: ArrayBuffer): Promise<void> {
    if (!this.audioContext) {
      console.error('AudioContext not initialized');
      return;
    }

    try {
      // 将 ArrayBuffer 转换为 AudioBuffer
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
        const sample = pcm16Data.getInt16(i * 2, true);
        channelData[i] = sample / 0x8000;
      }

      // 添加到播放队列
      this.audioQueue.push(audioBuffer);

      // 如果没有在播放，开始播放
      if (!this.isPlaying) {
        this.playNextAudio();
      }
    } catch (error) {
      console.error('Failed to play audio:', error);
    }
  }

  private async playNextAudio() {
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

    this.sourceNode.onended = () => {
      this.playNextAudio();
    };

    this.sourceNode.start();
  }

  stopPlayback() {
    if (this.sourceNode) {
      this.sourceNode.stop();
      this.sourceNode = null;
    }
    this.audioQueue = [];
    this.isPlaying = false;
  }

  /**
   * 打断当前对话（用户开始说话）
   * 停止音频播放，清空队列，清除音频缓冲
   */
  interrupt() {
    console.log('🛑 用户打断，停止播放');

    // 停止当前音频播放
    this.stopPlayback();

    // 清空音频缓冲
    this.clearAudioBuffer();

    // 通知状态变更
    this.onStateChange?.('listening');

    console.log('✅ 打断完成，等待用户输入');
  }
}
