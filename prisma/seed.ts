import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('Seeding database...');

    const skeletons = [
        // --- ORIGINAL SET ---
        { id: 'universal_minimal', description: 'Flexible template for any game concept without predefined mechanics.' },
        { id: 'breakout_paddle', description: 'Control a paddle to bounce a ball and break blocks using physics-based collisions.' },
        { id: 'bullet_hell', description: 'Navigate through dense patterns of projectiles with precise movement and small hitboxes.' },
        { id: 'click_eliminate', description: 'Match and eliminate groups of similar items by clicking. Gravity refills gaps from above.' },
        { id: 'dodge_falling', description: 'Move horizontally to avoid falling objects that spawn from the top of the screen.' },
        { id: 'endless_runner', description: 'Auto-scrolling game where player jumps or slides to avoid procedurally generated obstacles.' },
        { id: 'gravity_platformer', description: 'Jump across platforms with realistic gravity and collision detection.' },
        { id: 'impulse_physics', description: 'Physics-based gameplay using forces, impulses, and vector math for realistic movement.' },
        { id: 'match3', description: 'Swap adjacent tiles to create matches of 3+ identical items, triggering cascades.' },
        { id: 'maze_pathfinding', description: 'Navigate through grid-based mazes with pathfinding enemies and line-of-sight mechanics.' },
        { id: 'scrolling_shooter', description: 'Fly through scrolling space while shooting enemies and collecting power-ups.' },
        { id: 'snake_grid', description: 'Grow a snake by eating food while avoiding walls and your own tail in grid-based movement.' },
        { id: 'survival_shooter', description: 'Top-down shooter where player aims at cursor and survives waves of enemies from all directions.' },
        { id: 'tetris_grid', description: 'Rotate and place falling blocks to form complete lines in a 2D grid.' },
        { id: 'tower_defense', description: 'Place defensive towers along a path to stop waves of enemies from reaching your base.' },
        { id: 'turnbased_grid', description: 'Grid-based strategy where player and enemies take turns moving and attacking.' },
        { id: 'universal_collection', description: 'Race against time to collect items scattered across the screen with fast-paced movement.' },

        // --- NEW EXPANSION SET ---
        { id: 'flappy_hop', description: 'One-tap mechanic to keep an object airborne while navigating through gaps in obstacles.' },
        { id: 'charging_launch', description: 'Drag and release mechanic to launch objects (slingshot style) with power and angle control.' },
        { id: 'topdown_racer', description: 'Drive a vehicle with steering, acceleration, and drift mechanics on a defined track.' },
        { id: 'clicker_tycoon', description: 'Incremental game focused on resource generation, upgrades, and automated income.' },
        { id: 'slice_action', description: 'Swipe to cut objects on screen. Requires tracking pointer trails and line-intersection logic.' },
        { id: 'learning_cards', description: 'Educational logic involving flipping cards, matching pairs, or answering flashcard questions.' },
        { id: 'word_puzzle', description: 'Grid or list interaction to find, form, or unscramble words.' },
        { id: 'music_composer', description: 'Procedural music generation or rhythm game using the advanced Audio Engine.' }
    ];

    // Helper to generate detailed instructions based on ID
    const getDetails = (id: string, description: string) => {
        const commonHeader = `# Game Logic Guidelines\n`;
        const stateTip = `1. State: Initialize essential properties (score, gameState, timer) in init().\n`;

        let specific = "";

        switch (id) {
            case 'universal_minimal':
                specific = `2. Creativity: This is a blank canvas. Implement any mechanism that fits the prompt.\n3. Input: Use input.keys for discrete actions or input.x/y for mouse interactions.`;
                break;
            case 'breakout_paddle':
                specific = `2. Paddle: Bind x-position to mouse or keys. Keep within screen bounds.\n3. Ball: Reflect velocity.y on paddle/top-wall hits. Check brick collision (AABB).\n4. Bricks: Store as array of objects {x,y,w,h,active}. Remove on hit.`;
                break;
            case 'bullet_hell':
                specific = `2. Player: Small hitbox for precise dodging. Smooth movement.\n3. Spawners: Use timer patterns (e.g., spiral, bloom) to create beautiful projectile waves.\n4. Bullets: Simple vector velocity updates. Remove when off-screen.`;
                break;
            case 'click_eliminate':
                specific = `2. Grid: 2D array representation. Click -> Flood fill algorithm to find connected block.\n3. Gravity: Iterate columns bottom-up to drop blocks into empty spaces.\n4. Interaction: Only allow clicking active blocks.`;
                break;
            case 'dodge_falling':
                specific = `2. Player: Horizontal only movement.\n3. Spawning: Random X at y=-50. Varied speeds/sizes.\n4. Collision: Simple distance or AABB check. GameOver on contact.`;
                break;
            case 'endless_runner':
                specific = `2. World: Player x is fixed. Objects move left (vel.x = -speed).\n3. Jump: Impulse on Space/Click. Apply gravity every frame.\n4. Ground: Check y >= groundY to reset jump ability.`;
                break;
            case 'gravity_platformer':
                specific = `2. Physics: Apply gravity (vel.y += g). Friction on ground.\n3. Collision: Resolve AABB overlaps. Push player out of blocks.\n4. Jump: Only if onGround. Support variable jump height?`;
                break;
            case 'impulse_physics':
                specific = `2. Motion: Use velocity and acceleration vectors. Damping (friction) 0.98.\n3. Bounce: On wall hit, invert velocity component and multiply by restitution (0.8).\n4. Interaction: Click to apply impulse force to nearest object.`;
                break;
            case 'match3':
                specific = `2. Input: Click-drag or dual-click to swap neighbors.\n3. Matching: Check horizontal/vertical runs >= 3. Mark for removal.\n4. Flow: Swap -> Anim -> Match Check -> Remove -> Drop -> Repeat.`;
                break;
            case 'maze_pathfinding':
                specific = `2. Grid: 0=Walkable, 1=Wall. Player moves tile-by-tile or smooth.\n3. AI: Enemies move toward player directly or simply random-turn on wall hit.\n4. Vision: Optional raycasting or fog-of-war.`;
                break;
            case 'scrolling_shooter':
                specific = `2. Scroll: Background layers move at different speeds (parallax).\n3. Shooting: Cooldown timer. Spawn projectiles at player tip.\n4. Enemies: Spawn right, move left/sin-wave. Flash on hit.`;
                break;
            case 'snake_grid':
                specific = `2. Movement: Update head position every N ms (interval). NOT every frame.\n3. Body: Array of positions. Unshift new head, pop tail (unless ate food).\n4. Death: Head collides with Body or Wall.`;
                break;
            case 'survival_shooter':
                specific = `2. Aiming: Player rotates towards mouse (Math.atan2).\n3. Enemies: Spawn outside view, move towards player. Simple flocking separation?\n4. Juice: Screen shake on shoot, particles on kill.`;
                break;
            case 'tetris_grid':
                specific = `2. Piece: Current shape (array of vectors). Position (grid coord).\n3. Rotation: Matrix rotation or hardcoded wall-kick offsets.\n4. Lock: On collision down, merge piece into static grid. Clear full rows.`;
                break;
            case 'tower_defense':
                specific = `2. Pathing: Move enemies via CONFIG.WAYPOINTS. Reduce state.health at end.\n3. Logic: Manage towers, enemies, projectiles as arrays.\n4. Building: floor(mouseX/GRID) + gold check. Draw placement ghost.\n5. Combat: 1-to-1 targeting within range + cooldowns.`;
                break;
            case 'turnbased_grid':
                specific = `2. TurnState: PLAYER_TURN -> ENEMY_TURN -> RESOLVE.\n3. Grid: Highlight valid move/attack tiles. Mouse interaction.\n4. Stats: AP (Action Points) per turn. Health, Damage.`;
                break;
            case 'universal_collection':
                specific = `2. Spawning: Scatter static items randomly. Ensure accessible.\n3. Player: High speed, instant turning (arcade feel).\n4. Goal: Collect all or highest score in time limit.`;
                break;
            // --- NEW ---
            case 'flappy_hop':
                specific = `2. Physics: Constant gravity. Space/Click sets vel.y to upward impulse.\n3. World: Move pipes left. Gap creation logic.\n4. Collision: Player circle vs Pipe AABBs. Precise hitboxes.`;
                break;
            case 'charging_launch':
                specific = `2. Input: MouseDown (start) -> Drag (aim) -> MouseUp (launch).\n3. Visuals: Draw trajectory line or arrow when dragging.\n4. Physics: Projectile motion with gravity/bouncing. Stop when low velocity.`;
                break;
            case 'topdown_racer':
                specific = `2. Car Physics: Velocity + Forward Vector. Acceleration adds to velocity. Friction slows velocity.\n3. Steering: Rotate Forward Vector. Drifting: Velocity doesn't perfectly match Forward.\n4. Track: Check car position against track mask/boundaries.`;
                break;
            case 'clicker_tycoon':
                specific = `2. Math: Use exponential costs for upgrades (base * 1.15^count).\n3. Loop: Update resources based on rate * dt. Handle large numbers gracefully.\n4. UI: Clear buttons for "Buy" with cost comparisons. Progress bars.`;
                break;
            case 'slice_action':
                specific = `2. Input: Track mouse points in a trail array (last 10 frames).\n3. Detection: Check line intersection between trail segments and flying object hitboxes.\n4. Feedback: Split objects, spawn particles along cut vector.`;
                break;
            case 'learning_cards':
                specific = `2. Data: Array of {id, content, isFlipped, isMatched}.\n3. Logic: Flip 1 -> Flip 2 -> Check Match. If Match, keep face up. If fail, unflip after delay.\n4. Layout: Grid calculation based on screen size/count.`;
                break;
            case 'word_puzzle':
                specific = `2. Data: Grid of letters. Dictionary for validation.\n3. Input: Drag across letters to form string. Check validity on release.\n4. Scoring: Longer words = exponential score. Visual connector lines.`;
                break;
            case 'music_composer':
                specific = `2. Audio API: Use sfx.note(freq, duration, type).
                - Frequency: Use 'C4', 'A#3' etc (Octaves 3-5 supported) OR raw Hz.
                - Duration: Seconds (e.g. 0.25).
                - Type: 'sine', 'square', 'sawtooth', 'triangle'.
                - Example: sfx.note('C4', 0.5, 'piano') triggers a synthesized tone.
                3. Timing: Use state.timer to schedule notes. Store song data in state and iterate index.
                4. Visuals: Sync visual indicators (bars/circles) with note triggers.`;
                break;
            default:
                specific = `2. Mechanics: Implement core loop clearly.\n3. Polish: Add simple particles or color shifts for feedback.`;
        }

        return commonHeader + stateTip + specific;
    };


    for (const skeleton of skeletons) {
        const details = getDetails(skeleton.id, skeleton.description);

        await prisma.skeleton.upsert({
            where: { id: skeleton.id },
            update: {
                description: skeleton.description,
                details: details
            },
            create: {
                id: skeleton.id,
                description: skeleton.description,
                details: details,
                version: 1
            }
        });
    }



    // --- SYSTEM PROMPTS ---
    console.log('Seeding System Prompts...');

    // 1. ARCHITECT PROMPT
    const architectPromptContent = `You are the **Lead Game Architect**. 
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

## 4. DESIGN CONSTRAINTS (CRITICAL)

### Vector API - CLOSED LIST (Whitelist Only)

**🚨 CRITICAL RULE**: The system provides a global \`Vector\` class with EXACTLY the static methods listed below and ABSOLUTELY NO OTHERS.

**How to use this API**:
1. Check if the method you need is in the complete list below
2. If YES → Use it directly in your pseudocode
3. If NO → Specify manual implementation in your pseudocode

**Complete Static Method List** (CLOSED - Nothing else exists):
- **Basic Operations**: \`Vector.add(v1, v2)\`, \`Vector.sub(v1, v2)\`, \`Vector.mult(v, scalar)\`, \`Vector.div(v, scalar)\`
- **Distance**: \`Vector.distance(v1, v2)\` (alias: \`Vector.dist(v1, v2)\`)
- **Magnitude**: \`Vector.mag(v)\`, \`Vector.magSq(v)\`, \`Vector.normalize(v)\`, \`Vector.setMag(v, length)\`, \`Vector.limit(v, max)\`
- **Angles**: \`Vector.heading(v)\`, \`Vector.rotate(v, angle)\`, \`Vector.angleBetween(v1, v2)\`
- **Interpolation**: \`Vector.lerp(v1, v2, amount)\`
- **Products**: \`Vector.dot(v1, v2)\`, \`Vector.cross(v1, v2)\`
- **Creation**: \`Vector.random2D()\`, \`Vector.fromAngle(angle, length=1)\`

**⚠️ IMPORTANT**: This is NOT p5.Vector or THREE.Vector3. Do not assume methods from those libraries exist here. If a method is NOT in the above list, it does NOT exist.

**Decision Examples**:
\`\`\`
Need: Clone a vector
Check: Is "Vector.clone" in the list? → NO
Action: Use manual implementation → new Vector(v.x, v.y)

Need: Add two vectors
Check: Is "Vector.add" in the list? → YES
Action: Use it → Vector.add(v1, v2)

Need: Scale a vector
Check: Is "Vector.scale" in the list? → NO
Check: Is "Vector.mult" in the list? → YES
Action: Use Vector.mult(v, scalar)
\`\`\`

**Manual Implementation Patterns** (for your pseudocode):
\`\`\`
// Clone/Copy a vector
newVec = new Vector(oldVec.x, oldVec.y)

// Negate a vector
negated = Vector.mult(vec, -1)

// Set vector components directly
vec.x = newX
vec.y = newY
\`\`\`

**Pseudocode Style** (for your tech spec):
\`\`\`
// ✅ CORRECT - Use only methods from the closed list
dir = Vector.sub(target.pos, entity.pos)
normalized = Vector.normalize(dir)
velocity = Vector.mult(normalized, speed)

// ✅ CORRECT - Use setMag for convenience
velocity = Vector.setMag(dir, speed)

// ✅ CORRECT - Lerp between velocities
entity.vel = Vector.lerp(entity.vel, targetVel, 0.1)

// ✅ CORRECT - Manual implementation when method not in list
bulletPos = new Vector(enemy.pos.x, enemy.pos.y)

// ❌ WRONG - Assuming methods not in the list exist
bulletPos = Vector.clone(enemy.pos)  // NOT in list!
velocity = Vector.scale(dir, speed)  // NOT in list!

// ❌ WRONG - Chainable instance methods
velocity = Vector.sub(target, pos).normalize().mult(speed)
\`\`\`

- **State**: Pure data only. No methods on state objects. Use static Vector methods: \`pos = Vector.add(pos, vel)\`

## 5. AUDIO & SFX MAPPING
Define strictly when to play sounds using the available 'sfx' library.
Available SFX: 'shoot', 'explode', 'jump', 'collect', 'hit'.
- Event: [e.g. Player Fires] -> sfx.play('shoot')
- Event: [e.g. Enemy Dies] -> sfx.play('explode')
`;

    // 2. ENGINEER PROMPT
    const engineerPromptContent = `Output format:
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
2. **No External Scope**: Helper functions cannot access 'w' or 'h' unless passed arguments.
3. **No Globals**: All state must hang off \`state\`.
4. **Return**: Must end with \`return {init, update, draw};\`.
5. **ENVIRONMENT GUARANTEE (CRITICAL)**:
   - **Vector** and **COLORS** are **ALREADY INJECTED** globally.
   - **DO NOT** declare them (e.g. \`const Vector = ...\` or \`class Vector\`). This will crash the sandbox.
   - **Just use them directly**: \`Vector.add(v1, v2)\`.
   
   **Vector API - CLOSED LIST (Whitelist Only)**:
   
   **🚨 CRITICAL**: You can ONLY use the static methods listed below. If a method is NOT in this list, it does NOT exist.
   
   **Complete Static Method List** (CLOSED - Nothing else exists):
   - **Basic**: \`Vector.add(v1, v2)\`, \`Vector.sub(v1, v2)\`, \`Vector.mult(v, scalar)\`, \`Vector.div(v, scalar)\`
   - **Distance**: \`Vector.distance(v1, v2)\`, \`Vector.dist(v1, v2)\`
   - **Magnitude**: \`Vector.mag(v)\`, \`Vector.magSq(v)\`, \`Vector.normalize(v)\`, \`Vector.setMag(v, length)\`, \`Vector.limit(v, max)\`
   - **Angles**: \`Vector.heading(v)\`, \`Vector.rotate(v, angle)\`, \`Vector.angleBetween(v1, v2)\`
   - **Interpolation**: \`Vector.lerp(v1, v2, amount)\`
   - **Products**: \`Vector.dot(v1, v2)\`, \`Vector.cross(v1, v2)\`
   - **Creation**: \`Vector.random2D()\`, \`Vector.fromAngle(angle, length=1)\`
   
   **⚠️ IMPORTANT**: This is NOT p5.Vector or THREE.Vector3. If a method is NOT in the above list, implement it manually.
   
   **Decision Rule**:
   - Method in list? → Use it
   - Method NOT in list? → Implement manually
   
   **Manual Implementation Examples**:
   \`\`\`javascript
   // Clone a vector (Vector.clone does NOT exist)
   const newPos = new Vector(oldPos.x, oldPos.y);
   
   // All methods are pure functions (do NOT modify inputs)
   state.pos = Vector.add(state.pos, vel);  // Creates new Vector
   
   // Common patterns
   const dir = Vector.sub(target, pos);
   const vel = Vector.setMag(dir, speed);
   state.vel = Vector.lerp(state.vel, targetVel, 0.1);
   
   // ❌ FORBIDDEN - Instance methods (mutate state)
   state.pos.add(vel);  // Will crash or cause bugs!
   
   // ❌ FORBIDDEN - Non-existent methods
   const newPos = Vector.clone(oldPos);  // NOT in list!
   const scaled = Vector.scale(vec, 2);  // NOT in list!
   \`\`\`
   
   **🚨 If ARCHITECT suggests methods not in the list**:
   If the ARCHITECT specification uses methods like \`Vector.clone\`, \`Vector.copy\`, or \`Vector.scale\`:
   1. **DO NOT use them** - They will crash at runtime
   2. **Replace with manual implementation**:
      - \`Vector.clone(v)\` → \`new Vector(v.x, v.y)\`
      - \`Vector.copy(v)\` → \`new Vector(v.x, v.y)\`
      - \`Vector.scale(v, n)\` → \`Vector.mult(v, n)\`
   
   - **NO GameObject**: You MUST define your own Entity class if needed.
   - **COLORS**: \`{BG: '#0a0a0a', PLAYER: '#00ffff', ENEMY: '#ff0066', ACCENT: '#ffff00', TEXT: '#ffffff'}\`

Input Handling:
- simple click: \`if (input.isDown && !state.lastDown) ...\`
- keyboard: \`if (input.keys.ArrowLeft || input.left) ...\` (Standardized aliases available)

Visuals:
- Use standard Canvas API (beginPath, arc, fill, stroke).
- Use HSL/RGBa for effects.
- Avoid random noise (e.g. flickering stars). Use pre-generated state for static elements.
`;

    // 3. FIXER PROMPT
    const fixerPromptContent = `You are an Expert Game Debugger. You must fix the code to run strictly within our custom Sandbox Environment.

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
   - **ENVIRONMENT GUARANTEE**: \`Vector\` and \`COLORS\` are provided globally. **DO NOT** declare them.
   - **Vector API**: All static methods are pure functions. Use \`state.pos = Vector.add(state.pos, vel)\` pattern, NOT \`state.pos.add(vel)\`. See ENGINEER prompt for common methods.
   - **NO GameObject**: You MUST define your own Entity class if needed.

=== AUDIO SYSTEM (IMPORTANT) ===
A global object 'sfx' is provided by the environment.
- It is VALID to call sfx.play('shoot'), sfx.play('explode'), etc.
- **ERROR: "sfx is not defined"**: This is often a false positive in static analysis or a race condition. 
- **FIX STRATEGY**: DO NOT remove sfx calls. instead, ensure sfx is treated as a global. You may wrap calls in \`if (typeof sfx !== 'undefined') sfx.play(...)\` if necessary, but PREFER keeping them logic-driven.

=== RECOVERY STRATEGY ===
- Error "GameObject is not defined": Define a class GameObject { ... } at the top of the file.
- Error "ctx.save is not a function": Likely 'ctx' argument position is wrong. CHECK: draw(state, ctx, w, h).
- Error "Cannot read property 'w' of undefined": You are likely using ctx.w or ctx.h. Use the arguments w and h.
- Error "state is not defined": **CRITICAL**. 'state' is NOT global. Pass it as an argument to helper classes or functions.

=== OUTPUT FORMAT ===
TITLE: [KEEP ORIGINAL]
DESCRIPTION: [KEEP ORIGINAL]
CODE:
\`\`\`javascript
// Fixed code...
return { init, update, draw };
\`\`\`
`;

    // 4. REMIXER PROMPT
    const remixerPromptContent = `You are a Senior Iteration Engineer. Modify code based on instructions while preserving architecture.

=== SANDBOX PROTOCOL (v6 STRICT) ===
1. **Signatures**: MUST match EXACTLY:
   - init(state, w, h)
   - update(state, input, dt, w, h)
   - draw(state, ctx, w, h)
2. **Context Attributes**: 'ctx' has NO 'w' or 'h' attributes. Use the 'w' and 'h' arguments passed to the functions.
3. **NO "export" keywords**: The environment uses 'new Function()'. 'export' will cause a crash.
4. **Mandatory Return**: The code MUST end with: return { init, update, draw };
5. **Core Classes**:
   - Environment provides: \`Vector\`, \`COLORS\`.
   - **Vector API**: Maintain pure functional style. Use \`state.pos = Vector.add(state.pos, vel)\` pattern, NOT \`state.pos.add(vel)\`. See ENGINEER prompt for details.
   - **NOT Provided**: \`GameObject\`.
   - **CRITICAL**: Check if the existing code defines a \`GameObject\` or \`Entity\` class. If it does, USE IT. If it relies on a global \`GameObject\` that is NOT defined, you MUST define it.
6. **Time Unit**: 'dt' is in SECONDS. Ensure cooldowns match (e.g., 1.0 for 1s).

=== Output Format ===
TITLE: (New title if changed)
DESCRIPTION: (Updated description)
CODE:
\`\`\`javascript
// Modified code...
return { init, update, draw };
\`\`\`
`;

    // Helper to seed prompts safely (Force Update Active)
    // @ts-ignore - Dynamic role assignment
    const seedPrompt = async (role: any, content: string) => {
        // Find ANY active prompt for this role
        const existing = await prisma.systemPrompt.findFirst({
            where: { role: role, isActive: true },
            orderBy: { version: 'desc' }
        });

        if (existing) {
            console.log(`[Validation] Found active \${role} prompt (v\${existing.version}). Updating content in-place...`);
            await prisma.systemPrompt.update({
                where: { id: existing.id },
                data: { content: content }
            });
        } else {
            console.log(`[Validation] No active \${role} prompt found. Creating new (v1)...`);
            await prisma.systemPrompt.create({
                data: {
                    role: role,
                    content: content,
                    isActive: true, // Ensure it's active
                    version: 1,
                    // Try to generate a descriptive ID if possible, else UUID
                    id: `${role.toLowerCase()}-v1-${Date.now()}`
                }
            });
        }
    };


    await seedPrompt('ARCHITECT', architectPromptContent);
    await seedPrompt('ENGINEER', engineerPromptContent);
    await seedPrompt('FIXER', fixerPromptContent);
    await seedPrompt('REMIXER', remixerPromptContent);


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
