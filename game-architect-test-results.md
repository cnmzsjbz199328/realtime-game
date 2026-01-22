[API/CREATE] ========== Generation Request ==========
[API/CREATE] Topic: 火箭回收
[API/CREATE] Phase 1: Director Classification
[DIRECTOR] ========== Classification Started ==========
[DIRECTOR] Topic: 火箭回收
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
    "content": "You are a Game Design Director. Select the best skeleton and provide a CONCISE design concept.\n\n=== CRITICAL: Output Limits ===\n- expandedDesign: MAX 150 words\n- Focus on: core mechanic, visual style, win condition\n- NO backstory, NO philosophy, NO detailed lore\n\n=== Output Format ===\nReturn JSON only:\n{\n  \"skeletonId\": \"ID\",\n  \"expandedDesign\": \"Concise gameplay description (< 150 words)\"\n}\n\nAvailable Skeletons:\n- breakout_paddle: Control a paddle to bounce a ball and break blocks using physics-based collisions.\n- bullet_hell: Navigate through dense patterns of projectiles with precise movement and small hitboxes.\n- click_eliminate: Match and eliminate groups of similar items by clicking. Gravity refills gaps from above.\n- dodge_falling: Move horizontally to avoid falling objects that spawn from the top of the screen.\n- endless_runner: Auto-scrolling game where player jumps or slides to avoid procedurally generated obstacles.\n- gravity_platformer: Jump across platforms with realistic gravity and collision detection.\n- impulse_physics: Physics-based gameplay using forces, impulses, and vector math for realistic movement.\n- match3: Swap adjacent tiles to create matches of 3+ identical items, triggering cascades.\n- maze_pathfinding: Navigate through grid-based mazes with pathfinding enemies and line-of-sight mechanics.\n- scrolling_shooter: Fly through scrolling space while shooting enemies and collecting power-ups.\n- snake_grid: Grow a snake by eating food while avoiding walls and your own tail in grid-based movement.\n- survival_shooter: Top-down shooter where player aims at cursor and survives waves of enemies from all directions.\n- tetris_grid: Rotate and place falling blocks to form complete lines in a 2D grid.\n- tower_defense: Place defensive towers along a path to stop waves of enemies from reaching your base.\n- turnbased_grid: Grid-based strategy where player and enemies take turns moving and attacking.\n- universal_collection: Race against time to collect items scattered across the screen with fast-paced movement.\n- universal_minimal: Flexible template for any game concept without predefined mechanics.\n\nUser Input: \"火箭回收\""
  }
]
[AI-CLIENT] <<< END REQUEST MESSAGES <<<
[AI-CLIENT] >>> RAW RESPONSE >>>
{
  "skeletonId": "impulse_physics",
  "expandedDesign": "Players control a descending rocket stage using physics-based impulses to simulate thrusters. The core mechanic involves managing fuel while applying upward and lateral forces to counter gravity and wind. The visual style features a minimalist, high-contrast aerospace aesthetic with particle-based exhaust trails and UI gauges for velocity and tilt. The win condition is achieved by successfully landing the rocket vertically on a designated ocean barge or landing pad with a touchdown velocity below a critical threshold."
}
[AI-CLIENT] <<< END RAW RESPONSE <<<
[DIRECTOR] AI response received in 7109 ms
[DIRECTOR] Parsing classification result...
[DIRECTOR] Selected skeleton: impulse_physics
[DIRECTOR] Expanded design length: 523 chars
[DIRECTOR] ========== Classification Complete ==========
[API/CREATE] Selected skeleton: impulse_physics
[API/CREATE] Design length: 523
[API/CREATE] Phase 2: Loading Skeleton Context
[REGISTRY] Loading dynamic skeleton from DB: impulse_physics
[API/CREATE] Skeleton loaded: Physics-based gameplay using forces, impulses, and vector math for realistic movement.
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
    "content": "=== INPUTS ===\n1. Concept: \"Players control a descending rocket stage using physics-based impulses to simulate thrusters. The core mechanic involves managing fuel while applying upward and lateral forces to counter gravity and wind. The visual style features a minimalist, high-contrast aerospace aesthetic with particle-based exhaust trails and UI gauges for velocity and tilt. The win condition is achieved by successfully landing the rocket vertically on a designated ocean barge or landing pad with a touchdown velocity below a critical threshold.\"\n2. Skeleton: \"Physics-based gameplay using forces, impulses, and vector math for realistic movement.\" (Details: # Game Logic Guidelines\nPending implementation...)\n3. Engine Interface:\n\n// Available Globals in the sandbox:\n// state (managed by engine), input (keys/mouse), deltaTime: number\n\nclass Vector { constructor(x,y); x,y:number; add(v); static distance(v1,v2); }\nclass GameObject { constructor(x,y,radius,color); x,y,radius:number; color:string; active:boolean; velocity:Vector; update(dt, state, w, h); draw(ctx); }\n\n/** \n * input: { \n *   x, y: number (mouse/touch), \n *   isDown: boolean (primary button),\n *   keys: Record<string, boolean>, // e.g. keys['ArrowLeft']\n *   [key: string]: boolean // Direct access allowed: e.g. input.ArrowLeft, input.a, input.left, input.Space\n * } \n */\nconst COLORS = { BG, PLAYER, ENEMY, ACCENT, TEXT };\n\n\n4. The Constitution:\n- NO external libraries or assets (images/sounds).\n- dt is in SECONDS.\n- Standard HTML5 Canvas API only.\n- Single file output constraints.\n- SANDBOX SIGNATURES (MUST ADHERE):\n  * init(state, w, h)\n  * update(state, input, dt, w, h)\n  * draw(state, ctx, w, h)"
  }
]
[AI-CLIENT] <<< END REQUEST MESSAGES <<<
[AI-CLIENT] >>> RAW RESPONSE >>>
# TECHNICAL IMPLEMENTATION SPEC: Rocket Descent

## 1. STATE SCHEMA

```javascript
/**
 * @typedef {object} RocketState
 * @property {Vector} position - The rocket's current position (x, y).
 * @property {number} orientation - The rocket's current tilt angle in radians (0 = upright).
 * @property {number} fuel - The current amount of fuel remaining.
 * @property {Vector} velocity - The rocket's current velocity.
 * @property {number} angularVelocity - The rocket's current rotation speed.
 * @property {number} mass - The rocket's mass.
 * @property {number} fuelBurnRate - The rate at which fuel is consumed per second when thrusters are active.
 * @property {number} maxFuel - The maximum fuel capacity.
 * @property {number} thrustMagnitude - The force applied by the main thruster.
 * @property {number} rotationTorqueMagnitude - The torque applied by rotational thrusters.
 * @property {number} gravity - The gravitational acceleration vector.
 * @property {number} windVelocity - The current wind speed and direction.
 * @property {boolean} isLanded - Whether the rocket has successfully landed.
 * @property {number} touchdownVelocityThreshold - The maximum acceptable vertical velocity for landing.
 * @property {object} barge - Information about the landing barge.
 * @property {Vector} barge.position - The center position of the barge.
 * @property {number} barge.width - The width of the barge.
 * @property {number} barge.height - The height of the barge.
 * @property {number} score - The player's score (e.g., based on landing accuracy).
 */

/**
 * @typedef {object} GameState
 * @property {RocketState} rocket - The state of the player-controlled rocket.
 * @property {Array<{position: Vector, size: number, color: string}>} exhaustParticles - Particles for the rocket's exhaust.    
 * @property {object} ui - UI elements and their states.
 * @property {number} ui.fuelBarWidth - The current visual width of the fuel bar.
 * @property {number} ui.fuelBarMaxWidth - The maximum visual width of the fuel bar.
 * @property {string} ui.fuelBarColor - The color of the fuel bar.
 * @property {string} ui.velocityTextColor - The color of the velocity text.
 * @property {string} ui.tiltTextColor - The color of the tilt text.
 * @property {string} ui.landingMessage - Message to display on successful/failed landing.
 */
```

## 2. CORE LOGIC

### Initialization (`init(state, w, h)`)

