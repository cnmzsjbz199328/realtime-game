
import { StandardLibrary } from '../mocks/mock_stdlib';
import { createMockSfx } from '../mocks/mock_audio';
import { MockContext } from '../mocks/mock_canvas';

export interface SandboxResult {
    success: boolean;
    logs: string[];
    errors: string[];
    sfxCalls: string[];
    fps?: number;
}

export class HeadlessSandbox {
    private code: string;
    private sfx = createMockSfx();
    private width = 800;
    private height = 600;

    constructor(code: string) {
        this.code = code;
    }

    /**
     * Executes the game code in a confined environment.
     * Simulates Init -> Update (xFrames) -> Draw.
     */
    run(framesToSimulate: number = 60): SandboxResult {
        const logs: string[] = [];
        const errors: string[] = [];

        // 1. Sanitize: Enforce Deterministic Injection by stripping local definitions
        const sanitizedCode = this.sanitize(this.code);
        if (sanitizedCode !== this.code) {
            logs.push("[Sandbox] Sanitization applied: Local Vector/Globals definitions stripped.");
        }

        try {
            // 2. Prepare Injection Context
            const { Vector, COLORS } = StandardLibrary;

            // 3. Create Function Scope (Simulating GameHarness.tsx)
            // Signature: (Vector, COLORS, sfx) -> { init, update, draw }
            const gameFactory = new Function('Vector', 'COLORS', 'sfx', sanitizedCode);

            // 4. Instantiate
            // This is where 'sfx is not defined' would happen if we didn't pass it
            const gameExports = gameFactory(Vector, COLORS, this.sfx);

            if (!gameExports || typeof gameExports.init !== 'function') {
                throw new Error("Game code structure invalid: Missing init/update/draw exports.");
            }

            const { init, update, draw } = gameExports;

            // 5. Init Phase
            let state: any = {};
            try {
                const startParams = init(state, this.width, this.height);
                state = startParams || state; // Some games return state, some mutate
            } catch (e: any) {
                throw new Error(`Init Error: ${e.message}`);
            }

            // 6. Update Loop (Stress Test)
            const dt = 1 / 60;
            const input = { x: this.width / 2, y: this.height / 2, isDown: false, keys: {} };

            for (let i = 0; i < framesToSimulate; i++) {
                // CRITICAL TEST: Simulate Serialization Boundary
                // This converts all Vector instances in 'state' to plain objects {x,y}
                // If the code relies on 'state.pos.add()', it will CRASH here.
                // It forces usage of Static Math (Vector.add(state.pos)).
                try {
                    state = JSON.parse(JSON.stringify(state));
                } catch (e: any) {
                    throw new Error(`State Serialization Failed (Circular reference?): ${e.message}`);
                }

                try {
                    update(state, input, dt, this.width, this.height);
                } catch (e: any) {
                    throw new Error(`Update Error (Frame ${i}): ${e.message}`);
                }
            }

            // 7. Draw Phase
            const ctx = new MockContext();
            try {
                draw(state, ctx, this.width, this.height);
            } catch (e: any) {
                throw new Error(`Draw Error: ${e.message}`);
            }

            logs.push("Simulation complete.");

        } catch (e: any) {
            errors.push(e.message);
            // logs.push(e.stack); // Optional verbose logging
        }

        return {
            success: errors.length === 0,
            logs,
            errors,
            sfxCalls: this.sfx._getLogs()
        };
    }

    /**
     * Aggressively removes specific local definitions to force usage of injected ones.
     */
    private sanitize(code: string): string {
        let clean = code;
        // Strip class Vector { ... } blocks (Naive approach, usually sufficient for AI code)
        // Matches "class Vector {" until the next "}" at start of line or balanced-ish
        // We simply invalidate the name to avoid shadowing.
        if (clean.match(/class\s+Vector/)) {
            clean = clean.replace(/class\s+Vector/g, '// [SANDBOX_STRIP] class Vector_Disabled');
        }

        // Strip const sfx = ...
        if (clean.match(/const\s+sfx/)) {
            clean = clean.replace(/const\s+sfx/g, '// [SANDBOX_STRIP] const sfx_Disabled');
        }

        return clean;
    }
}
