# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev       # Vite dev server on port 3000
npm run build     # Production build
npm run preview   # Preview production build
```

**Database:**
```bash
npx prisma db push                            # Sync schema to database
npx prisma generate                           # Regenerate Prisma client (auto-runs on npm install)
node --loader ts-node/esm prisma/seed.ts      # Seed AI prompts and game skeletons
```

There is no configured linting, test runner, or pre-commit hooks. TypeScript type-checking is handled by Vite at build time.

## Architecture

**GenGame Studio** is an AI-powered HTML5 game generation platform. Users describe a game concept; a multi-agent pipeline produces runnable game code in seconds.

### Agent Pipeline

```
User input
  → Director (classifies into one of 16 skeleton archetypes, expands design)
  → Architect (generates technical spec)
  → Engineer (generates game JS from skeleton context + spec)
  → QA Validator (headless runtime, input fuzzing)
  → [on failure] Fixer (auto-corrects and retries)
  → Playable game
```

- **Backend agents** live in `server/services/` and are invoked via Vercel Serverless Functions in `api/`.
- **Frontend orchestration** lives in `application/useAgentWorkflow.ts`.
- **QA validation** runs client-side in `infrastructure/qa/HeadlessBrowserValidator.ts`.

### Layer Map

| Path | Responsibility |
|------|----------------|
| `api/` | Vercel serverless entry points (`/api/generation/create`, `/api/generation/fix`, `/api/generation/remix`, `/api/games`) |
| `server/services/` | Director, Architect, Engineer, Fixer, Remix services + `ai-client.ts` |
| `server/skeletons/` | 16 game archetype templates; `registry.ts` loads them; `directory.ts` lists them |
| `core/domain/types.ts` | Port interfaces: `IDirector`, `IEngineer`, `IFixer`, `IGameValidator`, shared DTOs |
| `core/runtime/std/` | Standard library injected into game sandbox: `Vector`, `RetroAudio`, `Colors` |
| `core/runtime/std/InjectionSource.ts` | Stringified versions of std lib classes for HTML export |
| `application/` | React hooks: `useAgentWorkflow.ts` (pipeline), `useGameCollection.ts` (history/leaderboard) |
| `infrastructure/` | `FrontendAIService.ts`, `HeadlessBrowserValidator.ts`, `PostgresGameRepository.ts` |
| `presentation/components/` | React UI — `GameStage.tsx`, `TerminalLogs.tsx`, `Leaderboard.tsx`, etc. |
| `prisma/schema.prisma` | Tables: `SavedGame`, `SystemPrompt`, `Skeleton`, `IssueRecord`, `OptimizationRecord` |
| `App.tsx` | Composition root — instantiates all services and wires hooks |

### Adding New Code

- **New AI agent**: implement in `server/services/`, declare its port interface in `core/domain/types.ts`, add a Vercel Function entry in `api/`, and wire it into `application/useAgentWorkflow.ts`.
- **New UI component**: place in `presentation/components/features/` (feature) or `presentation/components/layout/` (layout); inject services via props — never instantiate services inside a component.
- **New standard library class** (injected into the game sandbox): update the TypeScript source in `core/runtime/std/`, the stringified copy in `core/runtime/std/InjectionSource.ts`, and the mock in `infrastructure/qa/HeadlessBrowserValidator.ts` — all three must stay in sync (see Critical Invariants below).
- **New database table**: define it in `prisma/schema.prisma` with at least one `@@index`, and add seed data in `prisma/seed.ts`.

---

### Deterministic Injection System

Game code produced by the Engineer only stores the raw JS fragment. Before execution (both in browser and in QA validator), the harness scans for existing declarations (`class Vector`, `const COLORS`, etc.) and conditionally injects the standard library only if the game code doesn't already define it. This same detection logic must stay in sync between `GameStage.tsx` (browser runtime) and `HeadlessBrowserValidator.ts` (QA runtime). `core/utils/gameExport.ts` applies the same logic for standalone HTML downloads.

**Standard library API available to game code:**
- `Vector` — 2D math (instance + static methods: `add`, `sub`, `mult`, `div`, `mag`, `normalize`, `distance`, `heading`, `rotate`, etc.)
- `COLORS` — cyberpunk palette object (`BG`, `PLAYER`, `ENEMY`, `ACCENT`, `TEXT`)
- `RetroAudio` — audio synthesis/playback
- `GameObject` is deprecated; agents define their own entities directly

### Critical Invariants

**Triple-sync for Vector**: `Vector` exists in three independent copies; any change must be applied to all three:
1. `core/runtime/std/Vector.ts` — TypeScript source
2. `core/runtime/std/InjectionSource.ts` — stringified version for browser/HTML export injection
3. `MockVector` inside `infrastructure/qa/HeadlessBrowserValidator.ts` — used by the QA validator

Divergence between them produces silent bugs where QA passes but the game crashes in the browser.

**Injection-detection logic must be identical** across `GameStage.tsx` (browser runtime), `HeadlessBrowserValidator.ts` (QA runtime), and `core/utils/gameExport.ts` (HTML export). All three detect `class Vector` / `const COLORS` to decide whether to inject the standard library. Any inconsistency means the same game code behaves differently per environment.

**Only the raw game fragment is stored**: the database holds only the Engineer-generated JS snippet, without injected standard library code. The standard library is injected at runtime. Do not write the fully-assembled code to the DB.

---

### 16 Skeleton Archetypes

`universal_minimal`, `tower_defense`, `gravity_platformer`, `scrolling_shooter`, `maze_pathfinding`, `match3`, `universal_collection`, `survival_shooter`, `snake_grid`, `breakout_paddle`, `dodge_falling`, `endless_runner`, `click_eliminate`, `turnbased_grid`, `impulse_physics`, `bullet_hell`

### Data Store

System prompts (`SystemPrompt` table) and skeleton templates (`Skeleton` table) are stored in the database and seeded via `prisma/seed.ts`. Updating them does not require redeployment. `IssueRecord` and `OptimizationRecord` track runtime failures for analysis.

## Code Standards

### TypeScript

- Explicitly type all function parameters, return values, and variables in new code. Do not use `any`.
- API endpoints (`api/`) must validate `req.body` before use — check types and lengths. Use `zod` or a hand-written guard.
- Port interfaces live in `core/domain/types.ts`. New services must implement the corresponding interface; do not couple directly to a concrete class from another layer.
- `tsconfig.json` does not yet enable `strict: true`. Write new code as if it does: treat all values as potentially null/undefined unless proven otherwise.

### Error Handling

- All AI calls in `server/services/ai-client.ts` must use `AbortController` with a timeout (25 s recommended — below the Vercel Function default limit).
- Services throw errors with context; API handlers catch them and return structured error responses. Do not expose internal stack traces to the client.
- Do not silently swallow errors in `catch` and continue execution unless an explicit fallback strategy is in place (e.g. the skeleton fallback in `DirectorService`).

### Logging

- Do not `console.log` full request bodies (system prompts, user content) in `ai-client.ts` — these appear in Vercel logs and leak prompt content.
- Production logs should emit result summaries only (skeleton ID, latency, status code), not raw AI response content.

### Services

- Shared parsing logic across services (JSON cleanup regex, `CODE:` block extraction) belongs in `server/utils/parseAIResponse.ts`. Do not duplicate it in each service.
- Vercel Function handlers (`api/`) must not `new XxxService()` per request. Instantiate services at module level and reuse them.

### Database

- Every new table in `schema.prisma` needs at least one `@@index` (on `createdAt` and any foreign-key fields).
- Counter fields (e.g. `likes`) must be updated with Prisma's `{ increment: 1 }` atomic operation — never read-then-write.
- Cross-table references (e.g. `IssueRecord.gameId`) should use a Prisma relation with a proper foreign key to maintain data integrity.

### React / Frontend

- Components do not instantiate services (`new FrontendAIService()`). Services are injected via props or context.
- When a component has more than five `useState` calls, consolidate with `useReducer`.
- Repeated string-processing logic (e.g. header stripping in `GameStage.tsx`) must be extracted into a named function or a dedicated util, not copied across multiple callbacks.

## Known Technical Debt

The following issues are known but not yet fixed. Take care when touching these areas.

| Location | Issue | Risk |
|----------|-------|------|
| `core/runtime/std/InjectionSource.ts` | Stringified Vector copy must be manually kept in sync with `Vector.ts` | High — behaviour divergence is hard to detect |
| `infrastructure/qa/HeadlessBrowserValidator.ts` | `MockVector` is a third independent copy of Vector | High — QA can pass while the browser runtime fails |
| `server/services/ai-client.ts` | No request timeout; logs full request body | Medium — function hangs / prompt leak |
| `api/generation/create.ts`, `api/games.ts` | No input validation on `req.body` | Medium — malicious input passes directly to AI or DB |
| `DirectorService`, `EngineerService`, `FixerService` | JSON-cleanup regex duplicated in each service | Low — fixing a bug requires three edits |
| `prisma/schema.prisma` | No `@@index`; cross-table references lack foreign keys | Low — query performance degrades with data growth |

---

## Environment Variables

See `.env.example`. Required:
- `DATABASE_URL` — pooled PostgreSQL connection (Neon/Supabase)
- `DATABASE_URL_UNPOOLED` — non-pooled variant (used by Prisma migrations)
- Vercel Postgres template vars (`POSTGRES_URL`, `POSTGRES_PASSWORD`, etc.)

## Deployment

Frontend static assets and backend serverless functions are both deployed to Vercel. The `api/` directory maps directly to Vercel Functions routes.
