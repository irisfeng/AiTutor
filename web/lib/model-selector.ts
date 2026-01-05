/**
 * 模型选择器 - 智能调度系统
 *
 * 根据问题复杂度、网络状况、设备性能等因素
 * 自动选择 step-audio-2 或 step-audio-2-mini
 */

export interface ModelSelectionContext {
  userQuery: string;
  conversationTurns: number;
  networkLatency: number;
  devicePerformance: 'high' | 'medium' | 'low';
  userPreferences: {
    dataSaver: boolean;
    preferredModel?: 'step-audio-2' | 'step-audio-2-mini';
  };
}

export interface ModelSelectionResult {
  selectedModel: 'step-audio-2' | 'step-audio-2-mini';
  complexityScore: number;
  reason: string;
}

export class AudioModelSelector {
  private readonly COMPLEXITY_THRESHOLD = 50;

  /**
   * 选择最优模型
   */
  selectModel(context: ModelSelectionContext): ModelSelectionResult {
    // 1. 用户明确指定
    if (context.userPreferences.preferredModel) {
      return {
        selectedModel: context.userPreferences.preferredModel,
        complexityScore: 0,
        reason: '用户手动指定模型',
      };
    }

    // 2. 计算复杂度分数
    let complexityScore = this.calculateComplexity(context);

    // 3. 应用环境因素惩罚
    complexityScore = this.applyEnvironmentPenalty(
      complexityScore,
      context.networkLatency,
      context.devicePerformance,
      context.userPreferences.dataSaver
    );

    // 4. 最终决策
    const selectedModel =
      complexityScore >= this.COMPLEXITY_THRESHOLD ? 'step-audio-2' : 'step-audio-2-mini';

    const reason = this.generateReason(selectedModel, complexityScore, context);

    return {
      selectedModel,
      complexityScore,
      reason,
    };
  }

  /**
   * 计算问题复杂度分数 (0-100)
   */
  private calculateComplexity(context: ModelSelectionContext): number {
    let score = 0;

    // 问题长度 (每字+1分，最高20分)
    score += Math.min(context.userQuery.length * 1, 20);

    // 关键词检测
    const complexKeywords: Record<string, number> = {
      如果: 30,
      假设: 30,
      为什么: 20,
      如何: 20,
      怎样: 20,
      比较: 25,
      分析: 25,
      推理: 30,
      计算: 15,
      // English keywords
      'if': 30,
      'suppose': 30,
      'why': 20,
      'how': 20,
      'compare': 25,
      'analyze': 25,
      'reasoning': 30,
      'calculate': 15,
    };

    const lowerQuery = context.userQuery.toLowerCase();
    for (const [keyword, points] of Object.entries(complexKeywords)) {
      if (lowerQuery.includes(keyword.toLowerCase())) {
        score += points;
      }
    }

    // 对话轮次 (每轮+5分，最高30分)
    score += Math.min(context.conversationTurns * 5, 30);

    // 特殊需求检测
    if (lowerQuery.includes('搜索') || lowerQuery.includes('查') || lowerQuery.includes('search')) {
      score += 30; // 需要网络搜索
    }

    if (
      lowerQuery.includes('生成图片') ||
      lowerQuery.includes('看图') ||
      lowerQuery.includes('分析图') ||
      lowerQuery.includes('generate image') ||
      lowerQuery.includes('analyze image')
    ) {
      score += 40; // 需要 Tool Call
    }

    return Math.min(score, 100);
  }

  /**
   * 应用环境因素惩罚
   */
  private applyEnvironmentPenalty(
    score: number,
    networkLatency: number,
    devicePerformance: string,
    dataSaver: boolean
  ): number {
    let adjustedScore = score;

    // 网络延迟惩罚
    if (networkLatency > 2000) {
      adjustedScore -= 30;
    } else if (networkLatency > 1000) {
      adjustedScore -= 15;
    }

    // 设备性能惩罚
    if (devicePerformance === 'low') {
      adjustedScore -= 20;
    } else if (devicePerformance === 'medium') {
      adjustedScore -= 10;
    }

    // 省流量模式惩罚
    if (dataSaver) {
      adjustedScore -= 40;
    }

    return Math.max(0, adjustedScore);
  }

