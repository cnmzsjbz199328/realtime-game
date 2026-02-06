# TECHNICAL IMPLEMENTATION SPEC: Neon Breaker

## 1. STATE SCHEMA

```javascript
// GameState object structure
let GameState = {
    score: 0,
    level: 1,
    lives: 3,
    gameState: 'playing', // 'playing', 'win', 'lose', 'paused'
    paddle: {
        x: 0,
        y: 0,
        width: 100,
        height: 15,
        speed: 500 // pixels per second
    },
    ball: {
        position: new Vector(0, 0),
        velocity: new Vector(0, 0),
        radius: 8,
        speed: 300 // pixels per second
    },
    bricks: [], // Array of brick objects
    powerups: [], // Array of active powerup objects
    // internal state for particle effects
    particles: [] // { x, y, type: 'explode', color: string, lifetime: number, velocity: Vector }
};

// Brick object structure
// 'type' can be 'normal', 'armored', 'moving'
// 'hitsNeeded' for 'armored' or 'moving' bricks
let Brick = {
    x: 0,
    y: 0,
    width: 50,
    height: 20,
    color: COLORS.ACCENT, // Default color, can be overridden
    active: true,
    type: 'normal', // 'normal', 'armored', 'moving'
    hitsNeeded: 1,
    originalHitsNeeded: 1, // for reset if needed
    initialX: 0, // for moving bricks
    movingSpeed: 50 // for moving bricks
};

// Powerup object structure
let Powerup = {
    x: 0,
    y: 0,
    type: 'multi_ball', // 'multi_ball', 'laser_paddle'
    color: COLORS.ACCENT,
    size: 20,
    velocity: new Vector(0, 150), // falling speed
    active: true,
    lifetime: 10 // seconds
};
```

## 2. CORE LOGIC

### `init(state, w, h)`

1.  **State Initialization**:
    *   `state.score = 0;`
    *   `state.level = 1;`
    *   `state.lives = 3;`
    *   `state.gameState = 'playing';`
2.  **Paddle Initialization**:
    *   `state.paddle.width = w * 0.2;` // Adjust paddle width based on screen width
    *   `state.paddle.height = h * 0.02;` // Adjust paddle height
    *   `state.paddle.y = h - state.paddle.height * 2;` // Position paddle near bottom
    *   `state.paddle.x = (w - state.paddle.width) / 2;` // Center paddle
3.  **Ball Initialization**:
    *   `state.ball.radius = h * 0.015;` // Adjust ball radius based on screen height
    *   `state.ball.speed = w * 0.07;` // Adjust ball speed based on screen width
    *   `resetBall(state, w, h);` // Call a helper function to position and launch ball
4.  **Brick Initialization**:
    *   `state.bricks = createLevel(state.level, w, h);` // Call a helper function to generate bricks for the current level
5.  **Powerup Initialization**:
    *   `state.powerups = [];`
6.  **Particle Initialization**:
    *   `state.particles = [];`

### `resetBall(state, w, h)`

1.  **Position Ball**:
    *   `state.ball.position.x = state.paddle.x + state.paddle.width / 2;`
    *   `state.ball.position.y = state.paddle.y - state.ball.radius - 1;`
2.  **Initial Velocity**:
    *   `// Ball is launched by player input, or defaults to a slight upward angle if not launched`
    *   `if (state.gameState === 'playing') {`
    *   `    // If waiting for launch, set velocity to 0 or a very small value`
    *   `    state.ball.velocity = new Vector(0, 0);`
    *   `} else {`
    *   `    // If this is a reset after losing a life or starting a new level, launch it.`
    *   `    const angle = -Math.PI / 4 + Math.random() * Math.PI / 2; // Angle between -45 and 45 degrees`
    *   `    state.ball.velocity = new Vector(Math.cos(angle) * state.ball.speed, Math.sin(angle) * state.ball.speed);`
    *   `}`

### `update(state, input, dt, w, h)`

1.  **Game State Check**:
    *   `if (state.gameState !== 'playing') return;`

