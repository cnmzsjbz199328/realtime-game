# 提议的两阶段 AI 架构详细分析

## 架构概览

```
用户输入 → Director (分类) → Engineer (生成) → 前端拼接 → 执行
```

## 阶段 1: Director - 游戏分类与设计扩展

### 输入
```
用户输入: "我想要一个射击游戏"
```

### AI 模型
- **模型**: v1/models/large
- **为什么用 large 而不是 medium?**
  - 您的策略是用 large 模型
  - 优势: 更好的理解和分类能力
  - 劣势: 成本稍高，但可接受

### 上下文（Prompt）
```typescript
const SKELETON_DIRECTORY = `
可用的游戏类型骨架：

1. tower_defense - 塔防游戏
   描述: 路径防御，建造防御塔，波次管理

2. scrolling_shooter - 卷轴射击
   描述: 垂直/水平射击，敌人波次，能量道具

3. platformer - 平台跳跃
   描述: 重力跳跃，平台移动，关卡设计

... (共 16 种)
`;

const DIRECTOR_PROMPT = `
你是游戏设计总监。

用户需求: "${userTopic}"

可用骨架:
${SKELETON_DIRECTORY}

任务:
1. 选择最合适的骨架
2. 扩展用户需求为专业的游戏设计描述

输出 JSON:
{
  "skeletonId": "scrolling_shooter",
  "expandedDesign": "一款霓虹风格的太空射击游戏。玩家控制飞船..."
}
`;
```

### 输出
```json
{
  "skeletonId": "scrolling_shooter",
  "expandedDesign": "一款霓虹风格的太空射击游戏。玩家控制飞船在屏幕底部左右移动，向上发射子弹。敌人从顶部生成，向下移动。包含3个难度等级，每级敌人速度和数量递增。使用青色、品红、黄色的霓虹配色。"
}
```

### 关键价值

1. **专业化用户输入**
   - 用户: "射击游戏"
   - Director: "霓虹风格太空射击，3难度等级，波次管理..."

2. **骨架选择**
   - 从 16 种游戏类型中选择最合适的
   - 确保后续生成有正确的模板

3. **设计扩展**
   - 补充缺失的游戏设计细节
   - 确保游戏完整性

## 阶段 2: Engineer - 代码生成

### 输入

#### 输入 1: Skeleton 定义
```markdown
// scrolling_shooter.md
---
id: scrolling_shooter
name: Scrolling Shooter
description: 垂直/水平射击游戏
---

# Interface
```javascript
// 推荐的类结构
class Player extends GameObject { ... }
class Enemy extends GameObject { ... }
class Bullet extends GameObject { ... }
```

# System Prompt
你正在开发一个卷轴射击游戏...
- 玩家在底部，敌人从顶部生成
- 使用空格键射击
- 实现波次管理
...

# Runtime Code (可选)
```javascript
// 特定于射击游戏的辅助函数
function spawnWave(game, waveNumber) { ... }
```
```

#### 输入 2: Expanded Design
```
"一款霓虹风格的太空射击游戏。玩家控制飞船..."
```

### AI 模型
- **模型**: v1/models/large
- **上下文**: Skeleton 定义 + Expanded Design

### Prompt 构建
```typescript
const ENGINEER_PROMPT = `
你是游戏工程师。

游戏类型: ${skeleton.name}
${skeleton.systemPromptAddon}  // 来自 .md 文件

游戏设计:
${expandedDesign}  // 来自 Director

推荐结构:
${skeleton.interfaceContext}  // 来自 .md 文件

要求:
1. 生成 setupCode: 初始化游戏状态
2. 生成 updateCode: 每帧游戏逻辑
3. 遵循骨架的推荐结构

输出 JSON:
{
  "title": "Neon Space Blaster",
  "description": "射击太空敌人",
  "setupCode": "...",
  "updateCode": "..."
}
`;
```

### 输出
```json
{
  "title": "Neon Space Blaster",
  "description": "射击太空敌人，生存尽可能长的时间",
  "setupCode": "state.player = {x: 400, y: 550}; state.enemies = []; ...",
  "updateCode": "if (input.keys[' ']) { /* 射击 */ } ..."
}
```

