# GenGame Self-Evolutionary Architecture Plan
# 自反馈进化系统开发文档

## 1. Vision (愿景)

构建一个具备**自我进化能力**的游戏生成引擎。系统不仅能生成代码，还能观察生成的缺陷和用户的修改请求，将这些数据作为养料，自动优化自身的 Prompt 策略和骨架定义，从而实现生成质量的指数级提升。

---

## 2. Architecture Comparison (架构演进)

### 2.1 Current Architecture (Linear Flow)
当前架构是线性的单向输出。一旦生成逻辑（Prompt）有缺陷（例如 `deltaTime` 单位问题），必须由人工介入修改代码。

```mermaid
graph LR
    User[用户] --> |Topic| Director[Director Service]
    Director --> |Skeleton| Engineer[Engineer Service\n(Hardcoded Prompt)]
    Engineer --> |Code| Fixer[Fixer Service]
    Fixer --> |Result| DB[(Game DB)]
    DB --> Client
```

### 2.2 Proposed Evolutionary Architecture (Closed Loop)
新架构引入了**反馈回路**和**元代理（Evolution Agent）**。Prompt 不再硬编码，而是动态加载的资产。

```mermaid
graph TD
    subgraph "Execution Layer (运行时)"
        User[用户] --> |Topic| Director
        Director --> |Read Prompt| PromptsDB[(Prompt/Skeleton DB)]
        PromptsDB --> Engineer
        Engineer --> |Generate| Code
        Code --> |Runtime Error| FeedbackService
        User --> |"Remix/Optimize" Request| FeedbackService
    end

    subgraph "Data Layer (记忆与积淀)"
        FeedbackService --> |Log Issue| IssuesTbl[Issues Table]
        FeedbackService --> |Log Optimization| OptTbl[Optimizations Table]
    end

    subgraph "Evolution Layer (大脑)"
        IssuesTbl --> |Trigger (>20)| EvolutionAgent[Evolution Agent]
        OptTbl --> |Trigger (>20)| EvolutionAgent
         EvolutionAgent --> |Analyze Patterns| Insight[Insight]
        Insight --> |Update System Prompt| PromptsDB
        Insight --> |Update Skeleton Def| PromptsDB
        Insight --> |Create New Skeleton| PromptsDB
    end
```

---

## 3. Database Design (数据模型)

为了支撑该系统，需要新增/修改以下 Schema（Prisma 示例）：

### 3.1 Prompts & Skeletons (动态配置)
将 Prompt 从代码中解耦。

```prisma
// 存储 System Prompt 及其版本
model SystemPrompt {
  id          String   @id @default(uuid())
  role        String   // 'ENGINEER', 'DIRECTOR', 'FIXER'
  content     String   // 具体的 Prompt 内容
  version     Int      // 版本号 (v1, v2...)
  isActive    Boolean  @default(false)
  createdAt   DateTime @default(now())
}

// 骨架定义也入库
model Skeleton {
  id          String   @id
  name        String
  description String
  promptAddon String   // 该骨架特有的 Prompt 补充
  version     Int
}
```

### 3.2 Feedback Loop (养料)

```prisma
// 记录运行时错误或 Fixer 的修复记录
model IssueRecord {
  id          String   @id @default(uuid())
  gameId      String
  errorType   String   // 'SYNTAX', 'RUNTIME', 'LOGIC'
  errorMsg    String
  fixPrompt   String?  // Fixer 当时是怎么修好的
  skeletonId  String   // 关联的骨架，便于统计哪个骨架问题多
  status      String   // 'PENDING', 'PROCESSED'
}

// 记录用户的优化需求 (Remix)
model OptimizationRecord {
  id          String   @id @default(uuid())
  gameId      String
  userRequest String   // 用户说："让敌人移动慢一点"
  diff        String?  // 代码变更 diff (用于让 AI 学习怎么改)
  skeletonId  String
  status      String   // 'PENDING', 'PROCESSED'
}
```

---

## 4. Implementation Workflow (实施流程)

### Phase 1: Feedback Collection (当前可见的任务)
目标：建立数据收集渠道，让所有错误和用户需求落地到数据库。

1.  **Backend**: `FixerService` 在修复成功后，不仅返回代码，还要向生成的 `IssueRecord` 表插入一条记录：“我修复了一个 `deltaTime` 问题，骨架是 `Action`”。
2.  **Frontend**: 在 "Source" 页面增加 **"Remix w/ AI"** 按钮。
    *   用户点击输入：“这游戏太难了，加三条命”。
    *   调用新接口 `/api/generation/remix`。
    *   该接口调用 AI 修改代码，并将用户的请求 + 修改前后的对比 存入 `OptimizationRecord`。

### Phase 2: Dynamic Prompts (架构重构)
目标：`EngineerService` 不再读取本地 String，而是读取数据库。

1.  在数据库初始化（Seed）默认的 Prompt。
2.  修改 `EngineerService.ts`，在 `generate` 之前先 `db.systemPrompt.findFirst({ where: { role: 'ENGINEER', isActive: true } })`。
3.  Skeleton 同理，`registry.ts` 改为从数据库缓存中读取。

### Phase 3: The Evolution Agent (核心大脑)
目标：自动化优化。

1.  创建一个定时任务 (Cron Job) 或触发器。
2.  **逻辑**：
    *   检查 `IssueRecord`，如果 `skeletonId='platformer'` 的记录中有 20 条包含了 "fell through floor" (穿模)。
    *   启动 `EvolutionAgent`。
    *   **Prompt**: "Here are 20 bug reports about physics collisions. Here is the current Platformer Skeleton Prompt. Rewrite the prompt to prevent this pattern."
    *   **Action**: Agent 生成新的 Prompt，存入 `Skeleton` 表，版本号 +1。

---

## 5. Potential Risks & Control (风控)

1.  **提示词退化 (Prompt Drift)**: AI 可能会为了修复一个小 bug 而破坏了整体结构。
    *   *Solution*: **金丝雀发布 (Canary Rollout)**。新生成的 Prompt 只应用于 10% 的新用户请求，如果报错率飙升，自动回滚。
2.  **无限循环**: 自动生成的 Prompt 可能导致更多错误。
    *   *Solution*: 设置版本迭代上限，且每次大版本更新（Evolution）最好有人工简单的 Review 按钮（"Approve V2.0"）。

## 6. Next Immediate Steps (下一步行动)

1.  **Frontend**: 在代码预览页添加 Remix 输入框。
2.  **Backend API**: 实现 `/api/generation/remix` 接口，这是收集“用户想要什么”的最佳途径。
3.  **Database**: 迁移 Prisma Schema，增加上述反馈表。
