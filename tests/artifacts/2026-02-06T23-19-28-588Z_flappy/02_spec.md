# TECHNICAL IMPLEMENTATION SPEC: Pixel Plunge

## 1. STATE SCHEMA

```javascript
/**
 * @typedef {object} GameState
 * @property {number} score - The player's current score.
 * @property {string} gameState - Current state of the game ('ready', 'playing', 'gameOver').
 * @property {number} lastPipeSpawnTime - Timestamp of the last pipe pair spawn.
 * @property {number} pipeSpawnInterval - Time in seconds between pipe pair spawns.
 * @property {Array<Pipe>} pipes - Array of active pipe pairs.
 * @property {Player} player - The player character object.
 * @property {number} groundY - The Y-coordinate of the ground.
 * @property {number} parallaxBG1X - X-coordinate for the first parallax background layer.
 * @property {number} parallaxBG2X - X-coordinate for the second parallax background layer.
 * @property {number} parallaxSpeed1 - Scroll speed for the first background layer.
 * @property {number} parallaxSpeed2 - Scroll speed for the second background layer.
 * @property {number} lastTapTime - Timestamp of the last player tap.
 * @property {number} tapDuration - How long the upward impulse lasts after a tap.
 */

/**
 * @typedef {object} Player
 * @property {Vector} position - Current position of the player.
 * @property {Vector} velocity - Current velocity of the player.
 * @property {number} radius - The radius of the player's collision circle.
 * @property {number} gravity - The constant downward acceleration.
 * @property {number} jumpImpulse - The initial upward velocity applied on tap.
 * @property {number} impulseEndTime - Timestamp when the current jump impulse ends.
 */

/**
 * @typedef {object} Pipe
 * @property {number} x - The X-coordinate of the left edge of the pipe pair.
 * @property {number} gapHeight - The height of the gap between the pipes.
 * @property {number} gapCenterY - The Y-coordinate of the center of the gap.
 * @property {number} width - The width of the pipes.
 * @property {boolean} passed - Whether the player has successfully passed this pipe pair.
 * @property {number} topHeight - The height of the top pipe.
 * @property {number} bottomY - The Y-coordinate of the top of the bottom pipe.
 */
```

## 2. CORE LOGIC

### 2.1. Initialization (`init(state, w, h)`)

