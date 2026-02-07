# TECHNICAL IMPLEMENTATION SPEC: Neon Cyber Turret Defense

## 1. STATE SCHEMA

```javascript
// GameState object managed by the engine
// state = {
//   score: number,
//   wave: number,
//   coreHealth: number,
//   gold: number,
//   waveTimer: number, // Time until next wave starts
//   waveState: 'waiting' | 'active' | 'completed', // State of the current wave
//   towers: Tower[],
//   enemies: Enemy[],
//   projectiles: Projectile[],
//   placementGhost: { x: number, y: number, towerType: string | null } | null, // For placing towers
//   ui: { buttonHover: { type: string, hover: boolean }[] } // For UI elements like tower buy buttons
// }

// Tower data structure
// type Tower = {
//   id: string, // Unique identifier
//   type: 'rapidFire' | 'frost' | 'mortar',
//   position: Vector,
//   level: number,
//   fireCooldown: number, // Time remaining until next shot
//   targetEnemyId: string | null, // ID of the enemy it's currently targeting
//   range: number,
//   damage: number,
//   fireRate: number, // Shots per second
//   effect: { type: 'slow' | 'aoe', value: number, duration: number } | null // Special effects
// }

// Enemy data structure
// type Enemy = {
//   id: string, // Unique identifier
//   type: 'basic' | 'fast' | 'armored' | 'elite',
//   position: Vector,
//   pathIndex: number, // Current waypoint index
//   health: number,
//   maxHealth: number,
//   speed: number,
//   isFrozen: boolean, // Flag for frost tower effect
//   frozenTimer: number, // Duration of freeze
//   targetCore: boolean, // If true, is heading towards the core
//   color: string // Visual representation of type
// }

// Projectile data structure
// type Projectile = {
//   id: string, // Unique identifier
//   type: 'bullet' | 'frost' | 'mortarShell',
//   position: Vector,
//   velocity: Vector,
//   damage: number,
//   shooterId: string, // ID of the tower that fired it
//   targetId: string | null, // ID of the enemy it's targeting (for homing/impact)
//   radius: number, // For AoE
//   impactEffect: { type: 'slow' | 'aoe', value: number, duration: number } | null
// }
```

## 2. CORE LOGIC

### Initialization (`init(state, w, h)`)
1.  **`state`**:
    *   `score = 0`
    *   `wave = 1`
    *   `coreHealth = 100` (or appropriate value based on desired difficulty)
    *   `gold = 100` (starting gold)
    *   `waveTimer = 10.0` (seconds until wave 1 starts)
    *   `waveState = 'waiting'`
    *   `towers = []`
    *   `enemies = []`
    *   `projectiles = []`
    *   `placementGhost = null`
    *   `ui = { buttonHover: [ { type: 'rapidFire', hover: false }, { type: 'frost', hover: false }, { type: 'mortar', hover: false } ] }`
2.  **`CONFIG.WAYPOINTS`**: Pre-defined array of `Vector` objects representing the enemy path. The first waypoint is the start, the last is the core.
3.  **`GRID_SIZE`**: Define a global constant for grid snapping.
4.  **Tower Definitions**: Define `TowerConfig` object mapping tower types to stats:
    ```javascript
    const TowerConfig = {
        rapidFire: { cost: 50, upgradeCostMultiplier: 1.5, baseRange: 150, baseDamage: 10, baseFireRate: 5, bulletSpeed: 500, projectileType: 'bullet', effect: null },
        frost: { cost: 75, upgradeCostMultiplier: 1.7, baseRange: 120, baseDamage: 5, baseFireRate: 2, projectileType: 'frost', effect: { type: 'slow', value: 0.5, duration: 2 } }, // 50% slow for 2s
        mortar: { cost: 100, upgradeCostMultiplier: 1.8, baseRange: 180, baseDamage: 25, baseFireRate: 1, projectileType: 'mortarShell', effect: { type: 'aoe', value: 50, duration: 0 } } // AoE radius 50
    };
    ```

### Game Loop (`update(state, input, dt, w, h)`)

1.  **Timers & Wave Management**:
    *   If `state.waveState === 'waiting'`:
        *   `state.waveTimer -= dt`
        *   If `state.waveTimer <= 0`:
            *   `state.waveState = 'active'`
            *   Generate enemies for `state.wave` (based on a wave configuration function).
            *   `state.waveTimer = 0`
    *   If `state.waveState === 'active'`:
        *   Check if all enemies are dead and no more are spawning for the current wave. If so:
            *   `state.waveState = 'completed'`
            *   `state.wave += 1`
            *   `state.waveTimer = 15.0` (time before next wave)
            *   Grant gold for remaining enemies or wave completion bonus.
            *   Increase global difficulty parameters for next wave (enemy stats, spawn rate).

