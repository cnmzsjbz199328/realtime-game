import { IEngineer, GameDefinition, SkeletonContext } from '../../core/domain/types.js';
import { callAI } from './ai-client.js';
import { prisma } from '../lib/prisma.js';

export class EngineerService implements IEngineer {
    async generate(
        skeletonContext: SkeletonContext,
        expandedDesign: string
    ): Promise<GameDefinition> {
        console.log('[ENGINEER] ========== Code Generation Started ==========');
        console.log('[ENGINEER] Skeleton:', skeletonContext.name, `(${skeletonContext.id})`);
        console.log('[ENGINEER] Design length:', expandedDesign.length, 'chars');

        // Phase 2: Dynamic Prompts - Load from DB
        let systemPrompt = '';
        try {
            const dbPrompt = await prisma.systemPrompt.findFirst({
                where: { role: 'ENGINEER', isActive: true },
                orderBy: { version: 'desc' }
            });
            if (dbPrompt) {
                systemPrompt = dbPrompt.content;
                console.log(`[ENGINEER] Using dynamic system prompt (v${dbPrompt.version})`);
            }
        } catch (dbError) {
            console.warn('[ENGINEER] DB fetch failed, falling back to minimal prompt', dbError);
        }

        const designContent = typeof expandedDesign === 'string'
            ? expandedDesign
            : JSON.stringify(expandedDesign, null, 2);

        const gameDesignContext = `
=== SKELETON SPECIFIC GUIDELINES ===
Game Type: ${skeletonContext.name}
${skeletonContext.systemPromptAddon ? skeletonContext.systemPromptAddon : ''}

=== DETAILED DESIGN CONCEPT ===
${designContent}
`;

        const compositePrompt = systemPrompt
            ? `${systemPrompt}\n\n=== CONTEXT ===\n${gameDesignContext}`
            : `You are an expert game engineer. Create a playable JS Canvas game using this design: ${gameDesignContext}. 
            
=== Output Format ===
TITLE: (Game Title)
DESCRIPTION: (Game Description)
CODE:
\`\`\`javascript
// Code here
\`\`\`
`;

        console.log('[ENGINEER] Calling AI for code generation...');
        const startTime = Date.now();

        try {
            const contentRaw = await callAI([
                {
                    role: 'system',
                    content: 'You MUST output your response using the labels TITLE:, DESCRIPTION:, and CODE: followed by a javascript block. Be self-sufficient and handle all logic locally.'
                },
                { role: 'user', content: compositePrompt }
            ]);

            const elapsed = Date.now() - startTime;
            console.log('[ENGINEER] AI response received in', elapsed, 'ms');

            // Clean content
            let content = contentRaw.trim();
            if (content.startsWith('```')) {
                content = content.replace(/^```[a-z]*\n/, '').replace(/```$/, '');
            }

            console.log('[ENGINEER] Parsing game definition...');

            const titleMatch = content.match(/TITLE:\s*(.+)/);
            const descMatch = content.match(/DESCRIPTION:\s*(.+)/);
            const codeMatch = content.match(/CODE:[\s\S]*?```(?:javascript|js)?\s*([\s\S]*?)```/);

            if (!titleMatch || !descMatch || !codeMatch) {
                console.error('[ENGINEER] Parse Failed. Content sample:', content.substring(0, 200));
                throw new Error('Failed to parse AI response. Expected format: TITLE, DESCRIPTION, CODE block.');
            }

            const gameDef: GameDefinition = {
                title: titleMatch[1].trim(),
                description: descMatch[1].trim(),
                code: codeMatch[1].trim()
            };

            console.log('[ENGINEER] Game title:', gameDef.title);
            console.log('[ENGINEER] Code success. Length:', gameDef.code.length);
            console.log('[ENGINEER] ========== Code Generation Complete ==========');

            return gameDef;

        } catch (error: any) {
            console.error('[ENGINEER] ========== Code Generation Failed ==========');
            console.error('[ENGINEER] Error:', error.message);
            throw error;
        }
    }
}
