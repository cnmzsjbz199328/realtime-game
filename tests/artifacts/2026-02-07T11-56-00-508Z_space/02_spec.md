# TECHNICAL IMPLEMENTATION SPEC: Neon Invader Defense

## 1. STATE SCHEMA

```javascript
// GameState
let GameState = {
  score: 0,
  lives: 3,
  level: 1,
  wave: 0, // Current enemy wave progression
  waveState: 'descending', // 'descending', 'shifting', 'diving', 'retreating'
  waveDirection: 'right', // 'left' or 'right' for grid movement
  waveAdvanceTimer: 0, // Timer for wave state transitions and speed increases
  waveSpeedMultiplier: 1.0,
  player: {
    x: 0,
    y: 0,
    width: 20,
    height: 20,
    color: COLORS.PLAYER,
    cooldown: 0,
  },
  projectiles: [], // [{ x, y, radius, color, velocity }]
  enemies: [], // [{ x, y, width, height, type, color, health, isHitAnimation, hitTimer }]
  barriers: [ // 4 barriers
    { x: 0, y: 0, width: 0, height: 0, health: 3, color: COLORS.ACCENT },
    { x: 0, y: 0, width: 0, height: 0, health: 3, color: COLORS.ACCENT },
    { x: 0, y: 0, width: 0, height: 0, health: 3, color: COLORS.ACCENT },
    { x: 0, y: 0, width: 0, height: 0, health: 3, color: COLORS.ACCENT },
  ],
  mysteryShip: {
    x: 0,
    y: 0,
    width: 30,
    height: 15,
    color: COLORS.ACCENT,
    velocity: 0,
    active: false,
    spawnTimer: 0,
  },
  gameOver: false,
  winCondition: false,
};

// Entities (within GameState)
// projectiles: [{ x, y, radius, color, velocity: Vector }]
// enemies: [{ x, y, width, height, type: 'normal' | 'mystery', color, health, isHitAnimation: boolean, hitTimer: number }]
// barriers: [{ x, y, width, height, health, color }]
// player: { x, y, width, height, color, cooldown: number }
// mysteryShip: { x, y, width, height, color, velocity: number, active: boolean, spawnTimer: number }
```

## 2. CORE LOGIC

### Player Movement and Firing
- Player movement is constrained to horizontal movement at the bottom of the screen.
- **Player Input Handling**:
  - If `input.keys['ArrowLeft']` or `input.keys['a']` or `input.left` is true, move player left by `player.speed * dt`.
  - If `input.keys['ArrowRight']` or `input.keys['d']` or `input.right` is true, move player right by `player.speed * dt`.
  - Player X position is clamped between `player.width / 2` and `w - player.width / 2`.
- **Firing Mechanism**:
  - If `input.keys['Space']` or `input.isDown` (for mouse/touch) is true and `player.cooldown <= 0`:
    - Create a new projectile object:
      - `x`: `player.x`
      - `y`: `player.y - player.height / 2` (tip of the cannon)
      - `radius`: 3
      - `color`: `COLORS.ACCENT`
      - `velocity`: `Vector.fromAngle(-Math.PI / 2)` (straight up)
    - Add the projectile to the `GameState.projectiles` array.
    - Reset `player.cooldown` to a fixed value (e.g., 0.2 seconds).
    - Trigger `sfx.play('shoot')`.
- **Cooldown Update**:
  - If `player.cooldown > 0`, `player.cooldown -= dt`.

### Enemy Grid Management and Movement
- Enemies are arranged in a grid. The `GameState.enemies` array will store all active enemies.
- **Wave Initialization**:
  - `init(state, w, h)` will populate the `state.enemies` array based on `state.level`. Higher levels spawn more enemies in tighter formations.
  - Enemies will have a base `health` and a `type` (e.g., 'normal', 'shooter' - though concept only mentions one type, this allows for future expansion).
  - `state.waveState` initialized to 'descending'.
  - `state.waveDirection` initialized to 'right'.
  - `state.waveSpeedMultiplier` initialized to 1.0.
  - `state.waveAdvanceTimer` initialized to 0.