2.  **Paddle Movement**:
    *   `// Mouse control`
    *   `if (input.x !== undefined) {`
    *   `    state.paddle.x = input.x - state.paddle.width / 2;`
    *   `}`
    *   `// Keyboard control (optional, for flexibility)`
    *   `if (input.keys['ArrowLeft'] || input.keys['a']) {`
    *   `    state.paddle.x -= state.paddle.speed * dt;`
    *   `}`
    *   `if (input.keys['ArrowRight'] || input.keys['d']) {`
    *   `    state.paddle.x += state.paddle.speed * dt;`
    *   `}`
    *   `// Clamp paddle to screen bounds`
    *   `state.paddle.x = Math.max(0, Math.min(w - state.paddle.width, state.paddle.x));`

3.  **Ball Movement**:
    *   `state.ball.position.add(new Vector(state.ball.velocity.x * dt, state.ball.velocity.y * dt));`

4.  **Ball Collision Detection**:
    *   **Top Wall**:
        *   `if (state.ball.position.y - state.ball.radius < 0) {`
        *   `    state.ball.position.y = state.ball.radius;`
        *   `    state.ball.velocity.y *= -1;`
        *   `    sfx.play('hit');`
        *   `}`
    *   **Side Walls**:
        *   `if (state.ball.position.x - state.ball.radius < 0) {`
        *   `    state.ball.position.x = state.ball.radius;`
        *   `    state.ball.velocity.x *= -1;`
        *   `    sfx.play('hit');`
        *   `}`
        *   `if (state.ball.position.x + state.ball.radius > w) {`
        *   `    state.ball.position.x = w - state.ball.radius;`
        *   `    state.ball.velocity.x *= -1;`
        *   `    sfx.play('hit');`
        *   `}`
    *   **Paddle Collision**:
        *   `const paddleLeft = state.paddle.x;`
        *   `const paddleRight = state.paddle.x + state.paddle.width;`
        *   `const paddleTop = state.paddle.y;`
        *   `const paddleBottom = state.paddle.y + state.paddle.height;`
        *   `if (state.ball.position.y + state.ball.radius > paddleTop &&`
        *   `    state.ball.position.y < paddleBottom &&`
        *   `    state.ball.position.x + state.ball.radius > paddleLeft &&`
        *   `    state.ball.position.x < paddleRight) {`
        *   `    // Ball is within the horizontal bounds of the paddle and at the paddle's vertical level`
        *   `    state.ball.position.y = paddleTop - state.ball.radius; // Prevent sticking`
        *   `    state.ball.velocity.y *= -1;`
        *   `    // Add directional influence based on where the ball hit the paddle`
        *   `    const hitPos = (state.ball.position.x - (state.paddle.x + state.paddle.width / 2)) / (state.paddle.width / 2); // -1 to 1`
        *   `    state.ball.velocity.x = hitPos * state.ball.speed * 0.7 + state.ball.velocity.x * 0.3; // Influence x velocity, but don't completely override`
        *   `    state.ball.speed = Math.sqrt(state.ball.velocity.x * state.ball.velocity.x + state.ball.velocity.y * state.ball.velocity.y); // Ensure speed is maintained`
        *   `    sfx.play('hit');`
        *   `}`
    *   **Bottom (Lose Condition)**:
        *   `if (state.ball.position.y - state.ball.radius > h) {`
        *   `    state.lives--;`
        *   `    if (state.lives <= 0) {`
        *   `        state.gameState = 'lose';`
        *   `        sfx.play('explode'); // Or a specific lose sound if available`
        *   `    } else {`
        *   `        resetBall(state, w, h); // Reset ball for next life`
        *   `        // Consider pausing briefly or waiting for player input to restart`
        *   `    }`
        *   `}`