## 阶段 3: 前端拼接

### 拼接逻辑
```typescript
// GameHarness.tsx
const finalSetupCode = ENGINE_CORE + gameDef.setupCode;
const finalUpdateCode = gameDef.updateCode;

// 执行
new Function('ctx', 'canvas', 'state', `
  ${finalSetupCode}
  
  return {
    update: (ctx, canvas, state, input) => {
      ${finalUpdateCode}
    }
  };
`);
```

### 最终代码结构
```javascript
// finalSetupCode =
class Engine { ... }      // ENGINE_CORE
class GameObject { ... }  // ENGINE_CORE

state.player = { ... };   // AI 生成的 setupCode
state.enemies = [];

// finalUpdateCode =
if (input.keys[' ']) {    // AI 生成的 updateCode
  // 射击逻辑
}
```

## 策略优势分析

### 1. 两阶段分工明确

| 阶段 | 职责 | 输入 | 输出 |
|------|------|------|------|
| Director | 理解 + 分类 | 用户需求 | 骨架 + 设计 |
| Engineer | 编码实现 | 骨架 + 设计 | 代码 |

**优势**:
- ✅ 职责清晰，易于调试
- ✅ Director 专注理解，Engineer 专注编码
- ✅ 可以独立优化每个阶段

### 2. 骨架系统的价值

**作为提示词的一部分**:
```
Director 看到: 16 种游戏类型的列表
Engineer 看到: 具体游戏类型的详细指导
```

**优势**:
- ✅ Director 有明确的选择范围
- ✅ Engineer 有专业的游戏类型指导
- ✅ 保证生成质量的一致性

### 3. 设计扩展的价值

**用户输入** → **专业设计**

```
"射击游戏" 
    ↓
"霓虹风格太空射击，3难度等级，波次管理，
 玩家底部移动，敌人顶部生成，空格射击，
 青色/品红/黄色配色"
```

**优势**:
- ✅ 补充用户未说明的细节
- ✅ 确保游戏完整性
- ✅ 统一视觉风格

### 4. 使用 large 模型的考量

**为什么都用 large?**

Director 用 large:
- ✅ 更好的理解能力
- ✅ 更准确的分类
- ✅ 更好的设计扩展

Engineer 用 large:
- ✅ 更好的代码生成
- ✅ 更少的 bug
- ✅ 更符合骨架指导

**成本考虑**:
- ⚠️ 两次 large 调用，成本较高
- ✅ 但生成质量更好，重试更少
- ✅ 总体成本可能更低

### 5. 前端拼接的优势

**为什么在前端拼接?**

✅ **简单**:
- 无需后端 Stitcher
- 减少后端复杂度

✅ **灵活**:
- 前端可以控制拼接逻辑
- 易于调试

✅ **性能**:
- 减少后端处理时间
- 前端拼接很快

## 潜在问题与解决方案

### 问题 1: Director 选择错误的骨架

**场景**: 用户说 "塔防"，Director 选了 "platformer"

**解决方案**:
```typescript
// 在 Director prompt 中强调
"如果用户明确提到游戏类型，优先选择对应骨架"

// 添加验证
if (userTopic.includes('塔防') && skeletonId !== 'tower_defense') {
  console.warn('Director 选择可能不准确');
}
```

### 问题 2: Expanded Design 不够详细

**场景**: Director 只是重复用户输入

**解决方案**:
```typescript
// 在 Director prompt 中要求
"必须包含:
1. 游戏机制描述
2. 难度设计
3. 视觉风格
4. 玩家交互方式"

// 验证输出长度
if (expandedDesign.length < 100) {
  throw new Error('设计描述太简短');
}
```

### 问题 3: Engineer 不遵循骨架指导

**场景**: 骨架建议用 Player 类，AI 用了 state.player 对象

**解决方案**:
```typescript
// 在 Engineer prompt 中强调
"严格遵循骨架的推荐结构"

// 或者在骨架中提供代码示例
"必须定义 class Player extends GameObject"
```

### 问题 4: 两次 AI 调用的延迟

**场景**: Director 5秒 + Engineer 30秒 = 35秒总延迟

