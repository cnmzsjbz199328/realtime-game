# Sandbox Architecture Design Document (v2.0)

## Overview
This document details the **Sandbox Environment 2.0** architecture used in the `realtime-game` (GenGame) project. 
It is intended for synchronization with the [canvas2d](https://github.com/cnmzsjbz199328/canvas2d) project to ensure cross-project game compatibility.

## 1. Core Philosophy: "Conditional Injection"
The previous architecture injected stricter globals (`Vector`, `GameObject`, `COLORS`) unconditionally. This caused two major issues:
1.  **"Vector is not defined"**: When AI assumed `Vector` existed but the environment failed to provide it (or provided a different version).
2.  **"Identifier 'Vector' has already been declared"**: When AI proactively defined `class Vector { ... }` in its code, clashing with the injected global.

**Solution**: The new architecture uses a **Smart Conditional Injection** strategy.

### 1.1 The Logic
Before executing the user's code string (`new Function(code)`), the Runtime Environment performs a regex scan:
1.  **Scan** the code for definitions of `Vector` or `COLORS` (e.g., `class Vector`, `const COLORS`).
2.  **If Detected**: The environment **DOES NOT** inject its own version. The user's code is allowed to define its own.
3.  **If Not Detected**: The environment **INJECTS** the Standard Library version as a convenient global.

### 1.2 Deprecation of `GameObject`
We have **completely removed** `GameObject` from the injection list.
*   **Reason**: Forcing a rigid base class (`x, y, radius, velocity`) conflicted with non-physics games (Grid, Puzzle, Card).
*   **Result**: AI must now define its own Entity classes or data structures (`state.entities`).
*   **Migration**: Old games relying on `GameObject` can be auto-fixed by the `Fixer` agent, which detects `ReferenceError: GameObject` and prepends a polyfill class definition.

## 2. Implementation Reference

### 2.1 Frontend Runtime (`GameHarness.tsx`)
The React component that runs the game.

```typescript
// GameHarness.tsx (Simplified Logic)

const code = gameDef.code;

// 1. Detection
const hasVectorRedef = /class\s+Vector\b|const\s+Vector\b/.test(code);
const hasColorsRedef = /const\s+COLORS\b/.test(code);

// 2. Conditional Argument Build
const argNames = [];
const argValues = [];

if (!hasVectorRedef) {
  argNames.push('Vector');
  argValues.push(StandardLibrary.Vector); // Pre-imported from core/runtime
}
if (!hasColorsRedef) {
  argNames.push('COLORS');
  argValues.push(StandardLibrary.COLORS);
}

// 3. Execution (Note: GameObject is NEVER injected)
const createGame = new Function(...argNames, code);
const gameInstance = createGame(...argValues);
```

### 2.2 Backend QA Validator (`HeadlessBrowserValidator.ts`)
The server-side validation logic must match the Frontend *exactly* to prevent false positives/negatives.

```typescript
// HeadlessBrowserValidator.ts

// ... Regex detection same as above ...

if (!hasVectorRedef) {
    // Define a MockVector locally if not provided by user
    class MockVector { 
        x: number; y: number; 
        constructor(x=0, y=0) { ... }
        add(v) { ... }
        // CRITICAL: Must match Frontend API
        scale(s) { this.x *= s; this.y *= s; return this; } 
    }
    argNames.push('Vector');
    argValues.push(MockVector);
}
// ...
```

### 2.3 System Prompts (`prisma/seed.ts`)
The instructions given to the AI Agents (Engineer, Fixer) have been updated to reflect this architecture.

**Engineer Prompt (v13)**:
> **Core Classes**: 
> - The environment provides `Vector`. Use it freely.
> - **NO GameObject**: The environment DOES NOT provide a GameObject base class. You MUST define your own Entity/GameObject class if you need one.

**Fixer Prompt (v6)**:
> **RECOVERY STRATEGY**:
> - Error "GameObject is not defined": Define a class GameObject { ... } at the top of the file.

## 3. Data Storage & Export

### 3.1 Database Schema
*   We store **RAW Code Fragment** (Closure body) in the database.
*   We **DO NOT** store the injected `StandardLibrary` code in the database field. This keeps the data clean and upgradeable.

### 3.2 HTML Export
When exporting a standalone HTML file (`gameExport.ts`), we apply the same conditional logic:
*   If game code needs `Vector` (and doesn't define it), we inject the `StandardLibrary` source code into the HTML `<script>`.
*   If game code defines `Vector`, we skip the injection to avoid `Identifier detected` errors.

## 4. Synchronization Checklist for `canvas2d` Project

To align the `canvas2d` project with this architecture, please perform the following updates:

### 4.1 Runtime Injection (Frontend Only)
Since `canvas2d` is a pure frontend project, you must implement the **Conditional Injection** logic directly inside `components/GamePreview.tsx` (in the `createHostHTML` function).

**Step 1: Embed Standard Library Source**
You need the source code string for `class Vector` and `const COLORS`. Since you don't have `core/runtime`, you can hardcode them as a string constant:

```typescript
const STANDARD_LIB_SOURCE = `
const COLORS = { BG: '#050505', PLAYER: '#00ffff', ENEMY: '#ff3366', ACCENT: '#ffcc00', TEXT: '#ffffff' };
class Vector {
    constructor(x=0, y=0) { this.x = x; this.y = y; }
    add(v) { this.x += v.x; this.y += v.y; return this; }
    // ... (include other methods like sub, multiplyScalar, normalize, copy, distance) ...
    scale(s) { this.x *= s; this.y *= s; return this; } // Alias for consistency
}
`;
```

**Step 2: Implement Conditional Logic**
In `createHostHTML(aiScript)`:
```typescript
const hasVector = /class\s+Vector\b|const\s+Vector\b/.test(aiScript);
const hasColors = /const\s+COLORS\b/.test(aiScript);

let injection = '';
if (!hasVector || !hasColors) {
    // Note: We inject the WHOLE lib if either is missing for simplicity, 
    // or you can be more granular. Smartest is to check individually if possible,
    // but Vector usually needs COLORS and vice versa.
    // If you want strict granularity:
    // let lib = '';
    // if (!hasColors) lib += "const COLORS = ...;";
    // if (!hasVector) lib += "class Vector ...;";
    
    // For now, if EITHER is missing, it's safer to inject the Standard Lib 
    // UNLESS the user explicitly defined them.
    if (!hasVector && !hasColors) {
         injection = `<script>${STANDARD_LIB_SOURCE}</script>`;
    }
}

// Insert ${injection} before the main script execution
```

### 4.2 Metadata Extraction (Title & Description)
Currently, `canvas2d` likely treats the AI response as pure code, missing the metadata.
The AI (Engineer Agent) output follows this specific format:

```text
TITLE: Neon Racing
DESCRIPTION: A fast-paced racing game...
CODE:
```javascript
... code ...
```
```

**Task**:
1.  **Parse** the AI response in your Chat/Service layer *before* setting the `code` state.
2.  **Extract** `TITLE` and `DESCRIPTION` using Regex:
    ```javascript
    const titleMatch = response.match(/TITLE:\s*(.+)/);
    const descMatch = response.match(/DESCRIPTION:\s*(.+)/);
    const codeMatch = response.match(/CODE:[\s\S]*?```(?:javascript|js)?\s*([\s\S]*?)```/);
    ```
3.  **Store** these values in a state object (e.g., `currentGameMetadata`).
4.  **Auto-Fill**: Pass these values to your `SaveGameModal` so the user doesn't have to type them manually.

### 4.3 Checklist
1.  [ ] **Update `createHostHTML`**: Inject `StandardLibrary` only when `Vector`/`COLORS` are missing in user code.
2.  [ ] **Implement Parser**: Regex-parse the AI response to extract Title/Description/Code separately.
3.  [ ] **Update Save Flow**: Pre-fill the "Save Game" dialog with the extracted Title and Description.
4.  [ ] **Remove GameObject**: Ensure no legacy `GameObject` class is being injected.
5.  [ ] **Verify**: Load a Sandbox 2.0 game (which uses `Vector` but doesn't define it) and ensure it runs without `Vector is not defined`.