5.  **Brick Collision Detection**:
    *   `for (let i = state.bricks.length - 1; i >= 0; i--) {`
    *   `    const brick = state.bricks[i];`
    *   `    if (!brick.active) continue;`
    *   `    // Simple AABB collision with ball`
    *   `    const dist = Vector.distance(state.ball.position, {`
    *   `        x: Math.max(brick.x, Math.min(state.ball.position.x, brick.x + brick.width)),`
    *   `        y: Math.max(brick.y, Math.min(state.ball.position.y, brick.y + brick.height))`
    *   `    });`
    *   `    if (dist < state.ball.radius) {`
    *   `        // Collision occurred`
    *   `        brick.hitsNeeded--;`
    *   `        state.score += 10;`
    *   `        sfx.play('hit');`
    *   `        // Add particle effects`
    *   `        addParticles(state, brick.x + brick.width / 2, brick.y + brick.height / 2, brick.color);`
    *   `        if (brick.hitsNeeded <= 0) {`
    *   `            brick.active = false;`
    *   `            sfx.play('explode');`
    *   `            // Chance to drop powerup`
    *   `            if (Math.random() < 0.1) { // 10% chance to drop a powerup`
    *   `                dropPowerup(state, brick.x + brick.width / 2, brick.y + brick.height / 2);`
    *   `            }`
    *   `        } else {`
    *   `            // If not destroyed, still bounce`
    *   `            // Determine which side was hit to reflect velocity`
    *   `            const dx = state.ball.position.x - (brick.x + brick.width / 2);`
    *   `            const dy = state.ball.position.y - (brick.y + brick.height / 2);`
    *   `            const absDx = Math.abs(dx);`
    *   `            const absDy = Math.abs(dy);`
    *   `            const overlapX = state.ball.radius - absDx;`
    *   `            const overlapY = state.ball.radius - absDy;`
    *   `            if (absDx > absDy) { // Hit from the sides`
    *   `                state.ball.velocity.x *= -1;`
    *   `                state.ball.position.x += overlapX * Math.sign(dx); // Adjust position`
    *   `            } else { // Hit from top/bottom`
    *   `                state.ball.velocity.y *= -1;`
    *   `                state.ball.position.y += overlapY * Math.sign(dy); // Adjust position`
    *   `            }`
    *   `        }`
    *   `        // Only process one brick collision per frame to avoid multiple bounces from a single ball position.`
    *   `        break;`
    *   `    }`
    *   `}`

6.  **Powerup Movement and Collection**:
    *   `for (let i = state.powerups.length - 1; i >= 0; i--) {`
    *   `    const powerup = state.powerups[i];`
    *   `    if (!powerup.active) continue;`
    *   `    powerup.y += powerup.velocity.y * dt;`
    *   `    powerup.lifetime -= dt;`
    *   `    // Check if powerup is collected by the paddle`
    *   `    if (powerup.y + powerup.size > state.paddle.y &&`
    *   `        powerup.y < state.paddle.y + state.paddle.height &&`
    *   `        powerup.x + powerup.size > state.paddle.x &&`
    *   `        powerup.x < state.paddle.x + state.paddle.width) {`
    *   `        activatePowerup(state, powerup.type);`
    *   `        powerup.active = false;`
    *   `        sfx.play('collect');`
    *   `    }`
    *   `    // Remove powerup if it falls off screen or lifetime expires`
    *   `    if (powerup.y > h || powerup.lifetime <= 0) {`
    *   `        powerup.active = false;`
    *   `    }`
    *   `}`
    *   `state.powerups = state.powerups.filter(p => p.active);`

7.  **Particle Update**:
    *   `for (let i = state.particles.length - 1; i >= 0; i--) {`
    *   `    const p = state.particles[i];`
    *   `    p.position.add(new Vector(p.velocity.x * dt, p.velocity.y * dt));`
    *   `    p.lifetime -= dt;`
    *   `    if (p.lifetime <= 0) {`
    *   `        state.particles.splice(i, 1);`
    *   `    }`
    *   `}`

8.  **Win Condition**:
    *   `const allBricksInactive = state.bricks.every(brick => !brick.active);`
    *   `if (allBricksInactive) {`
    *   `    state.gameState = 'win';`
    *   `}`

### `createLevel(level, w, h)`

