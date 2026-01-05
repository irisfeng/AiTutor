# 语音模型调度策略 - AiTutor 历史学习助手

> **文档版本**: v1.0
> **更新日期**: 2026-01-05
> **适用模型**: step-audio-2, step-audio-2-mini

---

## 📊 模型对比分析

| 特性 | step-audio-2 | step-audio-2-mini | 差异说明 |
|------|-------------|-------------------|---------|
| **语言支持** | 中文(普通话+方言)、英语、日语 | 相同 | 无差异 |
| **输出语言** | 中文、英语 | 相同 | 无差异 |
| **环境声音理解** | ✅ | ✅ | 无差异 |
| **情绪识别** | ✅ | ✅ | 无差异 |
| **年龄推测** | ✅ | ✅ | 无差异 |
| **音乐理解** | ✅ | ✅ | 无差异 |
| **语速/语调/情感控制** | ✅ | ✅ | 无差异 |
| **Tool Call** | ✅ 原生支持 | ✅ 原生支持 | 无差异 |
| **网络搜索** | ✅ | ✅ | 无差异 |
| **指令遵循** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | mini 略低 |
| **数理推理** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | mini 略低 |
| **推理速度** | 标准 | **更快** | mini 优势 |
| **资源消耗** | 较高 | **更低** | mini 优势 |
| **成本** | 较高 | **较低** | mini 优势 |

---

## 🎯 智能调度策略

### 核心设计原则

1. **用户体验优先**: 保证响应速度和对话质量
2. **成本效益平衡**: 复杂任务用 step-audio-2，简单任务用 mini
3. **动态降级**: 网络差时自动切换到 mini
4. **用户可配置**: 允许高级用户手动选择

---

## 📋 场景映射表

### **优先使用 step-audio-2 的场景** ⭐⭐⭐⭐⭐

#### 1. 复杂历史推理场景
```
场景特征:
- 涉及多维度分析（政治/经济/文化）
- 需要深度推理（"如果"历史）
- 多轮对话的复杂问题

示例对话:
❌ mini: "秦始皇统一六国的影响是什么？"
✅ step-audio-2: "如果秦始皇没有统一六国，中国会是什么样子？
                请从政治格局、文化发展、民族形成三个角度分析"

触发条件:
- 问题包含"如果""假设""比较""分析"等关键词
- 问题长度 > 30字
- 对话轮次 > 5轮（进入深度探讨）
```

#### 2. 数学/逻辑推理场景
```
场景特征:
- 历史年代计算（"秦朝到唐朝差多少年？"）
- 统计分析（"唐朝皇帝平均在位多少年？"）
- 逻辑推理（"为什么三国鼎立而不是四国？"）

示例对话:
❌ mini: "赤壁之战曹操有多少万军队？"（简单事实）
✅ step-audio-2: "为什么号称80万的曹操军队会败给5万孙刘联军？
                从兵力的数量与质量、地形、战术三个角度推理"

触发条件:
- 包含数字计算问题
- 包含"为什么""怎样""如何"等推理词
- 需要跨知识点关联
```

#### 3. 精确指令遵循场景
```
场景特征:
- 用户提出复杂格式要求（"用表格对比""列出3个原因"）
- 角色扮演要求（"你是一个说书人""用侦探的口吻"）
- 特殊输出要求（"用诗词表达""不超过50字"）

示例对话:
❌ mini: "介绍一下唐朝"
✅ step-audio-2: "你是一个说书人，用评书的风格生动地讲述玄武门之变，
                要求：1. 制造悬念 2. 情感饱满 3. 200字左右"

触发条件:
- 包含"你是一个""请用""要求"等角色/格式指令
- 包含明确格式要求（表格、列表、诗词）
- 包含长度/风格限制
```

#### 4. Tool Call + 网络搜索场景
```
场景特征:
- 需要调用外部工具（生图、Vision API）
- 需要搜索最新历史研究
- 需要查询实时信息

示例对话:
❌ mini: "秦始皇是什么时候统一六国的？"
✅ step-audio-2: "帮我查一下最近考古发现关于兵马俑的新研究，
                并用 Vision API 分析这张兵马俑照片"

触发条件:
- 明确要求"搜索""查一下""最新研究"
- 需要调用其他 API（生成图片、分析图片）
- 涉及最新发现的考古/历史事件
```

