/**
 * AiTutor 多学科系统
 *
 * 单层架构：学科层（Subject）
 * - 历史、地理、生物、化学、物理、数学
 *
 * 每个学科有完整的专业提示词配置
 */

import { generateSubjectPrompt, SubjectKey } from './subject-prompts';

// ============================================
// 类型定义
// ============================================

export type SubjectType = SubjectKey;

export interface Subject {
  id: SubjectType;
  name: string;
  icon: string;
  description: string;
  keywords: string[];
}

// ============================================
// 学科配置
// ============================================

export const SUBJECTS: Subject[] = [
  {
    id: 'history',
    name: '历史',
    icon: '📜',
    description: '评书式讲故事，把历史讲活',
    keywords: ['秦朝', '皇帝', '战争', '朝代', '历史', '三国', '唐朝', '汉朝', '明朝', '清朝', '革命'],
  },
  {
    id: 'geography',
    name: '地理',
    icon: '🌍',
    description: '游记式探险，探索世界奥秘',
    keywords: ['地形', '气候', '地理', '国家', '河流', '山脉', '海洋', '城市', '经纬度', '板块'],
  },
  {
    id: 'biology',
    name: '生物',
    icon: '🧬',
    description: '侦探式探索，发现生命奇迹',
    keywords: ['细胞', '光合作用', '遗传', '生物', '基因', '蛋白质', 'DNA', 'RNA', '生态系统', '进化'],
  },
  {
    id: 'chemistry',
    name: '化学',
    icon: '⚗️',
    description: '实验演示，见证物质变化',
    keywords: ['元素', '反应', '分子', '化学', '化合物', '原子', '周期表', '酸', '碱', '盐'],
  },
  {
    id: 'physics',
    name: '物理',
    icon: '⚛️',
    description: '现象解谜，探究自然规律',
    keywords: ['力', '速度', '能量', '物理', '牛顿', '电', '磁', '光', '声', '热力学', '量子'],
  },
  {
    id: 'math',
    name: '数学',
    icon: '📐',
    description: '逻辑推理，训练思维方法',
    keywords: ['方程', '几何', '代数', '公式', '数学', '函数', '微积分', '概率', '统计', '数列'],
  },
  {
    id: 'english',
    name: '英语',
    icon: '🗣️',
    description: '对话式练习，提升语言能力',
    keywords: [
      '英语',
      'English',
      '单词',
      '语法',
      '口语',
      '发音',
      '对话',
      'vocabulary',
      'grammar',
      'speaking',
      'listening',
      '翻译',
      '时态',
      '从句',
    ],
  },
  {
    id: 'literature',
    name: '文学',
    icon: '📖',
    description: '文本解读，分析作品内涵',
    keywords: [
      '文学',
      '诗歌',
      '古诗词',
      '文言文',
      '阅读',
      '作文',
      '鉴赏',
      '主旨',
      '修辞',
      '翻译',
      '文章',
      '小说',
      '散文',
    ],
  },
  {
    id: 'astronomy',
    name: '天文学',
    icon: '🔭',
    description: '星空探索，了解宇宙奥秘',
    keywords: [
      '天文',
      '星星',
      '行星',
      '星座',
      '宇宙',
      '恒星',
      '太阳系',
      '月亮',
      '黑洞',
      '星系',
      '观测',
      '望远镜',
      '彗星',
      '流星',
    ],
  },
];

// ============================================
// 核心函数
// ============================================

/**
 * 获取学科的系统提示词
 * @param subjectKey - 学科键名
 * @param userLanguage - 语言（zh/en，默认zh）
 * @returns 完整的系统提示词
 */
export function getPersonaInstructions(
  subjectKey: SubjectType = 'history',
  userLanguage: 'zh' = 'zh'
): string {
  // 直接生成学科提示词
  return generateSubjectPrompt(subjectKey);
}

/**
 * 获取学科的开场白
 * @param subjectKey - 学科键名
 * @returns 学科开场白
 */
export function getSubjectGreeting(subjectKey: SubjectType = 'history'): string {
  const { SUBJECT_CONFIGS } = require('./subject-prompts');
  const config = SUBJECT_CONFIGS[subjectKey];
  return config?.greeting || '你好！我是你的专属学习伙伴～';
}

/**
 * 获取所有学科列表
 */
export function getAllSubjects(): Subject[] {
  return SUBJECTS;
}

/**
 * 获取学科描述
 */
export function getSubjectInfo(subjectKey: SubjectType): Subject {
  return SUBJECTS.find(s => s.id === subjectKey) || SUBJECTS[0];
}

/**
 * 默认学科（完整对象）
 */
export const DEFAULT_SUBJECT: Subject = SUBJECTS[0]; // history

// ============================================
// 向后兼容的类型导出（保留用于避免破坏现有代码）
// ============================================

/**
 * @deprecated 请使用 SubjectType 替代
 */
export type PersonaType = 'storyteller';

/**
 * @deprecated 请使用 getAllSubjects() 替代
 */
export const PERSONAS: any[] = [];

/**
 * @deprecated 请使用 getPersonaInstructions(subject) 替代
 */
export const DEFAULT_PERSONA = undefined;
