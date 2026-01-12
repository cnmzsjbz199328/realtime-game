import { IDirector, DirectorResult } from '../../../core/domain/types.js';
import { getSkeletonDirectory } from '../skeletons/directory.js';
import { callAI } from './ai-client.js';

export class DirectorService implements IDirector {
    async classify(topic: string): Promise<DirectorResult> {
        console.log('[DIRECTOR] ========== Classification Started ==========');
        console.log('[DIRECTOR] Topic:', topic);

        const skeletonDirectory = getSkeletonDirectory();
        console.log('[DIRECTOR] Loaded skeleton directory with', skeletonDirectory.split('\n').length, 'types');

        const prompt = `You are a Game Design Director. Your task is to analyze user requirements, select the most suitable game skeleton, and expand it into a detailed game design description.

Available Game Skeletons:
${skeletonDirectory}

User Requirements: "${topic}"

Tasks:
1. Analyze user requirements and understand core intent.
2. Select the most suitable skeleton ID from the list above.
3. Expand user requirements into a **Story and Theme** focused game design.

When expanding the design, focus on:
- **World & Story**: Who is the player? Origin of enemies? Mission goal?
- **Visual Theme & Atmosphere**: Combine with mandatory Neon colors, describe the setting (e.g., "Cyber Jungle", "Digital Void").
- **Roles & Entities**: Give story meaning to abstract shapes (e.g., "Player is a rebel fighter, enemies are imperial drones").
- **Progression Concept**: What does difficulty increase mean in the story context?

Output Format (Return JSON only, no other text):
{
  "skeletonId": "Selected Skeleton ID",
  "expandedDesign": "Detailed game design description (Focus on story and setting, at least 100 words)"
}

Important Notes:
- If uncertain, or if the user requests a game type NOT strictly listed (e.g., Tetris, Solitaire, Poker, or generic logic), you MUST select 'universal_minimal'.
- Do NOT force-fit unsupported game types into skeletons (e.g., do NOT put Tetris into 'click_eliminate').
- expandedDesign must be imaginative and inject 'soul' into the game.`;

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
                expandedDesign: `Game based on user request "${topic}". Uses neon color scheme (Cyan/Magenta/Yellow), includes 3 difficulty levels. Player interacts via mouse/keyboard, goal is to achieve high score.`
            };
        }
    }
}
