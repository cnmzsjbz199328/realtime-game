import { IFixer, GameDefinition } from '../../core/domain/types.js';
import { callAI } from './ai-client.js';
import { prisma } from '../lib/prisma.js';

export class FixerService implements IFixer {
    async fix(game: GameDefinition, error: string): Promise<GameDefinition> {
        console.log('[FIXER] ========== Bug Fix Started ==========');
        console.log('[FIXER] Game:', game.title);
        console.log('[FIXER] Error:', error);

        // Phase 2: Dynamic Prompts - Load from DB
        let systemPrompt = '';
        try {
            const dbPrompt = await prisma.systemPrompt.findFirst({
                where: { role: 'FIXER', isActive: true },
                orderBy: { version: 'desc' }
            });
            if (dbPrompt) {
                systemPrompt = dbPrompt.content;
                console.log(`[FIXER] Using dynamic system prompt (v${dbPrompt.version})`);
            }
        } catch (dbError) {
            console.warn('[FIXER] DB fetch failed, falling back to minimal prompt', dbError);
        }

        const compositePrompt = systemPrompt
            ? `${systemPrompt}\n\n=== Context ===\nRuntime Error: "${error}"\n\nCurrent Code:\n${game.code}`
            : `You are a Senior Debugger. Fix the following error in the game code: "${error}". 
            
=== Current Code ===
${game.code}

=== Output Format (STRICT) ===
TITLE: (Keep same or improve)
DESCRIPTION: (Keep same or improve)
CODE:
\`\`\`javascript
// Fixed code here
\`\`\`
`;

        console.log('[FIXER] Calling AI for bug fix...');
        const startTime = Date.now();

        try {
            const contentRaw = await callAI([
                {
                    role: 'system',
                    content: 'You are an expert game debugger. You MUST output your response using the labels TITLE:, DESCRIPTION:, and CODE: followed by a javascript block. NO other text.'
                },
                { role: 'user', content: compositePrompt }
            ]);

            const elapsed = Date.now() - startTime;
            console.log('[FIXER] AI response received in', elapsed, 'ms');

            // Clean content
            let content = contentRaw.trim();
            if (content.startsWith('```')) {
                content = content.replace(/^```[a-z]*\n/, '').replace(/```$/, '');
            }

            console.log('[FIXER] Parsing fixed game definition...');

            const titleMatch = content.match(/TITLE:\s*(.+)/);
            const descMatch = content.match(/DESCRIPTION:\s*(.+)/);
            const codeMatch = content.match(/CODE:[\s\S]*?```(?:javascript|js)?\s*([\s\S]*?)```/);

            if (!titleMatch || !descMatch || !codeMatch) {
                throw new Error('Failed to parse AI response. Expected format: TITLE, DESCRIPTION, CODE block.');
            }

            const fixedGame: GameDefinition = {
                title: titleMatch[1].trim(),
                description: descMatch[1].trim(),
                code: codeMatch[1].trim()
            };

            console.log('[FIXER] Fixed game title:', fixedGame.title);
            console.log('[FIXER] ========== Bug Fix Complete ==========');

            return fixedGame;

        } catch (error: any) {
            console.error('[FIXER] ========== Bug Fix Failed ==========');
            console.error('[FIXER] Error:', error.message);
            throw error;
        }
    }
}
