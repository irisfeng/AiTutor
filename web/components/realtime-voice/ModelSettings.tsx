/**
 * 模型指示器组件
 *
 * 简洁显示当前使用的模型模式
 */

'use client';

import { Sparkles } from 'lucide-react';

type ModelMode = 'auto' | 'quality' | 'fast';

interface ModelSettingsProps {
  currentModel?: string;
  modelMode?: ModelMode;
}

export function ModelSettings({
  currentModel = 'step-audio-2-mini',
  modelMode = 'auto',
}: ModelSettingsProps) {
  // 根据模型模式显示对应文字
  const getModelLabel = () => {
    switch (modelMode) {
      case 'quality':
        return '高质量';
      case 'fast':
        return '快速';
      case 'auto':
      default:
        return '自动';
    }
  };

  const modelLabel = getModelLabel();

  return (
    <div
      className="flex items-center gap-2 px-3 py-2 rounded-lg bg-card border border-border/50"
      title={`当前模型: ${currentModel} (${modelLabel})`}
    >
      <Sparkles className="w-4 h-4 text-primary" />
      <span className="text-sm font-medium">{modelLabel}</span>
    </div>
  );
}
