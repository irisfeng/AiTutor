# AiTutor 历史学习助手 - 开发计划 v2.0

> **更新日期**: 2026-01-05
> **核心目标**: 基于实时语音 + 多模态 API 的历史学习助手

---

## 📊 技术架构总览

```
┌──────────────────────────────────────────────────────┐
│                   用户交互层                          │
│  语音输入 │ 文本输入 │ 图片上传 │ 场景生成           │
└──────────────────┬───────────────────────────────────┘
                   ↓
┌──────────────────────────────────────────────────────┐
│              智能模型调度层                           │
│  ┌────────────────────────────────────────────┐     │
│  │  step-audio-2 (复杂推理)                   │     │
│  │  step-audio-2-mini (快速响应)              │     │
│  │  自动切换算法 (复杂度分数)                  │     │
│  └────────────────────────────────────────────┘     │
└──────────────────┬───────────────────────────────────┘
                   ↓
┌──────────────────────────────────────────────────────┐
│              多模态增强层                             │
│  Vision API │ Text API │ Reasoning API │ Image API  │
└──────────────────┬───────────────────────────────────┘
                   ↓
┌──────────────────────────────────────────────────────┐
│                 内容输出层                            │
│  语音播放 │ 文本卡片 │ 图片展示 │ 知识图谱           │
└──────────────────────────────────────────────────────┘
```

---

## 🚀 分阶段实施计划

### **阶段 0: 基础设施搭建** (1周) ⭐⭐⭐⭐⭐

#### 目标
搭建智能模型调度系统，为后续开发打基础。

#### 功能清单

##### 0.1 语音模型智能调度系统 (3天)
**文件**:
- `web/lib/model-selector.ts` - 模型选择器
- `web/lib/stepfun-realtime.ts` - 集成模型选择逻辑

**核心功能**:
```typescript
// 复杂度评分算法
- 问题长度分析
- 关键词检测（"如果""为什么""分析"）
- 对话轮次统计
- 工具调用需求检测

// 环境因素检测
- 网络延迟测量
- 设备性能检测
- 用户偏好设置

// 动态切换逻辑
if (complexityScore >= 50 && networkGood && deviceGood) {
  use step-audio-2;
} else {
  use step-audio-2-mini;
}
```

##### 0.2 模型设置 UI 组件 (2天)
**文件**:
- `web/components/realtime-voice/ModelSettings.tsx`

**功能**:
- 自动/高质量/快速模式切换
- 省流量模式开关
- 网络质量实时显示
- 当前使用的模型提示

##### 0.3 数据分析系统 (2天)
**文件**:
- `web/lib/model-analytics.ts`

**指标**:
- 模型使用比例（step-audio-2 vs mini）
- 平均响应时间
- 用户满意度
- 成本节省统计

**交付物**:
- ✅ 智能模型调度系统
- ✅ 模型设置 UI
- ✅ 数据分析看板
- ✅ 成本节省 30%

**工作量**: 1名全栈工程师 × 5工作日
**技术复杂度**: ⭐⭐⭐ (中等)

---

### **阶段 1: 文本+推理增强** (2-3周) ⭐⭐⭐⭐⭐

#### 目标
在实时语音对话中，静默调用 Text/Reasoning API 增强回复质量。

#### 功能清单

##### 1.1 对话深度增强器 (5天)
**文件**:
- `web/lib/multimodal/text-client.ts` - Text API 客户端
- `web/lib/multimodal/reasoning-client.ts` - Reasoning API 客户端
- `web/lib/multimodal/orchestrator.ts` - 多模态编排器

**场景设计**:
```
用户问: "项羽为什么输给刘邦？"

[Realtime API] 语音回复（50字简洁版）
  ↓
[后台静默调用]
  ├─ Text API: 生成深度分析（300字）
  ├─ Reasoning API: "如果项羽不乌江自刎..."
  └─ 知识图谱: 关联韩信、范增、刘邦
  ↓
[UI 显示]
  ├─ 语音播放（简洁）
  ├─ 文本卡片（深度分析）
  ├─ "如果"问题卡片
  └─ 知识图谱侧边栏
```

