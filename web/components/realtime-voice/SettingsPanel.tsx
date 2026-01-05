'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { Settings, X } from 'lucide-react';
import { useState } from 'react';

interface SettingsPanelProps {
  apiKey: string;
  onApiKeyChange: (key: string) => void;
  language: string;
  onLanguageChange: (lang: string) => void;
}

export default function SettingsPanel({
  apiKey,
  onApiKeyChange,
  language,
  onLanguageChange,
}: SettingsPanelProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {/* Settings Button */}
      <motion.button
        onClick={() => setIsOpen(true)}
        className="fixed top-6 right-6 z-40 p-3 rounded-full bg-nebula/80 backdrop-blur-sm border border-white/10 hover:border-cyan-500/50 transition-all duration-300"
        whileHover={{ scale: 1.05, rotate: 90 }}
        whileTap={{ scale: 0.95 }}
        aria-label="打开设置"
      >
        <Settings className="w-5 h-5 text-stardust" />
      </motion.button>

      {/* Settings Modal */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
            />

            {/* Panel */}
            <motion.div
              initial={{ opacity: 0, x: 400 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 400 }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed right-0 top-0 bottom-0 w-full max-w-md bg-nebula/95 backdrop-blur-xl border-l border-white/10 z-50 p-8 overflow-y-auto"
            >
              {/* Header */}
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-2xl font-display font-bold text-stardust">
                  设置
                </h2>
                <motion.button
                  onClick={() => setIsOpen(false)}
                  className="p-2 rounded-full hover:bg-white/10 transition-colors"
                  whileHover={{ rotate: 90 }}
                  aria-label="关闭设置"
                >
                  <X className="w-5 h-5 text-stardust" />
                </motion.button>
              </div>

              {/* Settings Content */}
              <div className="space-y-6">
                {/* API Key */}
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">
                    StepFun API Key
                  </label>
                  <input
                    type="password"
                    value={apiKey}
                    onChange={(e) => onApiKeyChange(e.target.value)}
                    placeholder="输入你的 API Key"
                    className="w-full px-4 py-3 bg-deep-space border border-white/10 rounded-lg text-stardast placeholder-gray-600 focus:outline-none focus:border-cyan-500/50 transition-colors"
                  />
                  <p className="mt-2 text-xs text-gray-500">
                    在{' '}
                    <a
                      href="https://platform.stepfun.com"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-cyan-glow hover:underline"
                    >
                      StepFun 平台
                    </a>{' '}
                    获取你的 API Key
                  </p>
                </div>

                {/* Language Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">
                    语言
                  </label>
                  <select
                    value={language}
                    onChange={(e) => onLanguageChange(e.target.value)}
                    className="w-full px-4 py-3 bg-deep-space border border-white/10 rounded-lg text-stardust focus:outline-none focus:border-cyan-500/50 transition-colors"
                  >
                    <option value="zh">中文</option>
                    <option value="en">English</option>
                  </select>
                </div>

                {/* Info Section */}
                <div className="pt-6 border-t border-white/10">
                  <h3 className="text-sm font-medium text-gray-400 mb-3">
                    关于
                  </h3>
                  <div className="space-y-2 text-sm text-gray-500">
                    <p>AiTutor v1.0</p>
                    <p>基于 StepFun Realtime API</p>
                    <p className="text-xs mt-4">
                      点击麦克风按钮开始实时语音对话
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
