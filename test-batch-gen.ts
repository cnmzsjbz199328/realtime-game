import { DirectorService } from './server/services/DirectorService.js';
import { EngineerService } from './server/services/EngineerService.js';
import { getSkeletonContext } from './server/skeletons/registry.js';

async function runBatchTest() {
    const director = new DirectorService();
    const engineer = new EngineerService();

    const testCases = [
        { topic: "经典俄罗斯方块", type: "Puzzle" },
        { topic: "炫酷打砖块", type: "Action" },
        { topic: "末日僵尸生存射击", type: "Shooter" },
        { topic: "复古战棋策略", type: "Strategy" },
        { topic: "赛博朋克风五子棋", type: "Board" }
    ];

    const results = [];

    console.log(`Starting Batch Test for ${testCases.length} games...\n`);

    for (const testCase of testCases) {
        console.log(`\n>>> TESTING: ${testCase.topic} (${testCase.type}) <<<`);
        try {
            // 1. Director
            const directorResult = await director.classify(testCase.topic);

            // 2. Registry
            const skeletonContext = await getSkeletonContext(directorResult.skeletonId);

            // 3. Engineer
            const game = await engineer.generate(skeletonContext, directorResult.expandedDesign);

            // 4. Validation Logic
            const violations = [];

            if (game.code.includes('export ')) violations.push("Contains 'export' keyword");
            if (game.code.includes('import ')) violations.push("Contains 'import' keyword");
            if (game.code.includes('window.')) violations.push("Accesses 'window' object");
            if (game.code.includes('document.')) violations.push("Accesses 'document' object");

            // Variable shadowing check (very specific to the Tetris bug)
            const shadowingRegex = /const\s+state\s*=|let\s+state\s*=/;
            if (shadowingRegex.test(game.code)) violations.push("Shadows 'state' parameter with global variable");

            // Contract checks
            if (!game.code.includes('function init(state')) {
                // Check for arrow function version too
                if (!game.code.includes('const init = (state')) violations.push("Missing or misnamed 'init' function");
            }
            if (!game.code.includes('return { init, update, draw }')) {
                // Flexible check for different spacing
                const returnRegex = /return\s*{\s*init\s*,\s*update\s*,\s*draw\s*}/;
                if (!returnRegex.test(game.code)) violations.push("Missing or malformed return statement (Contract)");
            }

            // Style/Modernity checks
            const hasConfig = game.code.includes('const CONFIG =') || game.code.includes('const CONSTANTS =');
            const usesInputKeys = game.code.includes("input.keys[") || game.code.includes('input.keys[');

            const passed = violations.length === 0;

            results.push({
                topic: testCase.topic,
                skeleton: directorResult.skeletonId,
                passed,
                violations,
                hasConfig,
                usesInputKeys,
                codeSize: game.code.length
            });

            console.log(`[Director] Skeleton: ${directorResult.skeletonId}`);
            console.log(`[Engineer] Generated: ${game.title} (${game.code.length} chars)`);
            if (passed) {
                console.log(`[Result] ✅ PASSED`);
            } else {
                console.log(`[Result] ❌ FAILED - Violations: ${violations.join(', ')}`);
            }

        } catch (error) {
            console.error(`[Error] Failed to test ${testCase.topic}:`, error);
            results.push({
                topic: testCase.topic,
                error: (error as Error).message,
                passed: false
            });
        }
    }

    // Final Summary Report
    console.log('\n' + '='.repeat(80));
    console.log('FINAL BATCH TEST SUMMARY REPORT');
    console.log('='.repeat(80));
    console.log(String('Topic').padEnd(25) + ' | ' +
        String('Status').padEnd(8) + ' | ' +
        String('Config').padEnd(6) + ' | ' +
        String('Keys').padEnd(6) + ' | ' +
        'Violations / Errors');
    console.log('-'.repeat(80));

    results.forEach(r => {
        const status = r.passed ? '✅ OK' : '❌ FAIL';
        const config = r.hasConfig ? '✅' : '❌';
        const keys = r.usesInputKeys ? '✅' : '❌';
        const notes = r.error ? `Error: ${r.error}` : (r.violations?.join(', ') || 'None');

        console.log(String(r.topic).padEnd(25) + ' | ' +
            status.padEnd(8) + ' | ' +
            config.padEnd(6) + ' | ' +
            keys.padEnd(6) + ' | ' +
            notes);
    });
    console.log('='.repeat(80));
}

runBatchTest().catch(console.error);