##### 1.2 "如果"历史实验室引擎 (7天)
**文件**:
- `web/lib/what-if-engine.ts`
- `web/components/realtime-voice/WhatIfPanel.tsx`

**核心功能**:
```typescript
// 推理模型调用
async function whatIfAnalysis(event: string, counterfactual: string) {
  const prompt = `
    原史实：${event}
    假设：${counterfactual}

    请分析：
    1. 政治格局变化
    2. 经济影响
    3. 文化走向
    4. 后续关键事件改变
  `;

  return await step3Reasoning(prompt);
}
```

**UI 交互**:
- 点击"如果"问题卡片
- 展开多角度分析
- 允许用户追问

##### 1.3 智能知识点关联 (5天)
**文件**:
- `web/lib/knowledge-graph.ts`
- `web/components/realtime-voice/RelationshipGraph.tsx`

**功能**:
```
对话提到: "秦始皇"
  ↓
自动生成关联:
  - 兵马俑
  - 长城
  - 统一六国
  - 焚书坑儒
  ↓
可视化展示:
  ┌─────────┐
  │  秦始皇  │
  └─┬───┬───┘
     │   │
  兵马俑 长城
```

**触发模型选择逻辑**:
```typescript
// 简单查询 → mini
userQuery: "秦始皇是谁？"
→ 使用 step-audio-2-mini

// 复杂分析 → step-audio-2
userQuery: "如果秦始皇没有统一六国，中国会怎样？"
→ 使用 step-audio-2 + Reasoning API
```

**交付物**:
- ✅ 对话深度增强（语音+文本双输出）
- ✅ "如果"实验室（10+ 历史场景）
- ✅ 知识图谱可视化
- ✅ 模型智能调度

**工作量**: 1名全栈工程师 × 17工作日
**技术复杂度**: ⭐⭐⭐ (中等)

**验证指标**:
- 用户平均对话轮数 > 10轮
- "如果"问题点击率 > 40%
- 用户留存提升 > 30%
- 成本优化 > 25%

---

### **阶段 2: 视觉理解增强** (3-4周) ⭐⭐⭐⭐⭐

#### 目标
用户上传历史图片/地图，AI 看懂后通过语音讲解。

#### 功能清单

##### 2.1 历史图片解读助手 (7天)
**文件**:
- `web/lib/multimodal/vision-client.ts` - Vision API 客户端
- `web/components/realtime-voice/ImageUpload.tsx`
- `web/components/realtime-voice/ImageAnnotation.tsx`

**工作流程**:
```
用户上传: 兵马俑照片
  ↓
[Vision API - step-1o-turbo-vision]
识别内容:
  - 兵马俑（陶俑）
  - 秦始皇陵陪葬品
  - 千人千面艺术特色
  - 世界文化遗产
  ↓
[模型选择逻辑]
判断讲解复杂度:
  - 简单描述 → step-audio-2-mini
  - 深度文化解读 → step-audio-2
  ↓
[Realtime API] 语音讲解
  ↓
[UI 显示]
  - 图片标注（关键区域）
  - 知识点卡片
  - 时间线定位
```

##### 2.2 历史地图分析器 (7天)
**文件**:
- `web/lib/map-analyzer.ts`
- `web/components/realtime-voice/MapViewer.tsx`

**功能**:
```
上传: 《三国形势图》
  ↓
Vision API 识别:
  - 魏/蜀/吴疆域
  - 关键战役地点（赤壁、官渡）
  - 地理要素（长江、黄河）
  ↓
step-audio-2 深度讲解:
  "为什么长江成为天然屏障..."
  ↓
互动提问:
  "如果你是诸葛亮，如何利用地形？"
```

##### 2.3 知识图谱动态渲染 (6天)
**文件**:
- `web/lib/graph-generator.ts`
- `web/components/realtime-voice/ForceDirectedGraph.tsx`

**功能**:
```
对话中提到人物/事件
  ↓
Text API 生成关系数据:
  {
    "entity": "曹操",
    "relations": [
      {"type": "对手", "target": "刘备"},
      {"type": "儿子", "target": "曹丕"}
    ]
  }
  ↓
动态渲染关系网
  ↓
点击节点 → 展开详细关系
```

