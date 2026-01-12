# UX Upgrade Plan: "Cyber-Terminal" & "Source Transparency"

**Objective**: Elevate the user experience to match [GameMax](https://github.com/cnmzsjbz199328/gamemax) by implementing real-time terminal logs and a transparent source code viewer.

## 1. Feature: Real-time Terminal Logs
**Goal**: Expose the backend AI's thinking process to the user in real-time, reducing anxiety and increasing trust (the "Black Box" problem).

### A. Backend Refactoring (Streaming)
Currently, `/api/generation/create` is a monolithic Request-Response. The user waits 30s+ with no feedback.
*   **Action**: Convert `/api/generation/create` to use **Vercel AI SDK (Streaming)** or standard **Node.js ReadableStream**.
*   **Protocol**:
    *   Server pushes text/event-stream chunks.
    *   Events:
        *   `[LOG] Classification Started...`
        *   `[LOG] Skeleton Selected: Tower Defense`
        *   `[LOG] Expanded Design: ...`
        *   `[RESULT] { ...gameData }`

### B. Frontend Terminal Component
*   **Component**: `components/features/TerminalLogs.tsx`
*   **Visuals**:
    *   Dark background (`#0d1117`).
    *   Monospace font (green/cyan text).
    *   Auto-scroll to bottom.
    *   Highlight keywords (skeleton names, errors).
*   **Integration**:
    *   Update `useAgentWorkflow` to handle streaming response parsing.
    *   Visual placement: Replace the current simple log list (bottom section or side panel).

## 2. Feature: Source Code Viewer
**Goal**: Allow users (and developers) to inspect the generated code, understand errors, and manually copy/fix if needed.

### A. UI Update (GameStage)
*   **Component**: `presentation/components/features/GameStage.tsx`
*   **Tab System**: Add tabs above the canvas area:
    *   [🎮 Play] (Default)
    *   [📝 Source Code]
*   **Code Editor/Viewer**:
    *   Use `react-syntax-highlighter` or a simple `<pre><code>` block for v1.
    *   Feature: "Copy to Clipboard" button.
    *   Feature: "Download .html" button (optional).

## 3. Implementation Step-by-Step Plan

### Phase 1: Frontend UI Skeleton (Immediate)
1.  Create `TerminalLogs` component (mock data first).
2.  Update `GameStage` to include Tab switching and Source View.
3.  *Deliverable*: Visual upgrade immediately visible to user.

### Phase 2: Logic Integration (Complex)
1.  Refactor `FrontendGameGenerator` to support `fetch` streaming reader.
2.  Refactor backend `POST` handler to write to a stream instead of returning JSON at the end.
    *   This requires piping `console.log` or a custom `Logger` to the response stream.

### Phase 3: Polish
1.  Add CSS animations (typing effect, cursor blink) to Terminal.
2.  Add syntax highlighting to Source View.

## 4. Why This Matters
*   **Debugging**: When a game fails (like "Snake moves too fast"), you can see the *Generated Code* immediately in the Source tab and spot `pos += speed` vs `timer > interval`.
*   **immersion**: The terminal logs reinforce the "AI Agent" persona.

---

**Next Immediate Action**: Execute Phase 1 (Frontend UI Components).
