# 当前版本核心问题解答

## Q1: 核心引擎是提示词还是等待拼接？

**答案：核心引擎是代码字符串，等待拼接**

### 详细说明

#### ENGINE_CORE 是什么？

```typescript
// api/generation/skeletons/engine.ts
export const ENGINE_CORE = `
class Engine {
  constructor(canvas) { ... }
  spawn(entity) { ... }
  update() { ... }
  draw() { ... }
  start() { ... }
}

class GameObject {
  constructor(x, y, w, h, tag) { ... }
  update(game) { ... }
  draw(ctx) { ... }
}
`;
```

这是一个**JavaScript 代码字符串**，包含：
- 完整的 Engine 类实现
- 完整的 GameObject 基类实现
- 不是提示词，是实际可执行的代码

#### 如何使用？

**当前版本的拼接方式**（在 GameHarness 中）：

```typescript
// components/GameHarness.tsx
const setupCode = ENGINE_CORE + AI生成的setupCode;
const updateCode = AI生成的updateCode;

// 执行
new Function('ctx', 'canvas', 'state', `
  ${setupCode}  // ENGINE_CORE + 游戏初始化
  
  return {
    update: (ctx, canvas, state, input) => {
      ${updateCode}  // 游戏逻辑
    }
  };
`);
```

## Q2: 之前有 Director (v1/models/medium) 吗？

**答案：当前回滚版本没有 Director！**

### 当前版本的流程

```
用户输入 "space shooter"
    ↓
RemoteAIService.generate(topic)  ← 直接调用，没有 Director
    ↓
AI 生成 {setupCode, updateCode}
    ↓
GameHarness 拼接 ENGINE_CORE + setupCode
    ↓
执行游戏
```

### 之前版本（已删除）的流程

```
用户输入 "space shooter"
    ↓
Director (v1/models/medium)  ← 分类和扩展设计
    ↓
选择 Skeleton: "scrolling_shooter"
    ↓
Engineer (v1/models/large)  ← 生成代码
    ↓
Stitcher 拼接
    ↓
执行游戏
```

## 当前版本 vs 之前版本对比

### 当前版本（回滚后）

| 组件 | 状态 | 说明 |
|------|------|------|
| Director | ❌ 不存在 | 没有预处理和骨架锁定 |
| Skeleton Loader | ✅ 存在但未使用 | 文件在，但没有被调用 |
| ENGINE_CORE | ✅ 存在 | 硬编码的引擎代码字符串 |
| AI Service | ✅ 简化版 | 直接生成 setupCode/updateCode |
| Stitching | ✅ 在 GameHarness | 前端拼接 |

**流程**：
```
Topic → AI (单次调用) → {setupCode, updateCode} → 前端拼接 ENGINE_CORE
```

### 之前版本（已删除）

| 组件 | 状态 | 说明 |
|------|------|------|
| Director | ✅ 存在 | v1/models/medium 分类 |
| Skeleton Loader | ✅ 使用 | 加载 .md 文件 |
| ENGINE_CORE | ✅ 存在 | 通过 Skeleton 提供 |
| Engineer | ✅ 存在 | v1/models/large 生成 |
| Stitcher | ✅ 后端 | 后端拼接代码 |

**流程**：
```
Topic → Director → Skeleton → Engineer → Stitcher → {完整代码}
```

## 核心差异总结

### 1. AI 调用次数

**当前版本**：
- 1 次 AI 调用（直接生成）
- 使用 v1/models/large

**之前版本**：
- 2 次 AI 调用
  - Director: v1/models/medium（分类）
  - Engineer: v1/models/large（生成）

### 2. Skeleton 使用

**当前版本**：
- Skeleton 文件存在但**未使用**
- ENGINE_CORE 硬编码在 engine.ts
- 没有游戏类型特化

**之前版本**：
- Skeleton 文件**被使用**
- Director 选择合适的 skeleton
- 每种游戏类型有专门的 Interface/Prompt/Runtime

### 3. 代码拼接位置

**当前版本**：
- **前端拼接**（GameHarness.tsx）
- ENGINE_CORE + AI.setupCode

**之前版本**：
- **后端拼接**（Stitcher）
- skeleton.runtimeCode + AI.setupCode

### 4. 提示词来源

**当前版本**：
```typescript
// RemoteAIService.ts
const systemPrompt = `
  You are an autonomous Game Engine Engineer Agent.
  // 通用提示词，没有游戏类型特化
  Topic: ${topic}
`;
```

**之前版本**：
```typescript
// Engineer 使用
const prompt = `
  ${ENGINE_INTERFACE}           // 来自 engine.ts
  ${skeleton.systemPromptAddon} // 来自 .md 文件
  ${expandedDesign}             // 来自 Director
`;
```

## 可视化对比

### 当前版本架构

```
┌──────────┐
│  Topic   │
└────┬─────┘
     │
     ▼
┌─────────────────────┐
│ RemoteAIService     │
│ (单次 AI 调用)      │
│ v1/models/large     │
└────┬────────────────┘
     │
     ▼
┌─────────────────────┐
│ {setupCode,         │
│  updateCode}        │
└────┬────────────────┘
     │
     ▼
┌─────────────────────┐
│ GameHarness         │
│ (前端拼接)          │
│ ENGINE_CORE +       │
│ setupCode           │
└─────────────────────┘
```

### 之前版本架构

```
┌──────────┐
│  Topic   │
└────┬─────┘
     │
     ▼
┌─────────────────────┐
│ Director            │
│ v1/models/medium    │
│ (分类 + 扩展)       │
└────┬────────────────┘
     │
     ├─→ skeletonId
     └─→ expandedDesign
     │
     ▼
┌─────────────────────┐
│ Skeleton Loader     │
│ (加载 .md 文件)     │
└────┬────────────────┘
     │
     ├─→ interfaceContext
     ├─→ systemPromptAddon
     └─→ runtimeCode
     │
     ▼
┌─────────────────────┐
│ Engineer            │
│ v1/models/large     │
│ (生成代码)          │
└────┬────────────────┘
     │
     ▼
┌─────────────────────┐
│ Stitcher            │
│ (后端拼接)          │
└────┬────────────────┘
     │
     ▼
┌─────────────────────┐
│ {完整代码}          │
└─────────────────────┘
```

## 结论

### 当前版本特点

✅ **简单**：
- 单次 AI 调用
- 前端拼接
- 无需后端处理

❌ **功能缺失**：
- 没有 Director（无分类）
- 没有 Skeleton 特化（无游戏类型优化）
- 没有 v1/models/medium 预处理

### 建议

如果要恢复完整功能，需要：
1. 重新实现 Director（v1/models/medium）
2. 重新实现 Engineer（使用 Skeleton）
3. 重新实现 Stitcher（后端拼接）

或者采用新架构（完整代码生成）。
