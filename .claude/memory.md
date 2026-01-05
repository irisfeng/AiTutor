# Memory - Tony 使用 Claude Code 的记忆

## 2026-01-05

### AiTutor 功能规划：语音模型调度策略

#### 语音模型对比
- **step-audio-2**: 功能完整，推理能力强，适合复杂任务
- **step-audio-2-mini**: 速度快，资源少，成本更低

#### 智能调度设计
创建了完整的模型选择和调度策略文档：
- **文档位置**: `docs/AUDIO_MODEL_STRATEGY.md`
- **核心策略**:
  1. 根据问题复杂度自动选择模型
  2. 环境因素检测（网络、设备性能）
  3. 用户可配置（自动/高质量/快速模式）
  4. 成本优化（节省 30%）

#### 场景映射
**优先使用 step-audio-2**:
- 复杂历史推理（"如果"分析）
- 数学/逻辑推理
- 精确指令遵循（角色扮演、格式要求）
- Tool Call + 网络搜索

**优先使用 step-audio-2-mini**:
- 简单事实查询
- 快速对话开场
- 低网络质量场景
- 移动端/低性能设备

#### 复杂度评分算法
```
基础分 = 问题长度(每字+1分) + 关键词分数 + 对话轮次(每轮+5分)
环境惩罚 = 网络延迟(-30) + 低性能(-20) + 省流量(-40)
最终分数 = 基础分 - 环境惩罚
决策: 分数>=50 → step-audio-2，否则 → mini
```

#### 技术实现
- `web/lib/model-selector.ts`: 模型选择器
- `web/lib/model-analytics.ts`: 数据分析
- `web/components/realtime-voice/ModelSettings.tsx`: 设置 UI

#### 预期效果
- 成本节省: 30%
- 响应速度: mini 模式提升 40%
- 用户体验: 无感知智能切换

---

### AiTutor 功能规划：多模态增强方案

#### 方案概览
基于 HISTORY_ASSISTANT_PLAN.md 的历史学习助手规划，设计三阶段多模态增强方案。

#### 核心发现
StepFun API 能力矩阵：
- **Realtime API**: 实时语音互动（基础，已实现）⭐⭐⭐⭐⭐
- **Vision API**: 图片/视频理解（历史图片/地图解读）⭐⭐⭐⭐⭐
- **Text API**: 文本生成（对话总结、深度分析）⭐⭐⭐⭐⭐
- **Reasoning API**: 深度推理（"如果"实验室）⭐⭐⭐⭐⭐
- **Image API**: 生图/编辑（场景还原）⭐⭐⭐⭐
- **Step-GUI**: GUI 操作（不适合历史场景）⭐

#### 三阶段实施方案

**阶段 0: 基础设施搭建** (1周)
- 智能模型调度系统
- 模型设置 UI
- 数据分析系统

**阶段 1: 文本+推理增强** (2-3周)
- 对话深度增强器（语音+文本双输出）
- "如果"历史实验室引擎
- 智能知识点关联

**阶段 2: 视觉理解增强** (3-4周)
- 历史图片解读助手
- 历史地图分析器
- 知识图谱动态渲染

**阶段 3: 图像生成增强** (3-4周)
- 历史场景还原生成器
- 历史人物画像生成
- "如果"场景可视化

#### 创新场景设计

**场景 1: "穿越时空"对话模式**
用户上传故宫照片 → Vision API 识别 → Image API 生成明朝建造场景 → Text API 生成深度分析 → Reasoning API 生成"如果"问题

**场景 2: 历史侦探解谜**
AI 展示历史图片 → 用户观察 → Voice API 引导推理 → Vision API 验证 → Reward feedback

**场景 3: 多模态知识卡片**
对话提到历史事件 → 自动生成增强卡片（图片+时间线+关系网+"如果"问题）

#### 技术架构
```
用户输入（语音/文本/图片）
    ↓
智能模型调度层 (step-audio-2 / mini)
    ↓
多模态增强层 (Vision / Text / Reasoning / Image)
    ↓
内容输出层（语音播放 / 文本卡片 / 图片展示 / 知识图谱）
```

#### 文件结构
```
web/
├── lib/
│   ├── model-selector.ts          # 模型调度
│   ├── multimodal/                # 多模态客户端
│   │   ├── text-client.ts
│   │   ├── reasoning-client.ts
│   │   ├── vision-client.ts
│   │   └── image-client.ts
│   ├── what-if-engine.ts          # "如果"引擎
│   └── knowledge-graph.ts         # 知识图谱
└── components/realtime-voice/
    ├── ModelSettings.tsx          # 模型设置
    ├── ImageUpload.tsx            # 图片上传
    └── RelationshipGraph.tsx      # 关系图谱
```

#### 成本估算
- 阶段 0: ¥600/月（1000 用户）
- 阶段 1: ¥900/月（+50%）
- 阶段 2: ¥1200/月（+33%）
- 阶段 3: ¥1500/月（+25%）

优化后节省 30% 成本（通过智能调度）

#### 交付文档
- `docs/AUDIO_MODEL_STRATEGY.md` - 模型调度策略
- `docs/DEV_PLAN_V2.md` - 开发计划 v2.0

---

## 2026-01-05 (更早)

### 项目更名：DeepTutor → AiTutor

#### 更新内容
- **项目名称**：从 "DeepTutor Voice" 更名为 "AiTutor"
- **核心理念**：追求极致简单，专注于实时 AI 语音交互功能
- **更新范围**：
  - package.json：项目名称改为 "aitutor"
  - 所有文档文件：README.md, USAGE_GUIDE.md, LICENSE, .env.example
  - 代码文件：layout.tsx, SettingsPanel.tsx
  - 配置文件：memory.md

