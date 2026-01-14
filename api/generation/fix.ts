import type { VercelRequest, VercelResponse } from '@vercel/node';
import { FixerService } from '../../server/services/FixerService.js';
import type { GameDefinition } from '../../core/domain/types';

export default async function handler(req: VercelRequest, res: VercelResponse) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    console.log('[API/FIX] ========== Fix Request ==========');

    try {
        const { game, error } = req.body;

        if (!game || !error) {
            return res.status(400).json({ error: 'Game and error are required' });
        }

        console.log('[API/FIX] Game:', game.title);
        console.log('[API/FIX] Error:', error);

        const fixer = new FixerService();
        const fixedGame = await fixer.fix(game as GameDefinition, error);

        console.log('[API/FIX] Fixed:', fixedGame.title);

        // Phase 1 Feedback Logging: Record the failure and fix attempt
        try {
            const { prisma } = await import('../../server/lib/prisma.js');
            await prisma.issueRecord.create({
                data: {
                    gameId: (game as any).id || 'new_gen',
                    errorType: 'RUNTIME',
                    errorMsg: error,
                    fixPrompt: 'AI Automatic Fix',
                    skeletonId: (game as any).skeletonId || 'unknown',
                    status: 'PENDING'
                }
            });
            console.log('[API/FIX] Issue record logged to DB');
        } catch (dbError) {
            console.warn('[API/FIX] Failed to log failure feedback:', dbError);
        }

        console.log('[API/FIX] ========== Fix Complete ==========');

        return res.status(200).json({
            success: true,
            game: fixedGame
        });

    } catch (error: any) {
        console.error('[API/FIX] ========== Fix Failed ==========');
        console.error('[API/FIX] Error:', error.message);

        return res.status(500).json({
            success: false,
            error: error.message || 'Internal Server Error'
        });
    }
}
