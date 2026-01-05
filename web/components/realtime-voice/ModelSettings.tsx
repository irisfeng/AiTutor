/**
 * 模型设置组件
 *
 * 允许用户配置智能模型调度系统
 */

'use client';

import { useState, useEffect } from 'react';
import { Settings, Zap, Shield, Network, TrendingUp } from 'lucide-react';

type ModelMode = 'auto' | 'quality' | 'fast';

interface ModelSettingsProps {
  onModeChange?: (mode: ModelMode) => void;
  onDataSaverChange?: (enabled: boolean) => void;
  currentModel?: string;
  complexityScore?: number;
  networkLatency?: number;
}

export function ModelSettings({
  onModeChange,
  onDataSaverChange,
  currentModel = 'step-audio-2-mini',
  complexityScore,
  networkLatency = 0,
}: ModelSettingsProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [mode, setMode] = useState<ModelMode>('auto');
  const [dataSaver, setDataSaver] = useState(false);
  const [latency, setLatency] = useState(networkLatency);

  // 更新延迟显示
  useEffect(() => {
    setLatency(networkLatency);
  }, [networkLatency]);

  // 处理模式切换
  const handleModeChange = (newMode: ModelMode) => {
    setMode(newMode);
    onModeChange?.(newMode);
  };

  // 处理省流量模式切换
  const handleDataSaverToggle = (enabled: boolean) => {
    setDataSaver(enabled);
    onDataSaverChange?.(enabled);
  };

  // 获取网络质量状态
  const getNetworkQuality = () => {
    if (latency === 0) return { text: '未检测', color: 'text-gray-400' };
    if (latency < 1000) return { text: '良好', color: 'text-green-400' };
    if (latency < 2000) return { text: '一般', color: 'text-yellow-400' };
    return { text: '较慢', color: 'text-red-400' };
  };

  const networkQuality = getNetworkQuality();

  return (
    <>
      {/* 设置按钮 */}
      <button
        onClick={() => setIsOpen(true)}
        className="p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-all duration-200"
        title="模型设置"
      >
        <Settings className="w-5 h-5 text-white/80" />
      </button>

      {/* 设置面板 */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50"
          onClick={() => setIsOpen(false)}
        >
          <div
            className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl p-6 max-w-md w-full mx-4 border border-white/10 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* 标题 */}
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <Settings className="w-5 h-5" />
                模型设置
              </h2>
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

            {/* 当前模型信息 */}
            <div className="mb-6 p-4 bg-white/5 rounded-lg border border-white/10">
              <div className="text-sm text-white/60 mb-1">当前使用</div>
              <div className="text-lg font-semibold text-white">{currentModel}</div>
              {complexityScore !== undefined && (
                <div className="mt-2 text-sm text-white/80">
                  复杂度分数: {complexityScore}/100
                </div>
              )}
            </div>

            {/* 模型选择模式 */}
            <div className="mb-6">
              <h3 className="text-sm font-medium text-white/80 mb-3">模型选择模式</h3>

              <div className="space-y-2">
                {/* 自动模式 */}
                <label
                  className={`flex items-start p-3 rounded-lg border transition-all cursor-pointer ${
                    mode === 'auto'
                      ? 'bg-cyan-500/20 border-cyan-500/50'
                      : 'bg-white/5 border-white/10 hover:border-white/30'
                  }`}
                >
                  <input
                    type="radio"
                    name="modelMode"
                    checked={mode === 'auto'}
                    onChange={() => handleModeChange('auto')}
                    className="mt-1 mr-3"
                  />
                  <div>
                    <div className="flex items-center gap-2 text-white font-medium">
                      <TrendingUp className="w-4 h-4" />
                      自动选择（推荐）
                    </div>
                    <p className="text-sm text-white/60 mt-1">
                      根据问题复杂度自动切换模型，平衡性能与成本
                    </p>
                  </div>
                </label>

                {/* 高质量模式 */}
                <label
                  className={`flex items-start p-3 rounded-lg border transition-all cursor-pointer ${
                    mode === 'quality'
                      ? 'bg-purple-500/20 border-purple-500/50'
                      : 'bg-white/5 border-white/10 hover:border-white/30'
                  }`}
                >
                  <input
                    type="radio"
                    name="modelMode"
                    checked={mode === 'quality'}
                    onChange={() => handleModeChange('quality')}
                    className="mt-1 mr-3"
                  />
                  <div>
                    <div className="flex items-center gap-2 text-white font-medium">
                      <Zap className="w-4 h-4" />
                      高质量模式
                    </div>
                    <p className="text-sm text-white/60 mt-1">
                      始终使用 step-audio-2，适合复杂推理和分析
                    </p>
                  </div>
                </label>

                {/* 快速模式 */}
                <label
                  className={`flex items-start p-3 rounded-lg border transition-all cursor-pointer ${
                    mode === 'fast'
                      ? 'bg-blue-500/20 border-blue-500/50'
                      : 'bg-white/5 border-white/10 hover:border-white/30'
                  }`}
                >
                  <input
                    type="radio"
                    name="modelMode"
                    checked={mode === 'fast'}
                    onChange={() => handleModeChange('fast')}
                    className="mt-1 mr-3"
                  />
                  <div>
                    <div className="flex items-center gap-2 text-white font-medium">
                      <Shield className="w-4 h-4" />
                      快速模式
                    </div>
                    <p className="text-sm text-white/60 mt-1">
                      始终使用 step-audio-2-mini，响应更快，节省流量
                    </p>
                  </div>
                </label>
              </div>
            </div>

            {/* 省流量模式 */}
            <div className="mb-6">
              <label className="flex items-center justify-between p-3 bg-white/5 rounded-lg border border-white/10 cursor-pointer hover:border-white/30 transition-all">
                <div className="flex items-center gap-2">
                  <Shield className="w-4 h-4 text-white/80" />
                  <span className="text-white font-medium">省流量模式</span>
                </div>
                <div className="relative">
                  <input
                    type="checkbox"
                    checked={dataSaver}
                    onChange={(e) => handleDataSaverToggle(e.target.checked)}
                    className="sr-only"
                  />
                  <div
                    className={`w-11 h-6 rounded-full transition-colors ${
                      dataSaver ? 'bg-cyan-500' : 'bg-white/20'
                    }`}
                  >
                    <div
                      className={`w-5 h-5 bg-white rounded-full shadow transform transition-transform ${
                        dataSaver ? 'translate-x-6' : 'translate-x-0.5'
                      } mt-0.5`}
                    />
                  </div>
                </div>
              </label>
              <p className="text-xs text-white/50 mt-2 ml-2">
                启用后将优先使用 mini 模型节省流量
              </p>
            </div>

            {/* 网络质量 */}
            <div className="p-4 bg-white/5 rounded-lg border border-white/10">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Network className="w-4 h-4 text-white/80" />
                  <span className="text-sm text-white/80">网络质量检测</span>
                </div>
                <div className={`text-sm font-medium ${networkQuality.color}`}>
                  {latency > 0 ? `${(latency / 1000).toFixed(1)}s` : '--'} {networkQuality.text}
                </div>
              </div>
            </div>

            {/* 提示信息 */}
            <div className="mt-6 p-3 bg-cyan-500/10 border border-cyan-500/30 rounded-lg">
              <p className="text-xs text-cyan-200">
                💡 智能调度可以节省约 30% 的成本，同时保证良好的对话体验
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
