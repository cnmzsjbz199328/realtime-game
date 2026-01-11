import { IFixer, GameDefinition } from '../../../core/domain/types.js';
import { callAI } from './ai-client.js';

export class FixerService implements IFixer {
    async fix(game: GameDefinition, error: string): Promise<GameDefinition> {
        console.log('[FIXER] ========== Bug Fix Started ==========');
        console.log('[FIXER] Game:', game.title);
        console.log('[FIXER] Error:', error);

        const prompt = `你是高级游戏工程师，专门负责调试和修复代码错误。

当前游戏代码在 QA 测试中失败。

运行时错误: "${error}"

当前代码 (code):
${game.code}

任务: 修复代码中的 bug

修复指南:
1. 如果错误涉及 "strict mode" 或 "eval"/"arguments"，请移除所有 eval() 调用，重命名任何名为 arguments/eval 的变量，并改用显式参数传递。
2. 如果错误涉及 "Canvas element not found" 或 "getContext"，**删除所有 DOM 获取代码** (如 document.getElementById)，直接使用 draw 方法参数中的 ctx。
3. 确保代码是单闭包结构，导出接口必须为: return { init: (state, width, height) => void, update, draw }。
4. 保持游戏核心逻辑不变。
5. ⚠️ CRITICAL: width 和 height 参数仅在 init 和 draw 中可用。在 update(state, input, deltaTime) 中**绝对不可**直接使用 width/height，必须使用 state.width / state.height (需在 init 中保存)。
6. ⚠️ 数组访问前必须检查边界 (y < grid.length && x < grid[y].length)。

=== 输出格式 (Strict Text Format) ===
请严格按照以下格式输出，不要包含 Markdown 代码块包裹整个回复：

TITLE: ${game.title}
DESCRIPTION: ${game.description}
CODE:
\`\`\`javascript
// 修复后的代码
\`\`\`

=== 重要提示 ===
1. 不要输出 JSON
2. CODE: 后面必须是 markdown 代码块
3. 绝对禁止访问 document/window/canvas 等全局对象
4. 绝对禁止使用 new Image() 或 new Audio()，只能用 Canvas 绘图
5. 绝对禁止使用 requestAnimationFrame 自建循环`;

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
