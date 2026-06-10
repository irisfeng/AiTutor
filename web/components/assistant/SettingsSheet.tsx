"use client";

/**
 * SettingsSheet —— 底部抽屉式设置
 * 只保留必要项：API Key、模型模式、清除记录
 */

import { motion, AnimatePresence } from "framer-motion";
import { Trash2, X } from "lucide-react";
import { ModelMode } from "@/lib/assistant/useAssistant";

interface SettingsSheetProps {
  open: boolean;
  apiKey: string;
  modelMode: ModelMode;
  onClose: () => void;
  onApiKeyChange: (key: string) => void;
  onModelModeChange: (mode: ModelMode) => void;
  onClearMessages: () => void;
}

const MODES: { id: ModelMode; label: string; hint: string }[] = [
  { id: "v25", label: "2.5 新模型", hint: "情绪感知（推荐）" },
  { id: "auto", label: "自动", hint: "旧模型智能调度" },
  { id: "quality", label: "高质量", hint: "step-audio-2" },
  { id: "fast", label: "快速", hint: "audio-2-mini" },
];

export function SettingsSheet({
  open,
  apiKey,
  modelMode,
  onClose,
  onApiKeyChange,
  onModelModeChange,
  onClearMessages,
}: SettingsSheetProps) {
  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.div
            className="fixed bottom-0 left-0 right-0 z-50 rounded-t-3xl bg-[hsl(var(--ink-raised))] border-t border-white/[0.07] px-6 pt-3 pb-[calc(env(safe-area-inset-bottom)+24px)]"
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 32, stiffness: 360 }}
          >
            {/* 抽屉把手 */}
            <div className="w-10 h-1 rounded-full bg-white/15 mx-auto mb-5" />

            <div className="max-w-md mx-auto space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-medium text-[hsl(var(--ink-bright))]">设置</h2>
                <button
                  onClick={onClose}
                  aria-label="关闭设置"
                  className="w-8 h-8 rounded-full flex items-center justify-center text-[hsl(var(--ink-soft))] hover:bg-white/[0.06] transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* API Key */}
              <div className="space-y-2">
                <label className="text-xs tracking-wider text-[hsl(var(--ink-soft))]">
                  STEPFUN API KEY
                </label>
                <input
                  type="password"
                  value={apiKey}
                  onChange={(e) => onApiKeyChange(e.target.value)}
                  placeholder="sk-…"
                  className="w-full px-4 py-3 rounded-xl bg-black/30 border border-white/[0.08] text-[15px] text-[hsl(var(--ink-bright))] placeholder:text-[hsl(var(--ink-soft))]/50 outline-none focus:border-[hsl(var(--ember))]/50 transition-colors"
                />
                <p className="text-[11px] text-[hsl(var(--ink-soft))]/70">
                  在{" "}
                  <a
                    href="https://platform.stepfun.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[hsl(var(--ember))] underline-offset-2 hover:underline"
                  >
                    StepFun 平台
                  </a>{" "}
                  获取，仅保存在本机
                </p>
              </div>

              {/* 模型模式 */}
              <div className="space-y-2">
                <label className="text-xs tracking-wider text-[hsl(var(--ink-soft))]">
                  对话模型
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {MODES.map((mode) => (
                    <button
                      key={mode.id}
                      onClick={() => onModelModeChange(mode.id)}
                      className={`px-3 py-2.5 rounded-xl text-center transition-all border ${
                        modelMode === mode.id
                          ? "bg-[hsl(var(--ember))]/[0.14] border-[hsl(var(--ember))]/40 text-[hsl(var(--ember-bright))]"
                          : "bg-black/20 border-white/[0.06] text-[hsl(var(--ink-soft))] hover:border-white/15"
                      }`}
                    >
                      <span className="block text-sm font-medium">{mode.label}</span>
                      <span className="block text-[10px] mt-0.5 opacity-70">{mode.hint}</span>
                    </button>
                  ))}
                </div>
                <p className="text-[11px] text-[hsl(var(--ink-soft))]/70">
                  空闲时切换立即生效；对话中切换将在下次会话生效
                </p>
              </div>

              {/* 清除记录 */}
              <button
                onClick={() => {
                  if (window.confirm("确定清除全部对话记录吗？此操作不可恢复。")) {
                    onClearMessages();
                    onClose();
                  }
                }}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl border border-red-400/20 text-red-300/90 text-sm hover:bg-red-400/[0.06] transition-colors"
              >
                <Trash2 className="w-4 h-4" />
                清除对话记录
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
