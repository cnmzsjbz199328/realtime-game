# GenGame Studio - Agentic Real-time Game Generation

[English](#english) | [简体中文](#简体中文)

---

<a name="english"></a>
## English

GenGame Studio is a cutting-edge platform that leverages Large Language Models (LLMs) to generate fully playable, high-quality HTML5 Canvas games in real-time. It features an agentic workflow that manages game design, code engineering, and quality assurance.

### 🚀 Key Features

- **Real-time Game Generation**: Generate a unique game from a simple topic or detailed prompt within seconds.
- **Agentic Workflow**:
    - **Director**: Classifies requirements and selects the perfect game skeleton.
    - **Engineer**: Generates robust, algorithmically sound JavaScript code.
    - **QA Validator**: Automatically performs smoke tests and input fuzzing to ensure stability.
- **Live Source Editing**: Modify the generated game's logic on the fly with a built-in code editor and "Fork" new versions.
- **Leaderboard**: Save your creations and explore games made by the community.
- **Premium UI/UX**: Stunning neon-cyberpunk aesthetic with glassmorphism and smooth micro-animations.

### 🛠️ Technology Stack

- **Frontend**: React 18, Vite, Vanilla CSS (Modern Design System).
- **Backend**: Vercel Serverless Functions (Node.js/TypeScript).
- **Database**: Prisma ORM with PostgreSQL (hosted on Neon/Supabase).
- **Game Engine**: Custom lightweight HTML5 Canvas interface.
- **AI Integration**: Unified AI Backend Proxy.

### 🛡️ Deterministic API Injection System

To ensure stability in AI-generated code, we implemented a rigorous "Closed-Loop" injection system:

1.  **Static Method Pre-fabrication (Runtime)**
    - The `Vector` class is fully implemented in TypeScript (`core/runtime/std/Vector.ts`) with a comprehensive suite of static methods (e.g., `Vector.add`, `Vector.mult`).
    - These are injected into the game sandbox via `HeadlessSandbox` and `InjectionSource`, ensuring consistent behavior across all environments.

2.  **Prompt Whitelisting (Design)**
    - **Closed List Strategy**: The AI is explicitly restricted to a whitelist of available APIs.
    - **Anti-Hallucination**: Prompts explicitly warn against using non-existent methods (e.g., "Do not use `v.add()`, use `Vector.add(v1, v2)`").

3.  **Stage-Specific Prompts (Orchestration)**
    - **Architect**: Defines the technical constraints and API usage rules in the Game Design Document.
    - **Engineer**: Focuses on implementation while strictly adhering to the "No `this`" and "No Global State" rules.
    - **Fixer**: Analyzes runtime errors and cross-references them with the API whitelist to auto-correct hallucinations (e.g., changing `v.mag()` to `Vector.mag(v)`).

4.  **Frontend Pre-check (Verification)**
    - The `HeadlessBrowserValidator` (QA) runs a synchronized Mock Environment that mirrors the production runtime 1:1.
    - This ensures that code passing QA will consistently run in the browser without "undefined function" errors.

### 📂 Project Structure

- `/api`: Public serverless entry points (optimized for Vercel Hobby Plan).
- `/server`: Core backend logic (Director, Engineer, Fixer services and Game Skeletons).
- `/core`: Domain types and shared utilities.
- `/application`: Application-level logic and React hooks.
- `/presentation`: UI components (Features, Layout, Atomic components).
- `/infrastructure`: External service implementations (AI clients, Persistence).

### 🏁 Getting Started

1. **Clone the repository**:
   ```bash
   git clone <your-repo-url>
   cd realtime-game
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Set up Environment Variables**:
   Create a `.env` file based on `.env.example`:
   ```env
   DATABASE_URL="your-postgres-url"
   # ... other keys
   ```

4. **Initialize Database**:
   ```bash
   npx prisma db push
   npx prisma generate
   ```

5. **Run Locallly**:
   ```bash
   npm run dev
   ```

---

<a name="简体中文"></a>
## 简体中文

GenGame Studio 是一个利用大语言模型（LLM）实时生成高质量 HTML5 Canvas 游戏的创新平台。它通过智能体（Agent）工作流，自动完成游戏设计、代码工程和质量校验。

### 🚀 核心特性

- **实时游戏生成**: 只需输入一个主题或复杂创意，即可在几秒钟内生成可玩的游戏。
- **智能体工作流**:
    - **总监 (Director)**: 分析需求并选择最合适的游戏模板（Skeleton）。
    - **工程师 (Engineer)**: 生成逻辑严密、算法健壮的 JavaScript 代码。
    - **质量校验 (QA)**: 自动执行冒烟测试和输入压力测试，确保运行稳定。
- **源码在线编辑**: 内置代码编辑器，支持实时修改游戏逻辑并“派生”新版本。
- **排行榜与社区**: 保存您的杰作，点赞并探索社区创作的热门游戏。
- **高级 UI/UX**: 极致的霓虹赛博朋克风格，结合磨砂玻璃质感与动态微交互。

### 🛠️ 技术栈

- **前端**: React 18, Vite, 原生 CSS (现代设计系统)。
- **后端**: Vercel Serverless Functions (Node.js/TypeScript)。
- **数据库**: Prisma ORM + PostgreSQL (Neon/Supabase 托管)。
- **游戏引擎**: 自研轻量级 HTML5 Canvas 运行环境。
- **AI 集成**: 统一 AI 后端代理服务。

### 🛡️ 确定性 API 注入系统

为了确保 AI 生成代码的稳定性，我们实施了一套严格的“闭环”注入系统：

1.  **静态方法预制 (运行时)**
    - `Vector` 类在 TypeScript (`core/runtime/std/Vector.ts`) 中完整实现，包含全套静态方法（如 `Vector.add`, `Vector.mult`）。
    - 这些方法通过 `HeadlessSandbox` 和 `InjectionSource` 注入到游戏沙箱中，确保环境一致性。

2.  **提示词白名单 (设计)**
    - **封闭列表策略**: AI 被明确限制在可用 API 的白名单内。
    - **反幻觉机制**: 提示词明确警告禁止使用不存在的方法（例如：“禁止使用 `v.add()`，必须使用 `Vector.add(v1, v2)`”）。

3.  **各阶段提示词特异性 (编排)**
    - **架构师 (Architect)**: 在设计阶段将 API 约束写入技术规格书 (Tech Spec)。
    - **工程师 (Engineer)**: 专注于逻辑实现，同时严格遵守“无 `this`”和“无全局变量”规则。
    - **修复者 (Fixer)**: 分析运行时错误，并对照 API 白名单自动纠正幻觉（例如自动将 `v.mag()` 修正为 `Vector.mag(v)`）。

4.  **前端代码预检 (验证)**
    - `HeadlessBrowserValidator` (QA) 运行一个与生产环境 1:1 同步的 Mock 环境。
    - 确保通过 QA 的代码在浏览器中运行绝对稳定，消除“未定义方法”错误。

### 📂 项目结构

- `/api`: 公开的云函数入口）。
- `/server`: 后端核心逻辑（Director, Engineer, Fixer 服务及游戏模板）。
- `/core`: 领域模型定义与共享工具类。
- `/application`: 应用层逻辑与状态管理 (React Hooks)。
- `/presentation`: UI 组件库 (按基础组件、布局、功能模块划分)。
- `/infrastructure`: 基础设施实现 (AI 客户端、持久化层)。

### 🏁 快速开始

1. **克隆仓库**:
   ```bash
   git clone <your-repo-url>
   cd realtime-game
   ```

2. **安装依赖**:
   ```bash
   npm install
   ```

3. **配置环境**:
   参考 `.env.example` 创建 `.env` 文件并填入数据库地址及密钥。

4. **同步数据库**:
   ```bash
   npx prisma db push
   npx prisma generate
   ```

5. **本地运行**:
   ```bash
   npm run dev
   ```

---
© 2024 GenGame Studio. Built with ❤️ by cnmzsjbz199328.
