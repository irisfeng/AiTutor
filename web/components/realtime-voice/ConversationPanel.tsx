'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useEffect, useRef } from 'react';
import ConversationBubble from './ConversationBubble';
import { ConversationTurn } from '@/types/voice';

interface ConversationPanelProps {
  conversations: ConversationTurn[];
}

export default function ConversationPanel({ conversations }: ConversationPanelProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  // 自动滚动到底部
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [conversations]);

  // 将所有消息转换为扁平列表
  const allMessages = conversations.flatMap((conv, convIndex) => [
    ...(conv.userMessage
      ? [
          {
            role: 'user' as const,
            content: conv.userMessage,
            timestamp: conv.timestamp,
            index: convIndex * 2,
          },
        ]
      : []),
    ...(conv.aiResponse
      ? [
          {
            role: 'assistant' as const,
            content: conv.aiResponse,
            timestamp: conv.timestamp + 1, // AI 回复稍晚
            index: convIndex * 2 + 1,
          },
        ]
      : []),
  ]);

  return (
    <motion.div
      className="w-full max-w-4xl mx-auto"
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      exit={{ opacity: 0, height: 0 }}
      transition={{ duration: 0.4, ease: 'easeInOut' }}
    >
      {/* Header */}
      <motion.div
        className="flex items-center justify-between mb-4 px-2"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <h3 className="text-lg font-display font-semibold text-stardust">对话历史</h3>
        <motion.span
          className="text-xs text-gray-500 bg-nebula/50 px-3 py-1 rounded-full border border-white/10"
          initial={{ scale: 0.8 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2 }}
        >
          {allMessages.length} 条消息
        </motion.span>
      </motion.div>

      {/* Conversation List */}
      <div
        ref={scrollRef}
        className="space-y-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar pb-4"
        style={{
          scrollbarWidth: 'thin',
          scrollbarColor: 'rgba(168, 85, 247, 0.3) transparent',
        }}
      >
        <AnimatePresence mode="popLayout">
          {allMessages.length === 0 ? (
            /* Empty State */
            <motion.div
              className="flex flex-col items-center justify-center py-16 text-center"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <motion.div
                className="w-20 h-20 rounded-full bg-nebula/20 flex items-center justify-center mb-4"
                animate={{
                  scale: [1, 1.1, 1],
                  opacity: [0.3, 0.5, 0.3],
                }}
                transition={{
                  duration: 3,
                  repeat: Infinity,
                  ease: 'easeInOut',
                }}
              >
                <svg
                  className="w-8 h-8 text-aurora-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                  />
                </svg>
              </motion.div>
              <p className="text-stardust text-lg mb-2">开始你的第一次对话</p>
              <p className="text-gray-500 text-sm">点击麦克风按钮，开始与 AI 交流</p>
            </motion.div>
          ) : (
            /* Messages */
            allMessages.map((msg, idx) => (
              <ConversationBubble
                key={`${msg.role}-${msg.timestamp}-${idx}`}
                role={msg.role}
                content={msg.content}
                timestamp={msg.timestamp}
                delay={idx * 0.05}
              />
            ))
          )}
        </AnimatePresence>
      </div>

      {/* Gradient fade at bottom */}
      <div className="relative h-4">
        <div className="absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-deep-space to-transparent pointer-events-none" />
      </div>
    </motion.div>
  );
}
