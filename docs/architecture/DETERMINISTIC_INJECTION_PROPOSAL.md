# Plan: Deterministic Injection & Pure Data State Architecture

**Status**: **APPROVED / IMPLEMENTATION PHASE**
**Date**: 2026-02-06
**Context**: Fixing Issue #12 (Prototype Loss), Issue #13 (Hybrid Scope), and stabilizing the Verification Pipeline.

---

## 1. Validated Problem Analysis

Based on the Automated Verification runs (Feb 2026), we have confirmed structural failures in the current architecture:

### A. The "Prototype Loss" Crash (CONFIRMED)
*   **Case Study**: *Vampire Survivors Clone* (Artifact `2026-02-06T07-37-38-057Z_vampire`)
*   **Error**: `entity.position.add is not a function`
*   **Cause**: The Sandbox's persistence simulation (`JSON.parse(JSON.stringify(state))`) strips all methods from `Vector` instances stored in `state`.
*   **Root Cause**: **System Prompt Conflict**. The current Engineer prompt explicitly lists "Chainable" methods (`add`, `sub`, `copy`), encouraging OOP-style code (`pos.add(vel)`), which is **incompatible** with our serializable state architecture.

### B. The "Hybrid Scope" Leak (CONFIRMED)
*   **Case Study**: *Space Invaders* (Artifact `2026-02-06T07-34-41-380Z_space`)
*   **Error**: `w is not defined` inside a helper function.
*   **Cause**: Javascript's `new Function` scope isolation works, but AI generates code assuming a shared closure where `w` and `h` are available globally.
*   **Mitigation**: Stronger Prompt enforcement ("All helpers must be pure functions receiving dependencies").

### C. The "False Positive" Risk
*   **Case Study**: *Tower Defense* (Artifact `2026-02-06T04-00-38-623Z_tower`)
*   **Issue**: Code PASSED verification despite containing prototype-dependent logic (`proj.position.add(...)`).
*   **Reason**: The logic was gated behind user interaction (placing a tower), which the Headless Harness did not trigger.
*   **Action**: Harness needs "Input Fuzzing" to validate interactive paths.

---

## 2. Implementation Plan

### Phase A: The "Pure Data" Protocol (Prompt Engineering) [CRITICAL]
We must rewrite the `Engineer` and `Fixer` System Prompts to strictly enforce a Data-Oriented Design (DOD) approach.

1.  **Ban Instance Methods**: Explicitly forbid `state.pos.add(v)`.
2.  **Enforce Static Math**: Mandate `Vector.add(state.pos, v)`.
3.  **Redefine Vector API in Prompt**:
    *   **Remove**: "Chainable (Returns this)" section.
    *   **Emphasize**: "Static Utilities (Returns New Vector)".
    *   *Note*: This helps matching the library to the prompt (Issue #17).

### Phase B: The "Deterministic" Harness (Sandbox Architecture)
Make the Sandbox environment immutable and aggressive.

1.  **Universal Injection**: Always inject `Vector`, `COLORS`, and `sfx` into the `new Function`.
2.  **Aggressive Sanitization (Pre-Flight)**:
    *   Use Regex to **strip** any user-defined `class Vector` or `const sfx` from the generated code string BEFORE execution.
    *   *Why*: If AI tries to redefine Vector, it's a "Scope Conflict" bug. Stripping it forces the code to fall back to our Injected Vector (which is what we want).
    *   *Pattern*: `code.replace(/class\s+Vector\s*\{[\s\S]*?\}/g, '')`

### Phase C: Feedback Loop Update
1.  **Update Fixer Prompt**: Explicitly warn against "Prototype Persistence" issues. "Remember: All state is serialized JSON. Objects do not keep methods."

---

## 3. Verification Strategy (Post-Implementation)

After applying changes to `SystemPrompt.json` and `sandbox.ts`:

1.  **Re-run Vampire Survivors**: Should PASS. The code should look like `state.pos = Vector.add(state.pos, vel)`.
2.  **Re-run Space Invaders**: Should PASS. Helper functions should accept `w, h` as args.

---

## 4. Rollout Order

1.  **SystemPrompt.json**: Modify Engineer rules immediately.
2.  **StandardLibrary.ts** (Optional but recommended): Ensure `Vector` class has static aliases (`multiply`, `divide`) matching standard intuition if p5.js aliases (`mult`, `div`) are confusing the AI.
3.  **Sandbox.ts**: Implement the Regex Stripper.
