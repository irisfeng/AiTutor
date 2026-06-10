"use client";

/**
 * 首页 —— 移动端全双工多模态 AI 助手
 *
 * 单屏产品：语音球是唯一主角。
 * 说话即对话，AI 回答时开口即打断（全双工）；
 * 底部输入坞支持文字与图片提问（多模态）。
 */

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { SlidersHorizontal } from "lucide-react";
import { useAssistant } from "@/lib/assistant/useAssistant";
import { VoiceOrb } from "@/components/assistant/VoiceOrb";
import { MessageStream } from "@/components/assistant/MessageStream";
import { InputDock } from "@/components/assistant/InputDock";
import { SettingsSheet } from "@/components/assistant/SettingsSheet";

export default function AssistantPage() {
  const assistant = useAssistant();
  const [showSettings, setShowSettings] = useState(false);

  const hasConversation =
    assistant.messages.length > 0 || !!assistant.streamingText || assistant.visionBusy;

  return (
    <main className="theme-ink relative h-[100dvh] flex flex-col overflow-hidden bg-[hsl(var(--ink))] text-[hsl(var(--ink-bright))]">
      {/* 氛围底色：暗部渐晕 + 颗粒 */}
      <div className="absolute inset-0 ink-vignette pointer-events-none" />
      <div className="absolute inset-0 ink-grain pointer-events-none" />

      {/* 顶栏 */}
      <header className="relative z-10 flex-shrink-0 flex items-center justify-between px-5 pt-[calc(env(safe-area-inset-top)+14px)] pb-3">
        <div className="flex items-center gap-2.5">
          <span className="font-display text-lg tracking-tight text-[hsl(var(--ink-bright))]">
            Ai<span className="text-[hsl(var(--ember))]">Tutor</span>
          </span>
          <span
            className={`w-1.5 h-1.5 rounded-full transition-colors duration-500 ${
              assistant.sessionActive
                ? "bg-[hsl(var(--ember))] shadow-[0_0_8px_hsl(var(--ember))]"
                : "bg-white/20"
            }`}
            aria-label={assistant.sessionActive ? "已连接" : "未连接"}
          />
        </div>
        <button
          onClick={() => setShowSettings(true)}
          aria-label="打开设置"
          className="w-9 h-9 rounded-full flex items-center justify-center text-[hsl(var(--ink-soft))] hover:text-[hsl(var(--ember))] hover:bg-white/[0.05] active:scale-90 transition-all"
        >
          <SlidersHorizontal className="w-[18px] h-[18px]" strokeWidth={1.75} />
        </button>
      </header>

      {/* 错误提示 */}
      <AnimatePresence>
        {assistant.error && (
          <motion.div
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            className="relative z-10 mx-auto px-4 py-2 rounded-full bg-red-400/[0.12] border border-red-400/25 text-red-200/90 text-xs"
          >
            {assistant.error}
          </motion.div>
        )}
      </AnimatePresence>

      {/* 主区：语音球 + 对话流 */}
      <div className="relative z-10 flex-1 min-h-0 flex flex-col overflow-y-auto">
        <motion.div
          layout
          transition={{ duration: 0.6, ease: [0.32, 0.72, 0, 1] }}
          className={`flex-shrink-0 flex flex-col items-center justify-center ${
            hasConversation ? "pt-4 pb-6 scale-[0.62] origin-top" : "flex-1"
          }`}
          onClick={assistant.voiceState === "speaking" ? assistant.interrupt : undefined}
        >
          <VoiceOrb
            state={assistant.voiceState}
            micOn={assistant.micOn}
            micLevelRef={assistant.micLevelRef}
            onTap={assistant.toggleMic}
          />
        </motion.div>

        {!hasConversation && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5, duration: 0.8 }}
            className="flex-shrink-0 text-center text-xs text-[hsl(var(--ink-soft))]/55 pb-8 px-10 leading-relaxed"
          >
            随时开口、打字或拍照提问
            <br />
            AI 回答时直接说话即可打断
          </motion.p>
        )}

        <MessageStream
          messages={assistant.messages}
          streamingText={assistant.streamingText}
          visionBusy={assistant.visionBusy}
        />
      </div>

      {/* 底部输入坞 */}
      <div className="relative z-10 flex-shrink-0">
        <InputDock
          micOn={assistant.micOn}
          visionBusy={assistant.visionBusy}
          onToggleMic={assistant.toggleMic}
          onSendText={assistant.sendText}
          onSendImage={assistant.sendImage}
        />
      </div>

      {/* 设置抽屉 */}
      <SettingsSheet
        open={showSettings}
        apiKey={assistant.apiKey}
        modelMode={assistant.modelMode}
        onClose={() => setShowSettings(false)}
        onApiKeyChange={assistant.setApiKey}
        onModelModeChange={assistant.setModelMode}
        onClearMessages={assistant.clearMessages}
      />
    </main>
  );
}
