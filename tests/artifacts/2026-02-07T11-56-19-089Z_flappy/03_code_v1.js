const init = (state, w, h) => {
  state.gameState = 'ready';
  state.canvasWidth = w;
  state.canvasHeight = h;
  
  // Player
  state.player = {
    position: new Vector(w * 0.3, h * 0.5),
    velocity: new Vector(0, 0),
    radius: Math.min(w, h) * 0.03,
    color: COLORS.PLAYER,
    lastInputState: { isDown: false }
  };
  
  // Obstacles
  state.obstacles = [];
  state.pipeSpawnInterval = 2.0;
  state.timeSinceLastPipe = state.pipeSpawnInterval * 0.7;
  state.scrollSpeed = w * 0.3;
  
  // Scoring
  state.score = 0;
  state.scoreAccumulator = 0;
  
  // Physics
  state.gravity = h * 0.8;
  state.flapImpulse = h * 0.5;
  
  // Parallax offsets
  state.bgOffset = 0;
  state.mgOffset = 0;
  state.fgOffset = 0;
  state.backgroundScrollSpeed = state.scrollSpeed * 0.2;
  state.midgroundScrollSpeed = state.scrollSpeed * 0.5;
  state.foregroundScrollSpeed = state.scrollSpeed;
  
  // Input
  state.justTapped = false;
};

const update = (state, input, dt, w, h) => {
  // Update dimensions if resized
  state.canvasWidth = w;
  state.canvasHeight = h;
  
  // Input handling
  if (input.isDown && !state.player.lastInputState.isDown) {
    state.justTapped = true;
  }
  state.player.lastInputState.isDown = input.isDown;
  
  // State transitions
  if (state.gameState === 'ready' && state.justTapped) {
    state.gameState = 'playing';
    state.justTapped = false;
  }
  
  if (state.gameState === 'gameOver' && state.justTapped) {
    // Reset game
    init(state, w, h);
    state.gameState = 'playing';
    state.justTapped = false;
    return;
  }
  
  if (state.gameState !== 'playing') return;
  
  // Apply flap impulse
  if (state.justTapped) {
    // Create temp vector for velocity adjustment
    let tempVel = new Vector(state.player.velocity.x, state.player.velocity.y);
    let flapVector = Vector.fromAngle(Math.PI * 1.5);
    flapVector = Vector.mult(flapVector, state.flapImpulse);
    tempVel = Vector.add(tempVel, flapVector);
    state.player.velocity.x = tempVel.x;
    state.player.velocity.y = tempVel.y;
    
    sfx.play('jump');
    state.justTapped = false;
  }
  
  // Apply gravity
  state.player.velocity.y += state.gravity * dt;
  
  // Update player position
  let newPos = Vector.add(state.player.position, Vector.mult(state.player.velocity, dt));
  state.player.position.x = newPos.x;
  state.player.position.y = newPos.y;
  
  // Keep player within vertical bounds (with ceiling)
  const minY = state.player.radius;
  const maxY = h - state.player.radius;
  state.player.position.y = Math.max(minY, Math.min(maxY, state.player.position.y));
  
  // Ground collision
  if (state.player.position.y >= maxY) {
    state.gameState = 'gameOver';
    sfx.play('hit');
    return;
  }
  
  // Update parallax offsets
  state.bgOffset -= state.backgroundScrollSpeed * dt;
  state.mgOffset -= state.midgroundScrollSpeed * dt;
  state.fgOffset -= state.foregroundScrollSpeed * dt;
  if (state.bgOffset <= -w) state.bgOffset = 0;
  if (state.mgOffset <= -w) state.mgOffset = 0;
  if (state.fgOffset <= -w) state.fgOffset = 0;
  
  // Update obstacles
  state.timeSinceLastPipe += dt;
  
  // Spawn new pipe
  if (state.timeSinceLastPipe >= state.pipeSpawnInterval) {
    const minGapCenter = state.player.radius * 4;
    const maxGapCenter = h - state.player.radius * 4;
    const gapCenterY = minGapCenter + Math.random() * (maxGapCenter - minGapCenter);
    const gapHeight = state.player.radius * 5;
    const pipeWidth = state.player.radius * 2.5;
    
    state.obstacles.push({
      gapCenterY: gapCenterY,
      gapHeight: gapHeight,
      pipeWidth: pipeWidth,
      scrollX: w,
      passed: false,
      color: COLORS.ENEMY
    });
    
    state.timeSinceLastPipe = 0;
    
    // Slightly increase difficulty
    state.scrollSpeed *= 1.005;
    state.pipeSpawnInterval = Math.max(1.0, state.pipeSpawnInterval * 0.995);
  }
  
  // Scroll obstacles and check collisions
  for (let i = state.obstacles.length - 1; i >= 0; i--) {
    const obstacle = state.obstacles[i];
    obstacle.scrollX -= state.scrollSpeed * dt;
    
    // Remove off-screen obstacles
    if (obstacle.scrollX + obstacle.pipeWidth < 0) {
      state.obstacles.splice(i, 1);
      continue;
    }
    
    // Circle-rectangle collision detection
    const topPipe = {
      x: obstacle.scrollX,
      y: 0,
      width: obstacle.pipeWidth,
      height: obstacle.gapCenterY - obstacle.gapHeight / 2
    };
    const bottomPipe = {
      x: obstacle.scrollX,
      y: obstacle.gapCenterY + obstacle.gapHeight / 2,
      width: obstacle.pipeWidth,
      height: h
    };
    
    // Helper function for collision
    const circleRectCollision = (circlePos, radius, rect) => {
      const closestX = Math.max(rect.x, Math.min(circlePos.x, rect.x + rect.width));
      const closestY = Math.max(rect.y, Math.min(circlePos.y, rect.y + rect.height));
      const dx = circlePos.x - closestX;
      const dy = circlePos.y - closestY;
      return (dx * dx + dy * dy) < (radius * radius);
    };
    
    if (circleRectCollision(state.player.position, state.player.radius, topPipe) ||
        circleRectCollision(state.player.position, state.player.radius, bottomPipe)) {
      state.gameState = 'gameOver';
      sfx.play('hit');
      return;
    }
    
    // Scoring
    if (!obstacle.passed && state.player.position.x > obstacle.scrollX + obstacle.pipeWidth) {
      obstacle.passed = true;
      state.score++;
      sfx.play('collect');
    }
  }
};

