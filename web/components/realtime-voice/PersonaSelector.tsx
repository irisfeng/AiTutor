/**
 * 历史人设选择器组件 - 与主页风格统一版
 *
 * 美学方向: 暖色纸张风格 + 优雅橙色调
 * 设计理念: 简洁优雅，与主页完美融合
 */

'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
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

  return (
    <>
      {/* 人设指示器按钮 - 简洁优雅风格 */}
      <motion.button
        onClick={() => setIsOpen(true)}
        disabled={disabled}
        whileHover={{ scale: disabled ? 1 : 1.02 }}
        whileTap={{ scale: disabled ? 1 : 0.98 }}
        className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-smooth ${
          disabled
            ? 'opacity-50 cursor-not-allowed bg-muted'
            : 'bg-card hover:bg-muted border border-border/50'
        }`}
        title="切换历史人设"
      >
        <span className="text-2xl">{currentPersonaData.icon}</span>
        <span className="text-sm font-medium">{currentPersonaData.name}</span>
        {!disabled && (
          <svg
            className="w-4 h-4 text-muted-foreground"
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
      </motion.button>

      {/* 人设选择面板 - 完美居中显示 */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* 背景遮罩 */}
            <motion.div
              className="fixed inset-0 bg-background/50 backdrop-blur-sm z-40"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={() => setIsOpen(false)}
            />

            {/* 面板容器 - 使用 flexbox 居中，支持滚动 */}
            <motion.div
              className="fixed inset-0 flex items-center justify-center z-50 p-4 pointer-events-none"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <motion.div
                className="w-full max-w-2xl pointer-events-auto"
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                transition={{ duration: 0.2, ease: "easeOut" }}
              >
                <div className="card-elevated max-h-[calc(100vh-2rem)] overflow-y-auto overflow-x-hidden">
                  <div className="p-6">
                {/* 标题栏 */}
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-semibold">选择历史人设</h3>
                  <button
                    onClick={() => setIsOpen(false)}
                    className="p-1 rounded hover:bg-muted transition-smooth"
                  >
                    <svg
                      className="w-5 h-5 text-muted-foreground"
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

                {/* 人设卡片网格 */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  {personas.map((persona, index) => {
                    const isSelected = persona.id === currentPersona;

                    return (
                      <motion.button
                        key={persona.id}
                        onClick={() => handlePersonaSelect(persona.id)}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className={`
                          relative p-4 rounded-lg border-2 transition-smooth text-left
                          ${isSelected
                            ? 'border-primary bg-primary/5 shadow-lg shadow-primary/20'
                            : 'border-border bg-card hover:border-primary/50 hover:bg-muted'
                          }
                        `}
                      >
                        {/* 图标 */}
                        <div className={`
                          text-4xl mb-3 text-center
                          ${isSelected ? 'scale-110' : ''}
                          transition-transform
                        `}>
                          {persona.icon}
                        </div>

                        {/* 名称 */}
                        <h4 className="text-base font-semibold text-center mb-2">
                          {persona.name}
                        </h4>

                        {/* 描述 */}
                        <p className="text-sm text-muted-foreground text-center mb-3 line-clamp-2">
                          {persona.description}
                        </p>

                        {/* 选中指示器 */}
                        {isSelected && (
                          <div className="flex items-center justify-center gap-1.5">
                            <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                            <span className="text-xs font-medium text-primary">当前使用</span>
                          </div>
                        )}

                        {/* 示例对话 - 悬停显示 */}
                        {!isSelected && (
                          <div className="pt-3 mt-3 border-t border-border/50 opacity-0 group-hover:opacity-100 transition-opacity">
                            <p className="text-xs text-muted-foreground italic text-center">
                              "{persona.examples[0]}"
                            </p>
                          </div>
                        )}
                      </motion.button>
                    );
                  })}
                </div>

                {/* 底部提示 */}
                <div className="p-4 bg-muted/50 rounded-lg">
                  <p className="text-sm text-muted-foreground text-center">
                    <span className="font-medium text-foreground">💡 不同人设，不同视角</span>
                    <br />
                    切换人设可获得全新的历史学习体验
                  </p>
                </div>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
