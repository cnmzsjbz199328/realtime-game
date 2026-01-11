/**
 * Skeleton Registry
 * Maps Skeleton IDs to their Markdown filenames.
 */
import { loadSkeleton, SkeletonDefinition } from './loader.js';
import type { SkeletonContext } from '../../../core/domain/types.js';

const SKELETON_FILES: Record<string, string> = {
    'universal_minimal': 'universal_minimal.md',
    'tower_defense': 'tower_defense.md',
    'gravity_platformer': 'platformer.md',
    'scrolling_shooter': 'scrolling_shooter.md',
    'maze_pathfinding': 'maze_pathfinding.md',
    'match3': 'match3.md',
    // Following skeletons will be converted to design-guide format
    'universal_collection': 'collection.md',
    'survival_shooter': 'survival_shooter.md',
    'snake_grid': 'snake_grid.md',
    'turnbased_grid': 'turnbased_grid.md',
    'breakout_paddle': 'breakout_paddle.md',
    'dodge_falling': 'dodge_falling.md',
    'endless_runner': 'endless_runner.md',
    'click_eliminate': 'click_eliminate.md',
    'impulse_physics': 'impulse_physics.md',
    'bullet_hell': 'bullet_hell.md',
};

export const AVAILABLE_SKELETONS = Object.keys(SKELETON_FILES);

export function getSkeleton(id: string): SkeletonDefinition | null {
    const filename = SKELETON_FILES[id];
    if (!filename) {
        console.warn(`[REGISTRY] Skeleton ID not found: ${id}`);
        return null;
    }
    return loadSkeleton(filename);
}



// For Director: Get skeleton directory as formatted string
export { getSkeletonDirectory } from './directory.js';

// For Engineer: Get skeleton context with interface and prompts
export function getSkeletonContext(id: string): SkeletonContext | null {
    console.log('[REGISTRY] Loading skeleton context for:', id);

    const skeleton = getSkeleton(id);
    if (!skeleton) {
        console.warn('[REGISTRY] Skeleton not found:', id);
        return null;
    }

    console.log('[REGISTRY] Skeleton loaded:', skeleton.name);

    return {
        id: skeleton.id,
        name: skeleton.name,
        interfaceContext: skeleton.interfaceContext,
        systemPromptAddon: skeleton.systemPromptAddon
    };
}