  /**
   * 生成选择原因说明
   */
  private generateReason(
    model: 'step-audio-2' | 'step-audio-2-mini',
    score: number,
    context: ModelSelectionContext
  ): string {
    if (model === 'step-audio-2') {
      const reasons = [];
      if (score >= 70) reasons.push('高复杂度问题');
      if (context.userQuery.includes('如果') || context.userQuery.includes('假设')) {
        reasons.push('包含推理分析');
      }
      if (context.conversationTurns > 5) reasons.push('深度对话');
      return `选择 step-audio-2: ${reasons.join('、')} (分数: ${score})`;
    } else {
      const reasons = [];
      if (score < 30) reasons.push('简单问题');
      if (context.networkLatency > 1000) reasons.push('网络较慢');
      if (context.devicePerformance === 'low') reasons.push('设备性能');
      if (context.userPreferences.dataSaver) reasons.push('省流量模式');
      return `选择 step-audio-2-mini: ${reasons.join('、')} (分数: ${score})`;
    }
  }
}

/**
 * 网络延迟测量工具
 */
export class NetworkLatencyMeasurer {
  private static instance: NetworkLatencyMeasurer;
  private latencies: number[] = [];
  private maxSamples = 5;

  private constructor() {}

  static getInstance(): NetworkLatencyMeasurer {
    if (!NetworkLatencyMeasurer.instance) {
      NetworkLatencyMeasurer.instance = new NetworkLatencyMeasurer();
    }
    return NetworkLatencyMeasurer.instance;
  }

  /**
   * 测量网络延迟
   */
  async measureLatency(): Promise<number> {
    const start = Date.now();
    try {
      // 使用 StepFun API 健康检查端点
      await fetch('https://api.stepfun.com/v1/models', {
        method: 'HEAD',
        cache: 'no-cache',
        signal: AbortSignal.timeout(5000), // 5秒超时
      });
      const latency = Date.now() - start;

      // 记录延迟值
      this.latencies.push(latency);
      if (this.latencies.length > this.maxSamples) {
        this.latencies.shift();
      }

      // 返回平均值
      return this.getAverageLatency();
    } catch {
      // 网络不可用，返回高延迟值
      return 9999;
    }
  }

  /**
   * 获取平均延迟
   */
  getAverageLatency(): number {
    if (this.latencies.length === 0) return 0;
    const sum = this.latencies.reduce((a, b) => a + b, 0);
    return Math.round(sum / this.latencies.length);
  }

  /**
   * 清空历史记录
   */
  clear() {
    this.latencies = [];
  }
}

/**
 * 设备性能检测工具
 */
export class DevicePerformanceDetector {
  private static instance: DevicePerformanceDetector;
  private cachedResult: 'high' | 'medium' | 'low' | null = null;

  private constructor() {}

  static getInstance(): DevicePerformanceDetector {
    if (!DevicePerformanceDetector.instance) {
      DevicePerformanceDetector.instance = new DevicePerformanceDetector();
    }
    return DevicePerformanceDetector.instance;
  }

  /**
   * 检测设备性能
   */
  detectPerformance(): 'high' | 'medium' | 'low' {
    if (this.cachedResult) {
      return this.cachedResult;
    }

    if (typeof window === 'undefined' || typeof navigator === 'undefined') {
      this.cachedResult = 'medium';
      return this.cachedResult;
    }

    const ua = navigator.userAgent;
    const memory = (navigator as any).deviceMemory || 4; // GB
    const cores = navigator.hardwareConcurrency || 2;

    // 移动端检测
    if (/mobile|android|iphone/i.test(ua)) {
      this.cachedResult = memory >= 6 ? 'medium' : 'low';
      return this.cachedResult;
    }

    // 桌面端检测
    if (cores >= 8 && memory >= 8) {
      this.cachedResult = 'high';
    } else if (cores >= 4 && memory >= 4) {
      this.cachedResult = 'medium';
    } else {
      this.cachedResult = 'low';
    }

    return this.cachedResult;
  }

  /**
   * 清空缓存
   */
  clearCache() {
    this.cachedResult = null;
  }
}
