# TECHNICAL IMPLEMENTATION SPEC: Flappy Bird (Pixel Arcade)

## 1. STATE SCHEMA

```javascript
GameState = {
  // Game State Machine
  // 'loading': Initial state, may involve setup if any.
  // 'ready': Game is paused, awaiting first input to start.
  // 'playing': Game is active.
  // 'gameOver': Game has ended due to collision.
  // 'scoreScreen': Displaying final score after gameOver.
  gameState: 'ready', // 'ready', 'playing', 'gameOver', 'scoreScreen'

  // Player State
  player: {
    position: Vector, // Center of the player's bounding circle
    velocity: Vector, // Current velocity
    radius: number,   // Collision radius
    color: string     // Pixel art color for the player
  },

  // Obstacle State
  obstacles: [
    {
      // Represents a pair of pipes (top and bottom)
      gapCenterY: number, // The vertical center of the gap
      gapHeight: number,  // The height of the traversable gap
      pipeWidth: number,  // Width of each pipe segment
      scrollX: number,    // Current horizontal position of the obstacle's leading edge
      passed: boolean,    // Has the player successfully passed this obstacle?
      color: string       // Pixel art color for the pipes
    }
  ],

  // Scoring
  score: number,
  scoreAccumulator: number, // To track progress towards the next point

  // Physics Constants (can be tuned)
  gravity: number, // Downward acceleration
  flapImpulse: number, // Upward velocity applied on tap
  scrollSpeed: number, // Pixels per second the obstacles move left

  // Game Constants
  pipeSpawnInterval: number, // Time in seconds between spawning new obstacle pairs
  timeSinceLastPipe: number, // Timer for spawning new pipes

  // Visuals/Parallax
  backgroundScrollSpeed: number, // Speed of the furthest background layer
  midgroundScrollSpeed: number,  // Speed of the middle background layer
  foregroundScrollSpeed: number, // Speed of the closest background layer (pipes move at this speed)

  // Game Dimensions (will be set in init)
  canvasWidth: number,
  canvasHeight: number,

  // Input State
  justTapped: boolean // Flag to detect a single tap event
};
```

## 2. CORE LOGIC

### Mechanic A: Player Movement (Flap)
The player is subject to constant downward gravity. A single tap applies an upward impulse.

**Pseudo-code:**

```
// In update(state, input, dt, w, h)

if (state.gameState === 'playing' && state.justTapped) {
  // Apply upward impulse
  state.player.velocity = Vector.add(state.player.velocity, Vector.fromAngle(Math.PI * 1.5) * state.flapImpulse); // Angle 1.5*PI is straight up
  state.justTapped = false; // Reset tap flag
}

// Apply gravity
state.player.velocity.y += state.gravity * dt;

// Update player position
state.player.position = Vector.add(state.player.position, Vector.mult(state.player.velocity, dt));

// Clamp player to screen bounds (for safety, though gameplay aims to avoid this)
// If player goes too high, it's effectively a "fail" state, but can be clamped to top edge.
state.player.position.y = Math.max(state.player.position.y, state.player.radius);
// If player hits ground, trigger gameOver. This is handled by collision detection.
```

### Mechanic B: Obstacle Spawning and Scrolling
Obstacles (pipe pairs) are spawned periodically off the right edge of the screen and scroll left.

**Pseudo-code:**

```
// In update(state, input, dt, w, h)

// Update obstacle scrolling
for (let obstacle of state.obstacles) {
  obstacle.scrollX -= state.scrollSpeed * dt;

  // Remove off-screen obstacles
  if (obstacle.scrollX + obstacle.pipeWidth < 0) {
    state.obstacles.shift(); // Remove the first (oldest) obstacle
  }
}

// Spawn new obstacles
state.timeSinceLastPipe += dt;
if (state.timeSinceLastPipe >= state.pipeSpawnInterval) {
  // Ensure a minimum distance between pipes and player starting area
  const minPlayerX = state.player.position.x + state.player.radius * 5; // Some buffer
  const minObstacleSpawnX = w; // Spawn at the right edge of the screen

  // Randomize gap vertical position within reasonable bounds
  // The gap should be large enough for the player to pass,
  // but positioned to create challenges.
  const availableHeightForGapCenter = h - (state.player.radius * 6); // Account for player size + buffer
  const randomGapCenterY = Math.random() * availableHeightForGapCenter + state.player.radius * 3;

  const newObstacle = {
    gapCenterY: randomGapCenterY,
    gapHeight: state.player.radius * 5, // Example: Gap height is 5 player diameters
    pipeWidth: state.player.radius * 2, // Example: Pipe width is 2 player diameters
    scrollX: minObstacleSpawnX,
    passed: false,
    color: COLORS.ENEMY // Assuming COLORS.ENEMY is defined and appropriate for pipes
  };
  state.obstacles.push(newObstacle);
  state.timeSinceLastPipe = 0;
}
```

