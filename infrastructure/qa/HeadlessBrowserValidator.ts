import { GameDefinition, IGameValidator } from '../../core/domain/types';

interface GameInterface {
    init: (state: any, width: number, height: number) => void;
    update: (state: any, input: any, deltaTime: number) => void;
    draw: (state: any, ctx: CanvasRenderingContext2D, width: number, height: number) => void;
}

export class HeadlessBrowserValidator implements IGameValidator {
    async validate(gameDef: GameDefinition): Promise<{ passed: boolean; error?: string }> {
        // 1. Create Headless Environment
        const canvas = document.createElement('canvas');
        canvas.width = 800;
        canvas.height = 600;
        const ctx = canvas.getContext('2d', { willReadFrequently: true });

        if (!ctx) return { passed: false, error: "System Error: Could not create headless context for QA." };

        // Mock State
        const state: any = {};

        // Mock Input
        const input = {
            x: 400,
            y: 300,
            isDown: false,
            keys: {} as Record<string, boolean>
        };

        try {
            // 2. Compilation Check
            let gameInterface: GameInterface;
            try {
                // SANDBOX COMPATIBILITY LAYER (Validator)
                // ----------------------------------------------------
                const code = gameDef.code;
                const hasVectorRedef = /class\s+Vector\b|const\s+Vector\b|var\s+Vector\b|function\s+Vector\b/.test(code);
                const hasColorsRedef = /const\s+COLORS\b|var\s+COLORS\b|let\s+COLORS\b/.test(code);

                const argNames = [];
                const argValues = [];

                if (!hasVectorRedef) {
                    // Define Mock Vector locally if needed
                    class MockVector {
                        x: number; y: number;
                        constructor(x = 0, y = 0) { this.x = x; this.y = y; }
                        add(v: any) { this.x += v.x; this.y += v.y; return this; }
                        sub(v: any) { this.x -= v.x; this.y -= v.y; return this; }
                        multiplyScalar(s: number) { this.x *= s; this.y *= s; return this; }
                        normalize() {
                            const len = Math.sqrt(this.x * this.x + this.y * this.y);
                            if (len > 0) { this.x /= len; this.y /= len; }
                            return this;
                        }
                        copy() { return new MockVector(this.x, this.y); }
                        static distance(v1: any, v2: any) { return Math.sqrt((v1.x - v2.x) ** 2 + (v1.y - v2.y) ** 2); }
                    }
                    argNames.push('Vector');
                    argValues.push(MockVector);
                }

                if (!hasColorsRedef) {
                    const MOCK_COLORS = {
                        BG: '#000000', PLAYER: '#ffffff', ENEMY: '#ff0000', ACCENT: '#ffff00', TEXT: '#ffffff'
                    };
                    argNames.push('COLORS');
                    argValues.push(MOCK_COLORS);
                }

                // eslint-disable-next-line no-new-func
                const createGame = new Function(...argNames, code);

                // Pass the conditional Mocks
                const result = createGame(...argValues);

                if (!result || typeof result.init !== 'function' || typeof result.update !== 'function' || typeof result.draw !== 'function') {
                    throw new Error("Missing exported functions: init, update, or draw");
                }
                gameInterface = result as GameInterface;
            } catch (syntaxError: any) {
                return { passed: false, error: `Compilation Error: ${syntaxError.message}` };
            }

            // 3. Initialization Check (Setup)
            gameInterface.init(state, 800, 600);

            // 4. Gameplay Simulation (Stress Test / Fuzzing)
            const TOTAL_FRAMES = 120; // 2 seconds of validation

            for (let frame = 0; frame < TOTAL_FRAMES; frame++) {
                // Fuzz inputs
                const moveKeys = ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'w', 'a', 's', 'd'];

                if (frame % 30 === 0) {
                    moveKeys.forEach(k => input.keys[k] = false);
                    if (Math.random() > 0.3) {
                        const k = moveKeys[Math.floor(Math.random() * moveKeys.length)];
                        input.keys[k] = true;
                    }
                }

                if (frame % 60 === 0) input.isDown = true;
                if (frame % 60 === 5) input.isDown = false;

                // D. EXECUTE FRAME
                gameInterface.update(state, input, 0.016);
                gameInterface.draw(state, ctx, 800, 600);

                // E. Sanity Check
                const checkNaN = (value: any, path: string) => {
                    if (typeof value === 'number' && isNaN(value)) {
                        throw new Error(`Game State Corruption: '${path}' became NaN.`);
                    }
                };

                if (state.player) {
                    checkNaN(state.player.x, 'state.player.x');
                    checkNaN(state.player.y, 'state.player.y');
                }
            }

            return { passed: true };

        } catch (e: any) {
            return { passed: false, error: e.message };
        }
    }
}