---

### **优先使用 step-audio-2-mini 的场景** ⭐⭐⭐⭐⭐

#### 1. 简单事实查询场景
```
场景特征:
- 单一知识点问答（"秦始皇是谁？"）
- 时间/地点/人物查询（"唐朝什么时候建立的？"）
- 定义/概念解释（"什么是科举制？"）

示例对话:
✅ mini: "秦始皇是什么时候统一六国的？"
✅ mini: "唐朝的首都在哪里？"
✅ mini: "科举制是什么？"

触发条件:
- 问题长度 < 20字
- 单一事实性答案
- 不需要推理或分析
```

#### 2. 快速对话开场场景
```
场景特征:
- 首次问候/自我介绍
- 简单互动（"你好""我是谁""今天学了什么"）
- 状态查询（"我们刚才讲到哪了？"）

示例对话:
✅ mini: "你好"
✅ mini: "今天我们学了什么？"
�️ mini: "继续讲刚才的故事"

触发条件:
- 对话轮次 < 3轮
- 简单问候/确认类问题
- 无需深度思考
```

#### 3. 低网络质量场景
```
场景特征:
- 检测到网络延迟 > 2秒
- 检测到丢包率 > 10%
- 用户反馈"响应慢"

自动切换逻辑:
```
if (networkLatency > 2000ms || packetLoss > 10%) {
  model = "step-audio-2-mini";  // 自动降级
  showNotification("网络较慢，已切换到快速模式");
}
```
```

#### 4. 移动端/低性能设备场景
```
场景特征:
- 检测到移动端设备
- 检测到低性能设备（通过 UserAgent 或性能测试）
- 用户启用"省流量模式"

自动切换逻辑:
```
if (isMobile || isLowPerformance || userPreference.dataSaver) {
  model = "step-audio-2-mini";
}
```
```

---

## 🔄 动态调度算法

### 算法流程图

```
用户发送语音/文本
       ↓
┌──────────────────┐
│  场景分析器      │
└────┬─────────────┘
     ↓
┌──────────────────────────────────────┐
│ 计算复杂度分数 (0-100)                │
│ - 问题长度: +1分/字                   │
│ - 关键词: "如果"+30, "为什么"+20      │
│ - 对话轮次: +5分/轮                   │
│ - 是否需要工具调用: +40分             │
│ - 是否需要网络搜索: +30分             │
└────┬─────────────────────────────────┘
     ↓
┌──────────────────────────────────────┐
│ 环境因素检测                          │
│ - 网络延迟: >2s 则 -30分              │
│ - 设备性能: 低性能则 -20分            │
│ - 用户偏好: 节流模式则 -40分          │
└────┬─────────────────────────────────┘
     ↓
┌──────────────────────────────────────┐
│ 最终决策                              │
│ 分数 >= 50 → step-audio-2             │
│ 分数 < 50 → step-audio-2-mini         │
└──────────────────────────────────────┘
```

### 代码实现

```typescript
// web/lib/model-selector.ts

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

export class AudioModelSelector {
  private readonly COMPLEXITY_THRESHOLD = 50;

  selectModel(context: ModelSelectionContext): 'step-audio-2' | 'step-audio-2-mini' {
    // 1. 用户明确指定
    if (context.userPreferences.preferredModel) {
      return context.userPreferences.preferredModel;
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
    return complexityScore >= this.COMPLEXITY_THRESHOLD
      ? 'step-audio-2'
      : 'step-audio-2-mini';
  }

  private calculateComplexity(context: ModelSelectionContext): number {
    let score = 0;

    // 问题长度 (每字+1分，最高20分)
    score += Math.min(context.userQuery.length * 1, 20);

    // 关键词检测
    const complexKeywords = {
      '如果': 30,
      '假设': 30,
      '为什么': 20,
      '如何': 20,
      '怎样': 20,
      '比较': 25,
      '分析': 25,
      '推理': 30,
      '计算': 15,
    };

    for (const [keyword, points] of Object.entries(complexKeywords)) {
      if (context.userQuery.includes(keyword)) {
        score += points;
      }
    }

    // 对话轮次 (每轮+5分，最高30分)
    score += Math.min(context.conversationTurns * 5, 30);

    // 特殊需求检测
    if (context.userQuery.includes('搜索') || context.userQuery.includes('查')) {
      score += 30; // 需要网络搜索
    }

    if (context.userQuery.includes('生成图片') || context.userQuery.includes('看图')) {
      score += 40; // 需要 Tool Call
    }

    return score;
  }

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
}
```

