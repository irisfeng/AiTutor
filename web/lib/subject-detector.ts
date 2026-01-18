/**
 * 学科自动检测模块
 * 根据对话内容自动识别当前学习的学科
 */

import { SUBJECTS, Subject, DEFAULT_SUBJECT } from '@/lib/prompts/personas';

export interface ConversationTurn {
  userMessage: string;
  aiResponse: string;
}

export interface DetectionResult {
  subject: Subject;
  confidence: number;
  matchedKeywords: string[];
}

/**
 * 从单段文本中检测学科
 */
export function detectSubjectFromText(text: string): DetectionResult {
  if (!text || text.trim().length === 0) {
    return {
      subject: DEFAULT_SUBJECT,
      confidence: 0,
      matchedKeywords: [],
    };
  }

  const lowerText = text.toLowerCase();

  const results = SUBJECTS.map(subject => {
    const matchedKeywords = subject.keywords.filter(keyword =>
      lowerText.includes(keyword.toLowerCase())
    );

    const confidence = matchedKeywords.length > 0
      ? matchedKeywords.length / subject.keywords.length
      : 0;

    return {
      subject,
      confidence,
      matchedKeywords,
    };
  });

  // 按置信度排序
  const sorted = results.sort((a, b) => b.confidence - a.confidence);

  // 返回置信度最高的学科
  return sorted[0];
}

/**
 * 从对话历史中检测学科
 */
export function detectSubjectFromConversations(
  conversations: ConversationTurn[]
): DetectionResult {
  if (!conversations || conversations.length === 0) {
    return {
      subject: DEFAULT_SUBJECT,
      confidence: 0,
      matchedKeywords: [],
    };
  }

  // 合并所有对话内容
  const allText = conversations
    .map(c => `${c.userMessage} ${c.aiResponse}`)
    .join(' ');

  return detectSubjectFromText(allText);
}

/**
 * 增量检测学科（考虑历史记录）
 * 当对话轮次较少时，降低阈值
 */
export function detectSubjectIncremental(
  conversations: ConversationTurn[],
  threshold: number = 0.3
): Subject {
  const result = detectSubjectFromConversations(conversations);

  // 如果置信度高于阈值，返回检测到的学科
  if (result.confidence >= threshold) {
    return result.subject;
  }

  // 否则返回默认学科
  return DEFAULT_SUBJECT;
}
