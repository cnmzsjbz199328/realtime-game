import { IEngineer, GameDefinition, SkeletonContext } from '../../../core/domain/types.js';
import { callAI } from './ai-client.js';

export class EngineerService implements IEngineer {
    async generate(
        skeletonContext: SkeletonContext,
        expandedDesign: string
    ): Promise<GameDefinition> {
        console.log('[ENGINEER] ========== Code Generation Started ==========');
        console.log('[ENGINEER] Skeleton:', skeletonContext.name, `(${skeletonContext.id})`);
        console.log('[ENGINEER] Design length:', expandedDesign.length, 'chars');

        const gameDesignContext = `
Game Type: ${skeletonContext.name}
${skeletonContext.systemPromptAddon ? `\n=== specific Skeleton Guidelines ===\n${skeletonContext.systemPromptAddon}\n` : ''}

=== Detailed Design ===
${expandedDesign}
`;

        const prompt = `
You are a professional game engineer. Based on the following game design, generate complete, playable, bug-free HTML5 Canvas game code.

=== Game Design ===
${gameDesignContext}

=== ALGORITHM QUALITY STANDARDS ===
You are a Senior Game Engineer.
1. **NO Lazy Implementations**: Do NOT use naive or random implementations for complex logic (e.g., random noise for level generation). YOU MUST implement standard, robust algorithms appropriate for the specific skeleton definition.
2. **Production Ready**: Your code must be robust, handle edge cases, and provide a polished experience.
3. **Logic Integrity**: Ensure the game logic actually works (e.g., proper collision detection, valid scoring, win/loss conditions).

=== Code Structure Guidelines ===

⚠️ CRITICAL RULE: Scope of width and height parameters
- init(state, width, height)  ✅ Available width/height
- update(state, input, deltaTime)  ❌ NO width/height in context, MUST use state.width/state.height
- draw(state, ctx, width, height)  ✅ Available width/height

=== Mandatory Code Structure ===
1. **init(state, width, height)**:
   - Must save width and height to state (state.width = width) for use in update.
   - Initialize scenes (MENU), score, game objects, etc.
2. **update(state, input, deltaTime)**:
   - **Input Handling**: The \`input\` argument is a **pure data object**, NOT a class.
     - Check keys: \`input.keys['KeyW']\` or \`input.keys['ArrowUp']\`. Use standard KeyboardEvent.code values (NOT 'w').
     - Check mouse: \`input.isDown\` (boolean), \`input.x\`, \`input.y\`.
     - ❌ ERROR: Do NOT access \`input\` as a function (e.g. \`input.isDown()\`).
   - Handle game logic and state transitions.
   - Strictly forbidden to use global width/height, must use state.width.
3. **draw(state, ctx, width, height)**:
   - Use ctx to draw each frame.
   - Must handle rendering for MENU, PLAYING, GAMEOVER states.

=== Core State Management (State) ===
state object recommended to include:
- width, height: Canvas dimensions (Mandatory)
- scene: Current scene ('MENU', 'PLAYING', 'GAMEOVER')
- game: Main game logic instance (Recommend using class Game encapsulation)
- score: Score
- wasDown: For tracking click events

=== Code Quality Requirements ===

✅ Must Implement:
1. Three game scenes: Start Menu (MENU), Gameplay (PLAYING), Game Over (GAMEOVER)
2. Clear operation instructions (Must be displayed on screen, e.g., "Press WASD to move")
3. Click event detection (By monitoring isDown state changes: \`pressed = input.isDown && !state.wasDown\`)
4. Save Canvas dimensions to state (For use in update)

❌ Errors to Avoid:
1. **Scope Error**: Directly using width/height in update method (Must use state.width/state.height)
2. **Array Out of Bounds**: Check y < array.length && x < array[y].length before accessing array[y][x]
3. **Division by Zero**: Check length > 0 or length !== 0 before calculating v/length
4. **Infinite Loop**: while/for loops must have clear exit conditions or counter limits
5. **Uninitialized Variables**: All state properties must be initialized in init
6. **Input Handling Error**: \`input\` has NO methods. Do not use \`input.isDown()\`. Use \`input.isDown\` property.
7. **DOM Access**: Strictly forbidden to use document, window, canvas, context global objects. Drawing must use the ctx parameter in draw method.
8. **External Resources**: Strictly forbidden to load local or network images/audio (e.g., new Image, new Audio). All visual effects must be drawn using Context2D API (rect, arc, lineTo).
9. **Private Loop**: Strictly forbidden to use requestAnimationFrame, setInterval, setTimeout to drive game loop. Must rely on the passed update method.

=== Visual Guidelines ===

Mandatory Color Scheme (Neon Cyberpunk Style):
- Walls/Obstacles: Cyan #00ffff
- Danger/Traps/Enemies: Yellow #ffff00 or Magenta #ff00ff
- Goals/Rewards/Exits: Magenta #ff00ff or Cyan #00ffff
- Player: White #ffffff
- Background: Dark #0a0a0a or #000033

Drawing Techniques:
- Use ctx.shadowBlur and ctx.shadowColor for glowing effects
- Use gradients createLinearGradient/createRadialGradient for enhanced visuals
- Use transparency rgba() for depth

=== Boundary Check Standards ===
- **Array Access**: Before accessing array[y][x], must check if y and x are within valid range.
- **Math Calculations**: Check divisor is not 0 before division. Handle zero vector case when normalizing vector length.
- **Coordinate Limiting**: Ensure entity coordinates are clamped within Canvas bounds (clamp).

=== Output Format ===

Please strictly output in the following format (Do not wrap the entire response in Markdown code blocks):

TITLE: Game Title (5-12 words)
DESCRIPTION: Short description of game play and controls (1 sentence, within 30 words)
CODE:
\`\`\`javascript
"use strict";

// 1. Define Game Constants (Colors, Speed, Configuration, etc.)
// Recommend using const CONSTANTS = { ... }

// 2. Define Game Logic Classes (Game, Player, Enemy, etc.)
// Recommend using class structure

// 3. Return Core Interface Object
return {
  init: (state, width, height) => {
    // Save dimensions: state.width = width;
    // Initialize state: state.scene, state.score, state.game
  },
  
  update: (state, input, deltaTime) => {
    // Scene switching logic (MENU -> PLAYING -> GAMEOVER)
    // Game loop update
  },
  
  draw: (state, ctx, width, height) => {
    // Draw background
    // Draw content based on scene
  }
};
\`\`\`

=== Self-Check List (Pre-generation Check) ===

Before outputting code, please confirm:
- [ ] Saved state.width and state.height in init method
- [ ] Used state.width instead of direct width in update method
- [ ] Implemented MENU, PLAYING, GAMEOVER three scenes
- [ ] Displayed operation instructions text on screen
- [ ] Checked boundaries for all array accesses
- [ ] Checked divisor is not zero for all divisions
- [ ] Did not use eval, document, window, Image, Audio
- [ ] Did not use setTimeout, setInterval, requestAnimationFrame
- [ ] Used Neon color scheme (Cyan/Magenta/Yellow)
- [ ] Code uses "use strict" mode`;

        console.log('[ENGINEER] Calling AI for code generation...');
        const startTime = Date.now();

        try {
            const contentRaw = await callAI([
                {
                    role: 'system',
                    content: 'You are an expert game engineer. You create complete, playable HTML5 Canvas games. return a single code block.'
                },
                { role: 'user', content: prompt }
            ]);

            const elapsed = Date.now() - startTime;
            console.log('[ENGINEER] AI response received in', elapsed, 'ms');

            // Clean content
            let content = contentRaw.trim();
            // Remove wrapping markdown if present (whole block)
            if (content.startsWith('```')) {
                content = content.replace(/^```[a-z]*\n/, '').replace(/```$/, '');
            }

            console.log('[ENGINEER] Parsing game definition (Text Format)...');

            // Parse using Regex
            const titleMatch = content.match(/TITLE:\s*(.+)/);
            const descMatch = content.match(/DESCRIPTION:\s*(.+)/);
            // Match code block: Look for CODE: followed by optional whitespace and markdown code block
            const codeMatch = content.match(/CODE:[\s\S]*?```(?:javascript|js)?\s*([\s\S]*?)```/);

            if (!titleMatch || !descMatch || !codeMatch) {
                console.error('[ENGINEER] Parse Failed. Content:', content.substring(0, 200) + '...');
                throw new Error('Failed to parse AI response. Expected format: TITLE, DESCRIPTION, CODE block.');
            }

            const gameDef: GameDefinition = {
                title: titleMatch[1].trim(),
                description: descMatch[1].trim(),
                code: codeMatch[1].trim()
            };

            // Validate result
            if (!gameDef.title || !gameDef.description || !gameDef.code) {
                throw new Error('Invalid game definition: missing required fields');
            }

            console.log('[ENGINEER] Game title:', gameDef.title);
            console.log('[ENGINEER] code length:', gameDef.code.length, 'chars');

            // Basic validation
            if (gameDef.code.length < 100) {
                console.warn('[ENGINEER] Warning: code is very short');
            }
            if (!gameDef.code.includes('return {')) {
                console.warn('[ENGINEER] Warning: code might be missing return statement');
            }

            console.log('[ENGINEER] ========== Code Generation Complete ==========');

            return gameDef;

        } catch (error: any) {
            console.error('[ENGINEER] ========== Code Generation Failed ==========');
            console.error('[ENGINEER] Error:', error.message);
            throw error;
        }
    }
}