2.  **Input Handling**:
    *   **Tower Placement**:
        *   Update `state.placementGhost` position based on `input.x`, `input.y` and `GRID_SIZE`. Snap to grid.
        *   If `input.isDown` and `input.x`, `input.y` are within valid placement bounds (not on path, etc.):
            *   Check if a tower button is hovered. If so, set `state.placementGhost.towerType` to the hovered tower type.
            *   If `state.placementGhost.towerType` is not null and player has enough `gold`:
                *   Calculate grid position: `gridX = Math.floor(input.x / GRID_SIZE) * GRID_SIZE`, `gridY = Math.floor(input.y / GRID_SIZE) * GRID_SIZE`.
                *   Check if a tower already exists at this grid location. If not:
                    *   Deduct cost from `state.gold`.
                    *   Create new tower object with unique ID, `position` (snapped), `type`, `level: 1`, `fireCooldown: 0`, and initial stats from `TowerConfig`.
                    *   Add to `state.towers`.
                    *   `state.placementGhost = null` (placement complete).
    *   **UI Button Hover**:
        *   Iterate through `state.ui.buttonHover`.
        *   For each button, check if `input.x`, `input.y` are within its bounding box. Set `hover: true/false`.

3.  **Tower Logic**:
    *   Iterate through `state.towers`:
        *   **Targeting**:
            *   If `tower.targetEnemyId` is null or the targeted enemy is dead/out of range:
                *   Find nearest enemy within `tower.range`.
                *   Prioritize enemies closer to the core or based on specific tower logic (e.g., frost targets closest, mortar targets cluster).
                *   If a target is found, set `tower.targetEnemyId` to the enemy's ID.
            *   If `tower.targetEnemyId` is set and the enemy is still valid (alive, in range):
                *   Calculate direction vector to target.
                *   Check if `tower.fireCooldown <= 0` and `tower.fireRate > 0`:
                    *   `fireRateInterval = 1.0 / tower.fireRate`
                    *   If `tower.fireCooldown <= 0`:
                        *   **Fire Projectile**:
                            *   Create a new projectile based on `tower.type`, `tower.position`, and target.
                            *   Set projectile `damage`, `shooterId`, `targetId`, and `impactEffect` from `TowerConfig`.
                            *   Calculate projectile `velocity` towards the target (or straight for mortar).
                            *   Add projectile to `state.projectiles`.
                            *   `tower.fireCooldown = fireRateInterval`
                            *   Trigger SFX: `sfx.play('shoot')`
        *   **Cooldown**: `tower.fireCooldown = Math.max(0, tower.fireCooldown - dt)`
        *   **Upgrading**: (Player clicks on a tower to upgrade)
            *   Check if click is within tower bounds.
            *   If upgrade possible (enough gold, not max level):
                *   Deduct upgrade cost.
                *   Increment `tower.level`.
                *   Update `tower.range`, `tower.damage`, `tower.fireRate` based on level and `TowerConfig` multipliers.
                *   Trigger SFX: `sfx.play('collect')` (or a dedicated 'upgrade' sound if available)

4.  **Projectile Logic**:
    *   Iterate through `state.projectiles`:
        *   **Movement**:
            *   If `projectile.targetId` is set and the target enemy is still alive:
                *   Update `projectile.position` using `Vector.add(projectile.position, Vector.mult(projectile.velocity, dt))`.
            *   Else (for mortar or non-homing projectiles):
                *   Update `projectile.position` using `Vector.add(projectile.position, Vector.mult(projectile.velocity, dt))`.
        *   **Collision/Impact**:
            *   If `projectile.type` is 'bullet' or 'frost':
                *   Check for collision with the `projectile.targetId` enemy.
                *   If collision occurs:
                    *   Apply damage to enemy.
                    *   If `projectile.impactEffect` exists, apply its effects (slow, etc.) to the enemy.
                    *   Remove projectile from `state.projectiles`.
                    *   If enemy health <= 0, handle enemy death (see below).
                    *   Trigger SFX: `sfx.play('hit')`
            *   If `projectile.type` is 'mortarShell':
                *   Check if projectile has reached its target `position` or range is exceeded.
                *   If impact:
                    *   Find all enemies within `projectile.radius` of impact point.
                    *   For each enemy hit:
                        *   Apply damage.
                        *   If `projectile.impactEffect` exists, apply its effects.
                        *   If enemy health <= 0, handle enemy death.
                    *   Remove projectile from `state.projectiles`.
                    *   Trigger SFX: `sfx.play('explode')`
        *   **Range/Lifetime**: If projectile goes off-screen or exceeds a lifetime, remove it.

