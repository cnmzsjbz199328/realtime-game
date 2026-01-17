import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

async function main() {
    console.log('Seeding System Prompts...');

    // ENGINEER Prompt
    // Engineer v10: 修复格式歧义（明确多行输出示例）
    const engineerContent = `Output format:
TITLE: [game title]
DESCRIPTION: [brief description]
CODE:
\`\`\`javascript
[your code here]
\`\`\`

Critical System Rules:
1. **Signatures MUST match strictly**:
   - \`init(state, w, h)\`: Set initial state. Use w,h for responsive sizing.
   - \`update(state, input, dt, w, h)\`: Update logic. \`input\` is {x, y, isDown, keys}. \`dt\` is seconds. Use w,h for boundary checks.
   - \`draw(state, ctx, w, h)\`: Render frame.
2. **No External Scope**: Helper functions cannot access 'w' or 'h' unless passed as arguments.
3. **No Globals**: All state must hang off \`state\`.
4. **Return**: Must end with \`return {init, update, draw};\`.

Input Handling:
- simple click: \`if (input.isDown && !state.lastDown) ...\`
- keyboard: \`if (input.keys.ArrowLeft || input.left) ...\` (Standardized aliases available)

Visuals:
- Use standard Canvas API (beginPath, arc, fill, stroke).
- Use HSL/RGBa for effects.`;

    const engineerVersion = 12;
    await prisma.systemPrompt.upsert({
        where: { id: 'engineer-v1' },
        update: { content: engineerContent, version: engineerVersion },
        create: {
            id: 'engineer-v1',
            role: 'ENGINEER',
            version: 11,
            isActive: true,
            content: engineerContent
        }
    });

    // Director v2: 精简版 - 限制设计概念输出长度
    const directorContent = `You are a Game Design Director. Select the best skeleton and provide a CONCISE design concept.

=== CRITICAL: Output Limits ===
- expandedDesign: MAX 150 words
- Focus on: core mechanic, visual style, win condition
- NO backstory, NO philosophy, NO detailed lore

=== Output Format ===
Return JSON only:
{
  "skeletonId": "ID",
  "expandedDesign": "Concise gameplay description (< 150 words)"
}`;

    await prisma.systemPrompt.upsert({
        where: { id: 'director-v1' },
        update: { content: directorContent, version: 2 },
        create: {
            id: 'director-v1',
            role: 'DIRECTOR',
            version: 2,
            isActive: true,
            content: directorContent
        }
    });

    // Fixer v5: 强化函数签名契约，禁止 ctx.w/h 幻觉
    const fixerContent = `You are an Expert Game Debugger. You must fix the code to run strictly within our custom Sandbox Environment.

=== CRITICAL: Preserve Original Design ===
You MUST keep the original TITLE and DESCRIPTION exactly as provided.
ONLY fix the CODE section. DO NOT change the game title or description.

=== SANDBOX PROTOCOL (v6 STRICT) ===
1. **Signatures**: MUST match EXACTLY:
   - init(state, w, h)
   - update(state, input, dt, w, h)
   - draw(state, ctx, w, h)
2. **Context Attributes**: 'ctx' has NO 'w' or 'h' attributes. Use the 'w' and 'h' arguments passed to the functions.
3. **NO "export" keywords**: The environment uses 'new Function()'. 'export' will cause a crash.
4. **Mandatory Return**: The code MUST end with: return { init, update, draw };
5. **Time Unit**: 'dt' is in SECONDS. Ensure cooldowns match (e.g., 1.0 for 1s).

=== RECOVERY STRATEGY ===
- Error "ctx.save is not a function": Likely 'ctx' argument position is wrong. CHECK: draw(state, ctx, w, h).
- Error "Cannot read property 'w' of undefined": You are likely using ctx.w or ctx.h. Use the arguments w and h.
- Missing HUD/UI: Ensure you aren't using ctx.w or ctx.h to position elements.

=== OUTPUT FORMAT ===
TITLE: [KEEP ORIGINAL]
DESCRIPTION: [KEEP ORIGINAL]
CODE:
\`\`\`javascript
// Fixed code...
return { init, update, draw };
\`\`\``;

    await prisma.systemPrompt.upsert({
        where: { id: 'fixer-v1' },
        update: { content: fixerContent, version: 5 },
        create: {
            id: 'fixer-v1',
            role: 'FIXER',
            version: 5,
            isActive: true,
            content: fixerContent
        }
    });


    // --- ARCHITECT PROMPT (New Role) ---
    const architectPrompt = `
You are the **Lead Game Architect**. 
Your goal is to translate a high-level Game Concept into a precise **Technical Implementation Spec** for an Engineer.

Input Context:
1. **Game Concept**: The creative vision (theme, mechanics, goals).
2. **Skeleton**: The structural foundation (genre, boundaries).
3. **The Constitution**: Critical system constraints that MUST be obeyed (e.g., "No external assets", "dt is in seconds").

Your Process:
1. **Analyze**: Check if the Concept violates any Constitutional Rules (e.g., asks for MP3 files when banned). If so, adapt the design to fit the rules (e.g., use procedural sound).
2. **Architect**: Design the core data structures and algorithms appropriately for a single-file implementations.
3. **Specify**: valid HTML5 Canvas API solutions for visuals.

Output Format (Markdown):
# TECHNICAL IMPLEMENTATION SPEC: [Game Title]

## 1. STATE SCHEMA
Define the exact JS objects.
- \`GameState\`: { ... }
- \`Entities\`: [{ ... }]

## 2. CORE LOGIC
Describe *how* to implement complex mechanics. Use **Pseudo-code** or detailed steps.
- **Mechanic A**: Explanation...
- **Mechanic B**: Explanation...

## 3. VISUAL IMPLEMENTATION
how to draw effects using *only* standard Canvas API (\`ctx.lineTo\`, \`ctx.arc\`, etc.).
- **Effect A**: Layers/Composition...
- **Effect B**: Animation math...
`.trim();

    await prisma.systemPrompt.upsert({
        where: { id: 'architect-v1' },
        update: {
            content: architectPrompt,
            version: 1,
            isActive: true, // Activate immediately
        },
        create: {
            id: 'architect-v1',
            role: 'ARCHITECT',
            content: architectPrompt,
            version: 1,
            isActive: true,
        },
    });
    console.log('✅ Architect Prompt (v1) upserted');

    // REMIXER Prompt
    await prisma.systemPrompt.upsert({
        where: { id: 'remixer-v1' },
        update: {},
        create: {
            id: 'remixer-v1',
            role: 'REMIXER',
            version: 1,
            isActive: true,
            content: `You are a Senior Iteration Engineer. Modify code based on instructions while preserving architecture.
            
=== Output Format ===
TITLE: (New title if changed)
DESCRIPTION: (Updated description)
CODE:
\`\`\`javascript
"use strict";
// Modified code...
return { init, update, draw };
\`\`\``
        }
    });

    // Skeletons
    const skeletons = [
        {
            id: 'universal_minimal',
            description: 'Flexible template for any game concept without predefined mechanics.'
        },
        {
            id: 'breakout_paddle',
            description: 'Control a paddle to bounce a ball and break blocks using physics-based collisions.'
        },
        {
            id: 'bullet_hell',
            description: 'Navigate through dense patterns of projectiles with precise movement and small hitboxes.'
        },
        {
            id: 'click_eliminate',
            description: 'Match and eliminate groups of similar items by clicking. Gravity refills gaps from above.'
        },
        {
            id: 'dodge_falling',
            description: 'Move horizontally to avoid falling objects that spawn from the top of the screen.'
        },
        {
            id: 'endless_runner',
            description: 'Auto-scrolling game where player jumps or slides to avoid procedurally generated obstacles.'
        },
        {
            id: 'gravity_platformer',
            description: 'Jump across platforms with realistic gravity and collision detection.'
        },
        {
            id: 'impulse_physics',
            description: 'Physics-based gameplay using forces, impulses, and vector math for realistic movement.'
        },
        {
            id: 'match3',
            description: 'Swap adjacent tiles to create matches of 3+ identical items, triggering cascades.'
        },
        {
            id: 'maze_pathfinding',
            description: 'Navigate through grid-based mazes with pathfinding enemies and line-of-sight mechanics.'
        },
        {
            id: 'scrolling_shooter',
            description: 'Fly through scrolling space while shooting enemies and collecting power-ups.'
        },
        {
            id: 'snake_grid',
            description: 'Grow a snake by eating food while avoiding walls and your own tail in grid-based movement.'
        },
        {
            id: 'survival_shooter',
            description: 'Top-down shooter where player aims at cursor and survives waves of enemies from all directions.'
        },
        {
            id: 'tetris_grid',
            description: 'Rotate and place falling blocks to form complete lines in a 2D grid.'
        },
        {
            id: 'tower_defense',
            description: 'Place defensive towers along a path to stop waves of enemies from reaching your base.'
        },
        {
            id: 'turnbased_grid',
            description: 'Grid-based strategy where player and enemies take turns moving and attacking.'
        },
        {
            id: 'universal_collection',
            description: 'Race against time to collect items scattered across the screen with fast-paced movement.'
        }
    ];

    for (const skeleton of skeletons) {
        const updateData: any = { description: skeleton.description };

        // 特殊处理：为 tower_defense 更新精简指令型 details
        if (skeleton.id === 'tower_defense') {
            updateData.details = `# Game Logic Guidelines
1. Pathing: Move enemies via CONFIG.WAYPOINTS. Reduce state.health at end.
2. Logic: Manage towers, enemies, projectiles as arrays in state.
3. Building: floor(mouseX/GRID) + gold check. Draw placement ghost.
4. Combat: 1-to-1 targeting within range + cooldowns (use dt in seconds).
5. Variety: Implement distinct unit behaviors/types per the DESIGN CONCEPT.`;
        }

        await prisma.skeleton.upsert({
            where: { id: skeleton.id },
            update: updateData,
            create: {
                id: skeleton.id,
                description: skeleton.description,
                details: updateData.details || '# Game Logic Guidelines\nPending implementation...',
                version: 1
            }
        });
    }

    console.log('Seeding complete.');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
