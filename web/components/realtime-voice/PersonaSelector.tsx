/**
 * 历史人设选择器组件
 *
 * 允许用户选择不同的历史对话人设
 */

'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  getPersona,
  getAllPersonas,
  type PersonaType,
} from '@/lib/prompts/personas';

interface PersonaSelectorProps {
  currentPersona?: PersonaType;
  onPersonaChange?: (persona: PersonaType) => void;
  disabled?: boolean;
}

export function PersonaSelector({
  currentPersona = 'storyteller',
  onPersonaChange,
  disabled = false,
}: PersonaSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const personas = getAllPersonas();

  const currentPersonaData = getPersona(currentPersona);

  const handlePersonaSelect = (personaType: PersonaType) => {
    if (disabled) return;
    onPersonaChange?.(personaType);
    setIsOpen(false);
  };

  // 获取人设颜色样式
  const getColorClasses = (color: string) => {
    const colorMap = {
      amber: 'from-amber-500/20 to-amber-600/10 border-amber-500/50',
      blue: 'from-blue-500/20 to-blue-600/10 border-blue-500/50',
      purple: 'from-purple-500/20 to-purple-600/10 border-purple-500/50',
    };
    return colorMap[color as keyof typeof colorMap] || colorMap.amber;
  };

  return (
    <>
      {/* 人设指示器按钮 */}
      <button
        onClick={() => setIsOpen(true)}
        disabled={disabled}
        className={`flex items-center gap-2 px-3 py-2 rounded-lg border transition-all ${
          disabled
            ? 'opacity-50 cursor-not-allowed border-white/10 bg-white/5'
            : 'border-white/20 bg-white/10 hover:bg-white/20'
        }`}
        title="切换历史人设"
      >
        <span className="text-lg">{currentPersonaData.icon}</span>
        <span className="text-sm text-white/80">{currentPersonaData.name}</span>
        {!disabled && (
          <svg
            className="w-4 h-4 text-white/60"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 9l-7 7-7-7"
            />
          </svg>
        )}
      </button>

      {/* 人设选择面板 */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50"
          onClick={() => setIsOpen(false)}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl p-6 max-w-md w-full mx-4 border border-white/10 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* 标题 */}
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-white">选择历史人设</h2>
              <button
                onClick={() => setIsOpen(false)}
                className="text-white/60 hover:text-white transition-colors"
              >
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            {/* 人设列表 */}
            <div className="space-y-3">
              {personas.map((persona) => {
                const isSelected = persona.id === currentPersona;
                const colorClasses = getColorClasses(persona.color);

                return (
                  <button
                    key={persona.id}
                    onClick={() => handlePersonaSelect(persona.id)}
                    className={`w-full text-left p-4 rounded-lg border transition-all ${
                      isSelected
                        ? `bg-gradient-to-r ${colorClasses} ring-2 ring-white/20`
                        : 'bg-white/5 border-white/10 hover:border-white/30 hover:bg-white/10'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      {/* 图标 */}
                      <div className="text-3xl">{persona.icon}</div>

                      {/* 内容 */}
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="text-white font-semibold">{persona.name}</h3>
                          {isSelected && (
                            <span className="text-xs bg-white/20 text-white px-2 py-0.5 rounded-full">
                              当前
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-white/70 mb-2">
                          {persona.description}
                        </p>

                        {/* 示例对话 */}
                        <div className="bg-black/30 rounded p-2 text-xs text-white/50">
                          <span className="text-white/60">示例：</span>
                          {persona.examples[0]}
                        </div>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* 提示信息 */}
            <div className="mt-6 p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg">
              <p className="text-sm text-blue-300">
                💡 提示：不同人设会带来不同的对话体验，可以根据兴趣随时切换
              </p>
            </div>
          </motion.div>
        </div>
      )}
    </>
  );
}
