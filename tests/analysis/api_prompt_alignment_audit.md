# API 注入与提示词对齐审查报告

## 1. 实际注入的 Vector API（InjectionSource.ts）

### 静态方法（Static Methods）
```javascript
✅ Vector.distance(v1, v2)  // 计算两点距离
✅ Vector.dist(v1, v2)      // distance 的别名
✅ Vector.add(v1, v2)       // 向量加法
✅ Vector.sub(v1, v2)       // 向量减法
✅ Vector.mult(v, n)        // 标量乘法
✅ Vector.div(v, n)         // 标量除法
✅ Vector.random2D()        // 随机单位向量
✅ Vector.fromAngle(angle, length) // 从角度创建向量
```

### 实例方法（Instance Methods - 仅用于临时变量）
```javascript
✅ v.add(v2)          // 修改自身
✅ v.sub(v2)          // 修改自身
✅ v.multiply(s)      // 修改自身
✅ v.mult(s)          // multiply 别名
✅ v.divide(s)        // 修改自身
✅ v.div(s)           // divide 别名
✅ v.mag()            // 获取长度
✅ v.magnitude()      // mag 别名
✅ v.normalize()      // 归一化（修改自身）
✅ v.limit(max)       // 限制长度
✅ v.dist(v2)         // 实例方法版本的距离
✅ v.dot(v2)          // 点积
✅ v.cross(v2)        // 叉积
```

## 2. 提示词声明的 API

### ARCHITECT Prompt
```markdown
## 4. DESIGN CONSTRAINTS (CRITICAL)
- **Math**: The system injects a global `Vector` class with static methods. 
  **DO NOT** specify a custom Vector class in the Schema.
- **Logic**: Write pseudo-code using **STATIC MATH** only 
  (e.g. `pos = Vector.add(pos, vel)`). 
  **DO NOT** use instance methods like `pos.add(vel)` on state objects.
- **State**: Pure data only. No methods on state objects.
```

**问题**：
❌ 没有列出具体可用的静态方法
❌ 没有警告哪些方法不存在（如 normalize, mag, limit 的静态版本）

### ENGINEER Prompt
```markdown
5. **ENVIRONMENT GUARANTEE (CRITICAL)**:
   - **Vector** and **COLORS** are **ALREADY INJECTED** globally.
   - **DO NOT** declare them (e.g. `const Vector = ...` or `class Vector`). 
     This will crash the sandbox.
   - **Just use them directly**: `Vector.add(v1, v2)`.
   - **Vector API (STRICT)**:
     - **Supported Static Methods**: 
       `Vector.add(v1, v2)`, `Vector.sub`, `Vector.mult`, `Vector.div`, 
       `Vector.dist`, `Vector.random2D()`, `Vector.fromAngle(angle)`.
     - **WARNING**: `Vector.normalize`, `Vector.mag`, `Vector.limit` do **NOT** exist. 
       You must calculate them manually using `Math.sqrt` or `Vector.dist`.
     - **Instance (FORBIDDEN ON STATE)**: `state.v.add(v2)` will CRASH. 
       State objects are pure data. Only use instance methods on temporary local variables.
```

**问题**：
❌ 列出了 `Vector.dist` 但没有列出 `Vector.distance`（实际两者都存在）
⚠️ 警告说 `Vector.normalize`, `Vector.mag`, `Vector.limit` 不存在，但这些作为**实例方法**是存在的

### FIXER Prompt
```markdown
- **ENVIRONMENT GUARANTEE**: `Vector` and `COLORS` are provided globally. 
  **DO NOT** declare them.
- **Vector API**: 
  - **Static**: Vector.add(v1, v2), Vector.sub, Vector.mult, Vector.div, 
    Vector.dist, Vector.mag.
  - **Instance**: ONLY use on local temp variables.
```

**问题**：
❌ 列出了 `Vector.mag` 作为静态方法，但实际上**不存在**静态版本
❌ 没有列出 `Vector.distance`
❌ 没有列出 `Vector.random2D`, `Vector.fromAngle`

### REMIXER Prompt
```markdown
5. **Core Classes**:
   - Environment provides: `Vector`, `COLORS`.
   - **NOT Provided**: `GameObject`.
```

**问题**：
❌ 完全没有列出 Vector 的具体 API
❌ 没有约束说明

## 3. 对齐问题总结

### 🔴 严重不一致

| API | 实际存在 | ARCHITECT | ENGINEER | FIXER | REMIXER |
|-----|---------|-----------|----------|-------|---------|
| `Vector.distance` | ✅ | ❌ 未提及 | ❌ 未提及 | ❌ 未提及 | ❌ 未提及 |
| `Vector.dist` | ✅ | ❌ 未提及 | ✅ 列出 | ✅ 列出 | ❌ 未提及 |
| `Vector.mag` (static) | ❌ **不存在** | ❌ 未提及 | ❌ 正确警告不存在 | ❌ **错误列为存在** | ❌ 未提及 |
| `Vector.normalize` (static) | ❌ **不存在** | ❌ 未提及 | ✅ 正确警告不存在 | ❌ 未提及 | ❌ 未提及 |
| `Vector.limit` (static) | ❌ **不存在** | ❌ 未提及 | ✅ 正确警告不存在 | ❌ 未提及 | ❌ 未提及 |
| `Vector.random2D` | ✅ | ❌ 未提及 | ✅ 列出 | ❌ 未提及 | ❌ 未提及 |
| `Vector.fromAngle` | ✅ | ❌ 未提及 | ✅ 列出 | ❌ 未提及 | ❌ 未提及 |

