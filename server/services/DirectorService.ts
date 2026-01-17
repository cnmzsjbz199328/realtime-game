import { IDirector, DirectorResult } from '../../core/domain/types.js';
import { getSkeletonDirectory } from '../skeletons/directory.js';
import { callAI } from './ai-client.js';
import { prisma } from '../lib/prisma.js';

export class DirectorService implements IDirector {
    async classify(topic: string): Promise<DirectorResult> {
        console.log('[DIRECTOR] ========== Classification Started ==========');
        console.log('[DIRECTOR] Topic:', topic);

        // Load skeletons for directory
        let skeletonDirectory = '';
        try {
            const dbSkeletons = await prisma.skeleton.findMany({
                select: { id: true, description: true },
                orderBy: { id: 'asc' }
            });
            if (dbSkeletons.length > 0) {
                skeletonDirectory = dbSkeletons.map((s, idx) => `${idx + 1}. ${s.id}: ${s.description}`).join('\n');
                console.log(`[DIRECTOR] Built dynamic directory with ${dbSkeletons.length} skeletons`);
            } else {
                skeletonDirectory = getSkeletonDirectory();
            }
        } catch (dbError) {
            console.warn('[DIRECTOR] DB skeleton fetch failed, using static directory', dbError);
            skeletonDirectory = getSkeletonDirectory();
        }

        console.log('[DIRECTOR] Loaded skeleton directory with', skeletonDirectory.split('\n').length, 'types');

        // Phase 2: Dynamic Prompts - Load from DB
        let systemPrompt = '';
        try {
            const dbPrompt = await prisma.systemPrompt.findFirst({
                where: { role: 'DIRECTOR', isActive: true },
                orderBy: { version: 'desc' }
            });
            if (dbPrompt) {
                systemPrompt = dbPrompt.content;
                console.log(`[DIRECTOR] Using dynamic system prompt (v${dbPrompt.version})`);
            }
        } catch (dbError) {
            console.warn('[DIRECTOR] DB fetch failed, falling back to minimal prompt', dbError);
        }

        const compositePrompt = systemPrompt
            ? `${systemPrompt}\n\nAvailable Skeletons:\n${skeletonDirectory}\n\nUser Input: "${topic}"`
            : `Classify topic "${topic}" into one of these skeletons: ${skeletonDirectory}. Return JSON: { "skeletonId": "id", "expandedDesign": "description" }`;

        console.log('[DIRECTOR] Calling AI for classification...');
        const startTime = Date.now();

        try {
            const contentRaw = await callAI([
                {
                    role: 'system',
                    content: 'You are a Game Design Director. You MUST return ONLY a JSON object with "skeletonId" and "expandedDesign" keys. NO other text.'
                },
                { role: 'user', content: compositePrompt }
            ]);
            const elapsed = Date.now() - startTime;
            console.log('[DIRECTOR] AI response received in', elapsed, 'ms');

            // Clean and parse JSON
            let content = contentRaw.trim();
            content = content.replace(/```json\s*/g, '').replace(/```\s*/g, '');

            console.log('[DIRECTOR] Parsing classification result...');
            const result = JSON.parse(content) as DirectorResult;

            // Clean skeleton ID (remove "1. ", etc)
            result.skeletonId = result.skeletonId.replace(/^\d+\.\s*/, '').trim().split(' ')[0];

            // Validate result
            if (!result.skeletonId || !result.expandedDesign) {
                throw new Error('Invalid classification result: missing required fields');
            }

            console.log('[DIRECTOR] Selected skeleton:', result.skeletonId);
            console.log('[DIRECTOR] Expanded design length:', result.expandedDesign.length, 'chars');
            console.log('[DIRECTOR] ========== Classification Complete ==========');

            return result;

        } catch (error: any) {
            console.error('[DIRECTOR] ========== Classification Failed ==========');
            console.error('[DIRECTOR] Error:', error.message);

            // Fallback to universal_minimal
            console.log('[DIRECTOR] Falling back to universal_minimal');
            return {
                skeletonId: 'universal_minimal',
                expandedDesign: `Game based on user request "${topic}". Uses neon color scheme (Cyan/Magenta/Yellow), includes 3 difficulty levels. Player interacts via mouse/keyboard, goal is to achieve high score.`
            };
        }
    }
}
