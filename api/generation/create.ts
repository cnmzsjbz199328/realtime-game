import type { VercelRequest, VercelResponse } from '@vercel/node';
import { DirectorService } from '../../server/services/DirectorService.js';
import { EngineerService } from '../../server/services/EngineerService.js';
import { getSkeletonContext } from '../../server/skeletons/registry.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    console.log('[API/CREATE] ========== Generation Request ==========');

    try {
        const { topic } = req.body;

        if (!topic || typeof topic !== 'string') {
            return res.status(400).json({ error: 'Topic is required' });
        }

        console.log('[API/CREATE] Topic:', topic);

        // Phase 1: Director Classification
        console.log('[API/CREATE] Phase 1: Director Classification');
        const director = new DirectorService();
        const { skeletonId, expandedDesign } = await director.classify(topic);

        console.log('[API/CREATE] Selected skeleton:', skeletonId);
        console.log('[API/CREATE] Design length:', expandedDesign.length);

        // Phase 2: Load Skeleton Context
        console.log('[API/CREATE] Phase 2: Loading Skeleton Context');
        const skeletonContext = await getSkeletonContext(skeletonId);

        if (!skeletonContext) {
            throw new Error(`Skeleton not found: ${skeletonId}`);
        }

        console.log('[API/CREATE] Skeleton loaded:', skeletonContext.description);

        // Phase 3: Engineer Code Generation
        console.log('[API/CREATE] Phase 3: Engineer Code Generation');
        const engineer = new EngineerService();
        const gameDef = await engineer.generate(skeletonContext, expandedDesign);

        console.log('[API/CREATE] Generated:', gameDef.title);
        console.log('[API/CREATE] ========== Generation Complete ==========');

        return res.status(200).json({
            success: true,
            game: gameDef,
            metadata: {
                skeletonId,
                skeletonName: skeletonContext.description
            }
        });

    } catch (error: any) {
        console.error('[API/CREATE] ========== Generation Failed ==========');
        console.error('[API/CREATE] Error:', error.message);

        return res.status(500).json({
            success: false,
            error: error.message || 'Internal Server Error'
        });
    }
}
