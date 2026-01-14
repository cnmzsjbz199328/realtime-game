import { IRemix, GameDefinition } from '../../core/domain/types.js';
import { callAI } from './ai-client.js';
import { prisma } from '../lib/prisma.js';

export class RemixService implements IRemix {
    async remix(game: GameDefinition, instruction: string): Promise<GameDefinition> {
        console.log('[REMIX] ========== Remix Started ==========');
        console.log('[REMIX] Game:', game.title);
        console.log('[REMIX] Instruction:', instruction);

        // Load dynamic prompt from DB
        let systemPrompt = '';
        try {
            const dbPrompt = await prisma.systemPrompt.findFirst({
                where: { role: 'REMIXER', isActive: true },
                orderBy: { version: 'desc' }
            });
            if (dbPrompt) {
                systemPrompt = dbPrompt.content;
                console.log(`[REMIX] Using dynamic system prompt (v${dbPrompt.version})`);
            }
        } catch (dbError) {
            console.warn('[REMIX] DB fetch failed, using minimal prompt', dbError);
        }

        const compositePrompt = systemPrompt
            ? `${systemPrompt}\n\n=== Current Game Code ===\n${game.code}\n\n=== User Instruction ===\n"${instruction}"`
            : `You are a Senior Game Engineer. Rewrite the code of this game based on the instruction.
            
=== Current Code ===
${game.code}

=== Instruction ===
"${instruction}"

=== Output Format (STRICT) ===
TITLE: (New title or keep same)
DESCRIPTION: (Updated description)
CODE:
\`\`\`javascript
// Updated code here
\`\`\`
`;

        console.log('[REMIX] Calling AI for remix...');
        const startTime = Date.now();

        try {
            const contentRaw = await callAI([
                {
                    role: 'system',
                    content: 'You are an expert game engineer. You MUST output your response using the labels TITLE:, DESCRIPTION:, and CODE: followed by a javascript block. NO other text before or after labels.'
                },
                { role: 'user', content: compositePrompt }
            ]);

            const elapsed = Date.now() - startTime;
            console.log('[REMIX] AI response received in', elapsed, 'ms');

            let content = contentRaw.trim();

            // Strict parsing
            const titleMatch = content.match(/TITLE:\s*(.+)/);
            const descMatch = content.match(/DESCRIPTION:\s*(.+)/);
            const codeMatch = content.match(/CODE:[\s\S]*?```(?:javascript|js)?\s*([\s\S]*?)```/);

            if (!titleMatch || !descMatch || !codeMatch) {
                console.error('[REMIX] Parse Failed. Raw content start:', content.substring(0, 200));
                throw new Error('Failed to parse AI response. Expected format: TITLE, DESCRIPTION, CODE block.');
            }

            const remixedGame: GameDefinition = {
                title: titleMatch[1].trim(),
                description: descMatch[1].trim(),
                code: codeMatch[1].trim()
            };

            console.log('[REMIX] Remix complete:', remixedGame.title);
            return remixedGame;

        } catch (error: any) {
            console.error('[REMIX] Failed:', error.message);
            throw error;
        }
    }
}