**交付物**:
- ✅ 历史图片智能解读
- ✅ 地图分析器
- ✅ 动态知识图谱
- ✅ 模型智能调度（视觉场景）

**工作量**: 1名全栈工程师 × 20工作日
**技术复杂度**: ⭐⭐⭐⭐ (中高)

**验证指标**:
- 图片上传使用率 > 50%
- 图片解读准确率 > 85%
- 用户满意度 > 4.0/5.0

---

### **阶段 3: 图像生成增强** (3-4周) ⭐⭐⭐⭐

#### 目标
根据对话内容动态生成历史场景/人物画像。

#### 功能清单

##### 3.1 历史场景还原生成器 (7天)
**文件**:
- `web/lib/multimodal/image-client.ts` - Image API 客户端
- `web/lib/scene-generator.ts`
- `web/components/realtime-voice/SceneGallery.tsx`

**工作流程**:
```
AI 讲解: "想象一下，公元前209年的大泽乡..."
  ↓
后台调用 Image API (step-2x-large):
  prompt: "中国古代，陈胜吴光起义，大泽乡，
          农民起义军，暴雨天气，历史写实风格"
  ↓
生成场景图并显示
  ↓
增强沉浸感
```

##### 3.2 历史人物画像生成 (6天)
**文件**:
- `web/lib/portrait-generator.ts`

**功能**:
```
用户: "李白长什么样？"
  ↓
Text API 生成描述:
  "唐代诗人，白衣飘飘，手持酒杯，
   豪放不羁，40岁左右..."
  ↓
Image API 生成画像
  ↓
step-audio-2 语音讲解:
  "这就是诗仙李白的形象..."
```

##### 3.3 "如果"场景可视化 (7天)
**文件**:
- `web/lib/counterfactual-visualizer.ts`

**功能**:
```
如果实验室:
"如果项羽在鸿门宴杀了刘邦..."
  ↓
生成历史场景图:
  - 鸿门宴场景（项羽胜利）
  - 不同的历史走向示意图
  ↓
帮助用户想象可能性
```

**交付物**:
- ✅ 场景还原生成器
- ✅ 人物画像生成
- ✅ "如果"场景可视化
- ✅ 场景画廊管理

**工作量**: 1名全栈工程师 × 20工作日
**技术复杂度**: ⭐⭐⭐⭐ (中高)

**验证指标**:
- 图片生成使用率 > 30%
- 用户生成内容分享率 > 20%
- 场景还原准确率 > 80%

---

## 📁 文件结构总览

```
web/
├── lib/
│   ├── model-selector.ts              # 阶段0: 模型调度
│   ├── model-analytics.ts             # 阶段0: 数据分析
│   ├── stepfun-realtime.ts            # 修改: 集成模型选择
│   │
│   ├── multimodal/                    # 新建目录
│   │   ├── text-client.ts             # 阶段1: Text API
│   │   ├── reasoning-client.ts        # 阶段1: Reasoning API
│   │   ├── vision-client.ts           # 阶段2: Vision API
│   │   ├── image-client.ts            # 阶段3: Image API
│   │   └── orchestrator.ts            # 多模态编排器
│   │
│   ├── what-if-engine.ts              # 阶段1: "如果"引擎
│   ├── knowledge-graph.ts             # 阶段1: 知识图谱
│   ├── map-analyzer.ts                # 阶段2: 地图分析
│   ├── scene-generator.ts             # 阶段3: 场景生成
│   └── portrait-generator.ts          # 阶段3: 人物生成
│
├── components/realtime-voice/
│   ├── ModelSettings.tsx              # 阶段0: 模型设置
│   ├── WhatIfPanel.tsx                # 阶段1: "如果"面板
│   ├── RelationshipGraph.tsx          # 阶段1: 关系图谱
│   ├── ImageUpload.tsx                # 阶段2: 图片上传
│   ├── ImageAnnotation.tsx            # 阶段2: 图片标注
│   ├── MapViewer.tsx                  # 阶段2: 地图查看
│   ├── SceneGallery.tsx               # 阶段3: 场景画廊
│   └── ConversationPanel.tsx          # 修改: 集成多模态
│
└── types/
    ├── multimodal.ts                  # 多模态类型定义
    └── analytics.ts                   # 分析类型定义
```

