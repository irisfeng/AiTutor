'use client';

import { motion } from 'framer-motion';
import { Mic, MicOff } from 'lucide-react';
import { VoiceState } from '@/types/voice';

interface MicrophoneButtonProps {
  state: VoiceState;
  isActive: boolean;
  onClick: () => void;
  disabled?: boolean;
}

const stateConfig = {
  idle: {
    color: 'from-gray-700 to-gray-800',
    glow: 'hover:shadow-gray-500/20',
    scale: 1,
  },
  connecting: {
    color: 'from-yellow-600 to-orange-700',
    glow: 'shadow-yellow-500/30',
    scale: 1.05,
  },
  listening: {
    color: 'from-cyan-500 to-blue-600',
    glow: 'glow-cyan shadow-cyan-500/50',
    scale: 1.1,
  },
  thinking: {
    color: 'from-purple-500 to-aurora-700',
    glow: 'glow-aurora shadow-aurora-500/50',
    scale: 1.05,
  },
  speaking: {
    color: 'from-green-500 to-emerald-600',
    glow: 'shadow-green-500/40',
    scale: 1.08,
  },
};

export default function MicrophoneButton({
  state,
  isActive,
  onClick,
  disabled = false,
}: MicrophoneButtonProps) {
  const config = stateConfig[state];

  return (
    <div className="relative flex items-center justify-center">
      {/* Ripple Effect */}
      {(state === 'listening' || state === 'speaking') && (
        <>
          <motion.div
            className="absolute inset-0 rounded-full bg-gradient-to-r opacity-20"
            style={{
              background: state === 'listening'
                ? 'linear-gradient(135deg, #00f5ff, #3b82f6)'
                : 'linear-gradient(135deg, #22c55e, #10b981)',
            }}
            animate={{
              scale: [1, 2, 2.5],
              opacity: [0.5, 0.2, 0],
            }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
              ease: 'easeOut',
            }}
          />
          <motion.div
            className="absolute inset-0 rounded-full bg-gradient-to-r opacity-20"
            style={{
              background: state === 'listening'
                ? 'linear-gradient(135deg, #00f5ff, #3b82f6)'
                : 'linear-gradient(135deg, #22c55e, #10b981)',
            }}
            animate={{
              scale: [1, 2, 2.5],
              opacity: [0.5, 0.2, 0],
            }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
              ease: 'easeOut',
              delay: 0.5,
            }}
          />
        </>
      )}

      {/* Main Button */}
      <motion.button
        onClick={onClick}
        disabled={disabled}
        className={`
          relative z-10 w-32 h-32 md:w-40 md:h-40 rounded-full
          bg-gradient-to-br ${config.color}
          flex items-center justify-center
          transition-all duration-500
          ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
          ${config.glow}
        `}
        animate={{
          scale: isActive ? config.scale : 1,
        }}
        whileHover={disabled ? {} : { scale: config.scale + 0.05 }}
        whileTap={disabled ? {} : { scale: config.scale - 0.05 }}
        transition={{
          type: 'spring',
          stiffness: 300,
          damping: 20,
        }}
        aria-label={isActive ? 'Stop recording' : 'Start recording'}
      >
        <motion.div
          animate={{
            rotate: state === 'thinking' ? 360 : 0,
          }}
          transition={{
            duration: 2,
            repeat: state === 'thinking' ? Infinity : 0,
            ease: 'linear',
          }}
        >
          {isActive ? (
            <Mic className="w-12 h-12 md:w-16 md:h-16 text-white" strokeWidth={2.5} />
          ) : (
            <MicOff className="w-12 h-12 md:w-16 md:h-16 text-gray-400" strokeWidth={2} />
          )}
        </motion.div>

        {/* Pulse Ring for Active States */}
        {(state === 'listening' || state === 'speaking') && (
          <motion.div
            className="absolute inset-0 rounded-full border-2 border-white/30"
            animate={{
              scale: [1, 1.1, 1],
              opacity: [1, 0.5, 1],
            }}
            transition={{
              duration: 1,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          />
        )}
      </motion.button>
    </div>
  );
}