const draw = (state, ctx, w, h) => {
  // Clear with background color
  ctx.fillStyle = COLORS.BG;
  ctx.fillRect(0, 0, w, h);
  
  // Parallax background layers
  const patternSize = Math.max(w, h) * 0.1;
  
  // Far background (slowest)
  ctx.fillStyle = '#1a1a2e';
  for (let x = state.bgOffset; x < w + patternSize; x += patternSize * 2) {
    for (let y = 0; y < h; y += patternSize * 2) {
      ctx.fillRect(x, y, patternSize, patternSize);
    }
  }
  
  // Mid background
  ctx.fillStyle = '#16213e';
  for (let x = state.mgOffset; x < w + patternSize; x += patternSize) {
    for (let y = 0; y < h; y += patternSize) {
      if ((x + y) % (patternSize * 2) < patternSize) {
        ctx.fillRect(x, y, patternSize / 2, patternSize / 2);
      }
    }
  }
  
  // Draw obstacles
  for (const obstacle of state.obstacles) {
    ctx.fillStyle = obstacle.color;
    
    // Top pipe
    const topHeight = obstacle.gapCenterY - obstacle.gapHeight / 2;
    if (topHeight > 0) {
      ctx.fillRect(obstacle.scrollX, 0, obstacle.pipeWidth, topHeight);
      
      // Pipe cap (accent)
      ctx.fillStyle = COLORS.ACCENT;
      ctx.fillRect(obstacle.scrollX - 2, topHeight - 10, obstacle.pipeWidth + 4, 10);
    }
    
    // Bottom pipe
    const bottomY = obstacle.gapCenterY + obstacle.gapHeight / 2;
    const bottomHeight = h - bottomY;
    if (bottomHeight > 0) {
      ctx.fillStyle = obstacle.color;
      ctx.fillRect(obstacle.scrollX, bottomY, obstacle.pipeWidth, bottomHeight);
      
      // Pipe cap (accent)
      ctx.fillStyle = COLORS.ACCENT;
      ctx.fillRect(obstacle.scrollX - 2, bottomY, obstacle.pipeWidth + 4, 10);
    }
  }
  
  // Draw player as pixel-art square
  ctx.fillStyle = state.player.color;
  const playerX = state.player.position.x - state.player.radius;
  const playerY = state.player.position.y - state.player.radius;
  const size = state.player.radius * 2;
  
  // Main body
  ctx.fillRect(playerX, playerY, size, size);
  
  // Eye
  ctx.fillStyle = COLORS.TEXT;
  const eyeSize = size * 0.3;
  ctx.fillRect(playerX + size * 0.6, playerY + size * 0.3, eyeSize, eyeSize);
  
  // Wing (animated with velocity)
  const wingOffset = Math.sin(state.player.velocity.y * 0.1) * size * 0.1;
  ctx.fillStyle = '#00aaff';
  ctx.fillRect(playerX - size * 0.2, playerY + size * 0.5 + wingOffset, size * 0.5, size * 0.3);
  
  // Draw score
  ctx.fillStyle = COLORS.TEXT;
  ctx.font = `bold ${Math.min(w, h) * 0.05}px monospace`;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';
  ctx.fillText(`SCORE: ${state.score}`, w * 0.05, h * 0.05);
  
  // Draw game state messages
  if (state.gameState === 'ready') {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(0, 0, w, h);
    
    ctx.fillStyle = COLORS.ACCENT;
    ctx.font = `bold ${Math.min(w, h) * 0.08}px monospace`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('PIXEL FLAP', w / 2, h / 3);
    
    ctx.fillStyle = COLORS.TEXT;
    ctx.font = `bold ${Math.min(w, h) * 0.04}px monospace`;
    ctx.fillText('TAP TO FLAP', w / 2, h / 2);
    ctx.fillText('NAVIGATE THROUGH GAPS', w / 2, h / 2 + h * 0.08);
  }
  
  if (state.gameState === 'gameOver') {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
    ctx.fillRect(0, 0, w, h);
    
    ctx.fillStyle = COLORS.ENEMY;
    ctx.font = `bold ${Math.min(w, h) * 0.09}px monospace`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('GAME OVER', w / 2, h / 3);
    
    ctx.fillStyle = COLORS.TEXT;
    ctx.font = `bold ${Math.min(w, h) * 0.05}px monospace`;
    ctx.fillText(`FINAL SCORE: ${state.score}`, w / 2, h / 2);
    
    ctx.fillStyle = COLORS.ACCENT;
    ctx.font = `bold ${Math.min(w, h) * 0.04}px monospace`;
    ctx.fillText('TAP TO RESTART', w / 2, h * 2 / 3);
  }
};

return { init, update, draw };