### Mechanic C: Collision Detection
Check for collisions between the player (circle) and obstacles (rectangles).

**Pseudo-code:**

```
// In update(state, input, dt, w, h)

// Player vs Ground
if (state.player.position.y + state.player.radius >= h) {
  state.gameState = 'gameOver';
  return; // Exit update early
}

// Player vs Obstacles
for (let obstacle of state.obstacles) {
  // Define pipe rectangles
  const topPipeRect = {
    x: obstacle.scrollX,
    y: 0,
    width: obstacle.pipeWidth,
    height: obstacle.gapCenterY - obstacle.gapHeight / 2
  };
  const bottomPipeRect = {
    x: obstacle.scrollX,
    y: obstacle.gapCenterY + obstacle.gapHeight / 2,
    width: obstacle.pipeWidth,
    height: h - (obstacle.gapCenterY + obstacle.gapHeight / 2)
  };

  // Circle-Rectangle collision detection
  if (isCircleIntersectingRect(state.player.position, state.player.radius, topPipeRect) ||
      isCircleIntersectingRect(state.player.position, state.player.radius, bottomPipeRect)) {
    state.gameState = 'gameOver';
    return; // Exit update early
  }

  // Scoring
  if (!obstacle.passed && state.player.position.x > obstacle.scrollX + obstacle.pipeWidth) {
    obstacle.passed = true;
    state.score++;
    state.scoreAccumulator = 0; // Reset for next point
    sfx.play('collect'); // Play sound for scoring
  }
}

// Helper function for Circle-Rectangle collision
function isCircleIntersectingRect(circlePos, radius, rect) {
  // Find the closest point to the circle within the rectangle
  const closestX = Math.max(rect.x, Math.min(circlePos.x, rect.x + rect.width));
  const closestY = Math.max(rect.y, Math.min(circlePos.y, rect.y + rect.height));

  // Calculate the distance between the circle's center and this closest point
  const distanceX = circlePos.x - closestX;
  const distanceY = circlePos.y - closestY;
  const distanceSquared = (distanceX * distanceX) + (distanceY * distanceY);

  // If the distance is less than the square of the circle's radius, an overlap occurs
  return distanceSquared < (radius * radius);
}
```

### Mechanic D: Input Handling
Detect a single tap event for player input.

**Pseudo-code:**

```
// In update(state, input, dt, w, h)

if (input.isDown && !state.player.lastInputState.isDown) { // Check for state transition to pressed
  state.justTapped = true;
}
state.player.lastInputState = { isDown: input.isDown }; // Store current input state for next frame comparison
```

## 3. VISUAL IMPLEMENTATION

The goal is to emulate 8-bit pixel art using Canvas primitives. All drawing will be done directly on the canvas context.

### Effect A: Pixel Art Rendering
Render entities as solid colored squares or circles with sharp edges, simulating pixel art.

**Drawing Steps:**

1.  **Background Layers (Parallax)**:
    *   Draw three distinct background layers with different `scrollSpeed` values.
    *   Each layer can be a repeating pattern or gradient.
    *   To draw a repeating pattern:
        *   `ctx.fillStyle = COLORS.BG_LAYER1;`
        *   `for (let x = 0; x < w; x += patternTileWidth) { ctx.fillRect(x - (state.backgroundScrollOffset % patternTileWidth), 0, patternTileWidth, h); }` (similarly for other layers, adjusting scroll offset and speed).
        *   `state.backgroundScrollOffset += state.backgroundScrollSpeed * dt;` (and similar for mid/foreground).

2.  **Player Bird**:
    *   Represent as a filled square or circle.
    *   `ctx.fillStyle = state.player.color;`
    *   `ctx.fillRect(state.player.position.x - state.player.radius, state.player.position.y - state.player.radius, state.player.radius * 2, state.player.radius * 2);` (if square)
    *   Or use `ctx.arc` if a circular bird is desired, but ensure no anti-aliasing for pixel art feel (set `ctx.imageSmoothingEnabled = false;` globally if possible or draw scaled sprites, but we are restricted to primitives here, so sharp edges are assumed).
    *   For pixel art, a simple filled square is best.

