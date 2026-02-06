
import { PipelineGenerator } from './pipeline/generator';
import { Archiver, ArtifactBundle } from './pipeline/archiver';
import { HeadlessSandbox } from './core/sandbox';
import path from 'path';

// Parse Args
// Parse Args
const args = process.argv.slice(2);
const USE_MOCK = !args.includes("--real");
const promptArgs = args.filter(arg => !arg.startsWith('--'));
let prompt = promptArgs[0];

if (!prompt) {
    const validTopics = [
        "Tower Defense",
        "Space Invaders",
        "Snake Game",
        "Flappy Bird",
        "Breakout",
        "Clicker Idle Game"
    ];
    prompt = validTopics[Math.floor(Math.random() * validTopics.length)];
    console.log(`🎲 No prompt provided. Selected random topic: "${prompt}"`);
}

async function main() {
    console.log("=== 🛡️  Realtime-Game Verification System 🛡️  ===");
    console.log(`Target Prompt: "${prompt}"`);
    console.log(`Mode: ${USE_MOCK ? "MOCK (Internal Test)" : "REAL (API Call)"}`);

    // 1. Setup
    const generator = new PipelineGenerator();
    const archiver = new Archiver();
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const gameId = prompt.split(' ')[0].toLowerCase().replace(/[^a-z0-9]/g, '');

    // 2. Generate
    console.log("\n>>> Phase 1: Generation");
    const genResult = await generator.generateGame(prompt);

    if (genResult.error) {
        console.error("❌ Generation Failed:", genResult.error);
        process.exit(1);
    }
    console.log("✅ Code Generated.");

    // 3. Verify (Sandbox)
    console.log("\n>>> Phase 2: Verification (Headless Sandbox)");
    const sandbox = new HeadlessSandbox(genResult.code);
    const result = sandbox.run(60); // 60 frames

    // 4. Report
    if (result.success) {
        console.log("✅ VERIFICATION PASSED");
        console.log(`   - SFX Checks: ${result.sfxCalls.length} calls`);
    } else {
        console.error("❌ VERIFICATION FAILED");
        result.errors.forEach(e => console.error(`   - ${e}`));
    }

    // 5. Archive
    const bundle: ArtifactBundle = {
        gameId,
        timestamp,
        design: genResult.design,
        spec: genResult.spec,
        codeV1: genResult.code,
        runtimeLogs: result.logs,
        errors: result.errors,
        result: result.success ? 'PASS' : 'FAIL'
    };

    const savePath = archiver.save(bundle);
    console.log(`\n📂 Artifacts archived at: ${savePath}`);

    // Exit code based on result
    process.exit(result.success ? 0 : 1);
}

main().catch(err => {
    console.error(err);
    process.exit(1);
});
