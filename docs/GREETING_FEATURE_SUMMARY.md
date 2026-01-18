# 🎭 动态开场白功能完成总结

## ✅ 完成时间
2026-01-18

## 📋 功能概述

为每个学科添加了个性化的开场白，并参照 stepfun 体验中心的设计，实现了：
1. **动态开场白**：每个学科有独特的问候语
2. **打字机效果**：开场白以逐字显示的方式呈现
3. **光标动画**：显示闪烁光标，增强打字效果
4. **学科切换联动**：切换学科时自动更新开场白

## 🗂️ 文件修改

### 1. `web/lib/prompts/subject-prompts.ts`

为每个学科添加了 `greeting` 字段：

```typescript
history: {
  name: '历史',
  icon: '📜',
  roleTitle: '历史说书人',
  greeting: '听得见听得见！我是你的历史说书人。话说当年，想听听哪段历史故事？我随时准备好了！',
  // ...
}
```

**所有学科开场白**：
- 📜 **历史**: "听得见听得见！我是你的历史说书人。话说当年，想听听哪段历史故事？我随时准备好了！"
- 🌍 **地理**: "你好呀！我是地理探险家。让我们一起飞到世界各地，探索奇妙的地理现象吧！你从哪里开始好奇？"
- 🧬 **生物**: "你有没有想过生命的奥秘？我是生命探索者，带你在微观世界探险！想了解哪个神奇的生命现象？"
- ⚗️ **化学**: "欢迎来到魔法实验室！我是你的化学向导。想亲眼见证哪些神奇的物质变化？"
- ⚛️ **物理**: "你有没有注意过生活中的奇妙现象？我是现象侦探，带你探究自然规律！想解开什么谜题？"
- 📐 **数学**: "这道题的关键是...啊，还没开始呢！我是逻辑导师，帮你一步步理清思路。今天想挑战什么数学问题？"
- 🗣️ **英语**: "Let's practice English together! I'm your language partner. Ready to start? What would you like to learn today?"

### 2. `web/lib/prompts/personas.ts`

添加了获取开场白的辅助函数：

```typescript
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
```

### 3. `web/app/page.tsx`

#### 新增状态：
```typescript
const [greetingText, setGreetingText] = useState<string>('');
const [displayedGreeting, setDisplayedGreeting] = useState<string>('');
const [isTyping, setIsTyping] = useState(false);
```

#### 新增效果：

1. **更新开场白（学科切换时）**：
```typescript
useEffect(() => {
  const greeting = getSubjectGreeting(currentSubject);
  setGreetingText(greeting);
}, [currentSubject]);
```

2. **打字机效果**：
```typescript
useEffect(() => {
  if (!greetingText) return;

  setIsTyping(true);
  setDisplayedGreeting('');

  let index = 0;
  const speed = 30; // 每个字符的显示速度（毫秒）

  const timer = setInterval(() => {
    if (index < greetingText.length) {
      setDisplayedGreeting((prev) => prev + greetingText.charAt(index));
      index++;
    } else {
      setIsTyping(false);
      clearInterval(timer);
    }
  }, speed);

  return () => clearInterval(timer);
}, [greetingText]);
```

3. **初始化和更新欢迎消息**：
```typescript
// 初始化
useEffect(() => {
  if (messages.length === 0 && greetingText) {
    setMessages([{ id: '1', role: 'assistant', content: greetingText, ... }]);
  }
}, [greetingText]);

// 学科切换时更新
useEffect(() => {
  if (messages.length > 0 && messages[0].id === '1' && messages[0].role === 'assistant') {
    setMessages([{ id: '1', role: 'assistant', content: greetingText, ... }]);
  }
}, [greetingText]);
```

#### 更新消息显示：
```typescript
{messages.map((message, index) => {
  const isGreeting = message.id === '1' && message.role === 'assistant';
  const displayContent = isGreeting ? displayedGreeting : message.content;

  return (
    <motion.div key={message.id}>
      <div>
        <p>
          {displayContent}
          {isGreeting && isTyping && (
            <motion.span
              animate={{ opacity: [1, 0] }}
              transition={{ repeat: Infinity, duration: 0.8 }}
              className="inline-block w-1 h-4 bg-[#333333] ml-1 align-middle"
            />
          )}
        </p>
      </div>
    </motion.div>
  );
})}
```

#### 更新清空对话功能：
```typescript
const handleClearMessages = () => {
  setMessages([{ id: Date.now().toString(), role: 'assistant', content: greetingText, ... }]);
  setKnowledgeCards([]);
  setConversationTurns(0);
};
```

## 🎨 UI 效果

1. **打字机速度**: 每个字符 30ms
2. **光标动画**: 闪烁效果（0.8秒周期）
3. **学科切换**: 自动更新开场白并重新播放打字机效果
4. **首次加载**: 自动播放开场白
5. **清空对话**: 使用当前学科的开场白重新初始化

## 📊 测试结果

创建了测试脚本 `web/test-greeting.js`，验证结果：

```
✅ 所有学科开场白配置完成

📜 历史: 40 字符
🌍 地理: 44 字符
🧬 生物: 43 字符
⚗️ 化学: 34 字符
⚛️ 物理: 40 字符
📐 数学: 47 字符
🗣️ 英语: 111 字符
```

## 🔍 设计亮点

1. **个性化开场白**：
   - 历史学科使用评书式开场，"话说当年..."
   - 地理学科使用探险式邀请，"让我们一起飞到..."
   - 生物学科使用探索式提问，"你有没有想过..."
   - 化学学科使用实验室欢迎，"欢迎来到魔法实验室..."
   - 物理学科使用现象引导，"你有没有注意过..."
   - 数学学科使用逻辑式幽默，"这道题的关键是...啊，还没开始呢！"
   - 英语学科使用双语开场，"Let's practice English together!"

2. **视觉反馈**：
   - 打字机效果让开场白更生动
   - 闪烁光标增强打字感
   - 平滑的动画过渡

3. **交互体验**：
   - 学科切换时自动更新开场白
   - 清空对话时恢复开场白
   - 打字效果不会影响其他消息

## 🚀 构建验证

```bash
npm run build
```

✅ 构建成功
✅ TypeScript 类型检查通过
✅ Next.js 静态页面生成成功

## 📝 后续建议

1. **可调整的打字速度**：可以在设置中添加打字速度调节
2. **跳过打字效果**：允许用户点击跳过打字动画
3. **开场白自定义**：允许用户编辑每个学科的开场白
4. **更多动画效果**：可以添加淡入、滑动等更多视觉效果

---

*创建时间：2026-01-18*
*参考设计：StepFun 体验中心*
