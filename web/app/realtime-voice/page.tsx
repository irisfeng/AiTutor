"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { BookOpen, Mic2, Settings, Sparkles } from "lucide-react";
import { useTranslation } from "react-i18next";
import { StepFunRealtimeClient } from "@/lib/stepfun-realtime";
import { VoiceState, ConversationTurn } from "@/types/voice";
import { ModelSettings } from "@/components/realtime-voice/ModelSettings";
import "@/lib/i18n";

export default function RealtimeVoicePage() {
  const { t, i18n } = useTranslation();
  const [voiceState, setVoiceState] = useState<VoiceState>("idle");
  const [isActive, setIsActive] = useState(false);
  const [apiKey, setApiKey] = useState("");
  const [language, setLanguage] = useState("zh");
  const [conversations, setConversations] = useState<ConversationTurn[]>([]);
  const [currentTurn, setCurrentTurn] = useState<Partial<ConversationTurn>>({});
  const [isAiResponding, setIsAiResponding] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string>(""); // 新增：错误信息

  // 智能调度配置
  const [modelMode, setModelMode] = useState<'auto' | 'quality' | 'fast'>('auto');
  const [dataSaver, setDataSaver] = useState(false);
  const [currentModel, setCurrentModel] = useState<string>('step-audio-2-mini');
  const [complexityScore, setComplexityScore] = useState<number | undefined>();
  const [networkLatency, setNetworkLatency] = useState<number>(0);

  const clientRef = useRef<StepFunRealtimeClient | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const processorNodeRef = useRef<ScriptProcessorNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const isRecordingRef = useRef(false);

  // 初始化客户端
  const initClient = useCallback(async () => {
    if (!apiKey || clientRef.current) return;

    try {
      // 根据模式确定模型
      let preferredModel: 'step-audio-2' | 'step-audio-2-mini' | undefined = undefined;
      if (modelMode === 'quality') {
        preferredModel = 'step-audio-2';
      } else if (modelMode === 'fast') {
        preferredModel = 'step-audio-2-mini';
      }

      const client = new StepFunRealtimeClient({
        apiKey,
        voice: "qingchunshaonv",
        instructions:
          language === "zh"
            ? "你是由阶跃星辰提供的AI导师，擅长通过对话启发思考。请用温暖、鼓励的语气，每次回答不超过50字。"
            : "You are an AI tutor provided by StepFun. You inspire thinking through conversation. Please answer warmly and encouragingly, keep responses under 50 words.",
        enableModelSelection: modelMode === 'auto',
        dataSaver,
        preferredModel,
      });

      await client.connect(
        (state) => {
          setVoiceState(state);
          // 清除错误信息
          if (state === "idle") {
            setErrorMessage("");
          }
          if (state === "thinking" && !isAiResponding) {
            setIsAiResponding(true);
          } else if (state === "idle" && isAiResponding) {
            if (currentTurn.userMessage || currentTurn.aiResponse) {
              // 记录用户查询（用于分析，但不切换模型）
              if (currentTurn.userMessage && clientRef.current) {
                clientRef.current.setUserQuery(currentTurn.userMessage);
              }

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
          if (isAiResponding) {
            setCurrentTurn((prev) => ({
              ...prev,
              aiResponse: (prev.aiResponse || "") + text,
            }));
          } else {
            // 用户说话（转录为文本）
            setCurrentTurn((prev) => ({
              ...prev,
              userMessage: (prev.userMessage || "") + text,
            }));
          }
        },
        async (audioData) => {
          await client.playAudio(audioData);
        },
        // 新增：错误回调
        (error) => {
          setErrorMessage(error);
          // 5秒后自动清除错误信息
          setTimeout(() => {
            setErrorMessage("");
          }, 5000);
        }
      );

      clientRef.current = client;

      // 获取当前模型信息
      const modelInfo = client.getCurrentModel();
      setCurrentModel(modelInfo.model);
      setComplexityScore(modelInfo.info?.complexityScore);

      // 测量网络延迟
      const latency = await client.measureNetworkLatency();
      setNetworkLatency(latency);
    } catch (error) {
      console.error("Failed to initialize client:", error);
      alert(t("alerts.connectionFailed"));
      setVoiceState("idle");
    }
  }, [apiKey, language, isAiResponding, currentTurn, t, modelMode, dataSaver]);

  // 开始录音
  const startRecording = async () => {
    try {
      if (!apiKey) {
        setShowSettings(true);
        return;
      }

      setVoiceState("connecting");

      if (!clientRef.current) {
        await initClient();
      }

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

      const audioContext = new AudioContext({ sampleRate: 24000 });
      audioContextRef.current = audioContext;

      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 256;
      analyserRef.current = analyser;

      const source = audioContext.createMediaStreamSource(stream);
      source.connect(analyser);

      const bufferSize = 4096;
      const processor = audioContext.createScriptProcessor(bufferSize, 1, 1);
      processorNodeRef.current = processor;

      processor.onaudioprocess = (e) => {
        if (clientRef.current && isRecordingRef.current) {
          const inputData = e.inputBuffer.getChannelData(0);
          clientRef.current.sendAudio(inputData);
        }
      };

      analyser.connect(processor);
      processor.connect(audioContext.destination);

      isRecordingRef.current = true;
      setIsActive(true);
      setVoiceState("idle");
    } catch (error) {
      console.error("Failed to start recording:", error);
      setVoiceState("idle");
      alert(t("alerts.microphoneAccess"));
    }
  };

  // 停止录音
  const stopRecording = () => {
    isRecordingRef.current = false;

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
  };

  // 切换录音状态
  const toggleRecording = async () => {
    if (isActive) {
      stopRecording();
    } else {
      await startRecording();
    }
  };

  // 语言切换
  const handleLanguageChange = (lang: string) => {
    setLanguage(lang);
    i18n.changeLanguage(lang);
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

  // 格式化时间
  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString(i18n.language === "zh" ? "zh-CN" : "en-US", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <main className="min-h-screen bg-background texture-paper">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <motion.div
            className="flex items-center gap-3"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-lg">
              <BookOpen className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-semibold">{t("header.title")}</h1>
              <p className="text-xs text-muted-foreground">
                {t("header.subtitle")}
              </p>
            </div>
          </motion.div>

          <div className="flex items-center gap-2">
            {/* 模型设置按钮 */}
            <ModelSettings
              onModeChange={setModelMode}
              onDataSaverChange={setDataSaver}
              currentModel={currentModel}
              complexityScore={complexityScore}
              networkLatency={networkLatency}
            />

            {/* 系统设置按钮 */}
            <motion.button
              onClick={() => setShowSettings(!showSettings)}
              className="p-2 rounded-lg hover:bg-muted transition-smooth"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
            >
              <Settings className="w-5 h-5 text-muted-foreground" />
            </motion.button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="pt-24 pb-32 px-6 max-w-4xl mx-auto">
        {/* Welcome Section */}
        <motion.div
          className="text-center mb-12"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <h2 className="text-4xl md:text-5xl font-bold mb-4 gradient-text">
            {t("hero.title")}
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            {t("hero.description")}
          </p>
        </motion.div>

        {/* Status Card */}
        <motion.div
          className="card-elevated p-8 mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
        >
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <motion.div
                className={`w-3 h-3 rounded-full ${
                  isActive ? "bg-primary" : "bg-muted-foreground/30"
                }`}
                animate={isActive ? { scale: [1, 1.2, 1] } : {}}
                transition={{ duration: 2, repeat: Infinity }}
              />
              <span className="text-sm font-medium text-muted-foreground">
                {t(`status.${voiceState}`)}
              </span>
            </div>

            <AnimatePresence>
              {!apiKey && (
                <motion.button
                  onClick={() => setShowSettings(true)}
                  className="text-sm text-primary hover:text-accent transition-smooth font-medium"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  {t("button.configureApiKey")}
                </motion.button>
              )}
            </AnimatePresence>
          </div>

          {/* Microphone Button */}
          <div className="flex justify-center">
            <motion.button
              onClick={toggleRecording}
              disabled={!apiKey}
              className={`relative w-24 h-24 rounded-full flex items-center justify-center transition-smooth ${
                isActive
                  ? "bg-gradient-to-br from-primary to-accent shadow-lg shadow-primary/30"
                  : "bg-gradient-to-br from-muted to-muted-foreground/10 hover:from-primary/80 hover:to-accent/80"
              }`}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              animate={isActive ? { scale: [1, 1.05, 1] } : {}}
              transition={{ duration: 2, repeat: isActive ? Infinity : 0 }}
            >
              <Mic2 className="w-10 h-10 text-white" />

              {isActive && (
                <motion.div
                  className="absolute inset-0 rounded-full bg-gradient-to-br from-primary to-accent opacity-50"
                  animate={{ scale: [1, 1.5, 2] }}
                  transition={{ duration: 2, repeat: Infinity }}
                />
              )}
            </motion.button>
          </div>
        </motion.div>

        {/* 错误提示 */}
        <AnimatePresence>
          {errorMessage && (
            <motion.div
              className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-lg"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
            >
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0">
                  <svg
                    className="w-5 h-5 text-red-400"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <div className="flex-1">
                  <p className="text-sm text-red-200">{errorMessage}</p>
                  <p className="text-xs text-red-300/70 mt-1">
                    {errorMessage.includes("连接失败") || errorMessage.includes("重连失败")
                      ? "提示：请检查网络连接或API Key是否正确"
                      : "系统将自动尝试重连..."}
                  </p>
                </div>
                <button
                  onClick={() => setErrorMessage("")}
                  className="flex-shrink-0 text-red-300 hover:text-red-200 transition-colors"
                >
                  <svg
                    className="w-4 h-4"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                      clipRule="evenodd"
                    />
                  </svg>
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Current Conversation */}
        <AnimatePresence>
          {(currentTurn.userMessage || currentTurn.aiResponse) && (
            <motion.div
              className="card-elevated p-6 mb-6"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              {currentTurn.userMessage && !isAiResponding && (
                <div className="mb-4">
                  <p className="text-xs text-muted-foreground mb-2">
                    {t("conversation.you")}
                  </p>
                  <p className="text-base">{currentTurn.userMessage}</p>
                </div>
              )}

              {currentTurn.aiResponse && (
                <div>
                  <p className="text-xs text-muted-foreground mb-2 flex items-center gap-2">
                    <Sparkles className="w-3 h-3" />
                    {t("conversation.ai")}
                  </p>
                  <p className="text-base leading-relaxed">
                    {currentTurn.aiResponse}
                  </p>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Conversation History */}
        {conversations.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <h3 className="text-lg font-semibold mb-4 text-muted-foreground">
              {t("conversation.history")}
            </h3>
            <div className="space-y-4">
              {conversations.map((conv, index) => (
                <motion.div
                  key={conv.id}
                  className="card-elevated p-6"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.1 }}
                >
                  <div className="mb-4">
                    <p className="text-xs text-muted-foreground mb-2">
                      {t("conversation.you")} · {formatTime(conv.timestamp)}
                    </p>
                    <p className="text-base">{conv.userMessage}</p>
                  </div>

                  <div>
                    <p className="text-xs text-muted-foreground mb-2 flex items-center gap-2">
                      <Sparkles className="w-3 h-3" />
                      {t("conversation.ai")}
                    </p>
                    <p className="text-base leading-relaxed text-foreground/90">
                      {conv.aiResponse}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </div>

      {/* Settings Panel */}
      <AnimatePresence>
        {showSettings && (
          <>
            <motion.div
              className="fixed inset-0 bg-background/50 backdrop-blur-sm z-40"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowSettings(false)}
            />

            <motion.div
              className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md z-50 px-6"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.2 }}
            >
              <div className="card-elevated p-6">
                <h3 className="text-xl font-semibold mb-6">
                  {t("settings.title")}
                </h3>

                <div className="space-y-4 mb-6">
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      {t("settings.apiKey")}
                    </label>
                    <input
                      type="password"
                      value={apiKey}
                      onChange={(e) => setApiKey(e.target.value)}
                      placeholder={t("settings.apiKeyPlaceholder")}
                      className="w-full px-4 py-3 rounded-lg border border-border bg-background focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-smooth"
                    />
                    <p className="text-xs text-muted-foreground mt-2">
                      {t("settings.apiKeyHelp")}{" "}
                      <a
                        href="https://platform.stepfun.com"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary hover:text-accent transition-smooth"
                      >
                        {t("settings.apiKeyPlatform")}
                      </a>
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">
                      {t("settings.language")}
                    </label>
                    <select
                      value={language}
                      onChange={(e) => handleLanguageChange(e.target.value)}
                      className="w-full px-4 py-3 rounded-lg border border-border bg-background focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-smooth"
                    >
                      <option value="zh">中文</option>
                      <option value="en">English</option>
                    </select>
                  </div>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => setShowSettings(false)}
                    className="flex-1 px-4 py-3 rounded-lg border border-border hover:bg-muted transition-smooth font-medium"
                  >
                    {t("button.cancel")}
                  </button>
                  <button
                    onClick={() => setShowSettings(false)}
                    className="flex-1 px-4 py-3 rounded-lg bg-gradient-to-r from-primary to-accent text-white hover:shadow-lg hover:shadow-primary/30 transition-smooth font-medium"
                  >
                    {t("button.done")}
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Footer */}
      <footer className="fixed bottom-0 left-0 right-0 py-4 px-6 border-t border-border/50 bg-background/80 backdrop-blur-md">
        <div className="max-w-6xl mx-auto text-center text-sm text-muted-foreground">
          {t("footer.poweredBy")}
        </div>
      </footer>
    </main>
  );
}
