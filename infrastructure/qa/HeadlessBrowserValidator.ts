import { GameDefinition, IGameValidator } from '../../core/domain/types';

export class HeadlessBrowserValidator implements IGameValidator {
    async validate(gameDef: GameDefinition): Promise<{ passed: boolean; error?: string }> {
        // 1. Create Headless Environment
        const canvas = document.createElement('canvas');
        canvas.width = 800;
        canvas.height = 600;
        // Note: We might get null if the browser is very restricted, but usually works.
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
            // We wrap this in try-catch to catch syntax errors immediately
            let setupFunc: Function;
            let updateFunc: Function;

            try {
                // eslint-disable-next-line no-new-func
                setupFunc = new Function('ctx', 'canvas', 'state', gameDef.setupCode);
                // eslint-disable-next-line no-new-func
                updateFunc = new Function('ctx', 'canvas', 'state', 'input', gameDef.updateCode);
            } catch (syntaxError: any) {
                return { passed: false, error: `Syntax Error during compilation: ${syntaxError.message}` };
            }

            // 3. Initialization Check (Setup)
            // Run setup to see if initial variables crash
            setupFunc(ctx, canvas, state);

            // 4. Gameplay Simulation (Stress Test / Fuzzing)
            // Run for 300 frames (approx 5 seconds of gameplay) to verify stability over time
            // and catch delayed crashes (e.g. enemy spawning logic).
            const TOTAL_FRAMES = 300;

            for (let frame = 0; frame < TOTAL_FRAMES; frame++) {
                // A. Simulate erratic mouse movement
                // Move towards center then random, simulating aiming
                const targetX = 400 + Math.sin(frame * 0.1) * 200;
                const targetY = 300 + Math.cos(frame * 0.1) * 150;
                input.x += (targetX - input.x) * 0.1; // Smooth lerp
                input.y += (targetY - input.y) * 0.1;

                // Clamp to screen
                input.x = Math.max(0, Math.min(800, input.x));
                input.y = Math.max(0, Math.min(600, input.y));

                // B. Simulate Clicking (Crucial for "click to start" or "shoot" mechanics)
                // Click every 60 frames roughly, or hold down
                if (frame % 60 === 0) input.isDown = true;
                if (frame % 60 === 5) input.isDown = false;

                // C. Simulate Key presses (Spacebar, Arrows, WASD)
                const moveKeys = ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'w', 'a', 's', 'd'];
                const actionKeys = [' ', 'Enter'];

                // Intelligent Fuzzing: Hold direction keys for chunks of time
                if (frame % 30 === 0) {
                    // Reset keys occasionally
                    moveKeys.forEach(k => input.keys[k] = false);

                    // Pick a random direction and hold it for 30 frames
                    if (Math.random() > 0.3) {
                        const k = moveKeys[Math.floor(Math.random() * moveKeys.length)];
                        input.keys[k] = true;
                    }
                }

                // Randomly mash action keys
                if (Math.random() > 0.9) {
                    const k = actionKeys[Math.floor(Math.random() * actionKeys.length)];
                    input.keys[k] = true;
                }
                if (Math.random() > 0.9) {
                    actionKeys.forEach(k => input.keys[k] = false);
                }

                // D. EXECUTE FRAME
                updateFunc(ctx, canvas, state, input);

                // E. Sanity Check: Detect NaN poisoning
                // Deep scan common properties
                const checkNaN = (value: any, path: string) => {
                    if (typeof value === 'number' && isNaN(value)) {
                        throw new Error(`Game State Corruption: '${path}' became NaN.`);
                    }
                };

                if (state.score !== undefined) checkNaN(state.score, 'state.score');
                if (state.player) {
                    checkNaN(state.player.x, 'state.player.x');
                    checkNaN(state.player.y, 'state.player.y');
                    checkNaN(state.player.vx, 'state.player.vx');
                    checkNaN(state.player.vy, 'state.player.vy');
                    checkNaN(state.player.health, 'state.player.health');
                }
                // Check enemy positions if array exists
                if (Array.isArray(state.enemies)) {
                    state.enemies.slice(0, 3).forEach((e: any, i: number) => {
                        if (e) {
                            checkNaN(e.x, `state.enemies[${i}].x`);
                            checkNaN(e.y, `state.enemies[${i}].y`);
                        }
                    });
                }
            }

            return { passed: true };

        } catch (e: any) {
            return { passed: false, error: e.message };
        }
    }
}