*   **Logic**: This function dynamically generates the `state.bricks` array based on the `level` number.
    *   **Level 1**: Simple grid of normal bricks.
    *   **Higher Levels**: Introduce `armored` bricks (higher `hitsNeeded`), `moving` bricks (implement simple horizontal or vertical movement logic within `update` for these bricks).
    *   **Layout**: Define different brick patterns for each level.
    *   **Brick Size/Spacing**: Adjust based on `w` and `h` for consistent feel across resolutions.
    *   **Example Structure for a level**:
        ```javascript
        const bricks = [];
        const brickWidth = w * 0.08;
        const brickHeight = h * 0.03;
        const gap = w * 0.01;
        const rows = 5;
        const cols = Math.floor((w - gap) / (brickWidth + gap));
        const startY = h * 0.1; // Top margin

        for (let r = 0; r < rows; r++) {
            for (let c = 0; c < cols; c++) {
                const brick = {
                    x: gap + c * (brickWidth + gap),
                    y: startY + r * (brickHeight + gap),
                    width: brickWidth,
                    height: brickHeight,
                    color: COLORS.ACCENT,
                    active: true,
                    type: 'normal',
                    hitsNeeded: 1,
                    initialX: gap + c * (brickWidth + gap),
                    movingSpeed: 50
                };

                // Add variations for higher levels
                if (level > 1 && r === 1 && c === Math.floor(cols/2)) {
                    brick.type = 'armored';
                    brick.hitsNeeded = 3;
                    brick.color = '#FF00FF'; // Purple for armored
                }
                if (level > 2 && r === 2) {
                    brick.type = 'moving';
                    brick.movingSpeed = w * 0.05; // Faster movement for higher levels
                }

                bricks.push(brick);
            }
        }
        return bricks;
        ```

### `addParticles(state, x, y, color)`

*   **Logic**: Generates a burst of particles at `(x, y)` with the given `color`.
    *   **Number of Particles**: e.g., 10-20.
    *   **Velocity**: Random outward velocities.
    *   **Lifetime**: Short duration (e.g., 0.5-1 second).
    *   **Type**: 'explode'.
    *   **Structure**: Push objects like `{ position: new Vector(x, y), velocity: new Vector(rand_vx, rand_vy), color: color, lifetime: random_lifetime }` to `state.particles`.

### `dropPowerup(state, x, y)`

*   **Logic**: Creates a new powerup object at `(x, y)`.
    *   **Type Selection**: Randomly choose between 'multi_ball' and 'laser_paddle'.
    *   **Structure**: Push an object with `type`, `x`, `y`, `color`, `size`, `velocity`, `active`, `lifetime` to `state.powerups`.

### `activatePowerup(state, type)`

*   **Logic**: Modifies game state based on the `type` of powerup.
    *   **'multi_ball'**:
        *   Create 1-2 additional balls, launching them with slightly varied angles from the paddle's center.
        *   Each new ball should have its own `position` and `velocity` properties.
    *   **'laser_paddle'**:
        *   Temporarily increase the paddle's width or add a "laser" element that can destroy blocks on contact without bouncing.
        *   Implement a timer for the powerup duration.

## 3. VISUAL IMPLEMENTATION

### Background

*   **Layer**: Bottom-most.
*   **Implementation**: `ctx.fillStyle = COLORS.BG; ctx.fillRect(0, 0, w, h);`

### Bricks

*   **Layer**: Above background.
*   **Implementation**:
    *   Iterate through `state.bricks`.
    *   For each `brick` where `brick.active` is true:
        *   `ctx.fillStyle = brick.color;`
        *   `ctx.fillRect(brick.x, brick.y, brick.width, brick.height);`
        *   **Neon Glow/Outline**: For a neon effect, draw a slightly larger, brighter rectangle behind the main brick or use `ctx.shadowBlur` and `ctx.shadowColor`.
        *   **Armored Bricks**: Draw a distinct indicator (e.g., an inner rectangle or a pattern) showing `hitsNeeded`.
        *   **Moving Bricks**: No specific visual difference in drawing, movement handled in update.

### Paddle

*   **Layer**: Above bricks.
*   **Implementation**:
    *   `ctx.fillStyle = COLORS.PLAYER;`
    *   `ctx.fillRect(state.paddle.x, state.paddle.y, state.paddle.width, state.paddle.height);`
    *   **Neon Glow/Outline**: Similar to bricks, use `ctx.shadowBlur`/`ctx.shadowColor` or draw a slightly larger, glowing shape behind.
    *   **Laser Paddle (Powerup)**: If active, draw a glowing line or beam extending from the paddle's top surface. `ctx.fillStyle = COLORS.ACCENT; ctx.fillRect(state.paddle.x, state.paddle.y, state.paddle.width, 2);` (or similar).

