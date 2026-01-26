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
        { id: 'word_puzzle', description: 'Grid or list interaction to find, form, or unscramble words.' }
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