1.  **Rocket Initial State**:
    *   `state.rocket.position`: Set to `new Vector(w / 2, 50)` (top-center of the screen).
    *   `state.rocket.orientation`: Set to `0` (upright).
    *   `state.rocket.fuel`: Set to `1.0` (representing 100% fuel).
    *   `state.rocket.velocity`: Set to `new Vector(0, 0)`.
    *   `state.rocket.angularVelocity`: Set to `0`.
    *   `state.rocket.mass`: Set to a reasonable value (e.g., `1000`).
    *   `state.rocket.fuelBurnRate`: Set to a value (e.g., `0.5` units per second).
    *   `state.rocket.maxFuel`: Set to `1.0`.
    *   `state.rocket.thrustMagnitude`: Set to a value (e.g., `2000`).
    *   `state.rocket.rotationTorqueMagnitude`: Set to a value (e.g., `500`).
    *   `state.rocket.gravity`: Set to `new Vector(0, 9.81 * 200)` (adjust multiplier for desired gravity strength).
    *   `state.rocket.windVelocity`: Set to `new Vector(0, 0)` initially. Wind can be procedurally generated or modified over time.
    *   `state.rocket.isLanded`: Set to `false`.
    *   `state.rocket.touchdownVelocityThreshold`: Set to `50` (units per second).
    *   `state.rocket.score`: Set to `0`.

2.  **Barge Initial State**:
    *   `state.barge.position`: Set to `new Vector(w / 2, h - 50)` (bottom-center of the screen).
    *   `state.barge.width`: Set to `100`.
    *   `state.barge.height`: Set to `20`.

3.  **UI Initial State**:
    *   `state.ui.fuelBarWidth`: Set to `100`.
    *   `state.ui.fuelBarMaxWidth`: Set to `100`.
    *   `state.ui.fuelBarColor`: Set to `COLORS.ACCENT`.
    *   `state.ui.velocityTextColor`: Set to `COLORS.TEXT`.
    *   `state.ui.tiltTextColor`: Set to `COLORS.TEXT`.
    *   `state.ui.landingMessage`: Set to `""`.

4.  **Exhaust Particles**:
    *   `state.exhaustParticles`: Initialize as an empty array `[]`.

### Update (`update(state, input, dt, w, h)`)

1.  **Handle Landing State**:
    *   If `state.rocket.isLanded` is `true`, skip all further physics updates. Only update UI or input for potential restart.  

2.  **Apply Gravity**:
    *   `state.rocket.velocity = state.rocket.velocity.add(state.rocket.gravity.multiply(dt))`.

3.  **Apply Wind**:
    *   `state.rocket.velocity = state.rocket.velocity.add(state.rocket.windVelocity.multiply(dt))`.

4.  **Handle Player Input**:
    *   **Main Thruster (Upward Impulse)**:
        *   If `input.keys['ArrowUp']` or `input.keys['w']` is `true` AND `state.rocket.fuel > 0`:
            *   Calculate thrust vector: `thrustVector = new Vector(0, -state.rocket.thrustMagnitude).rotate(state.rocket.orientation)`.
            *   Apply impulse: `state.rocket.velocity = state.rocket.velocity.add(thrustVector.multiply(dt / state.rocket.mass))`.
            *   Burn fuel: `state.rocket.fuel -= state.rocket.fuelBurnRate * dt`. Clamp `state.rocket.fuel` to be >= 0.
            *   Add exhaust particles (see **Particle System**).
    *   **Rotational Thrusters (Left/Right Torque)**:
        *   If `input.keys['ArrowLeft']` or `input.keys['a']` is `true`:
            *   Apply counter-clockwise torque: `state.rocket.angularVelocity -= state.rocket.rotationTorqueMagnitude * dt / state.rocket.mass` (mass affects angular inertia).
        *   If `input.keys['ArrowRight']` or `input.keys['d']` is `true`:
            *   Apply clockwise torque: `state.rocket.angularVelocity += state.rocket.rotationTorqueMagnitude * dt / state.rocket.mass`.

5.  **Physics Integration**:
    *   **Linear Motion**:
        *   `state.rocket.position = state.rocket.position.add(state.rocket.velocity.multiply(dt))`.
    *   **Rotational Motion**:
        *   `state.rocket.orientation += state.rocket.angularVelocity * dt`.
        *   Normalize `state.rocket.orientation` to be within `[-PI, PI]` or similar for consistent calculations.
    *   **Air Resistance/Drag (Optional but recommended for realism)**:
        *   Calculate drag force opposite to `state.rocket.velocity`. A simple model: `dragForce = state.rocket.velocity.normalize().multiply(-dragCoefficient * velocityMagnitudeSquared)`.
        *   Apply drag: `state.rocket.velocity = state.rocket.velocity.add(dragForce.multiply(dt / state.rocket.mass))`.        

6.  **Collision Detection (Landing)**:
    *   Check if the rocket is intersecting with the `state.barge`.
    *   A simple AABB (Axis-Aligned Bounding Box) or circle-rectangle intersection test can be used. For simplicity, consider the rocket's center and a bounding radius.
    *   If `state.rocket.position` is within barge bounds AND `state.rocket.velocity.y <= state.rocket.touchdownVelocityThreshold` AND `abs(state.rocket.orientation) < PI/4` (roughly vertical):
        *   `state.rocket.isLanded = true`.
        *   `state.rocket.velocity = new Vector(0, 0)`.
        *   `state.rocket.angularVelocity = 0`.
        *   Calculate score: For example, `state.rocket.score = (1 - abs(state.rocket.orientation) / (PI/4)) * (1 - state.rocket.velocity.y / state.rocket.touchdownVelocityThreshold) * 1000`.
        *   `state.ui.landingMessage = "SUCCESS! Score: " + state.rocket.score.toFixed(0)`.
    *   If `state.rocket.isLanded` is `false` AND `state.rocket.position.y >= h - 50` (hit the ground/water):
        *   `state.rocket.isLanded = true`.
        *   `state.ui.landingMessage = "CRASHED!"`.

7.  **Particle System (Exhaust)**:
    *   If the main thruster is active:
        *   Generate new particles at the rocket's base, with velocity influenced by the thruster's direction.
        *   Each particle should have: `position`, `velocity`, `lifespan`, `size`, `color`.
    *   For each particle in `state.exhaustParticles`:
        *   Update particle position: `particle.position = particle.position.add(particle.velocity.multiply(dt))`.
        *   Decrease lifespan: `particle.lifespan -= dt`.
        *   Update particle size/alpha for fading: e.g., `particle.size *= (1 - dt / particle.initialLifespan)`.
    *   Remove particles where `lifespan <= 0`.

8.  **UI Updates**:
    *   Update `state.ui.fuelBarWidth` based on `state.rocket.fuel / state.rocket.maxFuel`.
    *   Update text displays for velocity and tilt.

### Particle Generation Logic (When Thruster is Active)

*   **Position**: `rocket.position.add(new Vector(0, rocket.radius).rotate(rocket.orientation))`.
*   **Velocity**: `rocket.velocity.add(new Vector(0, -thrustMagnitude * 0.5).rotate(rocket.orientation).add(randomJitterVector()))`. (Smaller thrust for particle generation, with jitter).
*   **Lifespan**: Randomize between `0.5` and `1.5` seconds.
*   **Size**: Randomize between `2` and `5`.
*   **Color**: A gradient from orange to red, or a consistent white/grey.

### Wind Procedural Generation (Example)

*   Periodically (e.g., every 5 seconds), introduce a small, random change to `state.rocket.windVelocity.x`.
*   The wind can also gradually increase or decrease in intensity.

## 3. VISUAL IMPLEMENTATION

### Drawing the Scene (`draw(state, ctx, w, h)`)

1.  **Background**:
    *   `ctx.fillStyle = COLORS.BG;`
    *   `ctx.fillRect(0, 0, w, h);`

2.  **Landing Barge**:
    *   `ctx.fillStyle = COLORS.PLAYER;` // Or a dedicated barge color.
    *   `ctx.fillRect(state.barge.position.x - state.barge.width / 2, state.barge.position.y - state.barge.height / 2, state.barge.width, state.barge.height);`

