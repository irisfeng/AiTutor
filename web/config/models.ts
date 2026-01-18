/**
 * 模型和音色配置文件
 * 定义支持的 AI 模型和语音配置
 */

export interface ModelConfig {
  id: string;
  name: string;
  description: string;
  costPerMinute: number;
  recommended: boolean;
}

export const MODELS: ModelConfig[] = [
  {
    id: 'step-audio-2',
    name: 'Step Audio 2',
    description: '推荐',
    costPerMinute: 0.03,
    recommended: true,
  },
  {
    id: 'step-audio-2-mini',
    name: 'Step Audio 2 Mini',
    description: '快速模式',
    costPerMinute: 0.02,
    recommended: false,
  },
];

export interface VoiceConfig {
  id: string;
  name: string;
  gender: 'male' | 'female';
  description?: string;
}

export const VOICES: VoiceConfig[] = [
  {
    id: 'qingchunshaonv',
    name: '青春少女',
    gender: 'female',
    description: '活泼可爱的年轻女声',
  },
  {
    id: 'wenrounansheng',
    name: '温柔男声',
    gender: 'male',
    description: '温和稳重的男声',
  },
];

export const DEFAULT_MODEL = MODELS[0];
export const DEFAULT_VOICE = VOICES[0];

// 辅助函数：根据 ID 查找模型
export function getModelById(id: string): ModelConfig | undefined {
  return MODELS.find(model => model.id === id);
}

// 辅助函数：根据 ID 查找音色
export function getVoiceById(id: string): VoiceConfig | undefined {
  return VOICES.find(voice => voice.id === id);
}

// 辅助函数：获取推荐模型
export function getRecommendedModel(): ModelConfig {
  return MODELS.find(model => model.recommended) || MODELS[0];
}
