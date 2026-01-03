"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { motion } from "framer-motion";
import MicrophoneButton from "@/components/realtime-voice/MicrophoneButton";
import StatusIndicator from "@/components/realtime-voice/StatusIndicator";
import ParticleBackground from "@/components/realtime-voice/ParticleBackground";
import AudioVisualizer from "@/components/realtime-voice/AudioVisualizer";
import SettingsPanel from "@/components/realtime-voice/SettingsPanel";
import ConversationPanel from "@/components/realtime-voice/ConversationPanel";
import { StepFunRealtimeClient } from "@/lib/stepfun-realtime";
import { VoiceState, ConversationTurn } from "@/types/voice";

export default function RealtimeVoicePage() {
  const [voiceState, setVoiceState] = useState<VoiceState>("idle");
  const [isActive, setIsActive] = useState(false);
  const [apiKey, setApiKey] = useState("");
  const [language, setLanguage] = useState("zh");
  const [transcript, setTranscript] = useState("");
  const [conversations, setConversations] = useState<ConversationTurn[]>([]);
  const [currentTurn, setCurrentTurn] = useState<Partial<ConversationTurn>>({});
  const [isAiResponding, setIsAiResponding] = useState(false);

  const clientRef = useRef<StepFunRealtimeClient | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const processorNodeRef = useRef<ScriptProcessorNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const isRecordingRef = useRef(false); // 使用 ref 避免闭包问题

  // 初始化客户端
  const initClient = useCallback(async () => {
    if (!apiKey || clientRef.current) return;

    try {
      const client = new StepFunRealtimeClient({
        apiKey,
        voice: "qingchunshaonv", // step-audio-2-mini 只支持青春少女和温柔男声
        instructions:
          language === "zh"
            ? "你是由阶跃星辰提供的AI聊天助手，擅长中文和英文对话。请简洁友好地回答，每次回答不超过50字。请使用默认女声与用户交流。"
            : "You are an AI assistant provided by StepFun. You are good at Chinese and English conversations. Please answer concisely and friendly, keep responses under 50 words.",
      });

      await client.connect(
        (state) => {
          setVoiceState(state);

          // 监听状态变化，当 AI 开始说话时保存当前对话轮次
          if (state === "thinking" && !isAiResponding) {
            setIsAiResponding(true);
            // 用户说话结束，准备接收 AI 回复
          } else if (state === "idle" && isAiResponding) {
            // AI 回复结束，保存完整的对话轮次
            if (currentTurn.userMessage || currentTurn.aiResponse) {
              setConversations((prev) => [
                ...prev,
                {
                  id: `turn-${Date.now()}`,
                  timestamp: Date.now(),
                  userMessage: currentTurn.userMessage,
                  aiResponse: currentTurn.aiResponse,
                } as ConversationTurn,
              ]);
            }
            setCurrentTurn({});
            setIsAiResponding(false);
          }
        },
        (text) => {
          setTranscript((prev) => prev + text);

          // 区分用户消息和 AI 回复
          if (isAiResponding) {
            // AI 正在回复
            setCurrentTurn((prev) => ({
              ...prev,
              aiResponse: (prev.aiResponse || "") + text,
            }));
          } else {
            // 用户正在说话
            setCurrentTurn((prev) => ({
              ...prev,
              userMessage: (prev.userMessage || "") + text,
            }));
          }
        },
        async (audioData) => {
          await client.playAudio(audioData);
        },
      );

      clientRef.current = client;
      console.log("Client initialized");
    } catch (error) {
      console.error("Failed to initialize client:", error);
      alert("连接失败，请检查 API Key 是否正确");
      setVoiceState("idle");
    }
  }, [apiKey, language]);

  // 开始录音
  const startRecording = async () => {
    try {
      if (!apiKey) {
        alert("请先在设置中配置 StepFun API Key");
        return;
      }

      setVoiceState("connecting");

      // 初始化客户端（如果还没有）
      if (!clientRef.current) {
        await initClient();
      }

      // 获取麦克风权限
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          channelCount: 1,
          sampleRate: 24000,
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });

      streamRef.current = stream;

      // 创建音频上下文
      const audioContext = new AudioContext({ sampleRate: 24000 });
      audioContextRef.current = audioContext;

      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 256;
      analyserRef.current = analyser;

      const source = audioContext.createMediaStreamSource(stream);
      source.connect(analyser);

      // 创建脚本处理器（用于采集音频数据）
      const bufferSize = 4096;
      const processor = audioContext.createScriptProcessor(bufferSize, 1, 1);
      processorNodeRef.current = processor;

      processor.onaudioprocess = (e) => {
        // 使用 ref 避免闭包问题
        if (clientRef.current && isRecordingRef.current) {
          const inputData = e.inputBuffer.getChannelData(0);
          // 发送音频数据
          clientRef.current.sendAudio(inputData);
        }
      };

      analyser.connect(processor);
      processor.connect(audioContext.destination);

      isRecordingRef.current = true; // 标记开始录音
      setIsActive(true);
      setVoiceState("idle");
      console.log("Recording started");
    } catch (error) {
      console.error("Failed to start recording:", error);
      setVoiceState("idle");
      alert("无法访问麦克风，请检查权限设置");
    }
  };

  // 停止录音
  const stopRecording = () => {
    isRecordingRef.current = false; // 标记停止录音

    if (processorNodeRef.current) {
      processorNodeRef.current.disconnect();
      processorNodeRef.current = null;
    }

    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }

    if (clientRef.current) {
      clientRef.current.stopPlayback();
    }

    setIsActive(false);
    setVoiceState("idle");
    console.log("Recording stopped");
  };

  // 切换录音状态
  const toggleRecording = async () => {
    if (isActive) {
      stopRecording();
    } else {
      await startRecording();
    }
  };

  // 清理
  useEffect(() => {
    return () => {
      stopRecording();
      if (clientRef.current) {
        clientRef.current.disconnect();
      }
    };
  }, []);

  // 当 API Key 或语言变化时，重新初始化客户端
  useEffect(() => {
    if (isActive && clientRef.current) {
      stopRecording();
      clientRef.current = null;
    }
  }, [apiKey, language]);

  return (
    <main className="relative min-h-screen flex flex-col items-center py-12 px-4 overflow-hidden bg-deep-space">
      {/* Background Effects */}
      <ParticleBackground />

      {/* Content */}
      <motion.div
        className="relative z-10 flex flex-col items-center gap-8 w-full max-w-4xl"
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
      >
        {/* Title */}
        <motion.div
          className="text-center"
          initial={{ opacity: 0, y: -30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.6 }}
        >
          <h1 className="text-5xl md:text-6xl font-display font-bold mb-3 bg-gradient-to-r from-cyan-400 via-blue-500 to-aurora-500 bg-clip-text text-transparent">
            DeepTutor Voice
          </h1>
          <p className="text-gray-400 text-lg font-light">
            实时 AI 语音交互体验
          </p>
        </motion.div>

        {/* Status & Microphone */}
        <div className="flex flex-col items-center gap-8">
          <StatusIndicator state={voiceState} />

          <MicrophoneButton
            state={voiceState}
            isActive={isActive}
            onClick={toggleRecording}
            disabled={!apiKey}
          />
        </div>

        {/* Audio Visualizer */}
        <motion.div
          className="w-full max-w-2xl"
          initial={{ opacity: 0 }}
          animate={{ opacity: isActive ? 1 : 0.3 }}
          transition={{ duration: 0.3 }}
        >
          <AudioVisualizer isActive={isActive} analyser={analyserRef.current} />
        </motion.div>

        {/* Conversation History Panel */}
        {(conversations.length > 0 ||
          currentTurn.userMessage ||
          currentTurn.aiResponse) && (
          <ConversationPanel conversations={conversations} />
        )}

        {/* Current Transcript (Inline) */}
        {(currentTurn.userMessage || currentTurn.aiResponse) && (
          <motion.div
            className="w-full max-w-2xl p-4 rounded-lg bg-nebula/30 backdrop-blur-sm border border-white/10"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <p className="text-xs text-gray-500 mb-2">当前对话：</p>
            {currentTurn.userMessage && !isAiResponding && (
              <p className="text-cyan-300 text-sm mb-1">
                <span className="text-gray-500">你：</span>
                {currentTurn.userMessage}
              </p>
            )}
            {currentTurn.aiResponse && (
              <p className="text-aurora-300 text-sm">
                <span className="text-gray-500">AI：</span>
                {currentTurn.aiResponse}
              </p>
            )}
          </motion.div>
        )}

        {/* Instructions */}
        {!apiKey && (
          <motion.div
            className="text-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
          >
            <p className="text-gray-500 text-sm">
              点击右上角设置图标配置 API Key
            </p>
          </motion.div>
        )}
      </motion.div>

      {/* Settings Panel */}
      <SettingsPanel
        apiKey={apiKey}
        onApiKeyChange={setApiKey}
        language={language}
        onLanguageChange={setLanguage}
      />

      {/* Footer */}
      <motion.footer
        className="fixed bottom-6 left-0 right-0 text-center z-10"
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.5 }}
        transition={{ delay: 1 }}
      >
        <p className="text-xs text-gray-600 font-light">
          Powered by StepFun Realtime API
        </p>
      </motion.footer>
    </main>
  );
}
