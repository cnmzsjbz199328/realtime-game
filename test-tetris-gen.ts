import { DirectorService } from './server/services/DirectorService.js';
import { EngineerService } from './server/services/EngineerService.js';
import { getSkeletonContext } from './server/skeletons/registry.js';
import * as fs from 'fs';

async function testTetrisGeneration() {
    const director = new DirectorService();
    const engineer = new EngineerService();

    console.log('--- Phase 1: Director ---');
    const topic = "俄罗斯方块";
    const directorResult = await director.classify(topic);
    console.log('Director Result:', directorResult);

    console.log('\n--- Phase 2: Skeleton Registry ---');
    const skeletonContext = await getSkeletonContext(directorResult.skeletonId);
    console.log('Skeleton Context loaded:', skeletonContext.id);

    console.log('\n--- Phase 3: Engineer ---');
    const game = await engineer.generate(skeletonContext, directorResult.expandedDesign);

    console.log('\n--- Verification ---');
    console.log('Title:', game.title);
    console.log('Description:', game.description);

    const hasExport = game.code.includes('export ');
    const hasInit = game.code.includes('const init =');
    const hasReturn = game.code.includes('return { init, update, draw }');
    const hasWindow = game.code.includes('window.');

    console.log('Contains "export":', hasExport);
    console.log('Has "init" definition:', hasInit);
    console.log('Has proper return:', hasReturn);
    console.log('Contains "window.":', hasWindow);

    if (!hasExport && hasInit && hasReturn && !hasWindow) {
        console.log('\n✅ TEST PASSED: Code follows sandbox rules.');
    } else {
        console.log('\n❌ TEST FAILED: Code violates sandbox rules.');
        console.log('Raw Code Start:\n', game.code.substring(0, 500));
    }
}

testTetrisGeneration().catch(console.error);
