# AiTutor 多学科角色系统设计文档

## 📋 概述

我已完成多学科角色系统的逻辑抽取和重构。新系统采用**两层架构**：

1. **学科层（Subject）**：历史、地理、生物、化学、物理、数学
2. **风格层（Persona）**：不同学科的对话风格（仅历史学科有多个风格）

**最终提示词 = 学科基础提示词 + 风格强化提示词**

---

## 🏗️ 系统架构

### 第一层：通用规则（所有学科共享）

抽取的通用规则包括：

#### 1. 最高优先级 - 打断机制
```
- 随时打断：检测到用户语音输入立即停止当前输出
- 零重复：绝不重复之前说过的任何内容
- 无缝切换：立即回应用户的新问题，不道歉、不总结
- 零延迟：新提问的响应必须在0.5秒内开始
```

#### 2. 内容规范
```
- 简洁原则：每次回答不超过150字
- 准确性第一：基于事实，不编造、不臆测
- 信息密度：避免堆砌数据，选择最关键的2-3个要点
- 类比优先：用"像...一样"的生活化比喻解释抽象概念
```

#### 3. 教育原则
```
- 启发式提问：每段结尾抛出"你觉得呢？"引导思考
- 正向反馈：用"问得好！"强化参与感
- 探索任务：鼓励查资料、画图、做实验等主动学习行为
- 好奇心续航：推荐相关延伸资源
```

#### 4. 安全边界
```
- 敏感回避：争议话题用"不同学派有不同看法"客观表述
- 价值中立：不评判历史人物和观点，陈述事实即可
- 适宜年龄：语言和内容适合中小学生理解
- 版权意识：不直接背诵大段现代出版物
```

### 第二层：学科特定配置

每个学科都有以下配置：

#### 学科元信息
- `name`: 学科名称
- `icon`: 图标
- `roleTitle`: 角色头衔
- `style`: 叙事风格、语调、教学方式

#### 专业技能（学科特定）
每个学科定义了2-4个专业技能模块，例如：

**历史学科**：
- 叙事表现：评书式开场、场景还原、悬念设置、情感共鸣
- 史料运用：一手文献、年代转换、出处标注、错误自纠

**地理学科**：
- 空间思维：地图引导、方位描述、比例换算、地形比喻
- 现象解释：成因分析、影响关联、对比教学、动态变化

**生物学科**：
- 微观世界：细胞比喻、过程动画、放大缩小、时间加速
- 生命关联：结构功能、进化视角、生态联系、健康启示

#### 语言风格（学科特定）
- `opening`: 开场白数组（如历史用"话说当年..."）
- `closing`: 结束语数组（如历史用"且听下回分解"）
- `techniques`: 语言技巧列表

#### 内容边界（学科特定）
- `include`: 包含的内容范围
- `exclude`: 排除的内容范围
- `fallback`: 遇到敏感或超纲话题时的默认回答

---

## 📁 文件结构

```
web/lib/prompts/
├── subject-prompts.ts    # 学科提示词配置（新建）
│   ├── COMMON_RULES      # 通用规则
│   ├── SUBJECT_CONFIGS   # 学科配置（6个学科）
│   └── generateSubjectPrompt() # 提示词生成函数
│
└── personas.ts           # 人设配置（重构）
    ├── SUBJECTS          # 学科列表
    ├── Persona 接口      # 风格定义
    ├── 3个历史风格       # storyteller, detective, traveler
    └── getPersonaInstructions() # 整合函数
```

---

## 🔧 核心函数

### 1. `generateSubjectPrompt(subjectKey)`

生成完整的学科基础提示词。

**输入**：
- `subjectKey`: 学科键名（'history' | 'geography' | 'biology' | 'chemistry' | 'physics' | 'math'）

**输出**：
- 完整的学科系统提示词（字符串）

**示例**：
```typescript
const prompt = generateSubjectPrompt('history');
// 返回包含 Role, Profile, Rules, Skills, Workflows, Initialization 的完整提示词
```

### 2. `getPersonaInstructions(subjectKey, personaType, userLanguage)`

获取最终的系统提示词（学科 + 风格）。

**输入**：
- `subjectKey`: 学科键名
- `personaType`: 风格类型（'storyteller' | 'detective' | 'traveler'）
- `userLanguage`: 语言（'zh' | 'en'，默认'zh'）

**输出**：
- 最终系统提示词（学科提示词 + 风格提示词）

