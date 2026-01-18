/**
 * 实时知识提取模块
 * 从 AI 响应中实时提取知识点
 */

import { detectHistoricalKeywords } from './history-enhancer';

export type KnowledgePointType = 'concept' | 'figure' | 'event' | 'formula' | 'place' | 'period';

export interface KnowledgePoint {
  id: string;
  type: KnowledgePointType;
  text: string;
  timestamp: number;
  confidence: number;
}

/**
 * 从 AI 响应中提取知识点
 */
export function extractKnowledgePoints(aiResponse: string): KnowledgePoint[] {
  const points: KnowledgePoint[] = [];

  if (!aiResponse || aiResponse.trim().length === 0) {
    return points;
  }

  // 1. 检测历史关键词（人物、事件、地点、时期）
  const historical = detectHistoricalKeywords(aiResponse);

  // 提取历史人物
  historical.figures.forEach(figure => {
    points.push({
      id: `fig-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type: 'figure',
      text: figure,
      timestamp: Date.now(),
      confidence: 0.8,
    });
  });

  // 提取历史事件
  historical.events.forEach(event => {
    points.push({
      id: `evt-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type: 'event',
      text: event,
      timestamp: Date.now(),
      confidence: 0.8,
    });
  });

  // 提取地点
  historical.places.forEach(place => {
    points.push({
      id: `plc-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type: 'place',
      text: place,
      timestamp: Date.now(),
      confidence: 0.7,
    });
  });

  // 提取时期
  historical.periods.forEach(period => {
    points.push({
      id: `prd-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type: 'period',
      text: period,
      timestamp: Date.now(),
      confidence: 0.7,
    });
  });

  // 2. 提取概念（简单规则：名词 + 定义词）
  // 匹配模式："XXX 是/指/表示/即为 XXX"
  const conceptPatterns = [
    /([^，。！？\n]{2,10})(是|指|表示|即为)([^，。！？\n]{2,30})/g,
    /([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\s+(是|指|表示|means?|refers?\s+to)/g,
  ];

  conceptPatterns.forEach(pattern => {
    let match;
    // 重置正则表达式的 lastIndex
    pattern.lastIndex = 0;
    while ((match = pattern.exec(aiResponse)) !== null) {
      const concept = match[1].trim();
      if (concept.length > 1 && concept.length < 20) {
        points.push({
          id: `cpt-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          type: 'concept',
          text: concept,
          timestamp: Date.now(),
          confidence: 0.6,
        });
      }
    }
  });

  // 3. 提取公式（数学/物理/化学公式）
  // 匹配常见公式符号
  const formulaPattern = /[A-Z][a-z]?\s*=\s*[^。，！？\n]{5,50}/g;
  let formulaMatch;
  while ((formulaMatch = formulaPattern.exec(aiResponse)) !== null) {
    points.push({
      id: `frm-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type: 'formula',
      text: formulaMatch[0].trim(),
      timestamp: Date.now(),
      confidence: 0.9,
    });
  }

  // 4. 去重（相同文本只保留一个）
  const uniquePoints = removeDuplicates(points);

  // 5. 按置信度排序
  return uniquePoints.sort((a, b) => b.confidence - a.confidence);
}

/**
 * 去除重复的知识点
 */
function removeDuplicates(points: KnowledgePoint[]): KnowledgePoint[] {
  const seen = new Set<string>();
  return points.filter(point => {
    const key = `${point.type}-${point.text}`;
    if (seen.has(key)) {
      return false;
    }
    seen.add(key);
    return true;
  });
}

/**
 * 从对话历史中提取所有知识点
 */
export function extractKnowledgePointsFromConversations(
  conversations: Array<{ userMessage: string; aiResponse: string }>
): KnowledgePoint[] {
  const allPoints: KnowledgePoint[] = [];

  conversations.forEach(conv => {
    // 只分析 AI 响应
    const points = extractKnowledgePoints(conv.aiResponse);
    allPoints.push(...points);
  });

  // 去重
  return removeDuplicates(allPoints);
}

/**
 * 过滤知识点（按类型和置信度）
 */
export function filterKnowledgePoints(
  points: KnowledgePoint[],
  options?: {
    types?: KnowledgePointType[];
    minConfidence?: number;
    limit?: number;
  }
): KnowledgePoint[] {
  let filtered = [...points];

  // 按类型过滤
  if (options?.types && options.types.length > 0) {
    filtered = filtered.filter(p => options.types!.includes(p.type));
  }

  // 按置信度过滤
  if (options?.minConfidence !== undefined) {
    filtered = filtered.filter(p => p.confidence >= options.minConfidence!);
  }

  // 限制数量
  if (options?.limit !== undefined) {
    filtered = filtered.slice(0, options.limit);
  }

  return filtered;
}
