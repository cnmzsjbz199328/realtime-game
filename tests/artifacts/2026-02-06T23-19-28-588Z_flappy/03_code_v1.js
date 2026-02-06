const COLORS = { BG: "#111122", PLAYER: "#FFAA00", ENEMY: "#00CC44", ACCENT: "#664422", TEXT: "#FFFFFF" };

// Vector utilities - static methods only for state operations
const Vector = {
  add: (v1, v2) => ({ x: v1.x + v2.x, y: v1.y + v2.y }),
  sub: (v1, v2) => ({ x: v1.x - v2.x, y: v1.y - v2.y }),
  mult: (v, n) => ({ x: v.x * n, y: v.y * n }),
  div: (v, n) => ({ x: v.x / n, y: v.y / n }),
  dist: (v1, v2) => Math.sqrt((v2.x - v1.x) ** 2 + (v2.y - v1.y) ** 2),
  mag: (v) => Math.sqrt(v.x * v.x + v.y * v.y),
  dot: (v1, v2) => v1.x * v2.x + v1.y * v2.y,
  random2D: () => {
    const angle = Math.random() * Math.PI * 2;
    return { x: Math.cos(angle), y: Math.sin(angle) };
  }
};

const init = (state, w, h) => {
  state.score = 0;
  state.gameState = 'ready';
  state.lastPipeSpawnTime = 0;
  state.pipeSpawnInterval = 1.5;
  state.pipes = [];
  state.player = {
    position: { x: w / 4, y: h / 2 },
    velocity: { x: 0, y: 0 },
    radius: 10,
    gravity: 800,
    jumpImpulse: 300,
    impulseEndTime: 0
  };
  state.groundY = h - 30;
  state.parallaxBG1X = 0;
  state.parallaxBG2X = 0;
  state.parallaxSpeed1 = 50;
  state.parallaxSpeed2 = 80;
  state.lastTapTime = 0;
  state.tapDuration = 0.2;
  state.lastDown = false;
};

const update = (state, input, dt, w, h) => {
  const now = performance.now() / 1000;
  
  // Input handling with cooldown
  if (input.isDown && !state.lastDown) {
    if (state.gameState === 'ready') {
      state.gameState = 'playing';
      state.player.velocity.y = -state.player.jumpImpulse;
      state.player.impulseEndTime = now + state.tapDuration;
      state.lastTapTime = now;
    } else if (state.gameState === 'playing' && (now - state.lastTapTime > 0.1)) {
      state.player.velocity.y = -state.player.jumpImpulse;
      state.player.impulseEndTime = now + state.tapDuration;
      state.lastTapTime = now;
      sfx.play('jump');
    } else if (state.gameState === 'gameOver') {
      init(state, w, h);
    }
  }
  state.lastDown = input.isDown;

  if (state.gameState === 'playing') {
    // Player physics
    state.player.velocity.y += state.player.gravity * dt;
    state.player.velocity.y = Math.min(state.player.velocity.y, 500);
    
    // Update position using static vector math
    state.player.position = Vector.add(
      state.player.position,
      Vector.mult(state.player.velocity, dt)
    );

    // Boundary checks
    if (state.player.position.y - state.player.radius < 0) {
      state.player.position.y = state.player.radius;
      state.player.velocity.y = 0;
    }
    
    if (state.player.position.y + state.player.radius > state.groundY) {
      state.player.position.y = state.groundY - state.player.radius;
      state.player.velocity.y = 0;
      state.gameState = 'gameOver';
      sfx.play('hit');
    }

    // Pipe spawning
    if (now - state.lastPipeSpawnTime > state.pipeSpawnInterval) {
      const minGapCenter = state.player.radius * 5;
      const maxGapCenter = h - (h - state.groundY) - state.player.radius * 5;
      const gapCenterY = Math.random() * (maxGapCenter - minGapCenter) + minGapCenter;
      const gapHeight = 150;
      const pipeWidth = 60;
      
      state.pipes.push({
        x: w,
        gapHeight: gapHeight,
        gapCenterY: gapCenterY,
        width: pipeWidth,
        passed: false,
        topHeight: gapCenterY - gapHeight / 2,
        bottomY: gapCenterY + gapHeight / 2
      });
      
      state.lastPipeSpawnTime = now;
    }

    // Pipe movement and scoring
    const pipeSpeed = 150;
    for (let i = state.pipes.length - 1; i >= 0; i--) {
      const pipe = state.pipes[i];
      pipe.x -= pipeSpeed * dt;
      
      if (!pipe.passed && state.player.position.x > pipe.x + pipe.width) {
        pipe.passed = true;
        state.score++;
        sfx.play('collect');
      }
      
      if (pipe.x + pipe.width < 0) {
        state.pipes.splice(i, 1);
      }
    }

    // Collision detection
    const player = state.player;
    for (const pipe of state.pipes) {
      // Horizontal overlap check
      if (player.position.x + player.radius > pipe.x && 
          player.position.x - player.radius < pipe.x + pipe.width) {
        
        // Top pipe collision
        if (player.position.y - player.radius < pipe.topHeight) {
          state.gameState = 'gameOver';
          sfx.play('hit');
          break;
        }
        
        // Bottom pipe collision
        if (player.position.y + player.radius > pipe.bottomY) {
          state.gameState = 'gameOver';
          sfx.play('hit');
          break;
        }
      }
    }

    // Parallax scrolling
    state.parallaxBG1X -= state.parallaxSpeed1 * dt;
    state.parallaxBG2X -= state.parallaxSpeed2 * dt;
    
    if (state.parallaxBG1X < -w) state.parallaxBG1X = 0;
    if (state.parallaxBG2X < -w) state.parallaxBG2X = 0;
  }
};