**示例**：
```typescript
// 历史学科 + 说书人风格
const prompt = getPersonaInstructions('history', 'storyteller');

// 地理学科（不需要风格）
const prompt = getPersonaInstructions('geography');
```

### 3. 其他辅助函数

```typescript
// 获取所有学科列表
getAllSubjects(): Subject[]

// 获取指定学科的可用风格
getAvailablePersonas(subjectKey): Persona[]

// 检查风格是否适用于学科
isPersonaApplicable(personaType, subjectKey): boolean

// 获取学科默认风格
getDefaultPersona(subjectKey): PersonaType

// 优化用户问题（添加引导词）
enhanceQuestion(question, subjectKey, personaType): string
```

---

## 🎯 使用示例

### 示例1：生成历史学科提示词

```typescript
import { getPersonaInstructions } from './lib/prompts/personas';

// 生成历史 + 说书人的提示词
const prompt = getPersonaInstructions('history', 'storyteller');

console.log(prompt);
// 输出包含：
// - Role: AiTutor历史助手
// - Profile（学科基础信息）
// - Rules（通用规则 + 历史特定规则）
// - Skills（叙事表现、史料运用）
// - Workflows（工作流程）
// - Initialization（初始化消息）
// - 【风格强化：说书人模式】（追加的风格提示词）
```

### 示例2：生成地理学科提示词

```typescript
import { getPersonaInstructions } from './lib/prompts/personas';

// 生成地理学科的提示词（不需要风格）
const prompt = getPersonaInstructions('geography');

console.log(prompt);
// 输出包含：
// - Role: AiTutor地理助手
// - Profile（地理学科信息）
// - Rules（通用规则 + 地理特定规则）
// - Skills（空间思维、现象解释）
// - Workflows（地理探索流程）
// - Initialization（地理探险家初始化）
// 注意：没有风格提示词（因为地理学科只有一种风格）
```

### 示例3：添加新学科

```typescript
// 在 subject-prompts.ts 中添加新的学科配置
export const SUBJECT_CONFIGS = {
  // ... 现有学科

  // 新增：英语学科
  english: {
    name: '英语',
    icon: '🗣️',
    roleTitle: '语言伙伴',
    style: {
      narrative: '对话式',
      tone: '友好鼓励',
      approach: '情景教学',
    },
    skills: [
      {
        name: '口语训练',
        capabilities: [
          '日常对话：模拟真实生活场景',
          '发音纠正：注意常见发音错误',
          '表达自信：鼓励大胆开口',
        ],
      },
      // ... 更多技能
    ],
    // ... 其他配置
  },
};
```

---

## 🚀 下一步：UI 集成

现在需要在 `page.tsx` 中实现右上角的学科选择下拉功能：

### 1. 添加学科状态

```typescript
const [currentSubject, setCurrentSubject] = useState<SubjectType>('history');
const [currentPersona, setCurrentPersona] = useState<PersonaType>('storyteller');
```

### 2. 渲染学科选择器

```typescript
import { getAllSubjects, getAvailablePersonas } from '@/lib/prompts/personas';

// 在 UI 中添加学科下拉
<select
  value={currentSubject}
  onChange={(e) => setCurrentSubject(e.target.value as SubjectType)}
>
  {getAllSubjects().map(subject => (
    <option key={subject.id} value={subject.id}>
      {subject.icon} {subject.name}
    </option>
  ))}
</select>
```

### 3. 根据学科自动切换人设

```typescript
// 当学科改变时，自动更新提示词
useEffect(() => {
  const newPrompt = getPersonaInstructions(currentSubject, currentPersona);
  // 更新 StepFunRealtimeClient 的 instructions
}, [currentSubject, currentPersona]);
```

---

## ✅ 优势总结

### 1. 可扩展性强
- 添加新学科只需在 `SUBJECT_CONFIGS` 中添加配置
- 不需要修改核心逻辑代码

### 2. 维护成本低
- 通用规则统一管理，修改一处即可
- 学科特定规则清晰分离

### 3. 类型安全
- 使用 TypeScript 类型系统
- 编译时检查学科和风格的兼容性

### 4. 提示词质量高
- 结构化生成，避免遗漏重要规则
- 每个学科的提示词都经过精心设计

---

## 📝 待办事项

- [x] 抽取通用规则
- [x] 定义6个学科的配置
- [x] 重构 personas.ts
- [x] 创建提示词生成函数
- [ ] UI 集成（学科选择下拉）
- [ ] 测试各学科的对话效果
- [ ] 根据测试反馈优化提示词

---

*生成时间：2026-01-18*
*版本：v1.0*
