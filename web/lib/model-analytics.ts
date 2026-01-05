/**
 * 模型使用分析系统
 *
 * 跟踪模型选择、响应时间、用户满意度等指标
 * 用于优化调度策略和成本控制
 */

export type ModelType = 'step-audio-2' | 'step-audio-2-mini';

export interface ModelUsageRecord {
  timestamp: number;
  modelUsed: ModelType;
  complexityScore: number;
  responseTime: number;
  userSatisfaction?: 'good' | 'neutral' | 'bad';
  networkLatency: number;
  devicePerformance: 'high' | 'medium' | 'low';
  reason: string;
}

export interface ModelUsageStats {
  totalConversations: number;
  stepAudio2Count: number;
  stepAudio2MiniCount: number;
  stepAudio2UsageRate: number; // 0-1
  stepAudio2MiniUsageRate: number; // 0-1
  averageResponseTime: {
    'step-audio-2': number;
    'step-audio-2-mini': number;
  };
  userSatisfactionRate: {
    'step-audio-2': { good: number; neutral: number; bad: number };
    'step-audio-2-mini': { good: number; neutral: number; bad: number };
  };
  averageComplexityScore: {
    'step-audio-2': number;
    'step-audio-2-mini': number;
  };
  costSavings: number; // 节省百分比
}

/**
 * 模型使用分析器
 */
export class ModelAnalytics {
  private records: ModelUsageRecord[] = [];
  private maxRecords = 1000; // 最多保存1000条记录

  /**
   * 记录一次模型使用
   */
  trackModelUsage(record: ModelUsageRecord) {
    this.records.push(record);

    // 限制记录数量
    if (this.records.length > this.maxRecords) {
      this.records.shift();
    }

    // 持久化到 localStorage
    this.saveToLocalStorage();
  }

  /**
   * 生成使用报告
   */
  generateReport(): ModelUsageStats {
    if (this.records.length === 0) {
      return this.getEmptyStats();
    }

    const stepAudio2Records = this.records.filter((r) => r.modelUsed === 'step-audio-2');
    const stepAudio2MiniRecords = this.records.filter(
      (r) => r.modelUsed === 'step-audio-2-mini'
    );

    const total = this.records.length;
    const stepAudio2Count = stepAudio2Records.length;
    const stepAudio2MiniCount = stepAudio2MiniRecords.length;

    // 计算平均响应时间
    const avgResponseTime = {
      'step-audio-2': this.calculateAverage(stepAudio2Records, 'responseTime'),
      'step-audio-2-mini': this.calculateAverage(stepAudio2MiniRecords, 'responseTime'),
    };

    // 计算用户满意度
    const satisfactionRate = {
      'step-audio-2': this.calculateSatisfaction(stepAudio2Records),
      'step-audio-2-mini': this.calculateSatisfaction(stepAudio2MiniRecords),
    };

    // 计算平均复杂度分数
    const avgComplexityScore = {
      'step-audio-2': this.calculateAverage(stepAudio2Records, 'complexityScore'),
      'step-audio-2-mini': this.calculateAverage(stepAudio2MiniRecords, 'complexityScore'),
    };

    // 计算成本节省
    const costSavings = this.calculateCostSavings(stepAudio2Count, stepAudio2MiniCount);

    return {
      totalConversations: total,
      stepAudio2Count,
      stepAudio2MiniCount,
      stepAudio2UsageRate: stepAudio2Count / total,
      stepAudio2MiniUsageRate: stepAudio2MiniCount / total,
      averageResponseTime: avgResponseTime,
      userSatisfactionRate: satisfactionRate,
      averageComplexityScore: avgComplexityScore,
      costSavings,
    };
  }

  /**
   * 获取最近N条记录
   */
  getRecentRecords(count: number = 10): ModelUsageRecord[] {
    return this.records.slice(-count);
  }

  /**
   * 清空所有记录
   */
  clear() {
    this.records = [];
    this.saveToLocalStorage();
  }

