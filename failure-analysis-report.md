# 🔴 AI 游戏生成失败分析报告

> **日期**: 2026-01-22  
> **项目**: realtime-game  
> **对比参考**: canvas2d (高成功率项目)
> **状态**: 关键缺陷已定位

---

## 🛑 核心发现： "宪法"与"现实"的严重脱节

经过对 `IssueRecord.json` 中大量 "Can't find variable: Vector" 和 "GameObject is not defined" 错误的分析，结合 `GameHarness.tsx` 的源码审查，我们发现了一个导致低成功率的**致命架构缺陷**：

> **提示词承诺了沙盒中存在 `Vector` 和 `GameObject` 全局类，但实际上运行时环境中根本没有注入这些类。**

### 1. 谎言（The Lie）
在 `EngineerService.ts` 的系统提示词中，我们明确告诉 AI：
```javascript
// === ENGINE INTERFACE ===
// Available Globals in the sandbox:
class Vector { ... }
class GameObject { ... }
```
并且强调：
> `5. **Core Classes**: Use the provided Vector and GameObject. DO NOT redefine them.`

### 2. 现实（The Reality）
在 `GameHarness.tsx` 的执行逻辑中：
```javascript
const createGame = new Function(gameDef.code);
const result = createGame();
```
**并没有任何地方将 `Vector` 或 `GameObject` 注入到 `new Function` 的作用域中。** 也不存在 `window.Vector`。

### 3. 结果（The Consequence）
*   **当 AI 听话时**：它不重新定义类，直接使用 `new Vector()`  ---> 💥 **Runtime Error: Vector is not defined** (这是最常见的报错)。
*   **当 AI 不听话时**：它主要重新定义了类 ---> ⚠️ **代码冗余/冲突**，但在当前验证体系下反而能跑通（这就是为什么有些游戏能成）。
*   **当 AI 亦步亦趋时**：它尝试从 `window` 解构 (`const { Vector } = window`) ---> 💥 **Cannot read properties of undefined**。

---

## 第一部分：IssueRecord.json 深度解码

从 `IssueRecord.json` 的 18 条记录中，我们可以清晰地看到这个架构缺陷引发的灾难：

| 错误信息 | 出现次数 | 根本原因分析 | 是谁的错？ |
| :--- | :---: | :--- | :--- |
| `Can't find variable: Vector` | 5 | AI 遵守指令使用了 Vector，但环境没提供 | **基建组 (Harness)** |
| `Can't find variable: GameObject` | 3 | AI 遵守指令使用了 GameObject，但环境没提供 | **基建组 (Harness)** |
| `COLORS is not defined` / `Can't find variable: COLORS` | 1 | 同上，提示词承诺了 COLORS 常量但未注入 | **基建组 (Harness)** |
| `Compilation Error: GameObject is not defined` | 2 | Architect 使用了 `extends GameObject`，环境不支持 | **架构组 (Architect)** |
| `ctx.fillRect is not a function` | 1 | 可能是 AI 搞混了参数顺序 `draw(state, w, h, ctx)` | **AI (Engineer)** |

**结论：超过 60% 的初始生成失败完全是由于 Prompt 和 Harness 不一致造成的。我们惩罚了遵守规则的 AI，奖励了违规的 AI。**

---

## 第二部分：与 canvas2d 的对比（过度设计 vs 极简主义）

### 2.1 设计理念差异

| 特性 | canvas2d (参考项目) | realtime-game (当前项目) | 评价 |
| :--- | :--- | :--- | :--- |
| **基础类库** | **不提供**。AI 需要自己写简单的 `class Ball {...}` 或使用字面量对象。 | **承诺提供但不给**。承诺了 `Vector`/`GameObject` 这种重型 OOP 结构。 | realtime-game **过度设计**，增加了上下文负担且极易出错。 |
| **代码结构** | 扁平化。主要是一个包含 `init/update/draw` 的对象。 | OOP 化。Architect 倾向于生成复杂的类继承树 (`extends`)。 | JS 沙盒对类继承 (extends) 支持不佳，容易导致作用域问题。 |
| **API 协议** | 极简。只约定函数签名。 | 复杂。约定了大量全局变量和 helper 类。 | 协议越复杂，"幻觉"空间越大。 |

### 2.2 为什么 canvas2d 成功率高？
不是因为它即便写错了能修（虽然它确实有验证器），而是因为**它根本不需要 AI 去猜测环境里有什么**。AI 自己写 `x += vx * dt` 永远比调用 `pos.add(vel.multiply(dt))` 更稳健，因为前者不依赖外部黑盒代码。

---

## 第三部分：解决方案

我们面临两个选择：**"补全承诺"** 或 **"收回承诺"**。考虑到 JS 沙盒的特性和 Token 效率，强烈建议**收回承诺**。

### 方案 A：补全承诺（Fix the Infrastructure）
在 `GameHarness.tsx` 中把这些类挂载到 `window` 上或注入。
*   **缺点**：增加了耦合；`new Function` 作用域隔离仍然棘手；AI 可能会假设还有其他原本没承诺的东西（如 `Physics`）。

### 方案 B：收回承诺（Simplify the Spec）- 🌟 **推荐**
修改 System Prompt，删除关于 `Vector` 和 `GameObject` 的承诺。告诉 AI："你是一个极简主义者，不要使用类继承，使用简单的对象和函数。"

#### 推荐的 Prompt 修改 (EngineerService.ts)

```markdown
=== ENGINE INTERFACE ===
1. **NO EXTERNAL DEPENDENCIES**: The sandbox is empty. NO global `Vector`, `GameObject`, or `COLORS` exist.
2. **Define what you need**: If you need a Vector class, write a minimal one inside your code.
3. **Use Plain Objects**: Prefer `{x, y, vx, vy}` literals over complex classes. Avoid `class ... extends ...`.
4. **Globals**: Define your own constants (e.g. `const COLORS = {...}`) at the top of your code.
```

### 实施路线图

1.  **立即执行 (P0)**：
    *   修改 `EngineerService.ts` 中的提示词，**删除**所有关于预定义全局变量的声明。
    *   明确指示 AI 自行定义所需的任何 Helper 类。
2.  **次级执行 (P1)**：
    *   实施 `codeValidator.ts`（参考上一份报告），但规则要更新：**不再禁止重新定义 Vector，反而应鼓励定义它（如果用到了）。**
3.  **架构优化 (P2)**：
    *   调整 Architect 的 Prompt，让它输出更"数据驱动"而非"面向对象"的规范（例如：使用 Entity-Component 风格的数据结构，而不是类继承）。

---

## 结论更新

回顾您的疑问：
> "是开发文档没写好，还是写得太详细，过度设计了？还是代码生成阶段没有严格遵循指令？"

答案是：**文档（Prompt）写得太详细且带有误导性（Over-designed & Misleading）。**

我们构建了一个复杂的"虚拟引擎"概念（包含各种类和全局量），但只实现了一个空的沙盒。AI 严格遵循了指令（使用了承诺存在的 `Vector`），结果掉进了我们挖的坑里。

**去繁就简，回归本质。让 AI 掌控代码的全貌，而不是让它去猜黑盒里有什么。**
