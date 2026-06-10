"use client";

/**
 * InputDock —— 底部输入坞
 * 一条胶囊：图片 / 文字 / 麦克风，三种模态一次到位
 */

import { useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ImagePlus, ArrowUp, Mic, MicOff, X } from "lucide-react";
import { fileToDataUrl } from "@/lib/assistant/vision";

interface InputDockProps {
  micOn: boolean;
  visionBusy: boolean;
  onToggleMic: () => void;
  onSendText: (text: string) => void;
  onSendImage: (dataUrl: string, question: string) => void;
}

export function InputDock({
  micOn,
  visionBusy,
  onToggleMic,
  onSendText,
  onSendImage,
}: InputDockProps) {
  const [text, setText] = useState("");
  const [pendingImage, setPendingImage] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleSend = () => {
    const value = text.trim();
    if (pendingImage) {
      onSendImage(pendingImage, value);
      setPendingImage(null);
      setText("");
      return;
    }
    if (!value) return;
    onSendText(value);
    setText("");
  };

  const handleFile = async (file: File | undefined) => {
    if (!file) return;
    try {
      const dataUrl = await fileToDataUrl(file);
      setPendingImage(dataUrl);
      inputRef.current?.focus();
    } catch (e) {
      console.error("image read failed:", e);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto px-4 pb-[calc(env(safe-area-inset-bottom)+16px)] pt-2">
      {/* 待发送图片预览 */}
      <AnimatePresence>
        {pendingImage && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.96 }}
            className="relative inline-block mb-2 ml-1"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={pendingImage}
              alt="待发送的图片"
              className="h-20 rounded-xl border border-[hsl(var(--ink-line))] shadow-lg shadow-black/40"
            />
            <button
              onClick={() => setPendingImage(null)}
              aria-label="移除图片"
              className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-[hsl(var(--ink-raised))] border border-[hsl(var(--ink-line))] flex items-center justify-center text-[hsl(var(--ink-soft))] active:scale-90 transition-transform"
            >
              <X className="w-3 h-3" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex items-center gap-2 px-2 py-2 rounded-full bg-white/[0.055] border border-white/[0.07] backdrop-blur-xl shadow-[0_8px_32px_rgba(0,0,0,0.45)]">
        {/* 图片 */}
        <button
          onClick={() => fileRef.current?.click()}
          disabled={visionBusy}
          aria-label="添加图片"
          className="flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center text-[hsl(var(--ink-soft))] active:scale-90 transition-all hover:text-[hsl(var(--ember))] disabled:opacity-40"
        >
          <ImagePlus className="w-5 h-5" strokeWidth={1.75} />
        </button>
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            handleFile(e.target.files?.[0]);
            e.target.value = "";
          }}
        />

        {/* 文字 */}
        <input
          ref={inputRef}
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.nativeEvent.isComposing) handleSend();
          }}
          placeholder={pendingImage ? "想问这张图什么？" : "说话，或在这里输入…"}
          className="flex-1 min-w-0 bg-transparent text-[15px] text-[hsl(var(--ink-bright))] placeholder:text-[hsl(var(--ink-soft))]/55 outline-none px-1"
        />

        {/* 发送 / 麦克风 */}
        <AnimatePresence mode="popLayout" initial={false}>
          {text.trim() || pendingImage ? (
            <motion.button
              key="send"
              initial={{ scale: 0.6, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.6, opacity: 0 }}
              transition={{ duration: 0.18 }}
              onClick={handleSend}
              aria-label="发送"
              className="flex-shrink-0 w-10 h-10 rounded-full bg-[hsl(var(--ember))] text-[hsl(var(--ink))] flex items-center justify-center active:scale-90 transition-transform shadow-lg shadow-[hsl(var(--ember))]/25"
            >
              <ArrowUp className="w-5 h-5" strokeWidth={2.25} />
            </motion.button>
          ) : (
            <motion.button
              key="mic"
              initial={{ scale: 0.6, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.6, opacity: 0 }}
              transition={{ duration: 0.18 }}
              onClick={onToggleMic}
              aria-label={micOn ? "关闭麦克风" : "开启麦克风"}
              className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center active:scale-90 transition-all ${
                micOn
                  ? "bg-[hsl(var(--ember))] text-[hsl(var(--ink))] shadow-lg shadow-[hsl(var(--ember))]/25"
                  : "text-[hsl(var(--ink-soft))] hover:text-[hsl(var(--ember))]"
              }`}
            >
              {micOn ? (
                <Mic className="w-5 h-5" strokeWidth={2} />
              ) : (
                <MicOff className="w-5 h-5" strokeWidth={1.75} />
              )}
            </motion.button>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
