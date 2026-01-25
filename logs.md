[API/CREATE] Topic: 坦克大战
[API/CREATE] Phase 1: Director Classification
[DIRECTOR] ========== Classification Started ==========
[DIRECTOR] Topic: 坦克大战
[DIRECTOR] Built dynamic directory with 17 skeletons
[DIRECTOR] Loaded skeleton directory with 17 types
[DIRECTOR] Using dynamic system prompt (v2)
[DIRECTOR] Calling AI for classification...
[AI-CLIENT] Calling Main AI...
[AI-CLIENT] >>> REQUEST MESSAGES >>>
[
  {
    "role": "system",
    "content": "You are a Game Design Director. You MUST return ONLY a JSON object with \"skeletonId\" and \"expandedDesign\" keys. The \"skeletonId\" MUST be the exact string identifier provided in the list (e.g. \"tower_defense\"), NOT a number. NO other text."
  },
  {
    "role": "user",
    "content": "You are a Game Design Director. Select the best skeleton and provide a CONCISE design concept.\n\n=== CRITICAL: Output Limits ===\n- expandedDesign: MAX 150 words\n- Focus on: core mechanic, visual style, win condition\n- NO backstory, NO philosophy, NO detailed lore\n\n=== Output Format ===\nReturn JSON only:\n{\n  \"skeletonId\": \"ID\",\n  \"expandedDesign\": \"Concise gameplay description (< 150 words)\"\n}\n\nAvailable Skeletons:\n- breakout_paddle: Control a paddle to bounce a ball and break blocks using physics-based collisions.\n- bullet_hell: Navigate through dense patterns of projectiles with precise movement and small hitboxes.\n- click_eliminate: Match and eliminate groups of similar items by clicking. Gravity refills gaps from above.\n- dodge_falling: Move horizontally to avoid falling objects that spawn from the top of the screen.\n- endless_runner: Auto-scrolling game where player jumps or slides to avoid procedurally generated obstacles.\n- gravity_platformer: Jump across platforms with realistic gravity and collision detection.\n- impulse_physics: Physics-based gameplay using forces, impulses, and vector math for realistic movement.\n- match3: Swap adjacent tiles to create matches of 3+ identical items, triggering cascades.\n- maze_pathfinding: Navigate through grid-based mazes with pathfinding enemies and line-of-sight mechanics.\n- scrolling_shooter: Fly through scrolling space while shooting enemies and collecting power-ups.\n- snake_grid: Grow a snake by eating food while avoiding walls and your own tail in grid-based movement.\n- survival_shooter: Top-down shooter where player aims at cursor and survives waves of enemies from all directions.\n- tetris_grid: Rotate and place falling blocks to form complete lines in a 2D grid.\n- tower_defense: Place defensive towers along a path to stop waves of enemies from reaching your base.\n- turnbased_grid: Grid-based strategy where player and enemies take turns moving and attacking.\n- universal_collection: Race against time to collect items scattered across the screen with fast-paced movement.\n- universal_minimal: Flexible template for any game concept without predefined mechanics.\n\nUser Input: \"坦克大战\""
  }
]
[AI-CLIENT] <<< END REQUEST MESSAGES <<<
[AI-CLIENT] >>> RAW RESPONSE >>>
{
  "skeletonId": "survival_shooter",
  "expandedDesign": "A top-down tactical shooter where players control a tank to defend a central base from waves of armored invaders. Core mechanics involve 2D movement, projectile physics, and using destructible terrain for strategic cover. Players must eliminate varied enemy tank types that spawn from multiple directions while collecting power-ups to upgrade firepower and armor. The visual style features a vibrant, high-contrast retro pixel-art aesthetic with a fixed-camera perspective. The win condition is successfully destroying all enemy waves in a level while ensuring both the player’s tank and the central base remain intact."
}
[AI-CLIENT] <<< END RAW RESPONSE <<<
[DIRECTOR] AI response received in 20213 ms
[DIRECTOR] Parsing classification result...
[DIRECTOR] Selected skeleton: survival_shooter
[DIRECTOR] Expanded design length: 619 chars
[DIRECTOR] ========== Classification Complete ==========
[API/CREATE] Selected skeleton: survival_shooter
[API/CREATE] Design length: 619
[API/CREATE] Phase 2: Loading Skeleton Context
[REGISTRY] Loading dynamic skeleton from DB: survival_shooter
[API/CREATE] Skeleton loaded: Top-down shooter where player aims at cursor and survives waves of enemies from all directions.
[API/CREATE] Phase 2.5: Architect Spec Generation
[ArchitectService] Generating Spec...
[AI-CLIENT] Calling Small AI (Gemini)...
[AI-CLIENT] >>> REQUEST MESSAGES >>>
[
  {
    "role": "system",
    "content": "You are the **Lead Game Architect**. \nYour goal is to translate a high-level Game Concept into a precise **Technical Implementation Spec** for an Engineer.\n\nInput Context:\n1. **Game Concept**: The creative vision (theme, mechanics, goals).\n2. **Skeleton**: The structural foundation (genre, boundaries).\n3. **The Constitution**: Critical system constraints that MUST be obeyed (e.g., \"No external assets\", \"dt is in seconds\").\n\nYour Process:\n1. **Analyze**: Check if the Concept violates any Constitutional Rules (e.g., asks for MP3 files when banned). If so, adapt the design to fit the rules (e.g., use procedural sound).\n2. **Architect**: Design the core data structures and algorithms appropriately for a single-file implementations.\n3. **Specify**: valid HTML5 Canvas API solutions for visuals.\n\nOutput Format (Markdown):\n# TECHNICAL IMPLEMENTATION SPEC: [Game Title]\n\n## 1. STATE SCHEMA\nDefine the exact JS objects.\n- `GameState`: { ... }\n- `Entities`: [{ ... }]\n\n## 2. CORE LOGIC\nDescribe *how* to implement complex mechanics. Use **Pseudo-code** or detailed steps.\n- **Mechanic A**: Explanation...\n- **Mechanic B**: Explanation...\n\n## 3. VISUAL IMPLEMENTATION\nhow to draw effects using *only* standard Canvas API (`ctx.lineTo`, `ctx.arc`, etc.).\n- **Effect A**: Layers/Composition...\n- **Effect B**: Animation math..."
  },
  {
    "role": "user",
    "content": "=== INPUTS ===\n1. Concept: \"A top-down tactical shooter where players control a tank to defend a central base from waves of armored invaders. Core mechanics involve 2D movement, projectile physics, and using destructible terrain for strategic cover. Players must eliminate varied enemy tank types that spawn from multiple directions while collecting power-ups to upgrade firepower and armor. The visual style features a vibrant, high-contrast retro pixel-art aesthetic with a fixed-camera perspective. The win condition is successfully destroying all enemy waves in a level while ensuring both the player’s tank and the central base remain intact.\"\n2. Skeleton: \"Top-down shooter where player aims at cursor and survives waves of enemies from all directions.\" (Details: # Game Logic Guidelines\nPending implementation...)\n3. Engine Interface:\n\n// Available Globals in the sandbox:\n// state (managed by engine), input (keys/mouse), deltaTime: number\n\nclass Vector { constructor(x,y); x,y:number; add(v); static distance(v1,v2); }\nclass GameObject { constructor(x,y,radius,color); x,y,radius:number; color:string; active:boolean; velocity:Vector; update(dt, state, w, h); draw(ctx); }\n\n/** \n * input: { \n *   x, y: number (mouse/touch), \n *   isDown: boolean (primary button),\n *   keys: Record<string, boolean>, // e.g. keys['ArrowLeft']\n *   [key: string]: boolean // Direct access allowed: e.g. input.ArrowLeft, input.a, input.left, input.Space\n * } \n */\nconst COLORS = { BG, PLAYER, ENEMY, ACCENT, TEXT };\n\n\n4. The Constitution:\n- NO external libraries or assets (images/sounds).\n- dt is in SECONDS.\n- Standard HTML5 Canvas API only.\n- Single file output constraints.\n- SANDBOX SIGNATURES (MUST ADHERE):\n  * init(state, w, h)\n  * update(state, input, dt, w, h)\n  * draw(state, ctx, w, h)"
  }
]
[AI-CLIENT] <<< END REQUEST MESSAGES <<<