- **Wave Progression and States**:
  - **'descending'**: Enemies move downwards and horizontally according to `state.waveDirection`.
    - Enemy Y position increases by `baseEnemySpeed * state.waveSpeedMultiplier * dt`.
    - Enemy X position changes based on `state.waveDirection`: `enemy.x += enemyMoveSpeed * state.waveSpeedMultiplier * dt`.
  - **'shifting'**: Enemies move horizontally across the screen.
    - `state.waveAdvanceTimer` controls the duration.
    - When `state.waveAdvanceTimer` reaches a threshold, flip `state.waveDirection`.
    - Enemies update their X position based on the new `state.waveDirection`.
  - **'diving'**: Enemies move diagonally downwards and towards the player.
    - `state.waveAdvanceTimer` controls the duration.
    - Enemies move with a velocity vector pointing towards the player's general vicinity.
  - **'retreating'**: (Optional, for potential end-of-wave behavior or unique mechanics)
- **Speed Increase**:
  - `state.waveAdvanceTimer` accumulates `dt`. Periodically, upon reaching certain thresholds, `state.waveSpeedMultiplier` increases, and `state.waveAdvanceTimer` is reset or adjusted. This also triggers a state change (e.g., from 'descending' to 'shifting').
- **Enemy Hit Detection**:
  - For each `projectile` and `enemy`:
    - Check for collision using bounding boxes or circle-rectangle intersection.
    - If collision:
      - Reduce enemy `health`.
      - If `enemy.health <= 0`:
        - Remove enemy from `GameState.enemies`.
        - Increment `GameState.score` by enemy value.
        - Trigger `sfx.play('explode')`.
      - Else (enemy not dead):
        - Set `enemy.isHitAnimation = true`.
        - Trigger `sfx.play('hit')`.
      - Remove projectile from `GameState.projectiles`.
      - Break inner loop (projectile can only hit one enemy).

### Barrier Logic
- Barriers are static rectangular areas at the bottom of the screen.
- **Initialization**:
  - `init(state, w, h)` will define the `x`, `y`, `width`, and `height` of the four barriers, evenly spaced across the bottom. `health` is set to a fixed value (e.g., 3).
- **Damage and Destruction**:
  - When a projectile hits a barrier:
    - Reduce barrier `health`.
    - If `barrier.health <= 0`:
      - Mark barrier as inactive or remove it from rendering.
    - Remove projectile from `GameState.projectiles`.
    - Trigger `sfx.play('hit')`.
- **Collision with Enemies**:
  - If an enemy reaches a barrier's `y` coordinate and is within its `x` range, it damages the barrier and is destroyed, or vice-versa depending on design. For this spec, we assume enemies pass through barriers if undestroyed and their downward movement continues. The primary function of barriers is player cover.

### Mystery Ship
- **Spawning**:
  - `state.mysteryShip.spawnTimer` accumulates `dt`.
  - When `state.mysteryShip.spawnTimer` exceeds a random interval (e.g., 10-30 seconds):
    - Set `state.mysteryShip.active = true`.
    - Set `state.mysteryShip.x` to either 0 or `w`.
    - Set `state.mysteryShip.y` to a random position near the top of the screen.
    - Set `state.mysteryShip.velocity` to a random speed.
    - Reset `state.mysteryShip.spawnTimer` to 0.
- **Movement**:
  - If `state.mysteryShip.active` is true:
    - Move `state.mysteryShip.x` based on `state.mysteryShip.velocity * dt`.
    - If it goes off-screen, set `state.mysteryShip.active = false`.
- **Player Interaction**:
  - If a player projectile hits the mystery ship:
    - Grant bonus points to `state.score`.
    - Trigger `sfx.play('collect')` (or a custom 'bonus_collect' if available, else 'collect').
    - Set `state.mysteryShip.active = false`.
    - Remove projectile.

### Game State Management
- **Win Condition**:
  - If `state.enemies.length === 0`, set `state.winCondition = true` and `state.gameOver = true`.
