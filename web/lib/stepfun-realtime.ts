import { VoiceState } from '@/types/voice';

export interface StepFunConfig {
  apiKey: string;
  model?: string;
  voice?: string;
  instructions?: string;
}

export class StepFunRealtimeClient {
  private ws: WebSocket | null = null;
  private config: StepFunConfig;
  private onStateChange?: (state: VoiceState) => void;
  private onTranscript?: (text: string) => void;
  private onAudio?: (audioData: ArrayBuffer) => void;
  private audioContext: AudioContext | null = null;
  private audioQueue: AudioBuffer[] = [];
  private isPlaying: boolean = false;
  private sourceNode: AudioBufferSourceNode | null = null;

  constructor(config: StepFunConfig) {
    this.config = {
      model: 'step-audio-2-mini',  // 使用 step-audio-2-mini 模型
      voice: 'qingchunshaonv',  // step-audio-2-mini 只支持青春少女和温柔男声
      instructions: '你是由阶跃星辰提供的AI聊天助手，你擅长中文，英文，以及多种其他语言的对话。请简洁友好地回答，每次回答不超过50字。请使用默认女声与用户交流。',
      ...config,
    };

    // 验证音色是否有效
    const validVoices = ['qingchunshaonv', 'wenrounansheng'];
    if (!validVoices.includes(this.config.voice || '')) {
      console.warn(`⚠️ Invalid voice for step-audio-2-mini: ${this.config.voice}`);
      console.warn(`🔄 Auto-changing to: qingchunshaonv`);
      this.config.voice = 'qingchunshaonv';
    }
  }

  async connect(
    onStateChange: (state: VoiceState) => void,
    onTranscript: (text: string) => void,
    onAudio: (audioData: ArrayBuffer) => void
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      this.onStateChange = onStateChange;
      this.onTranscript = onTranscript;
      this.onAudio = onAudio;

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
          alert('连接失败，请检查 API Key 是否正确');
          reject(error);
        };

        this.ws.onclose = (event) => {
          console.log('🔌 WebSocket closed:', event.code, event.reason);
          if (event.code !== 1000) {
            console.error('❌ Connection closed abnormally. Code:', event.code);
          }
          onStateChange('idle');
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
      },
    };

    console.log('📤 Sending session update');
    console.log('   Voice:', this.config.voice);
    this.ws.send(JSON.stringify(sessionUpdate));
    console.log('✅ Session update sent');
  }

  private async handleEvent(event: any) {
    console.log('📥 Received event:', event.type);

    switch (event.type) {
      case 'session.created':
      case 'session.updated':
        console.log('✅ Session event:', event);
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
        break;

      case 'error':
        console.error('❌ Server error:', event.error);
        this.onStateChange?.('idle');
        const errorMsg = event.error?.message || event.error?.type || '未知错误';
        alert(`API 错误: ${errorMsg}`);
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

  disconnect() {
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
