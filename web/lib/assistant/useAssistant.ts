"use client";

/**
 * useAssistant —— 全双工多模态助手核心 Hook
 *
 * 管理一次"会话"的全部状态：
 * - 语音：常开麦克风 + 服务端 VAD + 随时打断（全双工）
 * - 文字：打字提问，走同一条 Realtime 通道
 * - 图片：拍照/相册提问，走 StepFun 视觉模型
 */

import { useCallback, useEffect, useRef, useState } from "react";
import { StepFunRealtimeClient } from "@/lib/stepfun-realtime";
import { VoiceState } from "@/types/voice";
import { askImage } from "@/lib/assistant/vision";
import { ASSISTANT_INSTRUCTIONS } from "@/lib/prompts/assistant";

export type MessageKind = "voice" | "text" | "image";

export interface AssistantMessage {
  id: string;
  role: "user" | "assistant";
  kind: MessageKind;
  content: string;
  imageUrl?: string;
  timestamp: number;
}

/** v25 = step-2.5-realtime（新一代，默认）；其余为旧模型回退 */
export type ModelMode = "v25" | "auto" | "quality" | "fast";

const STORAGE_MESSAGES = "aitutor_assistant_messages";
const STORAGE_SETTINGS = "aitutor_settings";
const MAX_SAVED_MESSAGES = 60;

let messageSeq = 0;
function makeId(prefix: string) {
  messageSeq += 1;
  return `${prefix}-${Date.now()}-${messageSeq}`;
}