### 🟡 实例方法混淆

**实际情况**：
- `v.mag()`, `v.normalize()`, `v.limit()` **作为实例方法存在**
- 但**没有对应的静态方法** `Vector.mag()`, `Vector.normalize()`, `Vector.limit()`

**提示词问题**：
- ENGINEER 正确警告静态版本不存在
- FIXER **错误地**列出 `Vector.mag` 为静态方法
- 没有明确说明这些方法作为实例方法是可用的（用于临时变量）

## 4. 建议的修复方案

### 方案 A：统一提示词（推荐）

创建一个**标准 Vector API 参考块**，在所有阶段复用：

```markdown
### VECTOR API REFERENCE (INJECTED GLOBALLY)

**Static Methods (Pure Functions)**:
- `Vector.add(v1, v2)` → new Vector
- `Vector.sub(v1, v2)` → new Vector
- `Vector.mult(v, scalar)` → new Vector
- `Vector.div(v, scalar)` → new Vector
- `Vector.distance(v1, v2)` → number (also aliased as `Vector.dist`)
- `Vector.random2D()` → new Vector
- `Vector.fromAngle(angle, length=1)` → new Vector

**Instance Methods (ONLY for temporary local variables, NOT state objects)**:
- `v.add(v2)`, `v.sub(v2)`, `v.mult(s)`, `v.div(s)` → modifies self
- `v.mag()` → number (magnitude/length)
- `v.normalize()` → modifies self to unit vector
- `v.limit(max)` → modifies self to max length
- `v.dist(v2)` → number (distance to v2)
- `v.dot(v2)`, `v.cross(v2)` → number

**CRITICAL RULES**:
1. State objects MUST use static methods: `state.pos = Vector.add(state.pos, vel)`
2. Instance methods ONLY on temp vars: `let temp = new Vector(x, y); temp.normalize();`
3. NO static versions of: `normalize`, `mag`, `limit` - use manual math or instance methods
```

### 方案 B：扩展 InjectionSource.ts（可选）

添加缺失的静态方法：
```javascript
static mag(v) { return Math.sqrt(v.x * v.x + v.y * v.y); }
static normalize(v) { 
    const m = Vector.mag(v); 
    return m > 0 ? new Vector(v.x / m, v.y / m) : new Vector(0, 0); 
}
static limit(v, max) {
    const m = Vector.mag(v);
    return m > max ? Vector.mult(Vector.normalize(v), max) : new Vector(v.x, v.y);
}
```

**我的建议**：先采用方案 A（统一提示词），观察效果后再决定是否需要方案 B。

## 5. 其他注入的全局对象

### COLORS
```javascript
// 从 InjectionSource.ts
const COLORS = {
  BG: '#0a0a0a',
  PLAYER: '#00ffff',
  ENEMY: '#ff0066',
  ACCENT: '#ffff00',
  TEXT: '#ffffff'
};
```

**提示词状态**：
- ✅ ENGINEER: 提及 COLORS 已注入
- ✅ FIXER: 提及 COLORS 已注入
- ❌ ARCHITECT: 未提及具体颜色值
- ❌ REMIXER: 仅提及存在，无细节

### GameObject
```javascript
// 从 InjectionSource.ts - 实际上是注入的！
class GameObject {
    constructor(x, y, radius = 10, color = '#ffffff') { ... }
    update(dt, state, w, h) { ... }
    draw(ctx) { ... }
}
```

**提示词状态**：
- ❌ ENGINEER: 说 "NO GameObject"
- ❌ FIXER: 说 "NO GameObject"，建议自己定义
- ❌ REMIXER: 说 "NOT Provided: GameObject"

**这是一个严重的不一致！GameObject 实际上是注入的，但所有提示词都说不存在！**

## 6. 立即需要修复的问题

### 优先级 P0（严重）
1. ✅ **GameObject 不一致**：实际注入了，但提示词说没有
2. ✅ **FIXER 的 Vector.mag 错误**：列为静态方法但不存在

### 优先级 P1（重要）
3. ✅ **统一 Vector API 文档**：所有阶段使用相同的参考
4. ✅ **ARCHITECT 缺少具体 API**：需要添加可用方法列表
5. ✅ **REMIXER 完全缺少 API 约束**：需要添加完整说明

### 优先级 P2（改进）
6. ⚠️ **实例方法的正确用法**：明确说明何时可以使用
7. ⚠️ **COLORS 的具体值**：在 ARCHITECT 阶段提供

需要我立即开始修复这些提示词吗？