*   Set `state.score = 0`.
*   Set `state.gameState = 'ready'`.
*   Set `state.lastPipeSpawnTime = 0`.
*   Set `state.pipeSpawnInterval = 1.5` (seconds).
*   Initialize `state.pipes = []`.
*   Set `state.player = { ... }` with initial `position` at `(w/4, h/2)`, `velocity` at `(0, 0)`, `radius = 10`, `gravity = 800` (pixels/sec^2), `jumpImpulse = 300` (pixels/sec), `impulseEndTime = 0`.
*   Set `state.groundY = h - 30` (or a value based on visual asset if they were allowed, here it's a fixed ground line).
*   Initialize parallax background properties: `state.parallaxBG1X = 0`, `state.parallaxBG2X = 0`, `state.parallaxSpeed1 = 50` (pixels/sec), `state.parallaxSpeed2 = 80` (pixels/sec).
*   Set `state.lastTapTime = 0`.
*   Set `state.tapDuration = 0.2` (seconds).

### 2.2. Game Loop (`update(state, input, dt, w, h)`)

#### 2.2.1. Input Handling

*   If `input.isDown` and `state.gameState === 'ready'`:
    *   Set `state.gameState = 'playing'`.
    *   Trigger initial player jump: `state.player.velocity.y = -state.player.jumpImpulse;`
    *   Set `state.player.impulseEndTime = performance.now() / 1000 + state.tapDuration;`
    *   `state.lastTapTime = performance.now() / 1000;`
*   If `input.isDown` and `state.gameState === 'playing'`:
    *   Check if enough time has passed since the last tap to allow another: `if (performance.now() / 1000 - state.lastTapTime > 0.1) { ... }` (small cooldown to prevent rapid taps).
    *   If allowed, trigger jump:
        *   `state.player.velocity.y = -state.player.jumpImpulse;`
        *   `state.player.impulseEndTime = performance.now() / 1000 + state.tapDuration;`
        *   `state.lastTapTime = performance.now() / 1000;`
        *   `sfx.play('jump');`
*   If `input.isDown` and `state.gameState === 'gameOver'`:
    *   Reset game state: `init(state, w, h);`

#### 2.2.2. Game State Management

*   **Ready State:**
    *   If `state.gameState === 'ready'`, handle initial tap to start. Player should remain static or have a slight bobble.
*   **Playing State:**
    *   If `state.gameState === 'playing'`:
        *   **Player Physics:**
            *   Apply gravity: `state.player.velocity.y += state.player.gravity * dt;`
            *   Clamp velocity to prevent excessive falling speed (optional, but good practice): `state.player.velocity.y = Math.min(state.player.velocity.y, 500);`
            *   Update player position: `state.player.position.add(new Vector(state.player.velocity.x * dt, state.player.velocity.y * dt));`
            *   Constrain player to screen vertical bounds (except ground): If `state.player.position.y - state.player.radius < 0`, set `state.player.position.y = state.player.radius; state.player.velocity.y = 0;`
            *   If `state.player.position.y + state.player.radius > state.groundY`:
                *   Set `state.player.position.y = state.groundY - state.player.radius;`
                *   Set `state.player.velocity.y = 0;`
                *   Set `state.gameState = 'gameOver';`
                *   `sfx.play('hit');` // Or a more appropriate 'crash' sound if available.

        *   **Pipe Spawning:**
            *   If `performance.now() / 1000 - state.lastPipeSpawnTime > state.pipeSpawnInterval`:
                *   Generate a random gap center: `const minGapCenter = state.player.radius * 5; const maxGapCenter = h - state.groundY - state.player.radius * 5; const gapCenterY = Math.random() * (maxGapCenter - minGapCenter) + minGapCenter;`
                *   Set a fixed `gapHeight` (e.g., `150`).
                *   Set `pipeWidth` (e.g., `60`).
                *   Create new pipe pair: `state.pipes.push({ x: w, gapHeight: gapHeight, gapCenterY: gapCenterY, width: pipeWidth, passed: false, topHeight: gapCenterY - gapHeight / 2, bottomY: gapCenterY + gapHeight / 2 });`
                *   Set `state.lastPipeSpawnTime = performance.now() / 1000;`

        *   **Pipe Movement & Scoring:**
            *   Iterate through `state.pipes`:
                *   Move pipe left: `pipe.x -= 150 * dt;` (adjust speed as needed).
                *   If `!pipe.passed` and `state.player.position.x > pipe.x + pipe.width`:
                    *   `pipe.passed = true;`
                    *   `state.score++;`
                    *   `sfx.play('collect');` // For passing through a gap
                *   If `pipe.x + pipe.width < 0`:
                    *   Remove pipe from `state.pipes` (e.g., using `splice` after iterating).

        *   **Collision Detection:**
            *   Iterate through `state.pipes`:
                *   **Horizontal Overlap:** If `state.player.position.x + state.player.radius > pipe.x` and `state.player.position.x - state.player.radius < pipe.x + pipe.width`:
                    *   **Vertical Overlap (Top Pipe):** If `state.player.position.y - state.player.radius < pipe.topHeight`:
                        *   `state.gameState = 'gameOver';`
                        *   `sfx.play('hit');`
                        *   Break loop.
                    *   **Vertical Overlap (Bottom Pipe):** If `state.player.position.y + state.player.radius > pipe.bottomY`:
                        *   `state.gameState = 'gameOver';`
                        *   `sfx.play('hit');`
                        *   Break loop.
*   **Game Over State:**
    *   If `state.gameState === 'gameOver'`, display game over message and prompt for restart. No game logic updates.

#### 2.2.3. Parallax Background Scrolling

*   If `state.gameState === 'playing'`:
    *   `state.parallaxBG1X -= state.parallaxSpeed1 * dt;`
    *   `state.parallaxBG2X -= state.parallaxSpeed2 * dt;`
    *   If `state.parallaxBG1X < -w` (assuming background image width is `w`): `state.parallaxBG1X = 0;`
    *   If `state.parallaxBG2X < -w`: `state.parallaxBG2X = 0;`

## 3. VISUAL IMPLEMENTATION

#### 3.1. Backgrounds

*   **Layer 1 (Distant):**
    *   `ctx.fillStyle = COLORS.BG;` // Or a darker shade for distant parallax
    *   `ctx.fillRect(state.parallaxBG1X, 0, w, h);`
    *   `ctx.fillRect(state.parallaxBG1X + w, 0, w, h);` // For seamless tiling
*   **Layer 2 (Mid-distance):**
    *   `ctx.fillStyle = "#557788";` // Example mid-tone color
    *   `ctx.fillRect(state.parallaxBG2X, 0, w, h);`
    *   `ctx.fillRect(state.parallaxBG2X + w, 0, w, h);`

#### 3.2. Ground

*   `ctx.fillStyle = COLORS.ACCENT;` // A earthy or rock-like color
*   `ctx.fillRect(0, state.groundY, w, h - state.groundY);`

#### 3.3. Player

*   `ctx.fillStyle = COLORS.PLAYER;`
*   `ctx.beginPath();`
*   `ctx.arc(state.player.position.x, state.player.position.y, state.player.radius, 0, Math.PI * 2);`
*   `ctx.fill();`

#### 3.4. Pipes

*   `ctx.fillStyle = COLORS.ENEMY;` // A distinct color for obstacles
*   For each `pipe` in `state.pipes`:
    *   **Top Pipe:**
        *   `ctx.beginPath();`
        *   `ctx.rect(pipe.x, 0, pipe.width, pipe.topHeight);`
        *   `ctx.fill();`
    *   **Bottom Pipe:**
        *   `ctx.beginPath();`
        *   `ctx.rect(pipe.x, pipe.bottomY, pipe.width, h - pipe.bottomY);`
        *   `ctx.fill();`

#### 3.5. Score Display

*   `ctx.fillStyle = COLORS.TEXT;`
*   `ctx.font = "32px Arial";` // Or a pixel-art font if one were available conceptually
*   `ctx.textAlign = "center";`
*   `ctx.fillText(state.score, w / 2, 50);`

#### 3.6. Game State Messages

*   **Ready State:**
    *   If `state.gameState === 'ready'`:
        *   `ctx.fillStyle = COLORS.TEXT;`
        *   `ctx.font = "48px Arial";`
        *   `ctx.textAlign = "center";`
        *   `ctx.fillText("Tap to Start", w / 2, h / 2);`
*   **Game Over State:**
    *   If `state.gameState === 'gameOver'`:
        *   `ctx.fillStyle = COLORS.TEXT;`
        *   `ctx.font = "48px Arial";`
        *   `ctx.textAlign = "center";`
        *   `ctx.fillText("Game Over", w / 2, h / 2 - 50);`
        *   `ctx.font = "32px Arial";`
        *   `ctx.fillText(`Score: ${state.score}`, w / 2, h / 2);`
        *   `ctx.font = "24px Arial";`
        *   `ctx.fillText("Tap to Restart", w / 2, h / 2 + 50);`

## 4. AUDIO & SFX MAPPING

*   **Player Jump:** On successful player jump input (`state.gameState === 'playing'` and tap detected): `sfx.play('jump')`
*   **Player Collision (Pipe/Ground):** When `state.gameState` changes to `'gameOver'` due to collision: `sfx.play('hit')`
*   **Pipe Passed:** When a pipe is marked as `pipe.passed = true` and score increments: `sfx.play('collect')`
*   **No 'explode' or 'shoot' SFX are mapped as they are not part of the core mechanics defined.**