3.  **Rocket Body**:
    *   Translate the canvas origin to the rocket's position:
        *   `ctx.save();`
        *   `ctx.translate(state.rocket.position.x, state.rocket.position.y);`
        *   Rotate the canvas: `ctx.rotate(state.rocket.orientation);`
    *   Draw the rocket body as a simple geometric shape (e.g., a cone on top of a cylinder, or just a stylized triangle).      
        *   Example: A basic cone shape.
        *   `ctx.fillStyle = COLORS.PLAYER;`
        *   `ctx.beginPath();`
        *   `ctx.moveTo(0, -20);` // Tip of the rocket
        *   `ctx.lineTo(10, 20);`  // Bottom right
        *   `ctx.lineTo(-10, 20);` // Bottom left
        *   `ctx.closePath();`
        *   `ctx.fill();`
    *   Restore the canvas origin: `ctx.restore();`

4.  **Exhaust Particles**:
    *   Iterate through `state.exhaustParticles`:
        *   For each particle:
            *   `ctx.save();`
            *   `ctx.translate(particle.position.x, particle.position.y);`
            *   `ctx.fillStyle = particle.color;` // Potentially with alpha fading
            *   `ctx.beginPath();`
            *   `ctx.arc(0, 0, particle.size, 0, Math.PI * 2);`
            *   `ctx.fill();`
            *   `ctx.restore();`

5.  **UI Elements**:
    *   **Fuel Bar**:
        *   `ctx.fillStyle = COLORS.TEXT;`
        *   `ctx.fillRect(20, 20, state.ui.fuelBarMaxWidth, 20);` // Background of bar
        *   `ctx.fillStyle = state.ui.fuelBarColor;`
        *   `ctx.fillRect(20, 20, state.ui.fuelBarWidth, 20);`
        *   `ctx.strokeStyle = COLORS.TEXT;`
        *   `ctx.strokeRect(20, 20, state.ui.fuelBarMaxWidth, 20);`
        *   `ctx.fillStyle = COLORS.TEXT;`
        *   `ctx.fillText("FUEL", 25, 35);`
    *   **Velocity Display**:
        *   `ctx.fillStyle = state.ui.velocityTextColor;`
        *   `ctx.fillText("VEL: " + state.rocket.velocity.magnitude().toFixed(1) + " m/s", 20, 60);`
    *   **Tilt Display**:
        *   `ctx.fillStyle = state.ui.tiltTextColor;`
        *   `ctx.fillText("TILT: " + (state.rocket.orientation * 180 / Math.PI).toFixed(1) + "°", 20, 80);`
    *   **Landing Message**:
        *   If `state.ui.landingMessage`:
            *   `ctx.fillStyle = COLORS.TEXT;`
            *   `ctx.font = "30px Arial";`
            *   `ctx.textAlign = "center";`
            *   `ctx.fillText(state.ui.landingMessage, w / 2, h / 2);`
            *   `ctx.textAlign = "left";` // Reset alignment

### Color Palette (`COLORS`)

```javascript
const COLORS = {
    BG: '#000000', // Black background
    PLAYER: '#CCCCCC', // Light grey for rocket
    ENEMY: '#FF0000', // Red (not used in this concept, but good to have)
    ACCENT: '#00FFFF', // Cyan for UI elements/thrust
    TEXT: '#FFFFFF' // White for UI text
};
```

### Helper Functions (within the single file)

