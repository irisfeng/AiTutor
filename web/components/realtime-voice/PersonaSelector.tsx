/**
 * 历史人设选择器组件 - 下拉列表版
 *
 * 美学方向: 暖色纸张风格 + 优雅橙色调
 * 设计理念: 简洁优雅，与主页完美融合
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

  const handleSelect = (personaType: PersonaType) => {
    if (disabled) return;
    onPersonaChange?.(personaType);
    setIsOpen(false);
  };

  return (
    <div className="relative">
      {/* 下拉按钮 */}
      <motion.button
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        whileHover={{ scale: disabled ? 1 : 1.02 }}
        whileTap={{ scale: disabled ? 1 : 0.98 }}
        className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-smooth ${
          disabled
            ? 'opacity-50 cursor-not-allowed bg-muted'
            : 'bg-card hover:bg-muted border border-border/50 cursor-pointer'
        }`}
      >
        <span className="text-2xl">{currentPersonaData.icon}</span>
        <span className="text-sm font-medium">{currentPersonaData.name}</span>
        {!disabled && (
          <svg
            className={`w-4 h-4 text-muted-foreground transition-transform duration-200 ${
              isOpen ? 'rotate-180' : ''
            }`}
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

      {/* 下拉菜单 */}
      {isOpen && !disabled && (
        <>
          {/* 背景遮罩 */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />

          {/* 菜单列表 */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="absolute top-full left-0 mt-2 z-50 w-full min-w-[200px]"
          >
            <div className="card-elevated rounded-lg overflow-hidden shadow-xl border border-border/50">
              {personas.map((persona, index) => {
                const isSelected = persona.id === currentPersona;

                return (
                  <motion.button
                    key={persona.id}
                    onClick={() => handleSelect(persona.id)}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className={`w-full text-left px-4 py-3 transition-smooth ${
                      isSelected
                        ? 'bg-primary/10 border-l-4 border-primary'
                        : 'bg-card hover:bg-muted border-l-4 border-transparent'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-2xl flex-shrink-0">{persona.icon}</span>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-semibold text-foreground">
                          {persona.name}
                        </div>
                        {isSelected && (
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <div className="w-1 h-1 rounded-full bg-primary animate-pulse" />
                            <span className="text-xs font-medium text-primary">当前使用</span>
                          </div>
                        )}
                        {!isSelected && (
                          <div className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
                            {persona.description}
                          </div>
                        )}
                      </div>
                    </div>
                  </motion.button>
                );
              })}

              {/* 底部提示 */}
              <div className="p-3 bg-muted/50 border-t border-border/50">
                <p className="text-xs text-muted-foreground text-center">
                  💡 切换人设可获得全新的历史学习体验
                </p>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </div>
  );
}