[AI-CLIENT] >>> REQUEST MESSAGES >>>
[
  {
    "role": "user",
    "content": "Output format:\nTITLE: [game title]\nDESCRIPTION: [brief description]\nCODE:\n```javascript\n[your code here]\n```\n\nCritical System Rules:\n1. **Signatures MUST match strictly**:\n   - `init(state, w, h)`: Set initial state. Use w,h for responsive sizing.\n   - `update(state, input, dt, w, h)`: Update logic. `input` is {x, y, isDown, keys}. `dt` is seconds. Use w,h for boundary checks.\n   - `draw(state, ctx, w, h)`: Render frame.\n2. **No External Scope**: Helper functions cannot access 'w' or 'h' unless passed as arguments.\n3. **No Globals**: All state must hang off `state`.\n4. **Return**: Must end with `return {init, update, draw};`.\n5. **Core Classes**: Use the provided `Vector` and `GameObject`. DO NOT redefine them.\n   - Note: `Vector` methods like `add` mutate the instance. Use `copy()` if needed.\n\nInput Handling:\n- simple click: `if (input.isDown && !state.lastDown) ...`\n- keyboard: `if (input.keys.ArrowLeft || input.left) ...` (Standardized aliases available)\n\nVisuals:\n- Use standard Canvas API (beginPath, arc, fill, stroke).\n- Use HSL/RGBa for effects.\n- Avoid random noise (e.g. flickering stars). Use pre-generated state for static elements.\n\n=== CONTEXT ===\n\n=== SKELETON SPECIFIC GUIDELINES ===\nGame Type: Top-down shooter where player aims at cursor and survives waves of enemies from all directions.\n\n=== ENGINE INTERFACE ===\n\n// Available Globals in the sandbox:\n// state (managed by engine), input (keys/mouse), deltaTime: number\n\nclass Vector { constructor(x,y); x,y:number; add(v); static distance(v1,v2); }\nclass GameObject { constructor(x,y,radius,color); x,y,radius:number; color:string; active:boolean; velocity:Vector; update(dt, state, w, h); draw(ctx); }\n\n/** \n * input: { \n *   x, y: number (mouse/touch), \n *   isDown: boolean (primary button),\n *   keys: Record<string, boolean>, // e.g. keys['ArrowLeft']\n *   [key: string]: boolean // Direct access allowed: e.g. input.ArrowLeft, input.a, input.left, input.Space\n * } \n */\nconst COLORS = { BG, PLAYER, ENEMY, ACCENT, TEXT };\n\n\n\n=== LOGIC GUIDELINES ===\nPending implementation...\n\n=== DETAILED DESIGN CONCEPT ===\nA top-down tactical shooter where players control a tank to defend a central base from waves of armored invaders. Core mechanics involve 2D movement, projectile physics, and using destructible terrain for strategic cover. Players must eliminate varied enemy tank types that spawn from multiple directions while collecting power-ups to upgrade firepower and armor. The visual style features a vibrant, high-contrast retro pixel-art aesthetic with a fixed-camera perspective. The win condition is successfully destroying all enemy waves in a level while ensuring both the player’s tank and the central base remain intact.\n\n=== ARCHITECTURAL SPECIFICATION (BLUEPRINT) ===\nYou MUST strictly implement the following logic and state schema. \nThis Spec is your definitive guide for \"How\" to build the game.\n# TECHNICAL IMPLEMENTATION SPEC: Tank Defender\n\n## 1. STATE SCHEMA\n\n### GameState\n\n- `gameOver`: boolean\n- `currentWave`: number\n- `playerTank`: GameObject\n- `base`: GameObject\n- `enemies`: GameObject[]\n\n### Tank\n\n- `health`: number\n- `powerLevel`: number\n- `armor`: number\n- `position`: Vector\n- `angle`: number\n\n### Enemy\n\n- `type`: string (e.g., \"light\", \"heavy\")\n- `health`: number\n- `position`: Vector\n- `angle`: number\n- `velocity`: Vector\n\n### PowerUp\n\n- `type`: string (e.g., \"firepower\", \"armor\")\n- `position`: Vector\n\n### Wave\n\n- `id`: number\n- `enemies`: Enemy[]\n\n## 2. CORE LOGIC\n\n### 2.1 Tank Movement\n\n* When player presses up/down arrow keys, update tank's position accordingly.\n* When player presses left/right arrow keys, update tank's angle.\n\n```pseudocode\nfunction updateTank(state, input, dt) {\n  if (input.ArrowUp) {\n    state.playerTank.position.y -= 100 * dt;\n  }\n  if (input.ArrowDown) {\n    state.playerTank.position.y += 100 * dt;\n  }\n  if (input.ArrowLeft) {\n    state.playerTank.angle -= 10 * dt;\n  }\n  if (input.ArrowRight) {\n    state.playerTank.angle += 10 * dt;\n  }\n}\n```\n\n### 2.2 Projectile Physics\n\n* When player presses fire button, create a projectile at tank's position and angle.\n* Update projectile's position based on its velocity and dt.\n\n```pseudocode\nfunction updateProjectile(state, input, dt) {\n  const projectile = state.projectiles[0];\n  projectile.position.x += projectile.velocity.x * dt;\n  projectile.position.y += projectile.velocity.y * dt;\n}\n```\n\n### 2.3 Enemy AI\n\n* Enemies should move towards the player's tank.\n* Enemies should be attracted to the player's tank's position.\n\n```pseudocode\nfunction updateEnemy(state, input, dt) {\n  const enemy = state.enemies[0];\n  const target = state.playerTank.position;\n  enemy.velocity.x = (target.x - enemy.position.x) / 10;\n  enemy.velocity.y = (target.y - enemy.position.y) / 10;\n  enemy.position.x += enemy.velocity.x * dt;\n  enemy.position.y += enemy.velocity.y * dt;\n}\n```\n\n### 2.4 Wave Spawning\n\n* Enemies should spawn at random positions around the screen.\n* Enemies should be attracted to the player's tank's position.\n\n```pseudocode\nfunction spawnEnemies(state, input, dt) {\n  const wave = state.waves[state.currentWave];\n  for (const enemy of wave.enemies) {\n    enemy.position.x = Math.random() * 800;\n    enemy.position.y = Math.random() * 600;\n    enemy.velocity.x = (state.playerTank.position.x - enemy.position.x) / 10;\n    enemy.velocity.y = (state.playerTank.position.y - enemy.position.y) / 10;\n  }\n  state.currentWave++;\n}\n```\n\n## 3. VISUAL IMPLEMENTATION\n\n### 3.1 Tank\n\n* Draw tank as a rectangle with color `PLAYER`.\n* Draw tank's position at `playerTank.position`.\n* Draw tank's angle as a line from `playerTank.position` to the top-left and bottom-right corners of the rectangle.\n\n```javascript\nfunction drawTank(state, ctx, w, h) {\n  ctx.fillStyle = COLORS.PLAYER;\n  ctx.fillRect(state.playerTank.position.x, state.playerTank.position.y, 50, 50);\n  ctx.beginPath();\n  ctx.moveTo(state.playerTank.position.x, state.playerTank.position.y);\n  ctx.lineTo(state.playerTank.position.x - 25, state.playerTank.position.y - 25);\n  ctx.lineTo(state.playerTank.position.x + 25, state.playerTank.position.y + 25);\n  ctx.stroke();\n}\n```\n\n### 3.2 Enemy\n\n* Draw enemy as a rectangle with color `ENEMY`.\n* Draw enemy's position at `enemy.position`.\n* Draw enemy's angle as a line from `enemy.position` to the top-left and bottom-right corners of the rectangle.\n\n```javascript\nfunction drawEnemy(state, ctx, w, h) {\n  ctx.fillStyle = COLORS.ENEMY;\n  ctx.fillRect(state.enemies[0].position.x, state.enemies[0].position.y, 50, 50);\n  ctx.beginPath();\n  ctx.moveTo(state.enemies[0].position.x, state.enemies[0].position.y);\n  ctx.lineTo(state.enemies[0].position.x - 25, state.enemies[0].position.y - 25);\n  ctx.lineTo(state.enemies[0].position.x + 25, state.enemies[0].position.y + 25);\n  ctx.stroke();\n}\n```\n\n### 3.3 Projectile\n\n* Draw projectile as a line with color `ACCENT`.\n* Draw projectile's position at `projectile.position`.\n\n```javascript\nfunction drawProjectile(state, ctx, w, h) {\n  ctx.strokeStyle = COLORS.ACCENT;\n  ctx.beginPath();\n  ctx.moveTo(state.projectiles[0].position.x, state.projectiles[0].position.y);\n  ctx.lineTo(state.projectiles[0].position.x + 100, state.projectiles[0].position.y);\n  ctx.stroke();\n}\n```\n\n### 3.4 Power-Up\n\n* Draw power-up as a rectangle with color `ACCENT`.\n* Draw power-up's position at `powerUp.position`.\n\n```javascript\nfunction drawPowerUp(state, ctx, w, h) {\n  ctx.fillStyle = COLORS.ACCENT;\n  ctx.fillRect(state.powerUps[0].position.x, state.powerUps[0].position.y, 20, 20);\n}\n```\n\n### 3.5 Base\n\n* Draw base as a rectangle with color `BG`.\n* Draw base's position at `base.position`.\n\n```javascript\nfunction drawBase(state, ctx, w, h) {\n  ctx.fillStyle = COLORS.BG;\n  ctx.fillRect(state.base.position.x, state.base.position.y, 100, 100);\n}\n```\n\n## 4. INITIALIZATION\n\n```javascript\nfunction init(state, w, h) {\n  state.playerTank = new GameObject(400, 300, 50, COLORS.PLAYER);\n  state.base = new GameObject(400, 200, 100, COLORS.BG);\n  state.enemies = [];\n  state.projectiles = [];\n  state.powerUps = [];\n  state.currentWave = 0;\n}\n```\n\n## 5. UPDATE\n\n```javascript\nfunction update(state, input, dt, w, h) {\n  updateTank(state, input, dt);\n  updateProjectile(state, input, dt);\n  updateEnemy(state, input, dt);\n  spawnEnemies(state, input, dt);\n}\n```\n\n## 6. DRAW\n\n```javascript\nfunction draw(state, ctx, w, h) {\n  ctx.clearRect(0, 0, w, h);\n  drawTank(state, ctx, w, h);\n  drawEnemy(state, ctx, w, h);\n  drawProjectile(state, ctx, w, h);\n  drawPowerUp(state, ctx, w, h);\n  drawBase(state, ctx, w, h);\n}\n```\n            "
  }
]
[AI-CLIENT] <<< END REQUEST MESSAGES <<<

