
import { HeadlessSandbox } from './core/sandbox';
import { createMockSfx } from './mocks/mock_audio';

// Test Code: Using the new sfx.note API
const TEST_CODE = `
function init(state, w, h) {
    state.hasPlayed = false;
    return state;
}

function update(state, input, dt, w, h) {
    if (!state.hasPlayed) {
        // Test: Using note name
        sfx.note('C4', 0.5, 'sine');
        
        // Test: Using raw frequency
        sfx.note(440, 0.25, 'square');
        
        state.hasPlayed = true;
    }
}

function draw(state, ctx, w, h) {
    ctx.fillStyle = COLORS.BG;
    ctx.fillRect(0, 0, w, h);
}

return { init, update, draw };
`;

async function runTest() {
    console.log("=== Testing Audio Engine Injection ===");

    // 1. Initialize Sandbox
    const sandbox = new HeadlessSandbox(TEST_CODE);

    // 2. Run Single Frame Simulation
    // This will trigger 'init' and one 'update' call
    const result = sandbox.run(1);

    // 3. Verify Results
    if (!result.success) {
        console.error("❌ Sandbox Execution Failed:", result.errors);
        process.exit(1);
    }

    console.log("✓ Sandbox executed successfully.");

    // 4. Verify Audio Calls
    const logs = result.sfxCalls;
    console.log("Captured SFX Logs:", logs);

    const hasC4 = logs.some(log => log.includes('C4') && log.includes('sine'));
    const has440 = logs.some(log => log.includes('440') && log.includes('square'));

    if (hasC4 && has440) {
        console.log("✅ SUCCESS: sfx.note() correctly injected and intercepted.");
        process.exit(0);
    } else {
        console.error("❌ FAILURE: Expected sfx.note calls not found.");
        process.exit(1);
    }
}

runTest();