export function useAssistant() {
  const [voiceState, setVoiceState] = useState<VoiceState>("idle");
  const [sessionActive, setSessionActive] = useState(false);
  const [micOn, setMicOn] = useState(false);
  const [messages, setMessages] = useState<AssistantMessage[]>([]);
  const [streamingText, setStreamingText] = useState("");
  const [error, setError] = useState("");
  const [apiKey, setApiKeyState] = useState("");
  const [modelMode, setModelModeState] = useState<ModelMode>("v25");
  const [visionBusy, setVisionBusy] = useState(false);

  const clientRef = useRef<StepFunRealtimeClient | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const micOnRef = useRef(false);
  const streamingRef = useRef("");
  const levelRafRef = useRef(0);
  const micLevelRef = useRef(0);
  const errorTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const loadedRef = useRef(false);

  // ---- 持久化 ----

  useEffect(() => {
    if (loadedRef.current) return;
    loadedRef.current = true;
    try {
      const saved = localStorage.getItem(STORAGE_MESSAGES);
      if (saved) setMessages(JSON.parse(saved).messages ?? []);
      const settings = JSON.parse(localStorage.getItem(STORAGE_SETTINGS) ?? "{}");
      if (settings.apiKey) setApiKeyState(settings.apiKey);
      if (settings.modelMode) setModelModeState(settings.modelMode);
    } catch {
      /* 本地数据损坏时静默重置 */
    }
  }, []);

  const persistMessages = useCallback((list: AssistantMessage[]) => {
    try {
      localStorage.setItem(
        STORAGE_MESSAGES,
        JSON.stringify({ messages: list.slice(-MAX_SAVED_MESSAGES), savedAt: Date.now() })
      );
    } catch {
      /* 存储已满时忽略 */
    }
  }, []);

  const persistSettings = useCallback((key: string, mode: ModelMode) => {
    try {
      const prev = JSON.parse(localStorage.getItem(STORAGE_SETTINGS) ?? "{}");
      localStorage.setItem(
        STORAGE_SETTINGS,
        JSON.stringify({ ...prev, apiKey: key, modelMode: mode })
      );
    } catch {
      /* 忽略 */
    }
  }, []);

  const setApiKey = useCallback(
    (key: string) => {
      setApiKeyState(key);
      persistSettings(key, modelMode);
    },
    [modelMode, persistSettings]
  );

  const setModelMode = useCallback(
    (mode: ModelMode) => {
      setModelModeState(mode);
      persistSettings(apiKey, mode);
      // 空闲（未开麦）时断开旧连接，让新模型立即生效；对话中则下次会话生效
      if (!micOnRef.current && clientRef.current) {
        clientRef.current.disconnect();
        clientRef.current = null;
        setSessionActive(false);
        setVoiceState("idle");
      }
    },
    [apiKey, persistSettings]
  );

  // ---- 消息 ----

  const appendMessage = useCallback(
    (msg: AssistantMessage) => {
      setMessages((prev) => {
        const next = [...prev, msg];
        persistMessages(next);
        return next;
      });
    },
    [persistMessages]
  );

  const clearMessages = useCallback(() => {
    setMessages([]);
    setStreamingText("");
    streamingRef.current = "";
    try {
      localStorage.removeItem(STORAGE_MESSAGES);
    } catch {
      /* 忽略 */
    }
  }, []);

  const showError = useCallback((msg: string) => {
    setError(msg);
    if (errorTimerRef.current) clearTimeout(errorTimerRef.current);
    errorTimerRef.current = setTimeout(() => setError(""), 5000);
  }, []);

  // AI 一轮回复结束：把流式文本落为正式消息
  const finalizeStreaming = useCallback(
    (kind: MessageKind = "voice") => {
      const text = streamingRef.current.trim();
      streamingRef.current = "";
      setStreamingText("");
      if (text) {
        appendMessage({
          id: makeId("ai"),
          role: "assistant",
          kind,
          content: text,
          timestamp: Date.now(),
        });
      }
    },
    [appendMessage]
  );

  // ---- 连接 ----

  const ensureClient = useCallback(async (): Promise<StepFunRealtimeClient | null> => {
    if (clientRef.current?.isConnected()) return clientRef.current;
    if (!apiKey) {
      showError("请先在设置中填写 StepFun API Key");
      return null;
    }

    setVoiceState("connecting");

    const preferredModel =
      modelMode === "v25"
        ? ("step-2.5-realtime" as const)
        : modelMode === "quality"
          ? ("step-audio-2" as const)
          : modelMode === "fast"
            ? ("step-audio-2-mini" as const)
            : undefined;

    const client = new StepFunRealtimeClient({
      apiKey,
      // 音色按模型区分：2.5 与旧模型音色库不同（linjiajiejie 为 2.5 官方文档示例音色）
      // 若音色不兼容，客户端会自动降级为服务端默认音色重试
      voice: modelMode === "v25" ? "linjiajiejie" : "qingchunshaonv",
      instructions: ASSISTANT_INSTRUCTIONS,
      enableModelSelection: modelMode === "auto",
      preferredModel,
    });

    try {
      await client.connect(
        (state) => {
          setVoiceState((prev) => {
            // 打断或回到待命 = 这一轮回复结束
            if ((state === "idle" || state === "listening") && prev === "speaking") {
              finalizeStreaming();
            }
            return state;
          });
        },
        (delta) => {
          streamingRef.current += delta;
          setStreamingText(streamingRef.current);
        },
        async (audio) => {
          await client.playAudio(audio);
        },
        (err) => showError(err),
        (userText) => {
          if (userText.trim()) {
            appendMessage({
              id: makeId("user"),
              role: "user",
              kind: "voice",
              content: userText.trim(),
              timestamp: Date.now(),
            });
          }
        }
      );
    } catch (e) {
      console.error("connect failed:", e);
      setVoiceState("idle");
      showError("连接失败，请检查网络或 API Key");
      return null;
    }

    clientRef.current = client;
    setSessionActive(true);
    setVoiceState("idle");
    return client;
  }, [apiKey, modelMode, appendMessage, finalizeStreaming, showError]);

  // ---- 麦克风（全双工：会话期间常开，AI 说话时也在听） ----

  const stopMic = useCallback(() => {
    micOnRef.current = false;
    setMicOn(false);
    cancelAnimationFrame(levelRafRef.current);
    micLevelRef.current = 0;

    processorRef.current?.disconnect();
    processorRef.current = null;
    analyserRef.current = null;

    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
  }, []);

  const startMic = useCallback(async () => {
    const client = await ensureClient();
    if (!client) return;

    try {
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

      const source = audioContext.createMediaStreamSource(stream);
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 256;
      analyserRef.current = analyser;
      source.connect(analyser);

      const processor = audioContext.createScriptProcessor(4096, 1, 1);
      processorRef.current = processor;
      processor.onaudioprocess = (e) => {
        if (clientRef.current && micOnRef.current) {
          clientRef.current.sendAudio(e.inputBuffer.getChannelData(0));
        }
      };
      analyser.connect(processor);
      processor.connect(audioContext.destination);

      // 音量驱动语音球（写 ref，由 UI 用 rAF 读取，避免高频 setState）
      const levelData = new Uint8Array(analyser.frequencyBinCount);
      const tick = () => {
        if (!analyserRef.current) return;
        analyserRef.current.getByteFrequencyData(levelData);
        let sum = 0;
        for (let i = 0; i < levelData.length; i++) sum += levelData[i];
        micLevelRef.current = Math.min(1, sum / levelData.length / 96);
        levelRafRef.current = requestAnimationFrame(tick);
      };
      levelRafRef.current = requestAnimationFrame(tick);

      micOnRef.current = true;
      setMicOn(true);
    } catch (e) {
      console.error("mic failed:", e);
      showError("无法访问麦克风，请检查权限设置");
    }
  }, [ensureClient, showError]);

  const toggleMic = useCallback(async () => {
    if (micOnRef.current) {
      stopMic();
      clientRef.current?.stopPlayback();
      setVoiceState("idle");
    } else {
      await startMic();
    }
  }, [startMic, stopMic]);

  // ---- 文字提问 ----

  const sendText = useCallback(
    async (text: string) => {
      const trimmed = text.trim();
      if (!trimmed) return;
      const client = await ensureClient();
      if (!client) return;

      appendMessage({
        id: makeId("user"),
        role: "user",
        kind: "text",
        content: trimmed,
        timestamp: Date.now(),
      });
      setVoiceState("thinking");
      client.sendText(trimmed);
    },
    [ensureClient, appendMessage]
  );

  // ---- 图片提问 ----

  const sendImage = useCallback(
    async (dataUrl: string, question: string) => {
      if (!apiKey) {
        showError("请先在设置中填写 StepFun API Key");
        return;
      }
      const prompt = question.trim() || "请描述这张图片，并指出最值得注意的信息。";

      appendMessage({
        id: makeId("user"),
        role: "user",
        kind: "image",
        content: prompt,
        imageUrl: dataUrl,
        timestamp: Date.now(),
      });

      setVisionBusy(true);
      try {
        const answer = await askImage(apiKey, dataUrl, prompt);
        appendMessage({
          id: makeId("ai"),
          role: "assistant",
          kind: "image",
          content: answer,
          timestamp: Date.now(),
        });
      } catch (e) {
        console.error("vision failed:", e);
        showError("图片解析失败，请重试");
      } finally {
        setVisionBusy(false);
      }
    },
    [apiKey, appendMessage, showError]
  );

  // ---- 打断 ----

  const interrupt = useCallback(() => {
    if (clientRef.current && (voiceState === "speaking" || voiceState === "thinking")) {
      clientRef.current.interrupt();
      finalizeStreaming();
      setVoiceState(micOnRef.current ? "listening" : "idle");
    }
  }, [voiceState, finalizeStreaming]);

  // ---- 清理 ----

  useEffect(() => {
    return () => {
      stopMic();
      clientRef.current?.disconnect();
      clientRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return {
    voiceState,
    sessionActive,
    micOn,
    micLevelRef,
    messages,
    streamingText,
    error,
    visionBusy,
    apiKey,
    modelMode,
    setApiKey,
    setModelMode,
    toggleMic,
    sendText,
    sendImage,
    interrupt,
    clearMessages,
  };
}
