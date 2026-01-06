/**
 * 历史对话增强器
 *
 * 功能：
 * 1. "如果"问题识别和增强引导
 * 2. 历史细节自动补充
 * 3. 关键词检测
 */

/**
 * 检测是否为"如果"问题（反事实问题）
 */
export function isWhatIfQuestion(question: string): boolean {
  const whatIfPatterns = [
    /如果.+?会/,
    /假如.+?会/,
    /要是.+?会/,
    /倘若.+?会/,
    /当时没有/,
    /当时没有.+?会/,
  ];

  return whatIfPatterns.some(pattern => pattern.test(question));
}

/**
 * 生成"如果"问题的增强提示词
 */
export function getWhatIfEnhancement(question: string): string {
  return `
【这是一道"如果"历史问题】

请按以下结构回答：
1. **可能性分析**：从政治、经济、文化三个角度分析可能的走向（至少2种）
2. **真实原因**：说明历史上实际发生了什么，为什么这样发生
3. **思考启发**：引导学生从中学到什么

回答要求：
- 每种可能性控制在50字以内
- 强调历史发展的必然性和偶然性
- 最后回归真实历史，帮助学生理解
- 总字数控制在200字以内

问题：${question}
`;
}

/**
 * 历史关键词库
 */
export const historicalKeywords = {
  // 人物
  figures: [
    '秦始皇', '项羽', '刘邦', '诸葛亮', '李世民', '武则天', '赵匡胤',
    '成吉思汗', '朱元璋', '康熙', '乾隆', '孙中山',
  ],
  // 事件
  events: [
    '统一六国', '楚汉争霸', '赤壁之战', '玄武门之变', '安史之乱',
    '陈桥兵变', '靖难之役', '鸦片战争', '辛亥革命',
  ],
  // 朝代/时期
  periods: [
    '秦朝', '汉朝', '三国', '晋朝', '南北朝', '隋朝', '唐朝',
    '宋朝', '元朝', '明朝', '清朝', '中华民国',
  ],
  // 地点
  places: [
    '长安', '洛阳', '南京', '北京', '开封', '杭州',
    '长城', '故宫', '兵马俑',
  ],
};

/**
 * 从文本中检测历史关键词
 */
export function detectHistoricalKeywords(text: string): {
  figures: string[];
  events: string[];
  periods: string[];
  places: string[];
} {
  const detected = {
    figures: [] as string[],
    events: [] as string[],
    periods: [] as string[],
    places: [] as string[],
  };

  // 检测人物
  detected.figures = historicalKeywords.figures.filter(figure =>
    text.includes(figure)
  );

  // 检测事件
  detected.events = historicalKeywords.events.filter(event =>
    text.includes(event)
  );

  // 检测时期
  detected.periods = historicalKeywords.periods.filter(period =>
    text.includes(period)
  );

  // 检测地点
  detected.places = historicalKeywords.places.filter(place =>
    text.includes(place)
  );

  return detected;
}

/**
 * 生成历史细节增强提示
 */
export function getDetailEnhancementPrompt(text: string): string {
  const keywords = detectHistoricalKeywords(text);
  const hasKeywords = Object.values(keywords).some(arr => arr.length > 0);

  if (!hasKeywords) {
    return '';
  }

  let enhancement = '\n【请在回答中添加以下历史细节】\n';

  // 如果检测到人物，添加人物细节提示
  if (keywords.figures.length > 0) {
    enhancement += `- 提到相关历史人物：${keywords.figures.join('、')}\n`;
  }

  // 如果检测到事件，添加事件细节提示
  if (keywords.events.length > 0) {
    enhancement += `- 描述事件场景和背景\n`;
  }

  // 如果检测到时期，添加时代背景提示
  if (keywords.periods.length > 0) {
    enhancement += `- 介绍${keywords.periods[0]}的时代特征\n`;
  }

  // 如果检测到地点，添加地理细节提示
  if (keywords.places.length > 0) {
    enhancement += `- 描绘${keywords.places[0]}的地理环境\n`;
  }

  enhancement += `- 适当引用历史原话或诗句\n`;
  enhancement += `- 对比今昔，说明历史变化`;

  return enhancement;
}

/**
 * 生成增强后的完整指令
 */
export function getEnhancedInstructions(
  baseInstructions: string,
  question: string,
  personaType: 'storyteller' | 'detective' | 'traveler'
): string {
  let enhanced = baseInstructions;

  // 如果是"如果"问题，添加特殊引导
  if (isWhatIfQuestion(question)) {
    enhanced += '\n\n' + getWhatIfEnhancement(question);
  } else {
    // 否则添加历史细节增强提示
    const detailEnhancement = getDetailEnhancementPrompt(question);
    if (detailEnhancement) {
      enhanced += detailEnhancement;
    }
  }

  // 根据人设添加特定的增强
  switch (personaType) {
    case 'storyteller':
      enhanced += '\n\n记住：你是在说书，要生动有趣，像讲故事一样！';
      break;
    case 'detective':
      enhanced += '\n\n记住：你是在探案，要分析推理，寻找线索！';
      break;
    case 'traveler':
      enhanced += '\n\n记住：你是在现场，要用第一人称，身临其境！';
      break;
  }

  return enhanced;
}

/**
 * 检测问题类型并返回建议
 */
export function analyzeQuestion(question: string): {
  isWhatIf: boolean;
  hasKeywords: boolean;
  suggestedApproach: string;
} {
  const isWhatIf = isWhatIfQuestion(question);
  const keywords = detectHistoricalKeywords(question);
  const hasKeywords = Object.values(keywords).some(arr => arr.length > 0);

  let suggestedApproach = '';

  if (isWhatIf) {
    suggestedApproach = '反事实推理：分析多种可能性，回归真实历史';
  } else if (hasKeywords) {
    suggestedApproach = '历史叙述：结合人物、事件、时代背景展开';
  } else {
    suggestedApproach = '知识探索：引导学生发现历史兴趣点';
  }

  return {
    isWhatIf,
    hasKeywords,
    suggestedApproach,
  };
}
