import { IDirector, IEngineer, IFixer, IRemix, DirectorResult, GameDefinition, SkeletonContext } from '../../core/domain/types';

/**
 * Frontend API Service
 * Calls backend API endpoints instead of running AI logic in browser
 */

export class FrontendDirector implements IDirector {
    async classify(topic: string): Promise<DirectorResult> {
        // This is not used in frontend - generation happens via /api/generation/create
        throw new Error('Director should not be called directly from frontend');
    }
}

export class FrontendEngineer implements IEngineer {
    async generate(skeletonContext: SkeletonContext, expandedDesign: string): Promise<GameDefinition> {
        // This is not used in frontend - generation happens via /api/generation/create
        throw new Error('Engineer should not be called directly from frontend');
    }
}

export class FrontendFixer implements IFixer {
    async fix(game: GameDefinition, error: string): Promise<GameDefinition> {
        console.log('[FRONTEND/FIXER] Calling backend fix API...');

        const response = await fetch('/api/generation/fix', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ game, error })
        });

        if (!response.ok) {
            throw new Error(`Fix API failed: ${response.status}`);
        }

        const data = await response.json();

        if (!data.success) {
            throw new Error(data.error || 'Fix failed');
        }

        return data.game;
    }
}

export class FrontendRemixer implements IRemix {
    async remix(game: GameDefinition, instruction: string): Promise<GameDefinition> {
        console.log('[FRONTEND/REMIXER] Calling backend remix API...');

        const response = await fetch('/api/generation/remix', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ game, instruction })
        });

        if (!response.ok) {
            throw new Error(`Remix API failed: ${response.status}`);
        }

        const data = await response.json();

        if (!data.success) {
            throw new Error(data.error || 'Remix failed');
        }

        return data.game;
    }
}

/**
 * Game Generator Service (Frontend)
 * Calls /api/generation/create which runs Director + Engineer on backend
 */
export class FrontendGameGenerator {
    async generate(topic: string): Promise<GameDefinition> {
        console.log('[FRONTEND/GENERATOR] Calling backend create API...');
        console.log('[FRONTEND/GENERATOR] Topic:', topic);

        const response = await fetch('/api/generation/create', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ topic })
        });

        if (!response.ok) {
            throw new Error(`Create API failed: ${response.status}`);
        }

        const data = await response.json();

        if (!data.success) {
            throw new Error(data.error || 'Generation failed');
        }

        const game = data.game;
        if (data.metadata) {
            (game as any).skeletonId = data.metadata.skeletonId;
        }

        return game;
    }
}
