/**
 * Skeleton Registry
 * Managed via Database. Decoupled from filesystem.
 */
import { prisma } from '../lib/prisma.js';
import type { SkeletonContext } from '../../core/domain/types.js';
import { ENGINE_INTERFACE } from './engine.js';

/**
 * For Engineer: Get skeleton context with interface and prompts directly from DB.
 * It parses the Markdown 'description' field to extract specific sections.
 */
export async function getSkeletonContext(id: string): Promise<SkeletonContext | null> {
    console.log('[REGISTRY] Loading dynamic skeleton from DB:', id);

    try {
        const dbSkel = await prisma.skeleton.findUnique({ where: { id } });
        if (!dbSkel) {
            console.warn(`[REGISTRY] Skeleton not found in DB: ${id}`);
            return null;
        }

        const content = dbSkel.description;

        // 1. Extract Interface
        const interfaceMatch = content.match(/# Interface[\s\S]*?```[\w]*[\r\n]+([\s\S]*?)[\r\n]+```/);
        const skeletonInterface = interfaceMatch ? interfaceMatch[1].trim() : '';

        // 2. Extract System Prompt Addon
        // Matches everything after "# System Prompt" up to the next heading or end of string
        const promptMatch = content.match(/# System Prompt[\r\n]+([\s\S]*?)(?=[\r\n]+#|$)/);
        const promptAddon = promptMatch ? promptMatch[1].trim() : '';

        return {
            id: dbSkel.id,
            name: dbSkel.name,
            interfaceContext: ENGINE_INTERFACE + '\n' + skeletonInterface,
            systemPromptAddon: promptAddon
        };

    } catch (dbError) {
        console.error(`[REGISTRY] DB lookup failed for ${id}:`, dbError);
        return null;
    }
}

// For Director: Get skeleton directory (DirectorService now handles dynamic listing, but keeping this as utility)
export { getSkeletonDirectory } from './directory.js';