---

## 💡 用户配置选项

### 设置界面设计

```
┌─────────────────────────────────────┐
│  ⚙️ 模型设置                        │
├─────────────────────────────────────┤
│                                     │
│  模型选择                           │
│  ○ 自动选择（推荐）                 │
│     根据问题复杂度自动切换          │
│                                     │
│  ○ 高质量模式                       │
│     始终使用 step-audio-2           │
│     ⚠️ 响应稍慢，质量更高           │
│                                     │
│  ○ 快速模式                         │
│     始终使用 step-audio-2-mini      │
│     ✅ 响应更快，节省流量           │
│                                     │
├─────────────────────────────────────┤
│  省流量模式                         │
│  🔘 已启用  ⚪ 未启用               │
│                                     │
│  网络质量检测                       │
│  延迟: 1.2s ✅ 良好                 │
│                                     │
└─────────────────────────────────────┘
```

### 代码实现

```typescript
// web/components/realtime-voice/ModelSettings.tsx

export function ModelSettings() {
  const [modelMode, setModelMode] = useState<'auto' | 'quality' | 'fast'>('auto');
  const [dataSaver, setDataSaver] = useState(false);
  const [networkLatency, setNetworkLatency] = useState(1200);

  return (
    <div className="model-settings">
      <h3>模型选择</h3>

      <label>
        <input
          type="radio"
          name="modelMode"
          checked={modelMode === 'auto'}
          onChange={() => setModelMode('auto')}
        />
        自动选择（推荐）
        <p className="hint">根据问题复杂度自动切换</p>
      </label>

      <label>
        <input
          type="radio"
          name="modelMode"
          checked={modelMode === 'quality'}
          onChange={() => setModelMode('quality')}
        />
        高质量模式
        <p className="hint">始终使用 step-audio-2，响应稍慢但质量更高</p>
      </label>

      <label>
        <input
          type="radio"
          name="modelMode"
          checked={modelMode === 'fast'}
          onChange={() => setModelMode('fast')}
        />
        快速模式
        <p className="hint">始终使用 step-audio-2-mini，响应更快</p>
      </label>

      <hr />

      <label className="toggle">
        <input
          type="checkbox"
          checked={dataSaver}
          onChange={(e) => setDataSaver(e.target.checked)}
        />
        省流量模式
        <p className="hint">优先使用 mini 模型节省流量</p>
      </label>

      <div className="network-status">
        <p>网络质量检测</p>
        <p>延迟: {(networkLatency / 1000).toFixed(1)}s
          {networkLatency < 1500 ? ' ✅ 良好' : ' ⚠️ 较慢'}
        </p>
      </div>
    </div>
  );
}
```

---

## 📈 成本优化分析

### 成本对比（每分钟）

| 模型 | 成本 | 响应速度 | 适用场景 |
|------|------|---------|---------|
| step-audio-2 | ¥0.03 | ~2s | 复杂推理 |
| step-audio-2-mini | ¥0.02 | ~1s | 简单对话 |

### 智能调度的成本节省

假设用户典型对话模式：
- 10% 复杂推理（step-audio-2）
- 60% 简单对话（mini）
- 20% 中等复杂度（mini）
- 10% 低网络环境（mini）

**成本对比**:
```
全部使用 step-audio-2: ¥0.03/分钟 × 100% = ¥0.030/分钟
智能调度: ¥0.03×10% + ¥0.02×90% = ¥0.021/分钟

节省: 30% 💰
```

---

## 🔧 技术实现集成

### 修改现有客户端