#### 项目信息
- **项目名称**：AiTutor - 实时 AI 语音助手
- **当前版本**：v0.1.0
- **技术栈**：Next.js 14 + React 18 + TypeScript + Tailwind CSS
- **核心功能**：基于 StepFun Realtime API 的实时语音交互

---

## 2026-01-03

### AiTutor 仓库重大重构 🎯

#### 重构目标
- **核心理念**：追求极致简单，专注于单一功能做到极致
- **决策**：删除所有其他 AI 学习模块，只保留实时语音交互功能

#### 重构内容
1. **删除的模块**（294 个文件，79,125 行代码）：
   - Python 后端（完整 src/ 目录）
   - 6 个 AI Agent 页面：co_writer, guide, ideagen, knowledge, notebook, question, research, settings, solver
   - 所有非语音组件和工具类
   - 开发调试文档（FINAL_UI_REPORT.md, UI_AUDIT_REPORT.md 等）

2. **保留的核心**：
   - 实时语音交互功能（`web/app/realtime-voice/`）
   - 7 个语音组件（AudioVisualizer, ConversationBubble, ConversationPanel, MicrophoneButton, ParticleBackground, SettingsPanel, StatusIndicator）
   - StepFun Realtime API 客户端（`web/lib/stepfun-realtime.ts`）

3. **新增文件**：
   - README.md（专注于语音功能的说明文档）
   - LICENSE（MIT 许可证）
   - .gitignore（更新）

4. **依赖优化**：
   - 清理前：17 个依赖包
   - 清理后：9 个依赖包（减少了 53%）
   - 新增：`ws@^8.0.0`（WebSocket 代理必需）
   - 删除：cytoscape, html2canvas, jspdf, mermaid, react-markdown 及相关包

#### 重构效果
| 指标 | 清理前 | 清理后 | 减少 |
|------|--------|--------|------|
| 总文件数 | ~200+ | ~30 | ~85% |
| 代码行数 | ~50,000+ | ~3,000 | ~94% |
| 依赖数量 | 17个 | 9个 | -53% |

#### 技术架构
```
AiTutor - 实时 AI 语音助手

技术栈:
- Next.js 14 (App Router)
- React 18
- TypeScript
- Tailwind CSS
- Framer Motion
- StepFun Realtime API

启动方式:
cd web
npm install
npm run dev      # 启动服务器（端口 3000）
```

#### WebSocket 代理服务器
- 文件：`web/server.js`
- 功能：代理前端与 StepFun Realtime API 之间的 WebSocket 连接
- 端点：`ws://localhost:3000/api/ws-proxy?apiKey=YOUR_KEY`
- 特点：
  - 集成在 Next.js 服务器中，无需单独启动
  - 自动处理 API Key 认证
  - 消息队列机制（连接前缓存消息）

#### 配置信息
- **模型**：step-audio-2-mini
- **音色**：qingchunshaonv（青春少女）/ wenrounansheng（温柔男声）
- **音频格式**：PCM16, 24kHz
- **VAD**：服务端语音活动检测

#### Git 提交记录
- Commit：a8a3433
- 日期：2026-01-03
- 消息："refactor: Remove all non-voice features, keep only realtime voice interaction"

#### 使用说明
1. 启动服务器：`cd web && npm run dev`
2. 访问：http://localhost:3000（自动跳转到 /realtime-voice）
3. 点击右上角设置图标配置 API Key
4. 点击麦克风按钮开始对话
5. 对话历史自动显示在下方

#### 已知问题
- ⚠️ 首次启动需要确保已安装 `ws` 依赖包
- ⚠️ WebSocket 代理集成在 server.js 中，必须使用 `node server.js` 启动，不能使用 `next dev`

#### 版本信息
- 当前版本：v0.1.0
- 更新日志：见 CHANGELOG.md
- 未来规划：见 HISTORY_ASSISTANT_PLAN.md（历史学习语音助手）

---

## 2025-12-30

### 初始化项目
- Tony 创建了 CLAUDE.md 文件，包含用户介绍、记忆管理和产品方法论
- Tony 是产品经理，基本不会写代码，正在探索 Claude Code 的用法
- 产品核心理念：追求极致简单，专注于一个功能做到极致

### AiTutor 项目概况（已废弃）
- 项目名称：AiTutor - AI 驱动的个性化学习助手
- 技术栈：Python 3.10+ (FastAPI) + Next.js 14 (TypeScript)
- 主要功能：6 个智能 Agent 模块（Solve、Question、Research、Guide、IdeaGen、Co-Writer）
- 启动方式：`python scripts/start_web.py`（前后端同时启动）
- **状态**：2026-01-03 重构，只保留实时语音功能

### StepFun Voice Chat 项目 ✨（已整合）
- **创建时间**：2025-12-30 晚间
- **项目目录**：`stepfun-voice-chat/`（已整合到 AiTutor/web/app/realtime-voice/）
- **项目描述**：基于 StepFun Realtime API 的优雅实时语音交互应用
- **技术栈**：
  - Next.js 14 + TypeScript + React 18
  - Tailwind CSS（优雅深色主题，毛玻璃效果）
  - Framer Motion（流畅动画）
  - StepFun Realtime API（实时语音）
- **核心功能**：
  1. 实时语音对话（服务端 VAD，自动检测说话结束）
  2. AI 状态可视化（Listening/Thinking/Speaking/Idle）
  3. 音频波形实时展示
  4. 对话历史记录
  5. 灵活的设置面板（API Key、模型、音色等）
- **设计特点**：
  - 现代化深色主题，紫色/蓝色渐变配色
  - 毛玻璃（glass）效果，流畅的动画过渡
  - 响应式布局，移动端友好
