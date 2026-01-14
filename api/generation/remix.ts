import type { VercelRequest, VercelResponse } from '@vercel/node';
import { RemixService } from '../../server/services/RemixService.js';
import type { GameDefinition } from '../../core/domain/types';
import { prisma } from '../../server/lib/prisma.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    console.log('[API/REMIX] ========== Remix Request ==========');

    try {
        const { game, instruction } = req.body;

        if (!game || !instruction) {
            return res.status(400).json({ error: 'Game and instruction are required' });
        }

        const remixer = new RemixService();
        const result = await remixer.remix(game as GameDefinition, instruction);

        // Phase 1 Feedback Logging: Record user optimization request
        try {
            await prisma.optimizationRecord.create({
                data: {
                    gameId: (game as any).id || 'new_gen',
                    userRequest: instruction,
                    skeletonId: (game as any).skeletonId || 'unknown',
                    status: 'PENDING'
                }
            });
            console.log('[API/REMIX] Optimization record logged to DB');
        } catch (dbError) {
            console.warn('[API/REMIX] Failed to log optimization feedback:', dbError);
        }

        return res.status(200).json({
            success: true,
            game: result
        });

    } catch (error: any) {
        console.error('[API/REMIX] Error:', error.message);
        return res.status(500).json({
            success: false,
            error: error.message || 'Internal Server Error'
        });
    }
}
