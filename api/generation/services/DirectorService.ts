import { IDirector, DirectorResult } from '../../../core/domain/types.js';
import { getSkeletonDirectory } from '../skeletons/directory.js';
import { callAI } from './ai-client.js';

export class DirectorService implements IDirector {
    async classify(topic: string): Promise<DirectorResult> {
        console.log('[DIRECTOR] ========== Classification Started ==========');
        console.log('[DIRECTOR] Topic:', topic);

        const skeletonDirectory = getSkeletonDirectory();
        console.log('[DIRECTOR] Loaded skeleton directory with', skeletonDirectory.split('\n').length, 'types');

        const prompt = `你是游戏设计总监。你的任务是分析用户需求，选择最合适的游戏类型骨架，并扩展为详细的游戏设计描述。

可用的游戏类型骨架：
${skeletonDirectory}

用户需求: "${topic}"

任务:
1. 分析用户需求，理解核心意图
2. 从上述骨架中选择最合适的类型
3. 将用户需求扩展为以**故事和主题**为核心的游戏设计

扩展设计时必须侧重于:
- **游戏世界观与故事背景**: 玩家是谁？敌人的来历？任务的目标？
- **视觉主题与氛围**: 结合强制的霓虹配色，描述场景设定 (如"赛博丛林"、"数字虚空")
- **角色与实体设定**: 将抽象的方块/圆圈赋予故事意义 (例如: "玩家是反抗军战机，敌人是帝国无人机")
- **关卡进阶概念**: 难度提升在故事中意味着什么？

输出格式（仅返回 JSON，不要包含任何其他文本）:
{
  "skeletonId": "选择的骨架ID",
  "expandedDesign": "详细的游戏设计描述（侧重故事与设定，至少100字）"
}

重要提示:
- 如果不确定，选择 universal_minimal
- expandedDesign 必须富有想象力，为游戏注入灵魂`;

        console.log('[DIRECTOR] Calling AI for classification...');
        const startTime = Date.now();

        try {
            const contentRaw = await callAI([{ role: 'user', content: prompt }]);
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

            if (result.expandedDesign.length < 50) {
                console.warn('[DIRECTOR] Warning: Expanded design is too short');
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
                expandedDesign: `基于用户需求"${topic}"的游戏。使用霓虹配色（青色/品红/黄色），包含3个难度等级。玩家通过鼠标和键盘交互，目标是获得高分。`
            };
        }
    }
}