5.  **Enemy Logic**:
    *   Iterate through `state.enemies`:
        *   **Movement**:
            *   If `enemy.isFrozen`: Skip movement or apply `enemy.speed * 0.1` (slowed speed).
            *   If `enemy.pathIndex < CONFIG.WAYPOINTS.length`:
                *   Calculate vector from current position to next waypoint: `targetVector = Vector.sub(CONFIG.WAYPOINTS[enemy.pathIndex], enemy.position)`.
                *   Calculate distance to waypoint: `distToTarget = Vector.distance(enemy.position, CONFIG.WAYPOINTS[enemy.pathIndex])`.
                *   If `distToTarget <= enemy.speed * dt`:
                    *   Snap `enemy.position` to `CONFIG.WAYPOINTS[enemy.pathIndex]`.
                    *   `enemy.pathIndex++`
                    *   If `enemy.pathIndex === CONFIG.WAYPOINTS.length`:
                        *   The enemy reached the core.
                        *   Reduce `state.coreHealth` by enemy's damage (or a fixed amount).
                        *   Remove enemy from `state.enemies`.
                        *   Trigger SFX: `sfx.play('hit')`
                *   Else:
                    *   Normalize `targetVector` and scale by `enemy.speed * dt`.
                    *   Update `enemy.position = Vector.add(enemy.position, Vector.div(targetVector, distToTarget))` (or use Vector.mult if targetVector is normalized).
        *   **Frozen Timer**: If `enemy.isFrozen`: `enemy.frozenTimer -= dt`. If `enemy.frozenTimer <= 0`, set `enemy.isFrozen = false`.

6.  **Enemy Death**:
    *   When an enemy's `health <= 0`:
        *   Add gold to `state.gold` based on enemy type.
        *   Increase `state.score` based on enemy type.
        *   Trigger SFX: `sfx.play('explode')`
        *   Remove enemy from `state.enemies`.

7.  **Core Health Check**:
    *   If `state.coreHealth <= 0`:
        *   Game Over state. Transition to a game over screen.

## 3. VISUAL IMPLEMENTATION

Use `ctx` for all drawing.

### Background
*   `ctx.fillStyle = COLORS.BG;`
*   `ctx.fillRect(0, 0, w, h);`

### Path
*   `ctx.beginPath();`
*   `ctx.moveTo(CONFIG.WAYPOINTS[0].x, CONFIG.WAYPOINTS[0].y);`
*   Loop through `CONFIG.WAYPOINTS`: `ctx.lineTo(waypoint.x, waypoint.y);`
*   `ctx.strokeStyle = COLORS.ACCENT;`
*   `ctx.lineWidth = 15;` (or appropriate width)
*   `ctx.stroke();`

### Core
*   Draw a circle at the end of the path.
*   `ctx.fillStyle = COLORS.PLAYER;`
*   `ctx.beginPath();`
*   `ctx.arc(CONFIG.WAYPOINTS[CONFIG.WAYPOINTS.length - 1].x, CONFIG.WAYPOINTS[CONFIG.WAYPOINTS.length - 1].y, 30, 0, Math.PI * 2);`
*   `ctx.fill();`
*   Draw health bar above core:
    *   `ctx.fillStyle = COLORS.TEXT;`
    *   `ctx.fillRect(coreX - barWidth/2, coreY - barHeight/2 - 40, barWidth, barHeight);`
    *   `ctx.fillStyle = COLORS.ACCENT;`
    *   `ctx.fillRect(coreX - barWidth/2, coreY - barHeight/2 - 40, (state.coreHealth / 100) * barWidth, barHeight);`

### Towers
*   Loop through `state.towers`:
    *   Draw base:
        *   `ctx.fillStyle = COLORS.TEXT;`
        *   `ctx.beginPath();`
        *   `ctx.arc(tower.position.x, tower.position.y, 15, 0, Math.PI * 2);`
        *   `ctx.fill();`
    *   Draw weapon barrel/visual:
        *   Based on `tower.type`, draw a distinct shape (e.g., rotating barrel for rapid fire, crystal for frost, mortar tube).
        *   Example for rapid fire: `ctx.fillStyle = COLORS.ACCENT; ctx.fillRect(tower.position.x - 5, tower.position.y - 5, 10, 10);`
    *   Draw range indicator when hovered or selected:
        *   `ctx.strokeStyle = COLORS.ACCENT + '80';` // Semi-transparent
        *   `ctx.lineWidth = 2;`
        *   `ctx.beginPath();`
        *   `ctx.arc(tower.position.x, tower.position.y, tower.range, 0, Math.PI * 2);`
        *   `ctx.stroke();`