TITLE: Tank Defender
DESCRIPTION: Top-down tank shooter defending base from enemy waves with power-ups and tactical cover.
CODE:
```javascript
class Tank extends GameObject {
    constructor(x, y, color) {
        super(x, y, 25, color);
        this.angle = 0;
        this.turretAngle = 0;
        this.health = 100;
        this.powerLevel = 1;
        this.armor = 1;
        this.fireCooldown = 0;
        this.velocity = new Vector(0, 0);
        this.speed = 200;
    }

    updateTank(dt, input, w, h) {
        // Movement
        const move = new Vector(0, 0);
        if (input.ArrowUp || input.w) move.y -= 1;
        if (input.ArrowDown || input.s) move.y += 1;
        if (input.ArrowLeft || input.a) move.x -= 1;
        if (input.ArrowRight || input.d) move.x += 1;

        if (move.x !== 0 || move.y !== 0) {
            move.normalize();
            this.velocity.x = move.x * this.speed;
            this.velocity.y = move.y * this.speed;
            this.angle = Math.atan2(move.y, move.x);
        } else {
            this.velocity.x *= 0.9;
            this.velocity.y *= 0.9;
        }

        this.x += this.velocity.x * dt;
        this.y += this.velocity.y * dt;

        // Boundary
        this.x = Math.max(this.radius, Math.min(w - this.radius, this.x));
        this.y = Math.max(this.radius, Math.min(h - this.radius, this.y));

        // Turret aims at cursor
        if (input.x !== undefined && input.y !== undefined) {
            this.turretAngle = Math.atan2(input.y - this.y, input.x - this.x);
        }

        // Fire cooldown
        if (this.fireCooldown > 0) {
            this.fireCooldown -= dt;
        }
    }

    drawTank(ctx) {
        ctx.save();
        ctx.translate(this.x, this.y);

        // Tank body
        ctx.rotate(this.angle);
        ctx.fillStyle = this.color;
        ctx.fillRect(-25, -15, 50, 30);
        ctx.strokeStyle = COLORS.ACCENT;
        ctx.lineWidth = 2;
        ctx.strokeRect(-25, -15, 50, 30);

        // Health bar
        ctx.fillStyle = COLORS.ENEMY;
        ctx.fillRect(-30, -25, 60, 4);
        ctx.fillStyle = COLORS.PLAYER;
        ctx.fillRect(-30, -25, 60 * (this.health / 100), 4);

        ctx.restore();

        // Tank turret
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.turretAngle);
        ctx.fillStyle = COLORS.ACCENT;
        ctx.fillRect(-5, -5, 35, 10);
        ctx.restore();
    }
}

class EnemyTank extends Tank {
    constructor(x, y, type) {
        const colors = {
            light: 'hsl(0, 70%, 50%)',
            heavy: 'hsl(0, 70%, 30%)',
            fast: 'hsl(300, 70%, 50%)'
        };
        super(x, y, colors[type] || COLORS.ENEMY);
        this.type = type;
        this.targetAngle = 0;
        this.fireTimer = Math.random() * 2;

        switch(type) {
            case 'light':
                this.health = 50;
                this.speed = 120;
                this.radius = 20;
                break;
            case 'heavy':
                this.health = 200;
                this.speed = 60;
                this.radius = 30;
                break;
            case 'fast':
                this.health = 30;
                this.speed = 250;
                this.radius = 18;
                break;
        }
    }

    updateEnemy(dt, player, base, w, h) {
        // AI targeting: prioritize base if close, otherwise player
        let target = base;
        const toBase = Vector.distance(this, base);
        const toPlayer = Vector.distance(this, player);

        if (toPlayer < 300 || toBase > 400) {
            target = player;
        }

        // Move toward target
        const dx = target.x - this.x;
        const dy = target.y - this.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist > 50) {
            this.velocity.x = (dx / dist) * this.speed;
            this.velocity.y = (dy / dist) * this.speed;
            this.angle = Math.atan2(dy, dx);
        } else {
            this.velocity.x *= 0.9;
            this.velocity.y *= 0.9;
        }

        this.x += this.velocity.x * dt;
        this.y += this.velocity.y * dt;

        // Boundary
        const padding = 50;
        this.x = Math.max(padding, Math.min(w - padding, this.x));
        this.y = Math.max(padding, Math.min(h - padding, this.y));

        // Turret aims at target
        this.turretAngle = Math.atan2(target.y - this.y, target.x - this.x);

        // Shooting logic
        this.fireTimer -= dt;
        if (this.fireTimer <= 0 && dist < 400) {
            this.fireTimer = 1.5 + Math.random();
            return true; // Signal to fire
        }
        return false;
    }
}

class PowerUp extends GameObject {
    constructor(x, y, type) {
        super(x, y, 15, COLORS.ACCENT);
        this.type = type;
        this.active = true;
        this.pulse = 0;
    }

    update(dt) {
        this.pulse += dt * 3;
    }

    draw(ctx) {
        if (!this.active) return;

        ctx.save();
        ctx.translate(this.x, this.y);

        // Pulsing effect
        const scale = 1 + Math.sin(this.pulse) * 0.2;
        ctx.scale(scale, scale);

        ctx.fillStyle = this.color;
        ctx.beginPath();

        switch(this.type) {
            case 'firepower':
                // Star shape
                for (let i = 0; i < 5; i++) {
                    const angle = (i * Math.PI * 2) / 5;
                    ctx.lineTo(
                        Math.cos(angle) * this.radius,
                        Math.sin(angle) * this.radius
                    );
                }
                ctx.closePath();
                break;
            case 'armor':
                // Shield shape
                ctx.arc(0, 0, this.radius, 0, Math.PI * 2);
                break;
            case 'health':
                // Plus shape
                ctx.fillRect(-10, -3, 20, 6);
                ctx.fillRect(-3, -10, 6, 20);
                break;
        }

        ctx.fill();
        ctx.restore();
    }
}

class Projectile extends GameObject {
    constructor(x, y, angle, power, owner) {
        super(x, y, 4, COLORS.ACCENT);
        this.velocity = new Vector(
            Math.cos(angle) * 400 * power,
            Math.sin(angle) * 400 * power
        );
        this.damage = 20 * power;
        this.owner = owner; // 'player' or 'enemy'
        this.lifetime = 3;
    }

    update(dt, w, h) {
        this.x += this.velocity.x * dt;
        this.y += this.velocity.y * dt;
        this.lifetime -= dt;
        this.active = this.lifetime > 0 &&
                     this.x > -100 && this.x < w + 100 &&
                     this.y > -100 && this.y < h + 100;
    }

    draw(ctx) {
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fill();

        // Trail effect
        ctx.beginPath();
        ctx.moveTo(this.x, this.y);
        ctx.lineTo(
            this.x - this.velocity.x * 0.05,
            this.y - this.velocity.y * 0.05
        );
        ctx.strokeStyle = this.color;
        ctx.lineWidth = 2;
        ctx.stroke();
    }
}

class Cover extends GameObject {
    constructor(x, y, width, height) {
        super(x, y, Math.max(width, height) / 2, 'hsl(120, 40%, 30%)');
        this.width = width;
        this.height = height;
        this.health = 100;
    }

    draw(ctx) {
        ctx.save();
        ctx.fillStyle = this.color;
        ctx.fillRect(
            this.x - this.width / 2,
            this.y - this.height / 2,
            this.width,
            this.height
        );

        // Damage cracks
        if (this.health < 50) {
            ctx.strokeStyle = 'rgba(0,0,0,0.3)';
            ctx.lineWidth = 2;
            ctx.beginPath();
            for (let i = 0; i < 3; i++) {
                const angle = Math.random() * Math.PI * 2;
                const length = this.width * 0.4;
                ctx.moveTo(this.x, this.y);
                ctx.lineTo(
                    this.x + Math.cos(angle) * length,
                    this.y + Math.sin(angle) * length
                );
            }
            ctx.stroke();
        }
        ctx.restore();
    }

    contains(x, y) {
        return x > this.x - this.width / 2 &&
               x < this.x + this.width / 2 &&
               y > this.y - this.height / 2 &&
               y < this.y + this.height / 2;
    }
}

function init(state, w, h) {
    // Player
    state.player = new Tank(w / 2, h - 100, COLORS.PLAYER);

    // Base
    state.base = new GameObject(w / 2, h / 2, 40, COLORS.BG);
    state.base.health = 200;

    // Game state
    state.enemies = [];
    state.projectiles = [];
    state.powerUps = [];
    state.covers = [];
    state.currentWave = 0;
    state.waveTimer = 0;
    state.gameOver = false;
    state.score = 0;
    state.lastDown = false;
    state.waveCleared = false;

    // Create initial covers
    for (let i = 0; i < 4; i++) {
        const angle = (i / 4) * Math.PI * 2;
        state.covers.push(new Cover(
            w / 2 + Math.cos(angle) * 200,
            h / 2 + Math.sin(angle) * 200,
            60 + Math.random() * 40,
            40 + Math.random() * 30
        ));
    }

    // Spawn first wave
    spawnWave(state, w, h);
}

function spawnWave(state, w, h) {
    state.currentWave++;
    state.waveCleared = false;
    const enemyCount = 5 + state.currentWave * 2;
    const types = ['light', 'heavy', 'fast'];

    for (let i = 0; i < enemyCount; i++) {
        const angle = (i / enemyCount) * Math.PI * 2;
        const distance = Math.max(w, h) / 2 + 100;
        const type = types[Math.floor(Math.random() * types.length)];

        state.enemies.push(new EnemyTank(
            w / 2 + Math.cos(angle) * distance,
            h / 2 + Math.sin(angle) * distance,
            type
        ));
    }
}

function checkCollision(obj1, obj2) {
    const dx = obj1.x - obj2.x;
    const dy = obj1.y - obj2.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    return distance < (obj1.radius || 0) + (obj2.radius || 0);
}

function update(state, input, dt, w, h) {
    if (state.gameOver) {
        if (input.isDown && !state.lastDown) {
            init(state, w, h);
        }
        state.lastDown = input.isDown;
        return;
    }

    // Update player
    state.player.updateTank(dt, input, w, h);

    // Player shooting
    if ((input.isDown || input.Space) && state.player.fireCooldown <= 0) {
        state.player.fireCooldown = 0.3 / state.player.powerLevel;
        state.projectiles.push(new Projectile(
            state.player.x + Math.cos(state.player.turretAngle) * 30,
            state.player.y + Math.sin(state.player.turretAngle) * 30,
            state.player.turretAngle,
            state.player.powerLevel,
            'player'
        ));
    }

    // Update enemies
    let allDead = state.enemies.length > 0;
    for (let i = state.enemies.length - 1; i >= 0; i--) {
        const enemy = state.enemies[i];

        if (enemy.updateEnemy(dt, state.player, state.base, w, h)) {
            // Enemy fires
            state.projectiles.push(new Projectile(
                enemy.x + Math.cos(enemy.turretAngle) * 25,
                enemy.y + Math.sin(enemy.turretAngle) * 25,
                enemy.turretAngle,
                1,
                'enemy'
            ));
        }

        // Enemy collision with base
        if (checkCollision(enemy, state.base)) {
            state.base.health -= 10 * dt;
            enemy.health -= 20 * dt;
        }

        // Enemy collision with player
        if (checkCollision(enemy, state.player)) {
            state.player.health -= 5 * dt;
        }

        if (enemy.health <= 0) {
            state.enemies.splice(i, 1);
            state.score += 100;

            // Chance to drop power-up
            if (Math.random() < 0.2) {
                const types = ['firepower', 'armor', 'health'];
                state.powerUps.push(new PowerUp(
                    enemy.x,
                    enemy.y,
                    types[Math.floor(Math.random() * types.length)]
                ));
            }
        } else {
            allDead = false;
        }
    }

    // Check wave cleared
    if (allDead && !state.waveCleared) {
        state.waveCleared = true;
        state.waveTimer = 3; // Time between waves
    }

    // Wave timer
    if (state.waveCleared) {
        state.waveTimer -= dt;
        if (state.waveTimer <= 0) {
            spawnWave(state, w, h);
        }
    }

    // Update projectiles
    for (let i = state.projectiles.length - 1; i >= 0; i--) {
        const proj = state.projectiles[i];
        proj.update(dt, w, h);

        // Collision with covers
        let hitCover = false;
        for (const cover of state.covers) {
            if (cover.contains(proj.x, proj.y)) {
                cover.health -= proj.damage;
                if (cover.health <= 0) {
                    state.covers.splice(state.covers.indexOf(cover), 1);
                }
                hitCover = true;
                break;
            }
        }

        if (hitCover || !proj.active) {
            state.projectiles.splice(i, 1);
            continue;
        }

        // Collision detection
        if (proj.owner === 'player') {
            for (let j = state.enemies.length - 1; j >= 0; j--) {
                if (checkCollision(proj, state.enemies[j])) {
                    state.enemies[j].health -= proj.damage;
                    state.projectiles.splice(i, 1);
                    break;
                }
            }
        } else if (proj.owner === 'enemy') {
            if (checkCollision(proj, state.player)) {
                const damage = proj.damage / state.player.armor;
                state.player.health -= damage;
                state.projectiles.splice(i, 1);
            } else if (checkCollision(proj, state.base)) {
                state.base.health -= proj.damage;
                state.projectiles.splice(i, 1);
            }
        }
    }

    // Update power-ups
    for (let i = state.powerUps.length - 1; i >= 0; i--) {
        const pup = state.powerUps[i];
        pup.update(dt);

        if (checkCollision(pup, state.player)) {
            switch(pup.type) {
                case 'firepower':
                    state.player.powerLevel = Math.min(3, state.player.powerLevel + 0.5);
                    break;
                case 'armor':
                    state.player.armor += 0.5;
                    break;
                case 'health':
                    state.player.health = Math.min(100, state.player.health + 30);
                    break;
            }
            state.powerUps.splice(i, 1);
        }
    }

    // Check game over
    if (state.player.health <= 0 || state.base.health <= 0) {
        state.gameOver = true;
    }

    // Mouse state
    state.lastDown = input.isDown;
}

function draw(state, ctx, w, h) {
    // Clear canvas
    ctx.fillStyle = COLORS.BG;
    ctx.fillRect(0, 0, w, h);

    // Draw base
    ctx.fillStyle = COLORS.BG;
    ctx.beginPath();
    ctx.arc(state.base.x, state.base.y, state.base.radius, 0, Math.PI * 2);
    ctx.fill();

    // Base health bar
    ctx.fillStyle = COLORS.ENEMY;
    ctx.fillRect(state.base.x - 50, state.base.y - 50, 100, 8);
    ctx.fillStyle = COLORS.PLAYER;
    ctx.fillRect(state.base.x - 50, state.base.y - 50, 100 * (state.base.health / 200), 8);

    // Draw covers
    for (const cover of state.covers) {
        cover.draw(ctx);
    }

    // Draw power-ups
    for (const pup of state.powerUps) {
        pup.draw(ctx);
    }

    // Draw projectiles
    for (const proj of state.projectiles) {
        proj.draw(ctx);
    }

    // Draw enemies
    for (const enemy of state.enemies) {
        enemy.drawTank(ctx);
    }

    // Draw player
    state.player.drawTank(ctx);

    // Draw UI
    ctx.fillStyle = COLORS.TEXT;
    ctx.font = '16px Arial';
    ctx.textAlign = 'left';
    ctx.fillText(`Wave: ${state.currentWave}`, 20, 30);
    ctx.fillText(`Score: ${state.score}`, 20, 55);
    ctx.fillText(`Health: ${Math.ceil(state.player.health)}`, 20, 80);
    ctx.fillText(`Power: x${state.player.powerLevel.toFixed(1)}`, 20, 105);
    ctx.fillText(`Armor: x${state.player.armor.toFixed(1)}`, 20, 130);

    // Wave cleared message
    if (state.waveCleared) {
        ctx.textAlign = 'center';
        ctx.font = '24px Arial';
        ctx.fillStyle = COLORS.ACCENT;
        ctx.fillText(`Wave ${state.currentWave} Cleared!`, w / 2, 40);
        ctx.fillText(`Next wave in: ${Math.ceil(state.waveTimer)}`, w / 2, 70);
    }

    // Game over
    if (state.gameOver) {
        ctx.fillStyle = 'rgba(0,0,0,0.7)';
        ctx.fillRect(0, 0, w, h);
        ctx.fillStyle = COLORS.TEXT;
        ctx.font = '48px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('GAME OVER', w / 2, h / 2 - 50);
        ctx.font = '24px Arial';
        ctx.fillText(`Final Score: ${state.score}`, w / 2, h / 2 + 10);
        ctx.fillText('Click to restart', w / 2, h / 2 + 50);
    }
}

return { init, update, draw };
```
[AI-CLIENT] <<< END RAW RESPONSE <<<
[AI-CLIENT] [REASONING] Available (length: 3046 chars)
[ENGINEER] AI response received in 163192 ms
[ENGINEER] Parsing game definition...
[ENGINEER] Game title: Tank Defender
[ENGINEER] Code success. Length: 17386
[ENGINEER] ========== Code Generation Complete ==========
[API/CREATE] Generated: Tank Defender
[API/CREATE] ========== Generation Complete ==========
[API/FIX] ========== Fix Request ==========
[API/FIX] Game: Tank Defender
[API/FIX] Error: Game State Corruption: 'state.player.x' became NaN.
[FIXER] ========== Bug Fix Started ==========
[FIXER] Game: Tank Defender
[FIXER] Error: Game State Corruption: 'state.player.x' became NaN.
[FIXER] Using dynamic system prompt (v5)
[FIXER] Calling AI for bug fix...
[AI-CLIENT] Calling Main AI...