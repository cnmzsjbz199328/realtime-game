import { GameDefinition } from '../types';

/**
 * Runs the generated game code in a headless environment to detect runtime errors
 * before the user sees them. Simulates human inputs (mouse, keys).
 */
export const runQATest = async (gameDef: GameDefinition): Promise<{ passed: boolean; error?: string }> => {
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
    // Run for 60 frames (approx 1 second of gameplay) to ensure loop stability
    for (let frame = 0; frame < 60; frame++) {
        // A. Simulate erratic mouse movement
        input.x += (Math.random() - 0.5) * 100;
        input.y += (Math.random() - 0.5) * 100;
        
        // Clamp to screen
        input.x = Math.max(0, Math.min(800, input.x));
        input.y = Math.max(0, Math.min(600, input.y));

        // B. Simulate Clicking (Crucial for "click to start" or "shoot" mechanics)
        // 10% chance to be holding down, 5% chance to click this frame
        input.isDown = Math.random() > 0.9;

        // C. Simulate Key presses (Spacebar, Arrows)
        const commonKeys = [' ', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Enter'];
        
        // Randomly press keys
        if (Math.random() > 0.8) {
            const k = commonKeys[Math.floor(Math.random() * commonKeys.length)];
            input.keys[k] = true;
        }
        
        // Randomly release keys
        commonKeys.forEach(k => {
            if (Math.random() > 0.8) input.keys[k] = false;
        });

        // D. EXECUTE FRAME
        updateFunc(ctx, canvas, state, input);
        
        // E. Sanity Check: Detect NaN poisoning (e.g. division by zero in physics)
        // If the game uses a score or player position, ensure they are valid numbers
        if (state.score !== undefined && typeof state.score === 'number' && isNaN(state.score)) {
             throw new Error("Game State Corruption: 'score' became NaN.");
        }
        if (state.player && state.player.x !== undefined && isNaN(state.player.x)) {
             throw new Error("Game State Corruption: 'player.x' became NaN.");
        }
    }

    return { passed: true };

  } catch (e: any) {
    return { passed: false, error: e.message };
  }
};