  /**
   * 从 localStorage 恢复数据
   */
  loadFromLocalStorage() {
    if (typeof window === 'undefined') return;

    try {
      const data = localStorage.getItem('aitutor_model_analytics');
      if (data) {
        this.records = JSON.parse(data);
      }
    } catch (error) {
      console.error('Failed to load analytics data:', error);
    }
  }

  /**
   * 保存到 localStorage
   */
  private saveToLocalStorage() {
    if (typeof window === 'undefined') return;

    try {
      localStorage.setItem('aitutor_model_analytics', JSON.stringify(this.records));
    } catch (error) {
      console.error('Failed to save analytics data:', error);
    }
  }

  /**
   * 计算平均值
   */
  private calculateAverage(
    records: ModelUsageRecord[],
    field: keyof ModelUsageRecord
  ): number {
    if (records.length === 0) return 0;

    const values = records
      .map((r) => r[field])
      .filter((v) => typeof v === 'number') as number[];

    const sum = values.reduce((a, b) => a + b, 0);
    return Math.round((sum / values.length) * 100) / 100;
  }

  /**
   * 计算满意度分布
   */
  private calculateSatisfaction(
    records: ModelUsageRecord[]
  ): { good: number; neutral: number; bad: number } {
    const satisfactionCounts = {
      good: 0,
      neutral: 0,
      bad: 0,
    };

    records.forEach((record) => {
      if (record.userSatisfaction) {
        satisfactionCounts[record.userSatisfaction]++;
      }
    });

    const total = records.length || 1;
    return {
      good: Math.round((satisfactionCounts.good / total) * 100),
      neutral: Math.round((satisfactionCounts.neutral / total) * 100),
      bad: Math.round((satisfactionCounts.bad / total) * 100),
    };
  }

  /**
   * 计算成本节省百分比
   *
   * 假设:
   * - step-audio-2: ¥0.03/分钟
   * - step-audio-2-mini: ¥0.02/分钟
   */
  private calculateCostSavings(stepAudio2Count: number, miniCount: number): number {
    // 如果全部使用 step-audio-2 的成本
    const total = stepAudio2Count + miniCount;
    if (total === 0) return 0;

    const fullCostAllStep2 = total * 0.03;

    // 实际成本
    const actualCost = stepAudio2Count * 0.03 + miniCount * 0.02;

    // 节省百分比
    const savings = ((fullCostAllStep2 - actualCost) / fullCostAllStep2) * 100;

    return Math.round(savings * 100) / 100;
  }

  /**
   * 获取空统计数据
   */
  private getEmptyStats(): ModelUsageStats {
    return {
      totalConversations: 0,
      stepAudio2Count: 0,
      stepAudio2MiniCount: 0,
      stepAudio2UsageRate: 0,
      stepAudio2MiniUsageRate: 0,
      averageResponseTime: {
        'step-audio-2': 0,
        'step-audio-2-mini': 0,
      },
      userSatisfactionRate: {
        'step-audio-2': { good: 0, neutral: 0, bad: 0 },
        'step-audio-2-mini': { good: 0, neutral: 0, bad: 0 },
      },
      averageComplexityScore: {
        'step-audio-2': 0,
        'step-audio-2-mini': 0,
      },
      costSavings: 0,
    };
  }

  /**
   * 导出数据为 JSON
   */
  exportToJSON(): string {
    return JSON.stringify(this.records, null, 2);
  }

  /**
   * 从 JSON 导入数据
   */
  importFromJSON(json: string) {
    try {
      const data = JSON.parse(json) as ModelUsageRecord[];
      if (Array.isArray(data)) {
        this.records = data;
        this.saveToLocalStorage();
      }
    } catch (error) {
      console.error('Failed to import analytics data:', error);
    }
  }
}

/**
 * 单例实例
 */
let analyticsInstance: ModelAnalytics | null = null;

export function getModelAnalytics(): ModelAnalytics {
  if (!analyticsInstance) {
    analyticsInstance = new ModelAnalytics();
    analyticsInstance.loadFromLocalStorage();
  }
  return analyticsInstance;
}
