/**
 * Skeleton Definition for Progressive Disclosure System
 * 
 * Each skeleton contains:
 * - runtimeCode: The full working code (hidden from AI, used at runtime)
 * - interfaceContext: TypeScript signatures only (visible to AI)
 * - systemPromptAddon: Specific instructions for this skeleton type
 */
export interface SkeletonDefinition {
    id: string;
    name: string;
    description: string; // For Director to understand what this skeleton does

    // HIDDEN: Full working engine + skeleton classes
    // Prepended to AI output before sending to browser
    runtimeCode: string;

    // VISIBLE TO AI: TypeScript signatures only
    // Example: "class Tower { constructor(x, y, range)... }"
    interfaceContext: string;

    // PROMPT ADDONS: Specific instructions for this skeleton
    // Example: "Define 'initGame'. Use 'new Tower(...)'. Do not redefine classes."
    systemPromptAddon: string;
}

export interface DirectorResponse {
    skeletonId: string;
    expandedDesign: string;
}

export interface SkeletonRegistry {
    [id: string]: SkeletonDefinition;
}
