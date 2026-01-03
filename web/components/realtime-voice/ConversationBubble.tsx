'use client';

import { motion } from 'framer-motion';
import { ConversationRole } from '@/types/voice';

interface ConversationBubbleProps {
  role: ConversationRole;
  content: string;
  timestamp: number;
  delay?: number;
}

export default function ConversationBubble({ role, content, timestamp, delay = 0 }: ConversationBubbleProps) {
  const isUser = role === 'user';

  const formatTime = (ts: number) => {
    const date = new Date(ts);
    return date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  };

  return (
    <motion.div
      className={`flex w-full ${isUser ? 'justify-end' : 'justify-start'}`}
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{
        type: 'spring',
        stiffness: 300,
        damping: 24,
        delay,
      }}
      whileHover={{ scale: 1.02 }}
    >
      <div className={`flex flex-col ${isUser ? 'items-end' : 'items-start'} max-w-[80%]`}>
        {/* Message Bubble */}
        <motion.div
          className={`relative px-5 py-3 rounded-2xl backdrop-blur-sm border ${
            isUser
              ? 'bg-gradient-to-br from-cyan-500/15 to-blue-500/15 border-cyan-500/30'
              : 'bg-gradient-to-br from-aurora-500/15 to-purple-500/15 border-aurora-500/30'
          }`}
          style={{
            boxShadow: isUser
              ? '0 4px 20px rgba(34, 211, 238, 0.15)'
              : '0 4px 20px rgba(168, 85, 247, 0.15)',
          }}
          whileHover={{
            boxShadow: isUser
              ? '0 6px 30px rgba(34, 211, 238, 0.25)'
              : '0 6px 30px rgba(168, 85, 247, 0.25)',
          }}
          transition={{ duration: 0.2 }}
        >
          {/* Decorative glow */}
          <div
            className={`absolute inset-0 rounded-2xl opacity-0 transition-opacity duration-300 ${
              isUser ? 'hover:opacity-100' : 'hover:opacity-100'
            }`}
            style={{
              background: isUser
                ? 'radial-gradient(circle at center, rgba(34, 211, 238, 0.1), transparent 70%)'
                : 'radial-gradient(circle at center, rgba(168, 85, 247, 0.1), transparent 70%)',
            }}
          />

          {/* Content */}
          <p className="relative text-stardust text-sm md:text-base leading-relaxed whitespace-pre-wrap break-words">
            {content}
          </p>

          {/* Timestamp indicator */}
          <motion.div
            className={`absolute -bottom-1 ${isUser ? '-left-8' : '-right-8'} w-6 h-6 flex items-center justify-center`}
            initial={{ opacity: 0, scale: 0 }}
            whileHover={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.2 }}
          >
            <div className="relative group">
              {/* Dot */}
              <div
                className={`w-1.5 h-1.5 rounded-full ${
                  isUser ? 'bg-cyan-400' : 'bg-aurora-400'
                }`}
              />
              {/* Time tooltip */}
              <div
                className={`absolute bottom-full mb-2 ${
                  isUser ? 'right-0' : 'left-0'
                } px-2 py-1 bg-nebula/90 backdrop-blur-md rounded text-xs text-gray-400 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity`}
              >
                {formatTime(timestamp)}
              </div>
            </div>
          </motion.div>
        </motion.div>

        {/* Role label (visible on larger screens) */}
        <motion.span
          className={`mt-1.5 text-xs text-gray-500 font-light hidden md:block ${
            isUser ? 'mr-2' : 'ml-2'
          }`}
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.6 }}
          transition={{ delay: delay + 0.2, duration: 0.3 }}
        >
          {isUser ? '你' : 'AI'}
        </motion.span>
      </div>
    </motion.div>
  );
}
