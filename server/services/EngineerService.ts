import { IEngineer, GameDefinition, SkeletonContext } from '../../core/domain/types.js';
import { callAIReasoning } from './ai-client.js';
import { prisma } from '../lib/prisma.js';
import { stripCodeFences, parseGameDefinition } from '../utils/parseAIResponse.js';

export class EngineerService implements IEngineer {
    async generate(
        skeletonContext: SkeletonContext,
        expandedDesign: string,
        architectSpec?: string
    ): Promise<GameDefinition> {
        console.log('[ENGINEER] ========== Code Generation Started ==========');
        console.log('[ENGINEER] Skeleton:', skeletonContext.description, `(${skeletonContext.id})`);
        console.log('[ENGINEER] Design length:', expandedDesign.length, 'chars');
        if (architectSpec) {
            console.log('[ENGINEER] Architect Spec provided. Length:', architectSpec.length, 'chars');
        }

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

        let gameDesignContext = `
=== SKELETON SPECIFIC GUIDELINES ===
Game Type: ${skeletonContext.description}
${skeletonContext.interfaceContext ? '\n=== ENGINE INTERFACE ===\n' + skeletonContext.interfaceContext : ''}
${skeletonContext.systemPromptAddon ? '\n=== LOGIC GUIDELINES ===\n' + skeletonContext.systemPromptAddon : ''}

=== DETAILED DESIGN CONCEPT ===
${designContent}
`;

        if (architectSpec) {
            gameDesignContext += `
=== ARCHITECTURAL SPECIFICATION (BLUEPRINT) ===
You MUST strictly implement the following logic and state schema. 
This Spec is your definitive guide for "How" to build the game.
${architectSpec}
            `;
        }

        const compositePrompt = `${systemPrompt}\n\n=== CONTEXT ===\n${gameDesignContext}`;

        console.log('[ENGINEER] Calling AI for code generation...');
        const startTime = Date.now();

        try {
            // DeepSeek R1 不使用 system prompt，v9 宪法已包含所有必要指令
            const contentRaw = await callAIReasoning([
                { role: 'user', content: compositePrompt }
            ]);

            const elapsed = Date.now() - startTime;
            console.log('[ENGINEER] AI response received in', elapsed, 'ms');

            console.log('[ENGINEER] Parsing game definition...');
            let gameDef: GameDefinition;
            try {
                gameDef = parseGameDefinition(stripCodeFences(contentRaw));
            } catch {
                console.error('[ENGINEER] Parse Failed. Content sample:', contentRaw.substring(0, 200));
                throw new Error('Failed to parse AI response. Expected format: TITLE, DESCRIPTION, CODE block.');
            }

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
