import { VoiceState } from '@/types/voice';
import {
  AudioModelSelector,
  ModelSelectionContext,
  ModelSelectionResult,
  NetworkLatencyMeasurer,
  DevicePerformanceDetector,
} from './model-selector';
import { getModelAnalytics, ModelUsageRecord } from './model-analytics';

export interface StepFunConfig {
  apiKey: string;
  model?: string;
  voice?: string;
  instructions?: string;
  // 智能调度配置
  enableModelSelection?: boolean;
  dataSaver?: boolean;
  preferredModel?: 'step-audio-2' | 'step-audio-2-mini';
}

export class StepFunRealtimeClient {
  private ws: WebSocket | null = null;
  private config: StepFunConfig;
  private onStateChange?: (state: VoiceState) => void;
  private onTranscript?: (text: string) => void;
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
  private currentModel: 'step-audio-2' | 'step-audio-2-mini' = 'step-audio-2-mini';
  private lastUserQuery: string = '';
  private responseStartTime: number = 0;
  private selectedModelInfo: ModelSelectionResult | null = null;

  // 连接管理相关
  private reconnectAttempts: number = 0;
  private maxReconnectAttempts: number = 3;
  private reconnectDelay: number = 2000; // 2秒
  private isManualDisconnect: boolean = false;

  constructor(config: StepFunConfig) {
    this.config = {
      model: 'step-audio-2-mini',
      voice: 'qingchunshaonv',
      instructions: '你是由阶跃星辰提供的AI聊天助手，你擅长中文，英文，以及多种其他语言的对话。请简洁友好地回答，每次回答不超过50字。请使用默认女声与用户交流。',
      enableModelSelection: true, // 默认启用智能调度
      dataSaver: false,
      ...config,
    };

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
    onError?: (error: string) => void // 新增：错误回调
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      this.onStateChange = onStateChange;
      this.onTranscript = onTranscript;
      this.onAudio = onAudio;
      this.onError = onError; // 保存错误回调
      this.isManualDisconnect = false; // 重置手动断开标志

      try {
        // 连接到本地代理服务器
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const host = window.location.host;
        const wsUrl = `${protocol}//${host}/api/ws-proxy?apiKey=${encodeURIComponent(this.config.apiKey)}`;

        console.log('Connecting to proxy:', wsUrl.replace(/apiKey=[^&]+/, 'apiKey=***'));
        console.log('Model (via URL): step-audio-2-mini');
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

    const sessionUpdate = {
      event_id: this.generateEventId(),
      type: 'session.update',
      session: {
        modalities: ['text', 'audio'],
        instructions: this.config.instructions,
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
        this.onStateChange?.('listening');
        break;

      case 'input_audio_buffer.speech_stopped':
        console.log('🤔 Speech stopped, thinking...');
        this.onStateChange?.('thinking');
        break;

      case 'response.audio.delta':
        // 收到音频数据
        if (event.delta) {
          const audioData = this.base64ToArrayBuffer(event.delta);
          this.onAudio?.(audioData);
        }
        break;

      case 'response.audio_transcript.delta':
        // 收到文字转录
        if (event.delta) {
          this.onTranscript?.(event.delta);
        }
        break;

      case 'response.audio.done':
      case 'response.audio_transcript.done':
        console.log('✅ Response done');
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
   * 设置用户查询文本（用于模型选择）
   */
  setUserQuery(query: string) {
    console.log('🎯 setUserQuery called:', query);
    this.lastUserQuery = query;
    this.conversationTurns++;

    console.log('📊 Model selection config:', {
      enableModelSelection: this.config.enableModelSelection,
      preferredModel: this.config.preferredModel,
    });

    // 如果启用了智能调度，选择模型
    if (this.config.enableModelSelection && !this.config.preferredModel) {
      console.log('🔄 Triggering model selection...');
      this.selectAndSwitchModel();
    } else {
      console.log('⏭️ Model selection skipped (disabled or preferred model set)');
    }
  }

  /**
   * 智能选择模型并切换
   */
  private async selectAndSwitchModel() {
    const context = this.buildSelectionContext();
    const result = this.modelSelector.selectModel(context);

    console.log('🎲 Model selection result:', {
      selected: result.selectedModel,
      current: this.currentModel,
      complexity: result.complexityScore,
      reason: result.reason,
    });

    this.selectedModelInfo = result;

    // 如果选择的模型与当前不同，需要重新创建会话
    if (result.selectedModel !== this.currentModel) {
      console.log('🔄 模型切换:', result.reason);
      console.log(`   从 ${this.currentModel} 切换到 ${result.selectedModel}`);
      this.currentModel = result.selectedModel;

      // 重新创建会话
      this.sendSessionUpdate();
    } else {
      console.log('✅ 继续使用当前模型:', result.reason);
    }
  }

  /**
   * 构建模型选择上下文
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

    const responseTime = Date.now() - this.responseStartTime;

    const record: ModelUsageRecord = {
      timestamp: Date.now(),
      modelUsed: this.currentModel,
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
}