**解决方案**:
```typescript
// 优化 1: 并行加载骨架
const [directorResult, skeletons] = await Promise.all([
  callDirector(topic),
  loadAllSkeletons()
]);

// 优化 2: 流式响应
// Director 完成后立即显示骨架选择
// Engineer 生成时显示进度
```

## 实现复杂度分析

### 需要新增的组件

1. **Director Service** (新)
   - 调用 AI
   - 解析骨架目录
   - 返回分类结果

2. **Skeleton Registry** (已存在，需修改)
   - 提供骨架列表给 Director
   - 加载骨架定义给 Engineer

3. **Engineer Service** (新)
   - 接收骨架 + 设计
   - 调用 AI
   - 返回代码

4. **Workflow Orchestrator** (修改)
   - 协调 Director → Engineer 流程
   - 错误处理
   - 进度显示

### 代码量估算

```
Director Service:    ~100 行
Engineer Service:    ~150 行
Skeleton Registry:   ~50 行修改
Workflow Update:     ~80 行修改
Types & Interfaces:  ~30 行
Tests:              ~200 行

总计: ~610 行代码
```

### 开发时间估算

- Director 实现: 2-3 小时
- Engineer 实现: 3-4 小时
- 集成测试: 2-3 小时
- Prompt 优化: 2-3 小时

**总计**: 9-13 小时

## 与其他方案对比

### 方案 A: 当前提议（两阶段）

```
Topic → Director → Engineer → 前端拼接
```

**优势**:
- ✅ 分工明确
- ✅ 骨架系统有价值
- ✅ 设计扩展提高质量

**劣势**:
- ⚠️ 两次 AI 调用
- ⚠️ 实现复杂度中等

### 方案 B: 单阶段（当前系统）

```
Topic → AI → 前端拼接
```

**优势**:
- ✅ 简单
- ✅ 一次 AI 调用

**劣势**:
- ❌ 无骨架特化
- ❌ 无设计扩展
- ❌ 生成质量不稳定

### 方案 C: 完整代码生成

```
Topic → Director → AI (生成完整代码包括 Engine)
```

**优势**:
- ✅ AI 完全自由
- ✅ 无拼接问题

**劣势**:
- ❌ Engine 可能不稳定
- ❌ Token 消耗大
- ❌ 生成时间长

## 推荐实施步骤

### Phase 1: 核心实现 (4-5 小时)
1. ✅ 实现 Director Service
2. ✅ 实现 Engineer Service
3. ✅ 更新 Skeleton Registry

### Phase 2: 集成 (2-3 小时)
4. ✅ 更新 useAgentWorkflow
5. ✅ 连接 Director → Engineer 流程
6. ✅ 前端显示优化

### Phase 3: 优化 (3-4 小时)
7. ✅ Prompt 优化
8. ✅ 错误处理
9. ✅ 性能优化

### Phase 4: 测试 (2-3 小时)
10. ✅ 测试各种游戏类型
11. ✅ 测试边缘情况
12. ✅ 用户体验优化

## 总结

### 策略评分

| 维度 | 评分 | 说明 |
|------|------|------|
| 架构清晰度 | ⭐⭐⭐⭐⭐ | 两阶段分工明确 |
| 实现复杂度 | ⭐⭐⭐⭐ | 中等，可控 |
| 生成质量 | ⭐⭐⭐⭐⭐ | 骨架+设计扩展 |
| 性能 | ⭐⭐⭐⭐ | 两次调用，可接受 |
| 可维护性 | ⭐⭐⭐⭐⭐ | 职责清晰 |
| 可扩展性 | ⭐⭐⭐⭐⭐ | 易于添加新骨架 |

**总体评分**: ⭐⭐⭐⭐⭐ (5/5)

### 建议

✅ **推荐实施此策略**

理由:
1. 架构清晰，易于理解和维护
2. 充分利用现有的骨架系统
3. 两阶段分工提高生成质量
4. 实现复杂度可控
5. 为未来扩展留有空间

### 下一步

如果您同意此策略，我可以立即开始实现：
1. 创建 Director Service
2. 创建 Engineer Service
3. 更新工作流
4. 测试完整流程
