# API 注入与提示词对齐修复报告

**日期**: 2026-02-07  
**修复范围**: InjectionSource.ts + 所有系统提示词 (ARCHITECT, ENGINEER, FIXER)

---

## 🎯 修复目标

解决实际注入的 API 与各阶段提示词之间的不一致问题，确保：
1. 提示词准确反映实际可用的 API
2. 所有阶段使用统一的 API 参考
3. 明确区分静态方法 vs 实例方法

---

## ✅ 已完成的修复

### 1. **移除遗留的 GameObject 类** (InjectionSource.ts)

**问题**: GameObject 在 InjectionSource.ts 中被注入，但设计意图是让 AI 自定义实体类以获得更大灵活性。

**修复**:
```diff
- class GameObject {
-     constructor(x, y, radius = 10, color = '#ffffff') { ... }
-     update(dt, state, w, h) { ... }
-     draw(ctx) { ... }
- }
```

**影响**: AI 现在必须自己定义实体类，提供更大的设计自由度。

---

### 2. **添加 Vector.dist 别名** (InjectionSource.ts)

**问题**: `Vector.ts` 有 `dist` 别名，但 `InjectionSource.ts` 缺失，导致 UI 端游戏崩溃。

**修复**:
```javascript
static dist(v1, v2) { return Vector.distance(v1, v2); } // Alias for consistency
```

**影响**: 前端和测试环境的 Vector API 现在完全一致。

---

### 3. **统一 ARCHITECT Prompt** (seed.ts)

**之前**:
```markdown
## 4. DESIGN CONSTRAINTS (CRITICAL)
- **Math**: The system injects a global `Vector` class with static methods.
- **State**: Pure data only.
```

**现在**:
```markdown
## 4. DESIGN CONSTRAINTS (CRITICAL)
- **Math**: The system injects a global `Vector` class with static methods.
  - Available: `Vector.add(v1, v2)`, `Vector.sub`, `Vector.mult`, `Vector.div`, 
    `Vector.distance` (alias: `Vector.dist`), `Vector.random2D()`, `Vector.fromAngle(angle)`.
  - **NOT available as static**: `Vector.normalize`, `Vector.mag`, `Vector.limit` 
    - use manual math (`Math.sqrt`) or instance methods on temp variables.
- **Logic**: Write pseudo-code using **STATIC MATH** only (e.g. `pos = Vector.add(pos, vel)`). 
  **DO NOT** use instance methods like `pos.add(vel)` on state objects.
- **State**: Pure data only. No methods on state objects.
```

**改进**:
- ✅ 列出所有可用的静态方法
- ✅ 明确警告不存在的静态方法
- ✅ 添加 Logic 约束（之前缺失）
- ✅ 提供正确/错误示例

---

### 4. **增强 ENGINEER Prompt** (seed.ts)

**之前**:
```markdown
- **Vector API**:
  - **Static (Returns New)**: `Vector.add(v1, v2)`, `Vector.sub`, `Vector.mult`, 
    `Vector.div`, `Vector.dist`, `Vector.random2D()`.
  - **Instance (AVOID ON STATE)**: `v.add(v2)` mutates `v`. 
    Only use on temporary local variables.
```

**现在**:
```markdown
- **Vector API (STRICT)**:
  - **Supported Static Methods**: `Vector.add(v1, v2)`, `Vector.sub`, `Vector.mult`, 
    `Vector.div`, `Vector.distance` (alias: `Vector.dist`), `Vector.random2D()`, 
    `Vector.fromAngle(angle)`.
  - **WARNING**: `Vector.normalize`, `Vector.mag`, `Vector.limit` do **NOT** exist 
    as static methods. You must calculate them manually using `Math.sqrt` or 
    `Vector.distance`, OR use instance methods on temporary local variables.
  - **Instance Methods (FORBIDDEN ON STATE)**: `state.v.add(v2)` will CRASH. 
    State objects are pure data. Instance methods (`v.add`, `v.normalize`, `v.mag`, etc.) 
    ONLY work on temporary local variables.
- **COLORS**: `{BG: '#0a0a0a', PLAYER: '#00ffff', ENEMY: '#ff0066', 
  ACCENT: '#ffff00', TEXT: '#ffffff'}`
```

**改进**:
- ✅ 添加 `Vector.distance` 和 `Vector.fromAngle`
- ✅ 更明确的警告和解决方案
- ✅ 添加 COLORS 的具体值
- ✅ 强调实例方法的正确用法