3.  **Obstacles (Pipes)**:
    *   Draw as solid rectangles.
    *   For each obstacle:
        *   `ctx.fillStyle = obstacle.color;`
        *   **Top Pipe**: `ctx.fillRect(obstacle.scrollX, 0, obstacle.pipeWidth, obstacle.gapCenterY - obstacle.gapHeight / 2);`
        *   **Bottom Pipe**: `ctx.fillRect(obstacle.scrollX, obstacle.gapCenterY + obstacle.gapHeight / 2, obstacle.pipeWidth, h - (obstacle.gapCenterY + obstacle.gapHeight / 2));`

4.  **Score Display**:
    *   Render score as text using a pixel-friendly font (if available via `ctx.font`, but assuming standard font rendering with pixelated texture).
    *   `ctx.fillStyle = COLORS.TEXT;`
    *   `ctx.font = 'bold 30px Arial'; // Adjust size as needed`
    *   `ctx.fillText("Score: " + state.score, 10, 30);`

5.  **Game Over/Ready Screen**:
    *   Draw a semi-transparent overlay for "game over".
    *   `ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';`
    *   `ctx.fillRect(0, 0, w, h);`
    *   Display "Game Over" or "Tap to Start" text.
    *   `ctx.fillStyle = COLORS.TEXT;`
    *   `ctx.font = 'bold 60px Arial';`
    *   `ctx.fillText("Game Over", w/2 - ctx.measureText("Game Over").width/2, h/2);`
    *   `ctx.font = 'bold 30px Arial';`
    *   `ctx.fillText("Tap to Play Again", w/2 - ctx.measureText("Tap to Play Again").width/2, h/2 + 50);`

### Effect B: Animation Math
Animations like scrolling are achieved by updating positions based on `dt` and velocities.

**Scrolling Math**:
`newPosition = oldPosition - speed * deltaTime`
This is directly implemented in Mechanic B (Obstacle Spawning and Scrolling) for the `obstacle.scrollX` property and for background layers.

**Player Physics**:
`newVelocity = oldVelocity + gravity * deltaTime`
`newPosition = oldPosition + newVelocity * deltaTime`
This is directly implemented in Mechanic A (Player Movement) for `state.player.velocity` and `state.player.position`.

## 4. DESIGN CONSTRAINTS (CRITICAL)

*   **Math**: The system injects a global `Vector` class with static methods. **DO NOT** specify a custom Vector class in the Schema.
    *   Available: `Vector.add(v1, v2)`, `Vector.sub`, `Vector.mult`, `Vector.div`, `Vector.distance` (alias: `Vector.dist`), `Vector.random2D()`, `Vector.fromAngle(angle)`.
    *   **NOT available as static**: `Vector.normalize`, `Vector.mag`, `Vector.limit` - use manual math (`Math.sqrt`) or instance methods on temp variables.
*   **Logic**: Write pseudo-code using **STATIC MATH** only (e.g. `pos = Vector.add(pos, vel)`). **DO NOT** use instance methods like `pos.add(vel)` on state objects.
*   **State**: Pure data only. No methods on state objects.

## 5. AUDIO & SFX MAPPING

Available SFX: 'shoot', 'explode', 'jump', 'collect', 'hit'.

*   **Player Flaps**: `sfx.play('jump')` - Triggered when `state.justTapped` is true within the `playing` state.
*   **Obstacle Passed**: `sfx.play('collect')` - Triggered when `state.player.position.x` passes the obstacle's right edge and `obstacle.passed` is false.
*   **Player Collides with Pipe/Ground**: `sfx.play('hit')` or `sfx.play('explode')` - Triggered when collision is detected, leading to `state.gameState = 'gameOver'`. 'hit' might be more appropriate for a near-miss, 'explode' for a definitive game-ending collision. Let's use 'hit' for the primary collision.
*   **Game Over (End of game)**: Not directly mapped to a specific SFX, but the 'hit' sound will precede the state change. If 'explode' is desired for game over, it can be played when `state.gameState` transitions to `gameOver`.
*   **Initial Tap to Start**: No specific SFX defined, but could potentially use 'jump' or a subtle UI sound if available and appropriate. However, sticking to the provided list, no explicit SFX is mapped for this.