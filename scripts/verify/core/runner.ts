
import { HeadlessSandbox, SandboxResult } from './sandbox';

// Simple runner to execute a single verification case
export const verifyCode = (code: string, contextName: string = 'Test'): SandboxResult => {
    console.log(`\n=== Verifying: ${contextName} ===`);

    const sandbox = new HeadlessSandbox(code);
    const result = sandbox.run(60); // Run 60 frames

    if (result.success) {
        console.log(`[PASS] ${contextName}`);
        console.log(`  - SFX Calls: ${result.sfxCalls.length}`);
    } else {
        console.log(`[FAIL] ${contextName}`);
        console.log(`  - Errors:`);
        result.errors.forEach(e => console.log(`    ❌ ${e}`));
    }

    return result;
};