*   `Vector.prototype.multiply(scalar)`: Returns a new Vector scaled by `scalar`.
*   `Vector.prototype.normalize()`: Returns a new unit Vector in the same direction.
*   `Vector.prototype.magnitude()`: Returns the length of the Vector.
*   `Vector.prototype.rotate(angle)`: Returns a new Vector rotated by `angle` (in radians) around the origin.
*   `Vector.prototype.clone()`: Returns a deep copy of the Vector.
*   `randomJitterVector()`: Returns a small random Vector for particle effects.
[AI-CLIENT] <<< END RAW RESPONSE <<<
[ArchitectService] Spec Generated. Length: 12944
[API/CREATE] Architect Spec generated successfully.
[API/CREATE] Phase 3: Engineer Code Generation
[ENGINEER] ========== Code Generation Started ==========
[ENGINEER] Skeleton: Physics-based gameplay using forces, impulses, and vector math for realistic movement. (impulse_physics)   
[ENGINEER] Design length: 523 chars
[ENGINEER] Architect Spec provided. Length: 12944 chars
[ENGINEER] Using dynamic system prompt (v12)
[ENGINEER] Calling AI for code generation...
[AI-CLIENT] Calling DeepSeek-R1...
[AI-CLIENT] >>> REQUEST MESSAGES >>>
[
  {
    "role": "user",
    "content": "Output format:\nTITLE: [game title]\nDESCRIPTION: [brief description]\nCODE:\n```javascript\n[your code here]\n```\n\nCritical System Rules:\n1. **Signatures MUST match strictly**:\n   - `init(state, w, h)`: Set initial state. Use w,h for responsive sizing.\n   - `update(state, input, dt, w, h)`: Update logic. `input` is {x, y, isDown, keys}. `dt` is seconds. Use w,h for boundary checks.\n   - `draw(state, ctx, w, h)`: Render frame.\n2. **No External Scope**: Helper functions cannot access 'w' or 'h' unless passed as arguments.\n3. **No Globals**: All state must hang off `state`.\n4. **Return**: Must end with `return {init, update, draw};`.\n5. **Core Classes**: Use the provided `Vector` and `GameObject`. DO NOT redefine them.\n   - Note: `Vector` methods like `add` mutate the instance. Use `copy()` if needed.\n\nInput Handling:\n- simple click: `if (input.isDown && !state.lastDown) ...`\n- keyboard: `if (input.keys.ArrowLeft || input.left) ...` (Standardized aliases available)\n\nVisuals:\n- Use standard Canvas API (beginPath, arc, fill, stroke).\n- Use HSL/RGBa for effects.\n- Avoid random noise (e.g. flickering stars). Use pre-generated state for static elements.\n\n=== CONTEXT ===\n\n=== SKELETON SPECIFIC GUIDELINES ===\nGame Type: Physics-based gameplay using forces, impulses, and vector math for realistic movement.\n\n=== ENGINE INTERFACE ===\n\n// Available Globals in the sandbox:\n// state (managed by engine), input (keys/mouse), deltaTime: number\n\nclass Vector { constructor(x,y); x,y:number; add(v); static distance(v1,v2); }\nclass GameObject { constructor(x,y,radius,color); x,y,radius:number; color:string; active:boolean; velocity:Vector; update(dt, state, w, h); draw(ctx); }\n\n/** \n * input: { \n *   x, y: number (mouse/touch), \n *   isDown: boolean (primary button),\n *   keys: Record<string, boolean>, // e.g. keys['ArrowLeft']\n *   [key: string]: boolean // Direct access allowed: e.g. input.ArrowLeft, input.a, input.left, input.Space\n * } \n */\nconst COLORS = { BG, PLAYER, ENEMY, ACCENT, TEXT };\n\n\n\n=== LOGIC GUIDELINES ===\nPending implementation...\n\n=== DETAILED DESIGN CONCEPT ===\nPlayers control a descending rocket stage using physics-based impulses to simulate thrusters. The core mechanic involves managing fuel while applying upward and lateral forces to counter gravity and wind. The visual style features a minimalist, high-contrast aerospace aesthetic with particle-based exhaust trails and UI gauges for velocity and tilt. The win condition is achieved by successfully landing the rocket vertically on a designated ocean barge or landing pad with a touchdown velocity below a critical threshold.\n\n=== ARCHITECTURAL SPECIFICATION (BLUEPRINT) ===\nYou MUST strictly implement the following logic and state schema. \nThis Spec is your definitive guide for \"How\" to build the game.\n# TECHNICAL IMPLEMENTATION SPEC: Rocket Descent\n\n## 1. STATE SCHEMA\n\n```javascript\n/**\n * @typedef {object} RocketState\n * @property {Vector} position - The rocket's current position (x, y).\n * @property {number} orientation - The rocket's current tilt angle in radians (0 = upright).\n * @property {number} fuel - The current amount of fuel remaining.\n * @property {Vector} velocity - The rocket's current velocity.\n * @property {number} angularVelocity - The rocket's current rotation speed.\n * @property {number} mass - The rocket's mass.\n * @property {number} fuelBurnRate - The rate at which fuel is consumed per second when thrusters are active.\n * @property {number} maxFuel - The maximum fuel capacity.\n * @property {number} thrustMagnitude - The force applied by the main thruster.\n * @property {number} rotationTorqueMagnitude - The torque applied by rotational thrusters.\n * @property {number} gravity - The gravitational acceleration vector.\n * @property {number} windVelocity - The current wind speed and direction.\n * @property {boolean} isLanded - Whether the rocket has successfully landed.\n * @property {number} touchdownVelocityThreshold - The maximum acceptable vertical velocity for landing.\n * @property {object} barge - Information about the landing barge.\n * @property {Vector} barge.position - The center position of the barge.\n * @property {number} barge.width - The width of the barge.\n * @property {number} barge.height - The height of the barge.\n * @property {number} score - The player's score (e.g., based on landing accuracy).\n */\n\n/**\n * @typedef {object} GameState\n * @property {RocketState} rocket - The state of the player-controlled rocket.\n * @property {Array<{position: Vector, size: number, color: string}>} exhaustParticles - Particles for the rocket's exhaust.\n * @property {object} ui - UI elements and their states.\n * @property {number} ui.fuelBarWidth - The current visual width of the fuel bar.\n * @property {number} ui.fuelBarMaxWidth - The maximum visual width of the fuel bar.\n * @property {string} ui.fuelBarColor - The color of the fuel bar.\n * @property {string} ui.velocityTextColor - The color of the velocity text.\n * @property {string} ui.tiltTextColor - The color of the tilt text.\n * @property {string} ui.landingMessage - Message to display on successful/failed landing.\n */\n```\n\n## 2. CORE LOGIC\n\n### Initialization (`init(state, w, h)`)\n\n1.  **Rocket Initial State**:\n    *   `state.rocket.position`: Set to `new Vector(w / 2, 50)` (top-center of the screen).\n    *   `state.rocket.orientation`: Set to `0` (upright).\n    *   `state.rocket.fuel`: Set to `1.0` (representing 100% fuel).\n    *   `state.rocket.velocity`: Set to `new Vector(0, 0)`.\n    *   `state.rocket.angularVelocity`: Set to `0`.\n    *   `state.rocket.mass`: Set to a reasonable value (e.g., `1000`).\n    *   `state.rocket.fuelBurnRate`: Set to a value (e.g., `0.5` units per second).\n    *   `state.rocket.maxFuel`: Set to `1.0`.\n    *   `state.rocket.thrustMagnitude`: Set to a value (e.g., `2000`).\n    *   `state.rocket.rotationTorqueMagnitude`: Set to a value (e.g., `500`).\n    *   `state.rocket.gravity`: Set to `new Vector(0, 9.81 * 200)` (adjust multiplier for desired gravity strength).\n    *   `state.rocket.windVelocity`: Set to `new Vector(0, 0)` initially. Wind can be procedurally generated or modified over time.\n    *   `state.rocket.isLanded`: Set to `false`.\n    *   `state.rocket.touchdownVelocityThreshold`: Set to `50` (units per second).\n    *   `state.rocket.score`: Set to `0`.\n\n2.  **Barge Initial State**:\n    *   `state.barge.position`: Set to `new Vector(w / 2, h - 50)` (bottom-center of the screen).\n    *   `state.barge.width`: Set to `100`.\n    *   `state.barge.height`: Set to `20`.\n\n3.  **UI Initial State**:\n    *   `state.ui.fuelBarWidth`: Set to `100`.\n    *   `state.ui.fuelBarMaxWidth`: Set to `100`.\n    *   `state.ui.fuelBarColor`: Set to `COLORS.ACCENT`.\n    *   `state.ui.velocityTextColor`: Set to `COLORS.TEXT`.\n    *   `state.ui.tiltTextColor`: Set to `COLORS.TEXT`.\n    *   `state.ui.landingMessage`: Set to `\"\"`.\n\n4.  **Exhaust Particles**:\n    *   `state.exhaustParticles`: Initialize as an empty array `[]`.\n\n### Update (`update(state, input, dt, w, h)`)\n\n1.  **Handle Landing State**:\n    *   If `state.rocket.isLanded` is `true`, skip all further physics updates. Only update UI or input for potential restart.\n\n2.  **Apply Gravity**:\n    *   `state.rocket.velocity = state.rocket.velocity.add(state.rocket.gravity.multiply(dt))`.\n\n3.  **Apply Wind**:\n    *   `state.rocket.velocity = state.rocket.velocity.add(state.rocket.windVelocity.multiply(dt))`.\n\n4.  **Handle Player Input**:\n    *   **Main Thruster (Upward Impulse)**:\n        *   If `input.keys['ArrowUp']` or `input.keys['w']` is `true` AND `state.rocket.fuel > 0`:\n            *   Calculate thrust vector: `thrustVector = new Vector(0, -state.rocket.thrustMagnitude).rotate(state.rocket.orientation)`.\n            *   Apply impulse: `state.rocket.velocity = state.rocket.velocity.add(thrustVector.multiply(dt / state.rocket.mass))`.\n            *   Burn fuel: `state.rocket.fuel -= state.rocket.fuelBurnRate * dt`. Clamp `state.rocket.fuel` to be >= 0.\n            *   Add exhaust particles (see **Particle System**).\n    *   **Rotational Thrusters (Left/Right Torque)**:\n        *   If `input.keys['ArrowLeft']` or `input.keys['a']` is `true`:\n            *   Apply counter-clockwise torque: `state.rocket.angularVelocity -= state.rocket.rotationTorqueMagnitude * dt / state.rocket.mass` (mass affects angular inertia).\n        *   If `input.keys['ArrowRight']` or `input.keys['d']` is `true`:\n            *   Apply clockwise torque: `state.rocket.angularVelocity += state.rocket.rotationTorqueMagnitude * dt / state.rocket.mass`.\n\n5.  **Physics Integration**:\n    *   **Linear Motion**:\n        *   `state.rocket.position = state.rocket.position.add(state.rocket.velocity.multiply(dt))`.\n    *   **Rotational Motion**:\n        *   `state.rocket.orientation += state.rocket.angularVelocity * dt`.\n        *   Normalize `state.rocket.orientation` to be within `[-PI, PI]` or similar for consistent calculations.\n    *   **Air Resistance/Drag (Optional but recommended for realism)**:\n        *   Calculate drag force opposite to `state.rocket.velocity`. A simple model: `dragForce = state.rocket.velocity.normalize().multiply(-dragCoefficient * velocityMagnitudeSquared)`.\n        *   Apply drag: `state.rocket.velocity = state.rocket.velocity.add(dragForce.multiply(dt / state.rocket.mass))`.\n\n6.  **Collision Detection (Landing)**:\n    *   Check if the rocket is intersecting with the `state.barge`.\n    *   A simple AABB (Axis-Aligned Bounding Box) or circle-rectangle intersection test can be used. For simplicity, consider the rocket's center and a bounding radius.\n    *   If `state.rocket.position` is within barge bounds AND `state.rocket.velocity.y <= state.rocket.touchdownVelocityThreshold` AND `abs(state.rocket.orientation) < PI/4` (roughly vertical):\n        *   `state.rocket.isLanded = true`.\n        *   `state.rocket.velocity = new Vector(0, 0)`.\n        *   `state.rocket.angularVelocity = 0`.\n        *   Calculate score: For example, `state.rocket.score = (1 - abs(state.rocket.orientation) / (PI/4)) * (1 - state.rocket.velocity.y / state.rocket.touchdownVelocityThreshold) * 1000`.\n        *   `state.ui.landingMessage = \"SUCCESS! Score: \" + state.rocket.score.toFixed(0)`.\n    *   If `state.rocket.isLanded` is `false` AND `state.rocket.position.y >= h - 50` (hit the ground/water):\n        *   `state.rocket.isLanded = true`.\n        *   `state.ui.landingMessage = \"CRASHED!\"`.\n\n7.  **Particle System (Exhaust)**:\n    *   If the main thruster is active:\n        *   Generate new particles at the rocket's base, with velocity influenced by the thruster's direction.\n        *   Each particle should have: `position`, `velocity`, `lifespan`, `size`, `color`.\n    *   For each particle in `state.exhaustParticles`:\n        *   Update particle position: `particle.position = particle.position.add(particle.velocity.multiply(dt))`.\n        *   Decrease lifespan: `particle.lifespan -= dt`.\n        *   Update particle size/alpha for fading: e.g., `particle.size *= (1 - dt / particle.initialLifespan)`.\n    *   Remove particles where `lifespan <= 0`.\n\n8.  **UI Updates**:\n    *   Update `state.ui.fuelBarWidth` based on `state.rocket.fuel / state.rocket.maxFuel`.\n    *   Update text displays for velocity and tilt.\n\n### Particle Generation Logic (When Thruster is Active)\n\n*   **Position**: `rocket.position.add(new Vector(0, rocket.radius).rotate(rocket.orientation))`.\n*   **Velocity**: `rocket.velocity.add(new Vector(0, -thrustMagnitude * 0.5).rotate(rocket.orientation).add(randomJitterVector()))`. (Smaller thrust for particle generation, with jitter).\n*   **Lifespan**: Randomize between `0.5` and `1.5` seconds.\n*   **Size**: Randomize between `2` and `5`.\n*   **Color**: A gradient from orange to red, or a consistent white/grey.\n\n### Wind Procedural Generation (Example)\n\n*   Periodically (e.g., every 5 seconds), introduce a small, random change to `state.rocket.windVelocity.x`.\n*   The wind can also gradually increase or decrease in intensity.\n\n## 3. VISUAL IMPLEMENTATION\n\n### Drawing the Scene (`draw(state, ctx, w, h)`)\n\n1.  **Background**:\n    *   `ctx.fillStyle = COLORS.BG;`\n    *   `ctx.fillRect(0, 0, w, h);`\n\n2.  **Landing Barge**:\n    *   `ctx.fillStyle = COLORS.PLAYER;` // Or a dedicated barge color.\n    *   `ctx.fillRect(state.barge.position.x - state.barge.width / 2, state.barge.position.y - state.barge.height / 2, state.barge.width, state.barge.height);`\n\n3.  **Rocket Body**:\n    *   Translate the canvas origin to the rocket's position:\n        *   `ctx.save();`\n        *   `ctx.translate(state.rocket.position.x, state.rocket.position.y);`\n        *   Rotate the canvas: `ctx.rotate(state.rocket.orientation);`\n    *   Draw the rocket body as a simple geometric shape (e.g., a cone on top of a cylinder, or just a stylized triangle).\n        *   Example: A basic cone shape.\n        *   `ctx.fillStyle = COLORS.PLAYER;`\n        *   `ctx.beginPath();`\n        *   `ctx.moveTo(0, -20);` // Tip of the rocket\n        *   `ctx.lineTo(10, 20);`  // Bottom right\n        *   `ctx.lineTo(-10, 20);` // Bottom left\n        *   `ctx.closePath();`\n        *   `ctx.fill();`\n    *   Restore the canvas origin: `ctx.restore();`\n\n4.  **Exhaust Particles**:\n    *   Iterate through `state.exhaustParticles`:\n        *   For each particle:\n            *   `ctx.save();`\n            *   `ctx.translate(particle.position.x, particle.position.y);`\n            *   `ctx.fillStyle = particle.color;` // Potentially with alpha fading\n            *   `ctx.beginPath();`\n         
   *   `ctx.arc(0, 0, particle.size, 0, Math.PI * 2);`\n            *   `ctx.fill();`\n            *   `ctx.restore();`\n\n5.  **UI Elements**:\n    *   **Fuel Bar**:\n        *   `ctx.fillStyle = COLORS.TEXT;`\n        *   `ctx.fillRect(20, 20, state.ui.fuelBarMaxWidth, 20);` // Background of bar\n        *   `ctx.fillStyle = state.ui.fuelBarColor;`\n        *   `ctx.fillRect(20, 20, state.ui.fuelBarWidth, 20);`\n        *   `ctx.strokeStyle = COLORS.TEXT;`\n        *   `ctx.strokeRect(20, 20, state.ui.fuelBarMaxWidth, 20);`\n        *   `ctx.fillStyle = COLORS.TEXT;`\n        *   `ctx.fillText(\"FUEL\", 25, 35);`\n    *   **Velocity Display**:\n        *   `ctx.fillStyle = state.ui.velocityTextColor;`\n        *   `ctx.fillText(\"VEL: \" + state.rocket.velocity.magnitude().toFixed(1) + \" m/s\", 20, 60);`\n    *   **Tilt Display**:\n        *   `ctx.fillStyle = state.ui.tiltTextColor;`\n        *   `ctx.fillText(\"TILT: \" + (state.rocket.orientation * 180 / Math.PI).toFixed(1) + \"°\", 20, 80);`\n    *   **Landing Message**:\n        *   If `state.ui.landingMessage`:\n            *   `ctx.fillStyle = COLORS.TEXT;`\n            *   `ctx.font = \"30px Arial\";`\n            *   `ctx.textAlign = \"center\";`\n            *   `ctx.fillText(state.ui.landingMessage, w / 2, h / 2);`\n            *   `ctx.textAlign = \"left\";` // Reset alignment\n\n### Color Palette (`COLORS`)\n\n```javascript\nconst COLORS = {\n    BG: '#000000', // Black background\n    PLAYER: '#CCCCCC', // Light grey for rocket\n    ENEMY: '#FF0000', // Red (not used in this concept, but good to have)\n    ACCENT: '#00FFFF', // Cyan for UI elements/thrust\n    TEXT: '#FFFFFF' // White for UI text\n};\n```\n\n### Helper Functions (within the single file)\n\n*   `Vector.prototype.multiply(scalar)`: Returns a new Vector scaled by `scalar`.\n*   `Vector.prototype.normalize()`: Returns a new unit Vector in the same direction.\n*   `Vector.prototype.magnitude()`: Returns the length of the Vector.\n*   `Vector.prototype.rotate(angle)`: Returns a new Vector rotated by `angle` (in radians) around the origin.\n*   `Vector.prototype.clone()`: Returns a deep copy of the Vector.\n*   `randomJitterVector()`: Returns a small random Vector for particle effects.\n            "
  }
]
[AI-CLIENT] <<< END REQUEST MESSAGES <<<

