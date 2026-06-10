"use client";

/**
 * MessageStream —— 对话流
 * 极简字幕式排版：用户右侧琥珀，AI 左侧墨色，流式回复带光标
 */

import { useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AssistantMessage } from "@/lib/assistant/useAssistant";

interface MessageStreamProps {
  messages: AssistantMessage[];
  streamingText: string;
  visionBusy: boolean;
}

function formatTime(timestamp: number) {
  return new Date(timestamp).toLocaleTimeString("zh-CN", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function MessageStream({ messages, streamingText, visionBusy }: MessageStreamProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages.length, streamingText, visionBusy]);

  if (messages.length === 0 && !streamingText && !visionBusy) return null;

  return (
    <div className="w-full max-w-md mx-auto px-5 pb-4 space-y-4">
      <AnimatePresence initial={false}>
        {messages.map((msg) => (
          <motion.div
            key={msg.id}
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, ease: [0.32, 0.72, 0, 1] }}
            className={`flex flex-col gap-1.5 ${
              msg.role === "user" ? "items-end" : "items-start"
            }`}
          >
            {msg.imageUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={msg.imageUrl}
                alt="用户上传的图片"
                className="max-w-[70%] rounded-2xl rounded-br-md border border-[hsl(var(--ink-line))] shadow-lg shadow-black/30"
              />
            )}
            <div
              className={`max-w-[85%] px-4 py-3 text-[15px] leading-relaxed rounded-2xl ${
                msg.role === "user"
                  ? "bg-[hsl(var(--ember))]/[0.14] text-[hsl(var(--ember-bright))] rounded-br-md"
                  : "bg-white/[0.045] text-[hsl(var(--ink-bright))] rounded-bl-md border border-white/[0.05]"
              }`}
            >
              {msg.content}
            </div>
            <span className="text-[10px] tracking-wider text-[hsl(var(--ink-soft))]/60 px-1">
              {msg.role === "user" ? "你" : "助手"} · {formatTime(msg.timestamp)}
            </span>
          </motion.div>
        ))}
      </AnimatePresence>

      {/* AI 流式回复 */}
      {streamingText && (
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-start gap-1.5"
        >
          <div className="max-w-[85%] px-4 py-3 text-[15px] leading-relaxed rounded-2xl rounded-bl-md bg-white/[0.045] text-[hsl(var(--ink-bright))] border border-white/[0.05]">
            {streamingText}
            <span className="inline-block w-[2px] h-[1em] ml-0.5 align-middle bg-[hsl(var(--ember))] animate-pulse" />
          </div>
        </motion.div>
      )}

      {/* 图片解析中 */}
      {visionBusy && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex items-center gap-2 text-xs text-[hsl(var(--ink-soft))]"
        >
          <span className="w-1.5 h-1.5 rounded-full bg-[hsl(var(--ember))] animate-pulse" />
          正在看图…
        </motion.div>
      )}

      <div ref={bottomRef} />
    </div>
  );
}
