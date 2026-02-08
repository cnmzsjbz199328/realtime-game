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
                    // This matches the whitelist API defined in prompts
                    class MockVector {
                        x: number; y: number;
                        constructor(x = 0, y = 0) { this.x = x; this.y = y; }

                        // Instance methods (for backward compatibility)
                        add(v: any) { this.x += v.x; this.y += v.y; return this; }
                        sub(v: any) { this.x -= v.x; this.y -= v.y; return this; }
                        multiplyScalar(s: number) { this.x *= s; this.y *= s; return this; }
                        scale(s: number) { return this.multiplyScalar(s); }
                        normalize() {
                            const len = Math.sqrt(this.x * this.x + this.y * this.y);
                            if (len > 0) { this.x /= len; this.y /= len; }
                            return this;
                        }
                        copy() { return new MockVector(this.x, this.y); }

                        // Static methods - COMPLETE WHITELIST API
                        // Basic Operations
                        static add(v1: any, v2: any) { return new MockVector(v1.x + v2.x, v1.y + v2.y); }
                        static sub(v1: any, v2: any) { return new MockVector(v1.x - v2.x, v1.y - v2.y); }
                        static mult(v: any, n: number) { return new MockVector(v.x * n, v.y * n); }
                        static div(v: any, n: number) { return new MockVector(v.x / n, v.y / n); }

                        // Distance
                        static distance(v1: any, v2: any) {
                            const dx = v1.x - v2.x;
                            const dy = v1.y - v2.y;
                            return Math.sqrt(dx * dx + dy * dy);
                        }
                        static dist(v1: any, v2: any) { return MockVector.distance(v1, v2); }

                        // Magnitude
                        static mag(v: any) { return Math.sqrt(v.x * v.x + v.y * v.y); }
                        static magSq(v: any) { return v.x * v.x + v.y * v.y; }
                        static normalize(v: any) {
                            const m = MockVector.mag(v);
                            if (m === 0) return new MockVector(0, 0);
                            return new MockVector(v.x / m, v.y / m);
                        }
                        static setMag(v: any, n: number) {
                            const normalized = MockVector.normalize(v);
                            return new MockVector(normalized.x * n, normalized.y * n);
                        }
                        static limit(v: any, max: number) {
                            const m = MockVector.mag(v);
                            if (m > max) return MockVector.setMag(v, max);
                            return new MockVector(v.x, v.y);
                        }

                        // Angles
                        static heading(v: any) { return Math.atan2(v.y, v.x); }
                        static rotate(v: any, angle: number) {
                            const newHeading = MockVector.heading(v) + angle;
                            const m = MockVector.mag(v);
                            return new MockVector(Math.cos(newHeading) * m, Math.sin(newHeading) * m);
                        }
                        static angleBetween(v1: any, v2: any) {
                            const dot = MockVector.dot(v1, v2);
                            const val = Math.max(-1, Math.min(1, dot / (MockVector.mag(v1) * MockVector.mag(v2))));
                            return Math.acos(val);
                        }

                        // Interpolation
                        static lerp(v1: any, v2: any, amt: number) {
                            return new MockVector(
                                v1.x + (v2.x - v1.x) * amt,
                                v1.y + (v2.y - v1.y) * amt
                            );
                        }

                        // Products
                        static dot(v1: any, v2: any) { return v1.x * v2.x + v1.y * v2.y; }
                        static cross(v1: any, v2: any) { return v1.x * v2.y - v1.y * v2.x; }

                        // Creation
                        static random2D() {
                            const angle = Math.random() * Math.PI * 2;
                            return new MockVector(Math.cos(angle), Math.sin(angle));
                        }
                        static fromAngle(angle: number, length = 1) {
                            return new MockVector(length * Math.cos(angle), length * Math.sin(angle));
                        }
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