### Ball

*   **Layer**: Above paddle.
*   **Implementation**:
    *   `ctx.beginPath();`
    *   `ctx.arc(state.ball.position.x, state.ball.position.y, state.ball.radius, 0, Math.PI * 2);`
    *   `ctx.fillStyle = COLORS.ACCENT; // Or a dedicated ball color`
    *   `ctx.fill();`
    *   **Neon Glow**: `ctx.shadowBlur = 10; ctx.shadowColor = COLORS.ACCENT;` before filling. Reset blur afterwards.
    *   **Glowing Trail**: In `update`, for each ball, store a short history of its positions. In `draw`, draw semi-transparent circles or lines connecting these positions.
        *   `ctx.beginPath();`
        *   `ctx.moveTo(previousPositions[0].x, previousPositions[0].y);`
        *   `for (let i = 1; i < previousPositions.length; i++) {`
        *   `    ctx.lineTo(previousPositions[i].x, previousPositions[i].y);`
        *   `}`
        *   `ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)'; // Fading trail`
        *   `ctx.lineWidth = state.ball.radius * 2;`
        *   `ctx.stroke();`

### Powerups

*   **Layer**: Above paddle.
*   **Implementation**:
    *   Iterate through `state.powerups`.
    *   For each `powerup` where `powerup.active` is true:
        *   `ctx.fillStyle = powerup.color;`
        *   `ctx.fillRect(powerup.x, powerup.y, powerup.size, powerup.size);`
        *   **Glow**: `ctx.shadowBlur = 5; ctx.shadowColor = powerup.color;`

### Particles (Explosions)

*   **Layer**: Above everything else (or on their own layer).
*   **Implementation**:
    *   Iterate through `state.particles`.
    *   For each `p`:
        *   `ctx.beginPath();`
        *   `// Draw as small circles`
        *   `ctx.arc(p.position.x, p.position.y, 2, 0, Math.PI * 2);`
        *   `ctx.fillStyle = p.color;`
        *   `// Fade out effect: Calculate alpha based on lifetime`
        *   `const alpha = Math.max(0, p.lifetime / initialLifetime);`
        *   `ctx.fillStyle = p.color.replace(')', `, ${alpha})`); // Assuming color is like 'rgb(...)' or 'rgba(...)'`
        *   `ctx.fill();`
        *   `// Reset shadow blur for subsequent draws`
        *   `ctx.shadowBlur = 0;`

### UI (Score, Lives, Level)

*   **Layer**: Top-most.
*   **Implementation**:
    *   `ctx.font = '24px Arial'; // Or adjust font size based on w/h`
    *   `ctx.fillStyle = COLORS.TEXT;`
    *   `ctx.textAlign = 'left';`
    *   `ctx.fillText('Score: ' + state.score, 10, 30);`
    *   `ctx.textAlign = 'right';`
    *   `ctx.fillText('Lives: ' + state.lives, w - 10, 30);`
    *   `ctx.textAlign = 'center';`
    *   `ctx.fillText('Level: ' + state.level, w / 2, 30);`
    *   **Game Over/Win Screen**: Overlay text.
        *   `if (state.gameState === 'lose') { ... ctx.fillText('Game Over', w/2, h/2); ... }`
        *   `if (state.gameState === 'win') { ... ctx.fillText('You Win!', w/2, h/2); ... }`

## 4. AUDIO & SFX MAPPING

*   **'shoot'**: Not directly applicable in this concept as the paddle doesn't shoot. If 'Laser-Paddle' implied shooting, this could be used. *Not used for now.*
*   **'explode'**:
    *   When a brick with `hitsNeeded <= 0` is destroyed.
    *   When `state.lives` reaches 0 (`gameState === 'lose'`).
*   **'jump'**: Not directly applicable in this concept. *Not used.*
*   **'collect'**:
    *   When the player collects a powerup.
*   **'hit'**:
    *   When the ball collides with the paddle.
    *   When the ball collides with any wall (top, left, right).
    *   When the ball collides with a brick (even if it doesn't destroy it).