```typescript
// web/lib/stepfun-realtime.ts

export class StepFunRealtimeClient {
  private config: StepFunConfig;
  private modelSelector: AudioModelSelector;

  constructor(config: StepFunConfig) {
    this.config = config;
    this.modelSelector = new AudioModelSelector();
  }

  async connect(
    onStateChange: (state: VoiceState) => void,
    onTextUpdate: (text: string) => void,
    onAudioData: (audioData: string) => Promise<void>
  ) {
    // 获取当前上下文
    const context = this.buildContext();

    // 选择模型
    const selectedModel = this.modelSelector.selectModel(context);

    console.log(`[Model Selector] Using: ${selectedModel}`);

    // 创建会话时指定模型
    const sessionConfig = {
      ...this.config,
      model: selectedModel,  // ← 动态选择
    };

    // ... 原有连接逻辑
  }

  private buildContext(): ModelSelectionContext {
    return {
      userQuery: this.getLastUserMessage(),
      conversationTurns: this.getConversationTurns(),
      networkLatency: this.measureNetworkLatency(),
      devicePerformance: this.detectDevicePerformance(),
      userPreferences: {
        dataSaver: this.config.dataSaver || false,
        preferredModel: this.config.preferredModel,
      },
    };
  }

  private async measureNetworkLatency(): Promise<number> {
    const start = Date.now();
    try {
      await fetch('https://api.stepfun.com/health', {
        method: 'HEAD',
        cache: 'no-cache',
      });
      return Date.now() - start;
    } catch {
      return 9999; // 网络不可用
    }
  }

  private detectDevicePerformance(): 'high' | 'medium' | 'low' {
    const ua = navigator.userAgent;
    const memory = (navigator as any).deviceMemory || 4;
    const cores = navigator.hardwareConcurrency || 2;

    // 移动端检测
    if (/mobile|android|iphone/i.test(ua)) {
      return memory >= 6 ? 'medium' : 'low';
    }

    // 桌面端检测
    if (cores >= 8 && memory >= 8) return 'high';
    if (cores >= 4 && memory >= 4) return 'medium';
    return 'low';
  }
}
```

---

## 📊 监控与分析

### 数据收集指标

```typescript
// web/lib/model-analytics.ts

export class ModelAnalytics {
  trackModelUsage(data: {
    modelUsed: 'step-audio-2' | 'step-audio-2-mini';
    complexityScore: number;
    responseTime: number;
    userSatisfaction?: 'good' | 'neutral' | 'bad';
    networkLatency: number;
  }) {
    // 发送到分析平台
    analytics.track('model_selection', data);
  }

  // 用于优化调度策略
  generateReport(): ModelUsageReport {
    return {
      totalConversations: 1000,
      stepAudio2Usage: 0.15,      // 15% 使用 step-audio-2
      stepAudio2MiniUsage: 0.85,   // 85% 使用 mini
      averageResponseTime: {
        'step-audio-2': 2.1,
        'step-audio-2-mini': 1.2,
      },
      userSatisfactionRate: {
        'step-audio-2': 0.92,
        'step-audio-2-mini': 0.88,
      },
      costSavings: 0.30,           // 节省 30% 成本
    };
  }
}
```

---

## 🎓 使用指南

### 开发者指南

1. **默认使用自动模式**：让算法自动选择最优模型
2. **监控关键指标**：响应时间、用户满意度、成本
3. **定期优化阈值**：根据实际数据调整 `COMPLEXITY_THRESHOLD`
4. **A/B 测试**：对比不同策略的用户体验

### 用户指南（UI 显示）

```
💡 提示：

- 高质量模式：适合深度学习和复杂问题
- 快速模式：适合快速问答和移动端使用
- 自动选择：系统会根据问题智能切换

当前设置：自动选择 ✅
```

---

## 📝 版本历史

| 版本 | 日期 | 变更内容 |
|------|------|---------|
| v1.0 | 2026-01-05 | 初始版本，定义调度策略 |

---

## 🔗 相关文档

- [StepFun 实时语音 API 文档](https://platform.stepfun.com/docs/zh/llm/realtime)
- [HISTORY_ASSISTANT_PLAN.md](../HISTORY_ASSISTANT_PLAN.md)
- [开发计划](../DEV_PLAN.md)
