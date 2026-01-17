/**
 * Skeleton Directory
 * Static skeleton descriptions for Director (browser-safe)
 */

export const SKELETON_DIRECTORY = `
- universal_minimal
- tower_defense
- gravity_platformer
- scrolling_shooter
- maze_pathfinding
- match3
- universal_collection
- survival_shooter
- snake_grid
- breakout_paddle
- dodge_falling
- endless_runner
- click_eliminate
- turnbased_grid
- impulse_physics
- bullet_hell
`.trim();

export function getSkeletonDirectory(): string {
    return SKELETON_DIRECTORY;
}