[AI-CLIENT] >>> RAW RESPONSE >>>
TITLE: Rocket Descent
DESCRIPTION: Physics-based rocket landing simulation with fuel management and realistic controls.
CODE:
```javascript
// Helper functions
const multiplyVector = (v, scalar) => new Vector(v.x * scalar, v.y * scalar);
const normalizeVector = (v) => {
    const mag = Math.sqrt(v.x * v.x + v.y * v.y);
    if (mag === 0) return new Vector(0, 0);
    return new Vector(v.x / mag, v.y / mag);
};
const magnitude = (v) => Math.sqrt(v.x * v.x + v.y * v.y);
const rotateVector = (v, angle) => new Vector(
    v.x * Math.cos(angle) - v.y * Math.sin(angle),
    v.x * Math.sin(angle) + v.y * Math.cos(angle)
);
const cloneVector = (v) => new Vector(v.x, v.y);
const randomJitter = () => new Vector((Math.random() - 0.5) * 10, Math.random() * 5);

// Initialize game state
const init = (state, w, h) => {
    // Rocket state
    state.rocket = {
        position: new Vector(w / 2, 50),
        orientation: 0,
        fuel: 1.0,
        velocity: new Vector(0, 0),
        angularVelocity: 0,
        mass: 1000,
        fuelBurnRate: 0.3,
        maxFuel: 1.0,
        thrustMagnitude: 2000,
        rotationTorqueMagnitude: 500,
        gravity: new Vector(0, 9.81 * 200),
        windVelocity: new Vector(0, 0),
        isLanded: false,
        touchdownVelocityThreshold: 50,
        score: 0
    };

    // Barge
    state.barge = {
        position: new Vector(w / 2, h - 50),
        width: 100,
        height: 20
    };

    // UI
    state.ui = {
        fuelBarWidth: 100,
        fuelBarMaxWidth: 100,
        fuelBarColor: COLORS.ACCENT,
        velocityTextColor: COLORS.TEXT,
        tiltTextColor: COLORS.TEXT,
        landingMessage: ""
    };

    // Particles
    state.exhaustParticles = [];

    // Wind timer for procedural generation
    state.windTimer = 0;
};

// Update game logic
const update = (state, input, dt, w, h) => {
    const rocket = state.rocket;
    const barge = state.barge;

    // Skip physics if landed
    if (rocket.isLanded) {
        return;
    }

    // Apply gravity
    rocket.velocity.add(multiplyVector(rocket.gravity, dt));

    // Apply wind
    rocket.velocity.add(multiplyVector(rocket.windVelocity, dt));

    // Procedural wind generation
    state.windTimer += dt;
    if (state.windTimer > 5) {
        state.windTimer = 0;
        rocket.windVelocity.x += (Math.random() - 0.5) * 20;
        // Clamp wind velocity
        rocket.windVelocity.x = Math.max(-50, Math.min(50, rocket.windVelocity.x));
    }

    // Input handling
    let thrusterActive = false;

    // Main thruster (up/w)
    if ((input.keys.ArrowUp || input.keys.w) && rocket.fuel > 0) {
        thrusterActive = true;
        const thrustVector = multiplyVector(new Vector(0, -rocket.thrustMagnitude), dt / rocket.mass);
        const rotatedThrust = rotateVector(thrustVector, rocket.orientation);
        rocket.velocity.add(rotatedThrust);

        // Burn fuel
        rocket.fuel -= rocket.fuelBurnRate * dt;
        rocket.fuel = Math.max(0, rocket.fuel);

        // Generate exhaust particles
        const exhaustPos = cloneVector(rocket.position);
        const baseOffset = new Vector(0, 15);
        const rotatedOffset = rotateVector(baseOffset, rocket.orientation);
        exhaustPos.add(rotatedOffset);

        for (let i = 0; i < 3; i++) {
            const particleVelocity = cloneVector(rocket.velocity);
            const thrustPart = rotateVector(new Vector(0, -rocket.thrustMagnitude * 0.3), rocket.orientation);
            particleVelocity.add(thrustPart);
            particleVelocity.add(randomJitter());

            state.exhaustParticles.push({
                position: cloneVector(exhaustPos),
                velocity: particleVelocity,
                lifespan: 0.5 + Math.random(),
                initialLifespan: 0.5 + Math.random(),
                size: 2 + Math.random() * 3,
                color: `rgba(255, ${100 + Math.random() * 155}, 0, 0.8)`
            });
        }
    }

    // Rotation controls (left/a, right/d)
    if (input.keys.ArrowLeft || input.keys.a) {
        rocket.angularVelocity -= rocket.rotationTorqueMagnitude * dt / rocket.mass;
    }
    if (input.keys.ArrowRight || input.keys.d) {
        rocket.angularVelocity += rocket.rotationTorqueMagnitude * dt / rocket.mass;
    }

    // Physics integration
    rocket.position.add(multiplyVector(rocket.velocity, dt));
    rocket.orientation += rocket.angularVelocity * dt;

    // Normalize orientation to [-PI, PI]
    while (rocket.orientation > Math.PI) rocket.orientation -= 2 * Math.PI;
    while (rocket.orientation < -Math.PI) rocket.orientation += 2 * Math.PI;

    // Simple air drag
    const dragCoefficient = 0.01;
    const speed = magnitude(rocket.velocity);
    if (speed > 0) {
        const dragForce = multiplyVector(normalizeVector(rocket.velocity), -dragCoefficient * speed * speed);
        rocket.velocity.add(multiplyVector(dragForce, dt / rocket.mass));
    }

    // Update particles
    for (let i = state.exhaustParticles.length - 1; i >= 0; i--) {
        const p = state.exhaustParticles[i];
        p.position.add(multiplyVector(p.velocity, dt));
        p.lifespan -= dt;
        p.size *= (1 - dt / p.initialLifespan);

        if (p.lifespan <= 0) {
            state.exhaustParticles.splice(i, 1);
        }
    }

    // Collision/Landing detection
    const rocketRadius = 10;
    const bargeLeft = barge.position.x - barge.width / 2;
    const bargeRight = barge.position.x + barge.width / 2;
    const bargeTop = barge.position.y - barge.height / 2;
    const bargeBottom = barge.position.y + barge.height / 2;

    const rocketBottom = rocket.position.y + rocketRadius;
    const verticalAlign = Math.abs(rocket.orientation) < Math.PI / 6; // 30 degrees
    const safeVelocity = rocket.velocity.y < rocket.touchdownVelocityThreshold;

    if (rocket.position.x >= bargeLeft && rocket.position.x <= bargeRight &&
        rocketBottom >= bargeTop && rocket.position.y <= bargeBottom) {

        if (verticalAlign && safeVelocity && !rocket.isLanded) {
            rocket.isLanded = true;
            rocket.velocity = new Vector(0, 0);
            rocket.angularVelocity = 0;

            const orientationScore = (1 - Math.abs(rocket.orientation) / (Math.PI / 6));
            const velocityScore = (1 - rocket.velocity.y / rocket.touchdownVelocityThreshold);
            rocket.score = Math.floor(orientationScore * velocityScore * 1000 + rocket.fuel * 500);
            state.ui.landingMessage = `SUCCESS! Score: ${rocket.score}`;
        } else if (!rocket.isLanded) {
            rocket.isLanded = true;
            state.ui.landingMessage = "CRASHED!";
        }
    }

    // Boundary check (out of bounds = crash)
    if (rocket.position.y > h + 50 && !rocket.isLanded) {
        rocket.isLanded = true;
        state.ui.landingMessage = "CRASHED!";
    }

    // UI updates
    state.ui.fuelBarWidth = (rocket.fuel / rocket.maxFuel) * state.ui.fuelBarMaxWidth;
};

// Render frame
const draw = (state, ctx, w, h) => {
    // Background
    ctx.fillStyle = COLORS.BG;
    ctx.fillRect(0, 0, w, h);

    // Draw barge
    ctx.fillStyle = '#333333';
    ctx.fillRect(
        state.barge.position.x - state.barge.width / 2,
        state.barge.position.y - state.barge.height / 2,
        state.barge.width,
        state.barge.height
    );

    // Draw ocean surface
    ctx.fillStyle = '#006994';
    ctx.fillRect(0, h - 30, w, 30);

    // Draw exhaust particles
    for (const p of state.exhaustParticles) {
        ctx.save();
        ctx.translate(p.position.x, p.position.y);
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(0, 0, p.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }

    // Draw rocket
    ctx.save();
    ctx.translate(state.rocket.position.x, state.rocket.position.y);
    ctx.rotate(state.rocket.orientation);

    // Rocket body
    ctx.fillStyle = COLORS.PLAYER;
    ctx.beginPath();
    ctx.moveTo(0, -15);
    ctx.lineTo(8, 15);
    ctx.lineTo(-8, 15);
    ctx.closePath();
    ctx.fill();

    // Rocket details
    ctx.strokeStyle = '#666666';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, -15);
    ctx.lineTo(0, 15);
    ctx.stroke();

    ctx.restore();

    // UI Elements
    ctx.font = '16px monospace';

    // Fuel bar
    ctx.fillStyle = COLORS.TEXT;
    ctx.fillRect(20, 20, state.ui.fuelBarMaxWidth, 20);
    ctx.fillStyle = state.ui.fuelBarColor;
    ctx.fillRect(20, 20, state.ui.fuelBarWidth, 20);
    ctx.strokeStyle = COLORS.TEXT;
    ctx.lineWidth = 2;
    ctx.strokeRect(20, 20, state.ui.fuelBarMaxWidth, 20);

    ctx.fillStyle = COLORS.TEXT;
    ctx.fillText('FUEL', 25, 35);

    // Velocity display
    const speed = magnitude(state.rocket.velocity);
    ctx.fillStyle = state.ui.velocityTextColor;
    ctx.fillText(`VEL: ${speed.toFixed(1)} m/s`, 20, 70);

    // Tilt display
    const tiltDeg = (state.rocket.orientation * 180 / Math.PI).toFixed(1);
    ctx.fillStyle = state.ui.tiltTextColor;
    ctx.fillText(`TILT: ${tiltDeg}°`, 20, 95);

    // Wind indicator
    ctx.fillText(`WIND: ${state.rocket.windVelocity.x.toFixed(1)} m/s`, 20, 120);

    // Landing message
    if (state.ui.landingMessage) {
        ctx.font = 'bold 24px monospace';
        ctx.fillStyle = COLORS.TEXT;
        ctx.textAlign = 'center';
        ctx.fillText(state.ui.landingMessage, w / 2, h / 2);
        ctx.textAlign = 'left';
    }

    // Instructions
    ctx.font = '12px monospace';
    ctx.fillStyle = '#666666';
    ctx.fillText('CONTROLS: W/↑ = Thrust, A/D = Rotate', 20, h - 40);
    ctx.fillText('GOAL: Land vertically on barge with low speed', 20, h - 20);
};

return { init, update, draw };
```
[AI-CLIENT] <<< END RAW RESPONSE <<<
[AI-CLIENT] [REASONING] Available (length: 4073 chars)
[ENGINEER] AI response received in 115793 ms
[ENGINEER] Parsing game definition...
[ENGINEER] Game title: Rocket Descent
[ENGINEER] Code success. Length: 9706
[ENGINEER] ========== Code Generation Complete ==========
[API/CREATE] Generated: Rocket Descent
[API/CREATE] ========== Generation Complete ==========
[API/FIX] ========== Fix Request ==========
[API/FIX] Game: Rocket Descent
[API/FIX] Error: Vector is not defined
[FIXER] ========== Bug Fix Started ==========
[FIXER] Game: Rocket Descent
[FIXER] Error: Vector is not defined
[FIXER] Using dynamic system prompt (v5)
[FIXER] Calling AI for bug fix...
[AI-CLIENT] Calling Main AI...
[AI-CLIENT] >>> REQUEST MESSAGES >>>
[
  {
    "role": "system",
    "content": "You are an expert game debugger. You MUST output your response using the labels TITLE:, DESCRIPTION:, and CODE: followed by a javascript block. NO other text."
  },
  {
    "role": "user",
    "content": "You are an Expert Game Debugger. You must fix the code to run strictly within our custom Sandbox Environment.\n\n=== CRITICAL: Preserve Original Design ===\nYou MUST keep the original TITLE and DESCRIPTION exactly as provided.\nONLY fix the CODE section. DO NOT change the game title or description.\n\n=== SANDBOX PROTOCOL (v6 STRICT) ===\n1. **Signatures**: MUST match EXACTLY:\n   - init(state, w, h)\n   - update(state, input, dt, w, h)\n   - draw(state, ctx, w, h)\n2. **Context Attributes**: 'ctx' has NO 'w' or 'h' attributes. Use the 'w' and 'h' arguments passed to the functions.\n3. **NO \"export\" keywords**: The environment uses 'new Function()'. 'export' will cause a crash.\n4. **Mandatory Return**: The code MUST end with: return { init, update, draw };\n5. **Time Unit**: 'dt' is in SECONDS. Ensure cooldowns match (e.g., 1.0 for 1s).\n\n=== RECOVERY STRATEGY ===\n- Error \"ctx.save is not a function\": Likely 'ctx' argument position is wrong. CHECK: draw(state, ctx, w, h).\n- Error \"Cannot read property 'w' of undefined\": You are likely using ctx.w or ctx.h. Use the arguments w and h.\n- Missing HUD/UI: Ensure you aren't using ctx.w or ctx.h to position elements.\n\n=== OUTPUT FORMAT ===\nTITLE: [KEEP ORIGINAL]\nDESCRIPTION: [KEEP ORIGINAL]\nCODE:\n```javascript\n// Fixed code...\nreturn { init, update, draw };\n```\n\n=== Context ===\nRuntime Error: \"Vector is not defined\"\n\nCurrent Code:\n// Helper functions\nconst multiplyVector = (v, scalar) => new Vector(v.x * scalar, v.y * scalar);\nconst normalizeVector = (v) => {\n    const mag = Math.sqrt(v.x * v.x + v.y * v.y);\n    if (mag === 0) return new Vector(0, 0);\n    return new Vector(v.x / mag, v.y / mag);\n};\nconst magnitude = (v) => Math.sqrt(v.x * v.x + v.y * v.y);\nconst rotateVector = (v, angle) => new Vector(\n    v.x * Math.cos(angle) - v.y * Math.sin(angle),\n    v.x * Math.sin(angle) + v.y * Math.cos(angle)\n);\nconst cloneVector = (v) => new Vector(v.x, v.y);\nconst randomJitter = () => new Vector((Math.random() - 0.5) * 10, Math.random() * 5);\n\n// Initialize game state\nconst init = (state, w, h) => {\n    // Rocket state\n    state.rocket = {\n        position: new Vector(w / 2, 50),\n        orientation: 0,\n        fuel: 1.0,\n        velocity: new Vector(0, 0),\n        angularVelocity: 0,\n        mass: 1000,\n        fuelBurnRate: 0.3,\n        maxFuel: 1.0,\n        thrustMagnitude: 2000,\n        rotationTorqueMagnitude: 500,\n        gravity: new Vector(0, 9.81 * 200),\n        windVelocity: new Vector(0, 0),\n        isLanded: false,\n        touchdownVelocityThreshold: 50,\n        score: 0\n    };\n\n    // Barge\n    state.barge = {\n        position: new Vector(w / 2, h - 50),\n        width: 100,\n        height: 20\n    };\n\n    // UI\n    state.ui = {\n        fuelBarWidth: 100,\n        fuelBarMaxWidth: 100,\n        fuelBarColor: COLORS.ACCENT,\n        velocityTextColor: COLORS.TEXT,\n        tiltTextColor: COLORS.TEXT,\n        landingMessage: \"\"\n    };\n\n    // Particles\n    state.exhaustParticles = [];\n    \n    // Wind timer for procedural generation\n    state.windTimer = 0;\n};\n\n// Update game logic\nconst update = (state, input, dt, w, h) => {\n    const rocket = state.rocket;\n    const barge = state.barge;\n    \n    // Skip physics if landed\n    if (rocket.isLanded) {\n        return;\n    }\n\n    // Apply gravity\n    rocket.velocity.add(multiplyVector(rocket.gravity, dt));\n\n    // Apply wind\n    rocket.velocity.add(multiplyVector(rocket.windVelocity, dt));\n\n    // Procedural wind generation\n    state.windTimer += dt;\n    if (state.windTimer > 5) {\n        state.windTimer = 0;\n        rocket.windVelocity.x += (Math.random() - 0.5) * 20;\n        // Clamp wind velocity\n        rocket.windVelocity.x = Math.max(-50, Math.min(50, rocket.windVelocity.x));\n    }\n\n    // Input handling\n    let thrusterActive = false;\n    \n    // Main thruster (up/w)\n    if ((input.keys.ArrowUp || input.keys.w) && rocket.fuel > 0) {\n        thrusterActive = true;\n        const thrustVector = multiplyVector(new Vector(0, -rocket.thrustMagnitude), dt / rocket.mass);\n        const rotatedThrust = rotateVector(thrustVector, rocket.orientation);\n        rocket.velocity.add(rotatedThrust);\n        \n        // Burn fuel\n        rocket.fuel -= rocket.fuelBurnRate * dt;\n        rocket.fuel = Math.max(0, rocket.fuel);\n        \n        // Generate exhaust particles\n        const exhaustPos = cloneVector(rocket.position);\n        const baseOffset = new Vector(0, 15);\n        const rotatedOffset = rotateVector(baseOffset, rocket.orientation);\n        exhaustPos.add(rotatedOffset);\n        \n        for (let i = 0; i < 3; i++) {\n            const particleVelocity = cloneVector(rocket.velocity);\n            const thrustPart = rotateVector(new Vector(0, -rocket.thrustMagnitude * 0.3), rocket.orientation);\n            particleVelocity.add(thrustPart);\n            particleVelocity.add(randomJitter());\n            \n            state.exhaustParticles.push({\n                position: cloneVector(exhaustPos),\n                velocity: particleVelocity,\n                lifespan: 0.5 + Math.random(),\n                initialLifespan: 0.5 + Math.random(),\n                size: 2 + Math.random() * 3,\n                color: `rgba(255, ${100 + Math.random() * 155}, 0, 0.8)`\n            });\n        }\n    }\n\n    // Rotation controls (left/a, right/d)\n    if (input.keys.ArrowLeft || input.keys.a) {\n        rocket.angularVelocity -= rocket.rotationTorqueMagnitude * dt / rocket.mass;\n    }\n    if (input.keys.ArrowRight || input.keys.d) {\n        rocket.angularVelocity += rocket.rotationTorqueMagnitude * dt / rocket.mass;\n    }\n\n    // Physics integration\n    rocket.position.add(multiplyVector(rocket.velocity, dt));\n    rocket.orientation += rocket.angularVelocity * dt;\n    \n    // Normalize orientation to [-PI, PI]\n    while (rocket.orientation > Math.PI) rocket.orientation -= 2 * Math.PI;\n    while (rocket.orientation < -Math.PI) rocket.orientation += 2 * Math.PI;\n\n    // Simple air drag\n    const dragCoefficient = 0.01;\n    const speed = magnitude(rocket.velocity);\n    if (speed > 0) {\n        const dragForce = multiplyVector(normalizeVector(rocket.velocity), -dragCoefficient * speed * speed);\n        rocket.velocity.add(multiplyVector(dragForce, dt / rocket.mass));\n    }\n\n    // Update particles\n    for (let i = state.exhaustParticles.length - 1; i >= 0; i--) {\n        const p = state.exhaustParticles[i];\n        p.position.add(multiplyVector(p.velocity, dt));\n        p.lifespan -= dt;\n        p.size *= (1 - dt / p.initialLifespan);\n        \n        if (p.lifespan <= 0) {\n            state.exhaustParticles.splice(i, 1);\n        }\n    }\n\n    // Collision/Landing detection\n    const rocketRadius = 10;\n    const bargeLeft = barge.position.x - barge.width / 2;\n    const bargeRight = barge.position.x + barge.width / 2;\n    const bargeTop = barge.position.y - barge.height / 2;\n    const bargeBottom = barge.position.y + barge.height / 2;\n    \n    const rocketBottom = rocket.position.y + rocketRadius;\n    const verticalAlign = Math.abs(rocket.orientation) < Math.PI / 6; // 30 degrees\n    const safeVelocity = rocket.velocity.y < rocket.touchdownVelocityThreshold;\n    \n    if (rocket.position.x >= bargeLeft && rocket.position.x <= bargeRight &&\n        rocketBottom >= bargeTop && rocket.position.y <= bargeBottom) {\n        \n        if (verticalAlign && safeVelocity && !rocket.isLanded) {\n            rocket.isLanded = true;\n            rocket.velocity = new Vector(0, 0);\n            rocket.angularVelocity = 0;\n            \n            const orientationScore = (1 - Math.abs(rocket.orientation) / (Math.PI / 6));\n            const velocityScore = (1 - rocket.velocity.y / rocket.touchdownVelocityThreshold);\n            rocket.score = Math.floor(orientationScore * velocityScore * 1000 + rocket.fuel * 500);\n            state.ui.landingMessage = `SUCCESS! Score: ${rocket.score}`;\n        } else if (!rocket.isLanded) {\n            rocket.isLanded = true;\n            
state.ui.landingMessage = \"CRASHED!\";\n        }\n    }\n    \n    // Boundary check (out of bounds = crash)\n    if (rocket.position.y > h + 50 && !rocket.isLanded) {\n        rocket.isLanded = true;\n        state.ui.landingMessage = \"CRASHED!\";\n    }\n\n    // UI updates\n    state.ui.fuelBarWidth = (rocket.fuel / rocket.maxFuel) * state.ui.fuelBarMaxWidth;\n};\n\n// Render frame\nconst draw = (state, ctx, w, h) => {\n    // Background\n    ctx.fillStyle = COLORS.BG;\n    ctx.fillRect(0, 0, w, h);\n\n    // Draw barge\n    ctx.fillStyle = '#333333';\n    ctx.fillRect(\n        state.barge.position.x - state.barge.width / 2,\n        state.barge.position.y - state.barge.height / 2,\n        state.barge.width,\n        state.barge.height\n    );\n    \n    // Draw ocean surface\n    ctx.fillStyle = '#006994';\n    ctx.fillRect(0, h - 30, w, 30);\n\n    // Draw exhaust particles\n    for (const p of state.exhaustParticles) {\n        ctx.save();\n        ctx.translate(p.position.x, p.position.y);\n        ctx.fillStyle = p.color;\n        ctx.beginPath();\n        ctx.arc(0, 0, p.size, 0, Math.PI * 2);\n        ctx.fill();\n        ctx.restore();\n    }\n\n    // Draw rocket\n    ctx.save();\n    ctx.translate(state.rocket.position.x, state.rocket.position.y);\n    ctx.rotate(state.rocket.orientation);\n    \n    // Rocket body\n    ctx.fillStyle = COLORS.PLAYER;\n    ctx.beginPath();\n    ctx.moveTo(0, -15);\n    ctx.lineTo(8, 15);\n    ctx.lineTo(-8, 15);\n    ctx.closePath();\n    ctx.fill();\n    \n    // Rocket details\n    ctx.strokeStyle = '#666666';\n    ctx.lineWidth = 2;\n    ctx.beginPath();\n    ctx.moveTo(0, -15);\n    ctx.lineTo(0, 15);\n    ctx.stroke();\n    \n    ctx.restore();\n\n    // UI Elements\n    ctx.font = '16px monospace';\n    \n    // Fuel bar\n    ctx.fillStyle = COLORS.TEXT;\n    ctx.fillRect(20, 20, state.ui.fuelBarMaxWidth, 20);\n    ctx.fillStyle = state.ui.fuelBarColor;\n    ctx.fillRect(20, 20, state.ui.fuelBarWidth, 20);\n    ctx.strokeStyle = COLORS.TEXT;\n    ctx.lineWidth = 2;\n    ctx.strokeRect(20, 20, state.ui.fuelBarMaxWidth, 20);\n    \n    ctx.fillStyle = COLORS.TEXT;\n    ctx.fillText('FUEL', 25, 35);\n    \n    // Velocity display\n    const speed = magnitude(state.rocket.velocity);\n    ctx.fillStyle = state.ui.velocityTextColor;\n    ctx.fillText(`VEL: ${speed.toFixed(1)} m/s`, 20, 70);\n    \n    // Tilt display\n    const tiltDeg = (state.rocket.orientation * 180 / Math.PI).toFixed(1);\n    ctx.fillStyle = state.ui.tiltTextColor;\n    ctx.fillText(`TILT: ${tiltDeg}°`, 20, 95);\n    \n    // Wind indicator\n    ctx.fillText(`WIND: ${state.rocket.windVelocity.x.toFixed(1)} m/s`, 20, 120);\n    \n    // Landing message\n    if (state.ui.landingMessage) {\n        ctx.font = 'bold 24px monospace';\n        ctx.fillStyle = COLORS.TEXT;\n        ctx.textAlign = 'center';\n        ctx.fillText(state.ui.landingMessage, w / 2, h / 2);\n        ctx.textAlign = 'left';\n    }\n    \n    // Instructions\n    ctx.font = '12px monospace';\n    ctx.fillStyle = '#666666';\n    ctx.fillText('CONTROLS: W/↑ = Thrust, A/D = Rotate', 20, h - 40);\n    ctx.fillText('GOAL: Land vertically on barge with low speed', 20, h - 20);\n};\n\nreturn { init, update, draw };"
  }
]
[AI-CLIENT] <<< END REQUEST MESSAGES <<<