- **Lose Condition**:
  - If any enemy's `y` position plus its height exceeds the player's `y` position (i.e., it reaches the player's baseline), decrement `state.lives`.
  - If `state.lives <= 0`, set `state.gameOver = true`.
  - If `state.gameOver` is true, stop updates and display final score/message.
- **Level Progression**:
  - After winning a wave, increment `state.level` and potentially re-initialize enemies with increased difficulty.

## 3. VISUAL IMPLEMENTATION

### Background
- Draw a solid black rectangle for the background: `ctx.fillStyle = COLORS.BG; ctx.fillRect(0, 0, w, h);`
- Parallax Scrolling: Use multiple layers of star fields.
  - Layer 1: Slowest speed, drawn at `starPos1`.
  - Layer 2: Medium speed, drawn at `starPos2`.
  - Layer 3: Fastest speed, drawn at `starPos3`.
  - Each layer is a pattern or a series of dots. When a layer scrolls off-screen, reset its position to draw new stars.
  - Example for one layer of stars:
    - `ctx.fillStyle = COLORS.TEXT;`
    - Loop through star positions and draw `ctx.fillRect(star.x, star.y, 1, 1);`
    - Update `star.y += starSpeed * dt;`
    - If `star.y > h`, reset `star.y = 0;` and potentially `star.x = Math.random() * w;`

### Player Cannon
- Draw a simple neon-colored rectangle: `ctx.fillStyle = state.player.color; ctx.fillRect(state.player.x - state.player.width / 2, state.player.y - state.player.height, state.player.width, state.player.height);`

### Projectiles
- Draw small filled circles:
  - For each projectile:
    - `ctx.fillStyle = projectile.color;`
    - `ctx.beginPath();`
    - `ctx.arc(projectile.x, projectile.y, projectile.radius, 0, Math.PI * 2);`
    - `ctx.fill();`

### Enemies
- Draw rectangles with neon colors.
- **Hit Animation**:
  - If `enemy.isHitAnimation` is true:
    - Flash the enemy color or draw a temporary effect.
    - `enemy.hitTimer -= dt;`
    - If `enemy.hitTimer <= 0`, set `enemy.isHitAnimation = false`.
  - Drawing logic:
    - `ctx.fillStyle = enemy.color;`
    - `ctx.fillRect(enemy.x, enemy.y, enemy.width, enemy.height);`
    - If `enemy.isHitAnimation`:
      - Draw a bright white or contrasting outline for a brief period.

### Barriers
- Draw rectangles representing the barriers.
- **Damaged State**:
  - Use `ctx.lineWidth` and `ctx.strokeStyle` to draw a damaged effect.
  - Example for drawing a barrier with `health` from 3 to 0:
    - For `h` from 0 to `barrier.health - 1`: draw a solid segment of the barrier.
    - `ctx.fillStyle = barrier.color;`
    - `ctx.fillRect(barrier.x, barrier.y + (3 - barrier.health) * (barrier.height / 3), barrier.width, barrier.height / 3);`

### Mystery Ship
- Draw a distinctive shape, e.g., a small wedge or elongated rectangle.
- `ctx.fillStyle = state.mysteryShip.color;`
- `ctx.beginPath();`
- `ctx.moveTo(state.mysteryShip.x, state.mysteryShip.y);`
- `ctx.lineTo(state.mysteryShip.x + state.mysteryShip.width, state.mysteryShip.y - state.mysteryShip.height / 2);`
- `ctx.lineTo(state.mysteryShip.x + state.mysteryShip.width, state.mysteryShip.y + state.mysteryShip.height / 2);`
- `ctx.closePath();`
- `ctx.fill();`

### UI Elements (Score, Lives, Level)
- Draw text using `ctx.fillStyle = COLORS.TEXT; ctx.font = '16px Arial'; ctx.fillText(...)`.
- Display `Score: ${state.score}` at the top-left.
- Display `Lives: ${state.lives}` at the top-right.
- Display `Level: ${state.level}` in the center-top.

## 4. DESIGN CONSTRAINTS (CRITICAL)

- **Math**: All vector operations *must* use `Vector.static_method(v1, v2)`. No instance methods like `v1.add(v2)`. Manual math for normalization, magnitude, etc.
- **Logic**: Pseudo-code will use `Vector.static_method` calls for positional updates. State objects are pure data.
- **State**: Pure data objects. No methods attached to `GameState`, `player`, `enemies`, etc.

## 5. AUDIO & SFX MAPPING

- Player Fires: `sfx.play('shoot')`
- Enemy Dies: `sfx.play('explode')`
- Enemy Hits Player (or player projectile hits enemy): `sfx.play('hit')`
- Player Collects Mystery Ship: `sfx.play('collect')` (or potentially a distinct sound if the engine provided more options, otherwise 'collect' is the closest match for a positive pickup).
- Barrier Hit: `sfx.play('hit')`