---

## 💰 成本预算总览

### API 成本估算（月均 1000 用户）

| 阶段 | API 使用 | 月成本 | 说明 |
|------|---------|--------|------|
| 阶段0 | Realtime (智能调度) | ¥600 | 节省 30% |
| 阶段1 | + Text + Reasoning | ¥900 | 增加 50% |
| 阶段2 | + Vision | ¥1200 | 增加 33% |
| 阶段3 | + Image | ¥1500 | 增加 25% |

### 成本优化策略

1. **智能模型调度**: 节省 30% 语音成本
2. **缓存机制**: 常见问题缓存，减少 API 调用
3. **用户配额**: 免费用户限制高级功能
4. **批量优化**: 合并 API 请求

---

## 📊 里程碑与验收标准

### Milestone 1: 智能调度上线（第 1 周）
- ✅ 模型自动切换正常工作
- ✅ 成本节省达到 25%+
- ✅ 响应时间无显著增加

### Milestone 2: 文本增强上线（第 4 周）
- ✅ 深度分析功能可用
- ✅ "如果"问题生成准确
- ✅ 用户留存提升 > 20%

### Milestone 3: 视觉理解上线（第 8 周）
- ✅ 图片解读准确率 > 85%
- ✅ 地图分析功能正常
- ✅ 知识图谱渲染流畅

### Milestone 4: 完整版上线（第 12 周）
- ✅ 全部多模态功能集成
- ✅ 用户满意度 > 4.5/5.0
- ✅ 月活用户 > 5000

---

## 🎯 风险评估与缓解

### 风险 1: API 成本超支 ⚠️⚠️⚠️
**缓解措施**:
- 实施严格的配额管理
- 优化缓存策略
- 用户分级（免费/付费）

### 风险 2: 模型切换延迟 ⚠️⚠️
**缓解措施**:
- 预加载模型连接
- 使用连接池
- 降级策略

### 风险 3: 图片生成质量不稳定 ⚠️⚠️
**缓解措施**:
- 人工审核提示词
- 用户反馈机制
- 多版本生成供选择

### 风险 4: 用户隐私（图片上传）⚠️⚠️⚠️
**缓解措施**:
- 加密传输
- 及时删除
- 隐私政策明确

---

## 🚀 下一步行动

### 立即开始（本周）
1. ✅ 创建 `model-selector.ts`
2. ✅ 实现复杂度评分算法
3. ✅ 开发模型设置 UI
4. ✅ 集成到 `stepfun-realtime.ts`

### 短期目标（1 个月内）
1. 完成 Text + Reasoning 集成
2. 上线"如果"实验室
3. 邀请 100 个种子用户测试
4. 收集反馈优化调度算法

### 中期目标（3 个月内）
1. 完成全部多模态功能
2. 用户数达到 5000+
3. 建立 UGC 内容库
4. 探索商业化路径

---

## 📚 相关文档

- [HISTORY_ASSISTANT_PLAN.md](../HISTORY_ASSISTANT_PLAN.md) - 产品规划
- [AUDIO_MODEL_STRATEGY.md](./AUDIO_MODEL_STRATEGY.md) - 模型调度策略
- [MULTIMODAL_ENHANCEMENT_PLAN.md](./MULTIMODAL_ENHANCEMENT_PLAN.md) - 多模态方案
- [API_REFERENCE.md](./API_REFERENCE.md) - API 参考文档

---

## 📝 版本历史

| 版本 | 日期 | 变更内容 |
|------|------|---------|
| v2.0 | 2026-01-05 | 整合多模态方案，更新开发计划 |
| v1.0 | 2026-01-03 | 初始版本（仅语音） |

---

**项目负责人**: Tony
**技术负责人**: 待定
**预计完成**: 2026-04 (3个月)
