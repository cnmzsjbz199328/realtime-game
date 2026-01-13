import { IRemix, GameDefinition } from '../../core/domain/types.js';
import { callAI } from './ai-client.js';

export class RemixService implements IRemix {
    async remix(game: GameDefinition, instruction: string): Promise<GameDefinition> {
        console.log('[REMIX] ========== Remix Started ==========');
        console.log('[REMIX] Game:', game.title);
        console.log('[REMIX] Instruction:', instruction);

        const prompt = `You are a Senior Game Engineer specializing in iterating and modifying existing game code.

=== Current Game Code ===
${game.code}

=== User Instruction ===
"${instruction}"

=== Task ===
Modify the provided code to fulfill the user's instruction WHILE PRESERVING the existing architecture and sandbox compatibility.

=== Sandbox Environment Constraints (CRITICAL) ===
1. **No Global Scope**: The code is executed inside a function wrapper. You MUST return an object with { init, update, draw }.
2. **No External Assets**: Do NOT use new Image(), new Audio(), or external URLs. Use Canvas API for all visuals.
3. **No DOM Access**: Do NOT access document, window, or canvas directly. Use the 'ctx' passed to draw().
4. **Input Handling**: 'input' is a pure data object (input.keys, input.isDown). It has NO methods.
5. **State Management**: Persist all state in the 'state' object passed to init/update/draw.
6. **DeltaTime**: Respect the existing time handling logic.

=== Output Format ===
Strictly output in the following format (no markdown blocks around the whole response):

TITLE: (New Title if changed, or same)
DESCRIPTION: (Updated description)
CODE:
\`\`\`javascript
// Your modified code here
\`\`\`
`;

        console.log('[REMIX] Calling AI for remix...');
        const startTime = Date.now();

        try {
            const contentRaw = await callAI([
                {
                    role: 'system',
                    content: 'You are a Senior Game Engineer. You modify existing Canvas game code based on user requests while maintaining code integrity.'
                },
                { role: 'user', content: prompt }
            ]);

            const elapsed = Date.now() - startTime;
            console.log('[REMIX] AI response received in', elapsed, 'ms');

            let content = contentRaw.trim();
            if (content.startsWith('```')) {
                content = content.replace(/^```[a-z]*\n/, '').replace(/```$/, '');
            }

            const titleMatch = content.match(/TITLE:\s*(.+)/);
            const descMatch = content.match(/DESCRIPTION:\s*(.+)/);
            const codeMatch = content.match(/CODE:[\s\S]*?```(?:javascript|js)?\s*([\s\S]*?)```/);

            if (!titleMatch || !descMatch || !codeMatch) {
                console.error('[REMIX] Parse Failed. Content:', content.substring(0, 200) + '...');
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
