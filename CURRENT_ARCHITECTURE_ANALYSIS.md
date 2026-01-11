# 当前版本技术路线分析

## 系统架构概览

当前系统采用**代码拼接（Code Stitching）**架构，将预定义的引擎代码与 AI 生成的游戏逻辑组合。

## 核心组件

### 1. AI 代理层
```
api/ai.ts
├── 接收前端请求
├── 转发到 unified-ai-backend
└── 返回 AI 响应
```

**职责**：
- 作为前端和 AI 服务的中间层
- 可以注入隐藏提示词或 API 密钥
- 统一错误处理

### 2. Skeleton 系统

#### 2.1 核心文件

```
api/generation/skeletons/
├── engine.ts           # ENGINE_CORE + ENGINE_INTERFACE
├── loader.ts           # Markdown 解析器
├── registry.ts         # Skeleton 注册表
├── types.ts            # 类型定义
└── definitions/        # 游戏类型文档（.md 文件）
    ├── tower_defense.md
    ├── platformer.md
    ├── scrolling_shooter.md
    └── ...
```

#### 2.2 Skeleton 定义文件结构

每个 `.md` 文件包含：

```markdown
---
id: tower_defense
name: Tower Defense
description: Path-based tower defense...
---

# Interface
```javascript
// 特定于该游戏类型的接口说明
```

# System Prompt
你正在开发一个塔防游戏...

# Runtime Code
```javascript
// 特定于该游戏类型的运行时代码
class Tower extends GameObject { ... }
```
```

#### 2.3 加载流程

```typescript
// loader.ts
loadSkeleton(filename) {
  1. 读取 .md 文件
  2. 解析 Frontmatter (id, name, description)
  3. 提取 Interface 代码块
  4. 提取 System Prompt 文本
  5. 提取 Runtime Code 代码块
  
  返回:
  {
    id: "tower_defense",
    name: "Tower Defense",
    description: "...",
    interfaceContext: ENGINE_INTERFACE + 提取的接口,
    systemPromptAddon: 提取的提示词,
    runtimeCode: ENGINE_CORE + 提取的运行时代码
  }
}
```

### 3. 引擎核心 (engine.ts)

```typescript
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
  onCollision(other, game) { ... }
}
`;

export const ENGINE_INTERFACE = `
说明 Engine 和 GameObject 的 API
`;
```

**特点**：
- 预定义的完整引擎实现
- 提供给所有游戏类型使用
- 包含碰撞检测、粒子系统、输入处理等

### 4. 代码拼接流程

```
1. 用户输入: "tower defense game"
   ↓
2. AI 生成:
   - setupCode: "state.towers = []; ..."
   - updateCode: "if (input.keys['1']) { ... }"
   ↓
3. Skeleton 提供:
   - runtimeCode: ENGINE_CORE + Tower类定义
   ↓
4. 拼接结果:
   setupCode = skeleton.runtimeCode + AI.setupCode
   updateCode = AI.updateCode
   ↓
5. GameHarness 执行
```

### 5. GameHarness 执行器

```typescript
// components/GameHarness.tsx
function GameHarness({ setupCode, updateCode }) {
  // 创建单一闭包
  const gameFunc = new Function('ctx', 'canvas', 'state', `
    ${setupCode}
    
    return {
      setup: (ctx, canvas, state) => {
        // setup 逻辑已在上面执行
      },
      update: (ctx, canvas, state, input) => {
        ${updateCode}
      }
    };
  `);
  
  // 执行
  const closure = gameFunc(ctx, canvas, state);
  // 游戏循环调用 closure.update()
}
```

## 数据流图

```
┌─────────────┐
│ User Input  │
│ "shooter"   │
└──────┬──────┘
       │
       ▼
┌─────────────────────────────────────┐
│ AI Proxy (api/ai.ts)                │
│ → unified-ai-backend                │
└──────┬──────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────┐
│ Skeleton Loader                     │
│ 1. 读取 definitions/*.md            │
│ 2. 解析 Frontmatter                 │
│ 3. 提取 Interface/Prompt/Runtime   │
└──────┬──────────────────────────────┘
       │
       ├─→ interfaceContext ─┐
       ├─→ systemPromptAddon ├─→ AI Prompt
       └─→ runtimeCode ───────┘
       
       ▼
┌─────────────────────────────────────┐
│ AI 生成                             │
│ - setupCode: 初始化代码             │
│ - updateCode: 每帧逻辑              │
└──────┬──────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────┐
│ Code Stitching                      │
│ setupCode = runtime + AI.setupCode  │
│ updateCode = AI.updateCode          │
└──────┬──────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────┐
│ GameHarness                         │
│ 执行拼接后的代码                    │
└─────────────────────────────────────┘
```

## 关键特点

### 优势
1. ✅ **引擎稳定**: ENGINE_CORE 是预定义的，不会被 AI 破坏
2. ✅ **类型特化**: 每个游戏类型有专门的 skeleton
3. ✅ **文档化**: .md 文件既是文档也是配置

### 劣势
1. ❌ **作用域问题**: setupCode 和 updateCode 分离导致变量可见性问题
2. ❌ **AI 困惑**: AI 不清楚哪些代码在 setup，哪些在 update
3. ❌ **instanceof 失效**: 类定义在 setupCode 中，updateCode 无法使用
4. ❌ **维护复杂**: 需要维护拼接逻辑

## 文件清单

### API 层
- `api/ai.ts` - AI 代理
- `api/games.ts` - 游戏存储 API

### Skeleton 系统
- `api/generation/skeletons/engine.ts` - 引擎核心
- `api/generation/skeletons/loader.ts` - Markdown 加载器
- `api/generation/skeletons/registry.ts` - Skeleton 注册
- `api/generation/skeletons/types.ts` - 类型定义
- `api/generation/skeletons/definitions/*.md` - 16 个游戏类型定义

### 前端
- `components/GameHarness.tsx` - 游戏执行器
- `App.tsx` - 主应用
- `presentation/` - UI 组件

### 基础设施
- `infrastructure/input/` - 输入源
- `infrastructure/persistence/` - 数据持久化
- `infrastructure/qa/` - QA 验证
- `infrastructure/ai/` - AI 服务

## 技术栈

- **前端**: React + TypeScript + Vite
- **后端**: Vercel Serverless Functions
- **AI**: unified-ai-backend (自建)
- **数据库**: Prisma (配置存在但未使用)

## 当前状态

✅ **可用的功能**:
- Skeleton 系统完整
- 16 种游戏类型定义
- AI 代理正常工作

⚠️ **已知问题**:
- 代码拼接导致的作用域问题
- AI 生成质量不稳定
- 缺少完整的生成流程（Director → Engineer → Stitcher）

## 下一步建议

根据之前的讨论，有两个方向：

### 方案 A: 保持拼接，优化 Skeleton
- 改进 .md 文件格式
- 更清晰的作用域说明
- 更好的 AI 提示词

### 方案 B: 完整代码生成
- Skeleton 作为开发文档（不是代码模板）
- AI 生成完整代码（包括 Engine）
- 使用自然语言规范指导 AI

---

**当前版本**: 代码拼接架构（Rollback 版本）
**Skeleton 文件**: 已保留
**状态**: 稳定但有已知限制
