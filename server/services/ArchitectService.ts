import { prisma } from '../lib/prisma.js';
import { callAISmall } from './ai-client.js';
import { SkeletonContext } from '../../core/domain/types.js';

export class ArchitectService {
    /**
     * Generates a Technical Implementation Spec based on the concept and skeleton.
     * Uses the 'ARCHITECT' system prompt and the 'small' model (Gemini).
     */
    static async generateSpec(
        concept: string,
        skeletonContext: SkeletonContext
    ): Promise<string> {
        console.log('[ArchitectService] Generating Spec...');

        // 1. Fetch System Prompt
        const systemPromptDoc = await prisma.systemPrompt.findFirst({
            where: { role: 'ARCHITECT', isActive: true },
            orderBy: { version: 'desc' },
        });

        if (!systemPromptDoc) {
            throw new Error('No active ARCHITECT system prompt found in database.');
        }

        const systemPrompt = systemPromptDoc.content;

        // 2. Construct User Message
        const constitutionSummary = `
- NO external libraries or assets (images/sounds).
- dt is in SECONDS.
- Standard HTML5 Canvas API only.
- Single file output constraints.
- SANDBOX SIGNATURES (MUST ADHERE):
  * init(state, w, h)
  * update(state, input, dt)
  * draw(state, ctx, w, h)
    `.trim();

        // Prefer 'details' (new field) but fallback to 'systemPromptAddon' if details is missing
        const skeletonDetails = skeletonContext.details || skeletonContext.systemPromptAddon || 'None';

        const userMessage = `
=== INPUTS ===
1. Concept: "${concept}"
2. Skeleton: "${skeletonContext.description}" (Details: ${skeletonDetails})
3. Engine Interface:
${skeletonContext.interfaceContext || 'Standard Canvas Wrapper'}
4. The Constitution:
${constitutionSummary}
    `.trim();

        // 3. Call LLM (Small Model)
        // We expect a Metadata + Markdown response.
        try {
            const response = await callAISmall([
                { role: 'system', content: systemPrompt },
                { role: 'user', content: userMessage },
            ]);

            console.log('[ArchitectService] Spec Generated. Length:', response.length);
            return response;
        } catch (err) {
            console.error('[ArchitectService] Spec Generation Failed:', err);
            throw err; // Propagate error so Director/Orchestrator can handle it (fallback or fail)
        }
    }
}