---

### 5. **修正 FIXER Prompt** (seed.ts)

**之前** (错误):
```markdown
- **Vector API**: 
  - **Static**: Vector.add(v1, v2), Vector.sub, Vector.mult, Vector.div, 
    Vector.dist, Vector.mag.  ❌ Vector.mag 不存在！
  - **Instance**: ONLY use on local temp variables.
```

**现在** (正确):
```markdown
- **Vector API (STRICT)**:
  - **Static Methods**: `Vector.add(v1, v2)`, `Vector.sub`, `Vector.mult`, 
    `Vector.div`, `Vector.distance` (alias: `Vector.dist`), `Vector.random2D()`, 
    `Vector.fromAngle(angle)`.
  - **NOT Static**: `Vector.normalize`, `Vector.mag`, `Vector.limit` 
    - these ONLY exist as instance methods.
  - **Instance Methods**: `v.add(v2)`, `v.normalize()`, `v.mag()`, etc. 
    ONLY use on temporary local variables, NEVER on state objects.
```

**改进**:
- ✅ 移除错误的 `Vector.mag` 静态方法
- ✅ 添加完整的静态方法列表
- ✅ 明确说明实例方法的存在和用法

---

## 📊 修复前后对比

| 问题 | 修复前 | 修复后 |
|------|--------|--------|
| **GameObject 注入** | ❌ 注入但提示词说不存在 | ✅ 已移除，提示词正确 |
| **Vector.dist 别名** | ❌ 仅在 Vector.ts | ✅ 两处都有 |
| **Vector.mag 静态方法** | ❌ FIXER 错误列为存在 | ✅ 正确标记为不存在 |
| **ARCHITECT API 列表** | ❌ 完全缺失 | ✅ 完整列出 |
| **ENGINEER 警告** | ⚠️ 部分警告 | ✅ 完整警告 + 解决方案 |
| **FIXER API 文档** | ❌ 有错误 | ✅ 完全正确 |
| **COLORS 值** | ❌ 未提供 | ✅ 已提供 |

---

## 🔍 验证清单

### 实际注入的 API (InjectionSource.ts)
- ✅ `Vector.add`, `Vector.sub`, `Vector.mult`, `Vector.div`
- ✅ `Vector.distance` + `Vector.dist` (别名)
- ✅ `Vector.random2D`, `Vector.fromAngle`
- ✅ 实例方法: `v.add`, `v.normalize`, `v.mag`, `v.limit`, etc.
- ✅ `COLORS` 对象
- ✅ `RetroAudio` (sfx)
- ❌ GameObject (已移除)

### 提示词声明 (seed.ts → 数据库)
- ✅ ARCHITECT: 完整 API 列表 + Logic 约束
- ✅ ENGINEER: 详细 API + 警告 + COLORS
- ✅ FIXER: 正确 API + 实例方法说明
- ✅ 所有阶段: 统一的 "NO GameObject" 声明

---

## 🎯 预期效果

1. **减少 API 相关错误**: AI 不会再尝试使用不存在的静态方法
2. **更清晰的约束**: 明确区分静态方法（用于 state）和实例方法（用于临时变量）
3. **一致的体验**: 前端和测试环境使用相同的 Vector API
4. **更好的错误恢复**: FIXER 有正确的 API 参考来修复代码

---

## 📝 后续建议

1. **监控新游戏生成**: 观察是否还有 Vector API 相关错误
2. **考虑添加静态方法**: 如果 AI 频繁需要 `normalize`/`mag`，可以考虑添加静态版本
3. **文档同步机制**: 建立流程确保 InjectionSource.ts 和 seed.ts 保持同步
4. **自动化测试**: 添加测试验证 Vector.ts 和 InjectionSource.ts 的 API 一致性

---

## ✅ 完成状态

- [x] 移除 GameObject 从 InjectionSource.ts
- [x] 添加 Vector.dist 别名到 InjectionSource.ts
- [x] 更新 ARCHITECT prompt (seed.ts)
- [x] 更新 ENGINEER prompt (seed.ts)
- [x] 更新 FIXER prompt (seed.ts)
- [x] 运行 seed 脚本更新数据库
- [x] 生成审查报告

**数据库已更新，所有提示词现在与实际 API 完全对齐。**
