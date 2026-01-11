import { IFixer, GameDefinition } from '../../../core/domain/types.js';
import { callAI } from './ai-client.js';

export class FixerService implements IFixer {
    async fix(game: GameDefinition, error: string): Promise<GameDefinition> {
        console.log('[FIXER] ========== Bug Fix Started ==========');
        console.log('[FIXER] Game:', game.title);
        console.log('[FIXER] Error:', error);

        const prompt = `You are a Senior Game Engineer specializing in debugging and code fixing.

The current game code failed in QA testing.

Runtime Error: "${error}"

Current Code:
${game.code}

Task: Fix bugs in the code.

Fix Guidelines:
1. If error involves "strict mode" or "eval"/"arguments", remove all eval() calls, rename arguments/eval variables, use explicit parameter passing.
2. If error involves "Canvas element not found" or "getContext", **REMOVE ALL DOM ACCESS CODE** (e.g. document.getElementById), strictly use ctx from draw parameters.
3. Ensure single closure structure, exported interface must be: return { init: (state, width, height) => void, update, draw }.
4. Maintain core game logic.
5. ⚠️ CRITICAL: width and height are ONLY available in init and draw. In update(state, input, deltaTime), you **MUST NOT** use width/height directly; use state.width/state.height (saved in init).
6. ⚠️ Check array boundaries (safe access) before accessing.

=== Output Format (Strict Text Format) ===
Strictly output in the following format, do not wrap response in markdown code blocks:

TITLE: ${game.title}
DESCRIPTION: ${game.description}
CODE:
\`\`\`javascript
// Fixed code
\`\`\`

=== Important Constraints ===
1. Do NOT output JSON
2. CODE: must be followed by markdown code block
3. Strictly forbidden to access document/window/canvas global objects
4. Strictly forbidden to use new Image() or new Audio(), use Canvas API only
5. Strictly forbidden to use requestAnimationFrame custom loops`;

        console.log('[FIXER] Calling AI for bug fix...');
        const startTime = Date.now();

        try {
            const contentRaw = await callAI([
                {
                    role: 'system',
                    content: 'You are a Senior Game Engineer specializing in debugging. You fix runtime errors in JavaScript Canvas games.'
                },
                { role: 'user', content: prompt }
            ]);

            const elapsed = Date.now() - startTime;
            console.log('[FIXER] AI response received in', elapsed, 'ms');

            // Clean content
            let content = contentRaw.trim();
            if (content.startsWith('```')) {
                content = content.replace(/^```[a-z]*\n/, '').replace(/```$/, '');
            }

            console.log('[FIXER] Parsing fixed game definition (Text Format)...');

            const titleMatch = content.match(/TITLE:\s*(.+)/);
            const descMatch = content.match(/DESCRIPTION:\s*(.+)/);
            const codeMatch = content.match(/CODE:[\s\S]*?```(?:javascript|js)?\s*([\s\S]*?)```/);

            if (!titleMatch || !descMatch || !codeMatch) {
                console.error('[FIXER] Parse Failed. Content:', content.substring(0, 200) + '...');
                throw new Error('Failed to parse AI response. Expected format: TITLE, DESCRIPTION, CODE block.');
            }

            const fixedGame: GameDefinition = {
                title: titleMatch[1].trim(),
                description: descMatch[1].trim(),
                code: codeMatch[1].trim()
            };

            console.log('[FIXER] Fixed game title:', fixedGame.title);
            console.log('[FIXER] Fixed code length:', fixedGame.code.length, 'chars');
            console.log('[FIXER] ========== Bug Fix Complete ==========');

            return fixedGame;

        } catch (error: any) {
            console.error('[FIXER] ========== Bug Fix Failed ==========');
            console.error('[FIXER] Error:', error.message);
            throw error;
        }
    }
}