### Enemies
*   Loop through `state.enemies`:
    *   Draw enemy body:
        *   `ctx.fillStyle = enemy.color;` // Use predefined colors per enemy type
        *   `ctx.beginPath();`
        *   `ctx.arc(enemy.position.x, enemy.position.y, 10, 0, Math.PI * 2);` // Basic enemy shape
        *   `ctx.fill();`
    *   Draw health bar above enemy:
        *   `ctx.fillStyle = COLORS.TEXT;`
        *   `ctx.fillRect(enemy.position.x - 10, enemy.position.y - 20, 20, 4);`
        *   `ctx.fillStyle = COLORS.ACCENT;`
        *   `ctx.fillRect(enemy.position.x - 10, enemy.position.y - 20, (enemy.health / enemy.maxHealth) * 20, 4);`
    *   If `enemy.isFrozen`: Draw a light blue overlay or ice particles effect.

### Projectiles
*   Loop through `state.projectiles`:
    *   **Bullet (`'bullet'`)**:
        *   `ctx.fillStyle = COLORS.ACCENT;`
        *   `ctx.beginPath();`
        *   `ctx.arc(projectile.position.x, projectile.position.y, 3, 0, Math.PI * 2);`
        *   `ctx.fill();`
    *   **Frost (`'frost'`)**:
        *   `ctx.fillStyle = COLORS.ACCENT + 'A0';` // Lighter, semi-transparent
        *   `ctx.beginPath();`
        *   `ctx.arc(projectile.position.x, projectile.position.y, 5, 0, Math.PI * 2);`
        *   `ctx.fill();`
    *   **Mortar Shell (`'mortarShell'`)**:
        *   `ctx.fillStyle = COLORS.TEXT;`
        *   `ctx.beginPath();`
        *   `ctx.arc(projectile.position.x, projectile.position.y, 7, 0, Math.PI * 2);`
        *   `ctx.fill();`

### UI Elements
*   **Gold Display**:
    *   `ctx.fillStyle = COLORS.TEXT;`
    *   `ctx.font = '20px Arial';`
    *   `ctx.fillText(`Gold: ${Math.floor(state.gold)}`, 10, 30);`
*   **Wave Display**:
    *   `ctx.fillStyle = COLORS.TEXT;`
    *   `ctx.fillText(`Wave: ${state.wave}`, w - 100, 30);`
*   **Core Health Display**: (Can be part of core drawing)
*   **Tower Buy Buttons**:
    *   Define positions for buttons.
    *   For each button:
        *   Check `state.ui.buttonHover` for `hover` state.
        *   Set `ctx.fillStyle` based on hover (e.g., brighter if hovered).
        *   Draw a rectangle for the button.
        *   Draw icon or text for tower type.
        *   Draw cost below button.

### Placement Ghost
*   If `state.placementGhost` is not null and `state.placementGhost.towerType` is not null:
    *   Get `gridX`, `gridY` from `state.placementGhost.position`.
    *   `ctx.fillStyle = COLORS.ACCENT + '80';` // Semi-transparent ghost
    *   `ctx.fillRect(gridX, gridY, GRID_SIZE, GRID_SIZE);`
    *   Draw a smaller representation of the tower type inside the ghost.

## 4. DESIGN CONSTRAINTS (CRITICAL)

*   **Math**: Global `Vector` class is available with static methods only. **NO** custom Vector class.
    *   Example: `currentPos = Vector.add(currentPos, Vector.mult(velocity, dt));`
    *   Example: `dist = Vector.distance(pos1, pos2);`
*   **Logic**: Use static math operations for vector manipulation in pseudo-code.
*   **State**: State objects are pure data. No methods.

## 5. AUDIO & SFX MAPPING

*   **`sfx.play('shoot')`**: Triggered when a tower fires a projectile.
*   **`sfx.play('explode')`**: Triggered when an enemy is destroyed.
*   **`sfx.play('jump')`**: Not applicable in this game.
*   **`sfx.play('collect')`**: Triggered when gold is collected (wave completion bonus or selling towers), or when a tower is upgraded.
*   **`sfx.play('hit')`**: Triggered when an enemy takes damage from a projectile or reaches the core.