const draw = (state, ctx, w, h) => {
  // Clear canvas
  ctx.fillStyle = COLORS.BG;
  ctx.fillRect(0, 0, w, h);

  // Parallax layers
  ctx.fillStyle = "#223344";
  ctx.fillRect(state.parallaxBG1X, 0, w, h);
  ctx.fillRect(state.parallaxBG1X + w, 0, w, h);
  
  ctx.fillStyle = "#335566";
  ctx.fillRect(state.parallaxBG2X, 0, w, h);
  ctx.fillRect(state.parallaxBG2X + w, 0, w, h);

  // Ground
  ctx.fillStyle = COLORS.ACCENT;
  ctx.fillRect(0, state.groundY, w, h - state.groundY);

  // Pipes
  ctx.fillStyle = COLORS.ENEMY;
  for (const pipe of state.pipes) {
    // Top pipe
    ctx.fillRect(pipe.x, 0, pipe.width, pipe.topHeight);
    // Bottom pipe
    ctx.fillRect(pipe.x, pipe.bottomY, pipe.width, h - pipe.bottomY);
  }

  // Player
  ctx.fillStyle = COLORS.PLAYER;
  ctx.beginPath();
  ctx.arc(state.player.position.x, state.player.position.y, state.player.radius, 0, Math.PI * 2);
  ctx.fill();

  // Score
  ctx.fillStyle = COLORS.TEXT;
  ctx.font = "32px monospace";
  ctx.textAlign = "center";
  ctx.fillText(state.score.toString(), w / 2, 50);

  // Game state messages
  if (state.gameState === 'ready') {
    ctx.font = "48px monospace";
    ctx.fillText("Tap to Start", w / 2, h / 2);
  } else if (state.gameState === 'gameOver') {
    ctx.font = "48px monospace";
    ctx.fillText("Game Over", w / 2, h / 2 - 50);
    ctx.font = "32px monospace";
    ctx.fillText(`Score: ${state.score}`, w / 2, h / 2);
    ctx.font = "24px monospace";
    ctx.fillText("Tap to Restart", w / 2, h / 2 + 50);
  }
};

return { init, update, draw };