# Plan: Automated Code Generation Verification System
**Goal**: Establish a continuous integration (CI) workflow to validate the quality, stability, and sandbox-compliance of AI-generated game code without manual UI interaction.

## 1. System Philosophy: Decoupled Black-Box Testing

The Verification System is an **External Tool** (a script script or separate utility) that treats the Realtime-Game backend as a "Black Box".
*   **No Code Coupling**: It does NOT import `GameHarness.tsx` or internal server logic directly.
*   **Simulation**: It mimics the Frontend Client (React) behavior.
*   **Workflow**:
    1.  Send HTTP/API request to `POST /api/generate` (or call the LLM Service Interface if strictly local).
    2.  Receive the raw Javascript string.
    3.  Inject into a local, isolated V8 context (using simple `eval` or `new Function` logic that mirrors the browser).
    4.  Verify pass/fail criteria.

## 2. System Components

### A. The "Simulated Client" (Script)
A standalone Node.js script.
- **Dependencies**: 
  - A *copy* or *reference implementation* of `StandardLibrary.ts` (to verify compatibility).
  - `MockAudio` & `MockCanvas`.
- **Role**: Validates the **Output Artifact** (the code), not the internal process.

### B. The Validator (Static & Runtime Analysis)
A suite of checks to ensure code health.

#### 1. Static Checks (Regex/AST)
- [ ] **Forbidden Globals**: Check for usage of `window`, `document` (except allowed ones).
- [ ] **Forbidden Re-definitions**: Check if code defines `class Vector` or `const sfx`.
- [ ] **Syntax Validity**: Ensure `return { init, update, draw }` exists.

#### 2. Runtime Checks (Simulation)
- [ ] **Crash Detection**: Run `init()`, then 100 frames of `update()`, then `draw()`. Catch errors.
- [ ] **Prototype Persistence Check**: JSON-serialize `state` between frames to simulate persistence boundary. Fail if `v.multiply is not a function`.
- [ ] **Audio Connectivity**: Verify `sfx.play()` calls are captured by the mock.
- [ ] **State Isolation**: Ensure global scope isn't polluted.

### C. The "Judge" (LLM Evaluator - Optional)
A step where an LLM reads the generated code + runtime logs and grades it.

### D. Artifact Archival & Logging
**Crucial**: To prevent data loss (terminal truncation) and enable audit trails, ALL generated content must be saved to the disk in a structured format.

**Storage Structure**: `tests/artifacts/[timestamp]_[game_id]/`
- `01_design.json`: The raw output from the Director/Architect (Concept & Spec).
- `02_spec.md`: The formatted Technical Specification.
- `03_code_v1.js`: The initial Engineer output.
- `04_runtime_logs.txt`: Captures stdout/stderr during the "Headless Harness" run.
- `05_fixer_code_v2.js`: (If applicable) The code after Fixer intervention.
- `report.json`: Final pass/fail status and metadata.

**Benefit**: This creates a permanent dataset of "Attempt vs Result" to fine-tune prompts later.

## 2. Implementation Roadmap

### Phase 1: Modular Infrastructure Scaffold (COMPLETED)
To ensure maintainability and debuggability, the system will be split into focused modules within `scripts/verify/`:

- **`core/`**:
  - `runner.ts`: The main entry point orchestrating the pipeline.
  - `sandbox.ts`: Encapsulates the V8/Function based isolation logic (The "Headless Harness").
- **`pipeline/`**:
  - `generator.ts`: Handles API calls to LLM services (Mock or Real).
  - `archiver.ts`: Manages file I/O for the `artifacts/` folder.
  - `validator.ts`: Runs the static and runtime check suites.
- **`mocks/`**:
  - `mock_audio.ts`: Simulated `sfx`.
  - `mock_canvas.ts`: Simulated `CanvasRenderingContext2D`.
  - `mock_stdlib.ts`: Local import of the project's Standard Library.

### Phase 2: Test Case Generation
- Port `prisma/seed.ts` skeletons into test cases.
- Ability to run `npm run verify:gen -- --skeleton=breakout_paddle` (Generates code for them using the new Prompt).

### Phase 3: Integration
- Add `npm run verify` to pre-commit or CI hooks.
- Output a `report.md` summarizing pass/fail rates.

## 3. Workflow Example

1. **Engineer Change**: We modify `SystemPrompt` to fix a `Vector` issue.
2. **Auto-Verification**:
   - System picks 3 random game seeds.
   - Generates code for them using the new Prompt.
   - Runs them in `Headless Harness`.
   - **Report**:
     - Game 1: PASS
     - Game 2: FAIL (`sfx` undefined) -> **Immediate feedback!**
     - Game 3: PASS

## 4. Verification Results & Learnings (2026-02-06)

### Recent Test Runs
| Prompt | Result | Root Cause / Analysis |
| :--- | :--- | :--- |
| **Realtime Car Racing** | **FAIL** | **Variable Redefinition**: Generated code attempted to redeclare `const Vector = Vector`, causing collision with injected sandbox arguments. |
| **Tower Defense** | **PASS** (False Positive) | Passed static checks. However, dynamic interactions (placing towers) were not triggered by sandbox input, masking potential serialization issues in projectile logic. |
| **Space Invaders** | **FAIL** | **Scope Error**: Helper functions accessed `w` (width) from the global scope instead of receiving it as a parameter. `w` is only available in `update` scope. |
| **Vampire Survivors** | **FAIL** | **Persistence Violation**: Code relied on `Vector` instance methods (e.g., `pos.add()`) on state objects. The sandbox's serialization stress test (`JSON.parse(JSON.stringify(state))`) stripped prototypes, causing a crash. |

### Identified Issues & Action Items

1.  **Serialization/Persistence Boundary**:
    *   **Problem**: AI naturally writes "stateful classes" (OOP style) where state objects have methods. Our architecture requires "Plain Old Data" (POD) state + Static Helper functions.
    *   **Action**: Update `SystemPrompt` to explicitly forbid Instance Methods on state objects. Enforce `Vector.add(state.pos, velocity)` pattern.

2.  **Scope Safety**:
    *   **Problem**: Helper functions often assume global access to canvas dimensions (`w`, `h`).
    *   **Action**: `SystemPrompt` must emphasize that `w` and `h` are local to `update/draw` and must be passed as arguments.

3.  **False Positives in Sandbox**:
    *   **Problem**: "Tower Defense" passed because the code paths that would fail were never executed (no user input).
    *   **Action**: Enhance `HeadlessSandbox` to inject simulated "Random Click Inputs" to trigger interaction-heavy code paths (like placement, shooting).

4.  **CLI Tooling**:
    *   **Fix**: `verify_cli.ts` argument parsing was corrected to properly handle flags vs positional arguments.
