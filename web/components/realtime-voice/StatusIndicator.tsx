'use client';

import { motion } from 'framer-motion';
import { VoiceState } from '@/types/voice';

interface StatusIndicatorProps {
  state: VoiceState;
}

const statusConfig = {
  idle: {
    text: '点击麦克风开始对话',
    color: 'text-gray-500',
    icon: '●',
  },
  connecting: {
    text: '正在连接...',
    color: 'text-yellow-500',
    icon: '◐',
  },
  listening: {
    text: '聆听中...',
    color: 'text-cyan-glow text-glow-cyan',
    icon: '◉',
  },
  thinking: {
    text: '思考中...',
    color: 'text-aurora text-glow-aurora',
    icon: '◎',
  },
  speaking: {
    text: 'AI 正在说话',
    color: 'text-green-400',
    icon: '♦',
  },
};

export default function StatusIndicator({ state }: StatusIndicatorProps) {
  const config = statusConfig[state];

  return (
    <motion.div
      className="flex flex-col items-center gap-3"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <motion.div
        className={`
          text-4xl font-display font-bold tracking-wider
          ${config.color}
        `}
        animate={
          state === 'thinking' || state === 'connecting'
            ? {
                opacity: [1, 0.5, 1],
              }
            : {}
        }
        transition={
          state === 'thinking' || state === 'connecting'
            ? {
                duration: 1.5,
                repeat: Infinity,
                ease: 'easeInOut',
              }
            : {}
        }
      >
        {config.icon}
      </motion.div>

      <motion.p
        className={`
          text-lg font-body font-light tracking-wide
          ${config.color}
        `}
        animate={
          state === 'thinking' || state === 'connecting'
            ? {
                opacity: [1, 0.6, 1],
              }
            : {}
        }
        transition={
          state === 'thinking' || state === 'connecting'
            ? {
                duration: 1.5,
                repeat: Infinity,
                ease: 'easeInOut',
              }
            : {}
        }
      >
        {config.text}
      </motion.p>
    </motion.div>
  );
}
