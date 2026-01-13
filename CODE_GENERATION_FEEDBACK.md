# AI Code Generation: Common Pitfalls & Prompt Engineering Feedback

This document summarizes the recurring issues encountered during the dynamic generation of game logic. Use these findings to refine the System Prompts for the `EngineerService` and `FixerService`.

## 1. Time Step & Physics Instability

### Symptom
*   **"The game is frozen."**
*   **"Objects teleport instantly off-screen."**
*   **"Velocity numbers are huge (e.g., 5000)."**

### Root Cause
**Unit Mismatch (Seconds vs. Milliseconds):** The AI often assumes `deltaTime` is in seconds (e.g., `0.016`), while the harness provides milliseconds (e.g., `16.6`), or vice-versa.
*   *Scenario A:* Code writes `x += speed * dt`. If `speed=100` and `dt=16` (ms treated as s), object moves 1600px per frame (screen wipe).
*   *Scenario B:* Code writes `x += speed * (dt/1000)`. If `dt=0.016` (s treated as ms), object moves 0.0016px per frame (frozen).

### Prompt Improvement
> **Rule:** "Always normalize `deltaTime`. Detect the unit size at the start of `update`. If `deltaTime > 1`, assume milliseconds and divide by 1000. If `deltaTime <= 1`, assume seconds."
> **Code Pattern:**
> ```javascript
> let dt = deltaTime || 0.016;
> if (dt > 1) dt /= 1000;
> ```

---

## 2. Input Safety & Crash Loops

### Symptom
*   **"Critical System Failure" immediately upon load.**
*   **"Cannot read properties of undefined (reading 'KeyW')."**

### Root Cause
**Unsafe Property Access:** The AI assumes `input.keys` is always populated. In the very first frame or specific harness states, `input` or `input.keys` might be `undefined` or empty.
*   *Bad Code:* `if (input.keys['KeyW']) ...`
*   *Good Code:* `if (input.keys && input.keys['KeyW']) ...`

### Prompt Improvement
> **Rule:** "Defensive Coding is mandatory. Never access nested properties of `input` without checking if the parent exists. Use optional chaining `?.` or explicit checks."

---

## 3. Scope & Execution Context

### Symptom
*   **"ReferenceError: Enemy is not defined."**
*   **`Unexpected token '{'`**

### Root Cause
1.  **Hoisting Issues:** Defining `class Enemy {}` *after* the `return { ... }` block. In the function wrapper used by the harness, code after the `return` statement is unreachable or not hoisted depending on the exact eval method.
2.  **Object Literal Syntax:** Using ES6 method shorthand (`init() { ... }`) inside the returned object, which can fail in certain strict parsers or if the generation format is slightly off.

### Prompt Improvement
> **Rule:** "Define all helper classes and functions **BEFORE** the `return` statement."
> **Rule:** "Use standard function property syntax in the returned object: `init: function(s, w, h) { ... }`, NOT `init(s, w, h) { ... }`."

---

## 4. Canvas & Coordinate Management

### Symptom
*   **"The game is just a black screen with text."** (Game is rendering off-canvas)
*   **"I can't move to the right side."** (Hardcoded coordinate limits)
*   **"The maze is tiny in the corner."** or **"The maze goes off screen."**

### Root Cause
1.  **Hardcoded Offsets:** AI tries to center things by adding arbitrary numbers (e.g., `offsetX = 250`), which breaks when the container size changes.
2.  **Logic/Render Coupling:** Mixing collision logic with rendering offsets. If the player logic says `x=10`, but render says `x+offset`, the collision detection often fails to account for the offset, causing "ghost walls".

### Prompt Improvement
> **Rule:** "Keep Logical Coordinates simple (0,0 to Width,Height). Use `ctx.translate` in the `draw` function for centering/camera effects, but DO NOT bake offsets into the physics logic."
> **Rule:** "Always use the `width` and `height` arguments passed to `init` and `draw` for boundary checks. Never assume 800x600."

---

## 5. State Management & Re-Entrancy

### Symptom
*   **"I restarted the game but the score kept going up."**
*   **"Enemies from the previous game are still there."**
*   **"Shadows/Blur effects persist on the UI."**

### Root Cause
1.  **Dirty Initialization:** `init` function doesn't reset *all* state variables (e.g., clearing the `enemies` array or resetting `score`).
2.  **Canvas State Pollution:** Modifying global canvas context properties (like `shadowBlur`, `globalAlpha`, `translate`) without `ctx.save()` and `ctx.restore()`.

### Prompt Improvement
> **Rule:** "The `init` function must fundamentally reset the ENTIRE game state object. Assume `state` contains garbage data from a previous run."
> **Rule:** "Wrap all drawing operations that change context properties in `ctx.save()` and `ctx.restore()`."

---

## 6. Logic complexity vs. Reliability

### Symptom
*   **"The generated code is too complex to debug."**
*   **code cut off or syntax errors due to length.**

### Root Cause
**Over-engineering:** AI trying to implement complex algorithms (A* pathfinding, complex physics engines) in a single file without external libraries, increasing the chance of syntax/logic errors.

### Prompt Improvement
> **Rule:** "Prefer robustness over complexity. Use simple AABB collision. Use simple state machines. Do not implement complex pathfinding unless explicitly requested."
