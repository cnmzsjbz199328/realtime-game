
import fs from 'fs';
import path from 'path';

export interface ArtifactBundle {
    gameId: string;
    timestamp: string;
    design?: any;
    spec?: string;
    codeV1?: string;
    codeV2?: string;
    runtimeLogs?: string[];
    errors?: string[];
    result: 'PASS' | 'FAIL';
}

/**
 * Manages storage of verification artifacts.
 */
export class Archiver {
    private baseDir: string;

    constructor() {
        this.baseDir = path.resolve(process.cwd(), 'tests', 'artifacts');
        if (!fs.existsSync(this.baseDir)) {
            fs.mkdirSync(this.baseDir, { recursive: true });
        }
    }

    save(bundle: ArtifactBundle) {
        // Create folder: tests/artifacts/2026-02-05_12-30_breakout
        const folderName = `${bundle.timestamp}_${bundle.gameId}`;
        const folderPath = path.join(this.baseDir, folderName);

        if (!fs.existsSync(folderPath)) {
            fs.mkdirSync(folderPath, { recursive: true });
        }

        // 1. Save Report Meta
        fs.writeFileSync(path.join(folderPath, 'report.json'), JSON.stringify({
            result: bundle.result,
            gameId: bundle.gameId,
            timestamp: bundle.timestamp,
            errors: bundle.errors || []
        }, null, 2));

        // 2. Save Content
        if (bundle.design) {
            fs.writeFileSync(path.join(folderPath, '01_design.json'), JSON.stringify(bundle.design, null, 2));
        }
        if (bundle.spec) {
            fs.writeFileSync(path.join(folderPath, '02_spec.md'), bundle.spec);
        }
        if (bundle.codeV1) {
            fs.writeFileSync(path.join(folderPath, '03_code_v1.js'), bundle.codeV1);
        }
        if (bundle.codeV2) {
            fs.writeFileSync(path.join(folderPath, '05_fixer_code_v2.js'), bundle.codeV2);
        }
        if (bundle.runtimeLogs) {
            fs.writeFileSync(path.join(folderPath, '04_runtime_logs.txt'), bundle.runtimeLogs.join('\n'));
        }

        console.log(`[Archiver] Artifacts saved to: ${folderName}`);
        return folderPath;
    }
}
