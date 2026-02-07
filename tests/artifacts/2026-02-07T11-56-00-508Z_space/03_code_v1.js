// Helper functions (must not access w/h from closure)
function createVector(x, y) { return new Vector(x, y); }
function rectRect(rect1, rect2) {
  return rect1.x < rect2.x + rect2.width &&
         rect1.x + rect1.width > rect2.x &&
         rect1.y < rect2.y + rect2.height &&
         rect1.y + rect1.height > rect2.y;
}
function pointRect(point, rect) {
  return point.x > rect.x && point.x < rect.x + rect.width &&
         point.y > rect.y && point.y < rect.y + rect.height;
}

const init = (state, w, h) => {
  // Core game state
  state.score = 0;
  state.lives = 3;
  state.level = 1;
  state.wave = 0;
  state.waveState = 'descending';
  state.waveDirection = 'right';
  state.waveAdvanceTimer = 0;
  state.waveSpeedMultiplier = 1.0;
  state.gameOver = false;
  state.winCondition = false;
  
  // Player
  state.player = {
    x: w / 2,
    y: h - 30,
    width: 20,
    height: 20,
    speed: 300,
    color: COLORS.PLAYER,
    cooldown: 0,
    fireCooldown: 0.2
  };
  
  // Projectiles
  state.projectiles = [];
  
  // Enemies - grid of 5 rows, 11 columns
  state.enemies = [];
  const enemyRows = 5;
  const enemyCols = 11;
  const enemySpacing = 30;
  const enemyStartX = 50;
  const enemyStartY = 50;
  
  for (let row = 0; row < enemyRows; row++) {
    for (let col = 0; col < enemyCols; col++) {
      state.enemies.push({
        x: enemyStartX + col * enemySpacing,
        y: enemyStartY + row * enemySpacing,
        width: 20,
        height: 15,
        type: 'normal',
        color: COLORS.ENEMY,
        health: 1,
        isHitAnimation: false,
        hitTimer: 0,
        baseSpeed: 50,
        pointValue: 10 * (enemyRows - row) // Higher rows worth more
      });
    }
  }
  
  // Barriers - 4 evenly spaced
  state.barriers = [];
  const barrierCount = 4;
  const barrierWidth = 40;
  const barrierHeight = 20;
  const barrierSpacing = w / (barrierCount + 1);
  
  for (let i = 1; i <= barrierCount; i++) {
    state.barriers.push({
      x: barrierSpacing * i - barrierWidth / 2,
      y: h - 100,
      width: barrierWidth,
      height: barrierHeight,
      health: 3,
      color: COLORS.ACCENT
    });
  }
  
  // Mystery ship
  state.mysteryShip = {
    x: 0,
    y: 30,
    width: 30,
    height: 15,
    color: COLORS.ACCENT,
    velocity: 100,
    active: false,
    spawnTimer: 0,
    spawnInterval: 15 + Math.random() * 15
  };
  
  // Parallax stars (3 layers)
  state.stars = [];
  const starLayers = 3;
  for (let layer = 0; layer < starLayers; layer++) {
    const layerStars = [];
    const starCount = 50 - layer * 15;
    for (let i = 0; i < starCount; i++) {
      layerStars.push({
        x: Math.random() * w,
        y: Math.random() * h,
        speed: 20 + layer * 30,
        size: 1 + layer * 0.5
      });
    }
    state.stars.push(layerStars);
  }
};

const update = (state, input, dt, w, h) => {
  if (state.gameOver) return;
  
  // Update parallax stars
  for (let layer = 0; layer < state.stars.length; layer++) {
    const layerStars = state.stars[layer];
    for (let star of layerStars) {
      star.y += star.speed * dt;
      if (star.y > h) {
        star.y = 0;
        star.x = Math.random() * w;
      }
    }
  }
  
  // Player movement
  const playerSpeed = state.player.speed * dt;
  if (input.keys.ArrowLeft || input.keys.a || input.left) {
    state.player.x -= playerSpeed;
  }
  if (input.keys.ArrowRight || input.keys.d || input.right) {
    state.player.x += playerSpeed;
  }
  
  // Clamp player position
  state.player.x = Math.max(state.player.width / 2, 
                           Math.min(w - state.player.width / 2, state.player.x));
  
  // Player firing
  if ((input.keys.Space || input.isDown) && state.player.cooldown <= 0) {
    state.projectiles.push({
      x: state.player.x,
      y: state.player.y - state.player.height / 2,
      radius: 3,
      color: COLORS.ACCENT,
      velocity: createVector(0, -400)
    });
    state.player.cooldown = state.player.fireCooldown;
    if (typeof sfx !== 'undefined') sfx.play('shoot');
  }
  
  // Update cooldown
  if (state.player.cooldown > 0) {
    state.player.cooldown -= dt;
  }
  
  // Update projectiles
  for (let i = state.projectiles.length - 1; i >= 0; i--) {
    const proj = state.projectiles[i];
    proj.x += proj.velocity.x * dt;
    proj.y += proj.velocity.y * dt;
    
    // Remove if off-screen
    if (proj.y < 0 || proj.y > h || proj.x < 0 || proj.x > w) {
      state.projectiles.splice(i, 1);
      continue;
    }
    
    // Check collision with barriers
    for (let barrier of state.barriers) {
      if (barrier.health > 0 && pointRect(proj, barrier)) {
        barrier.health--;
        state.projectiles.splice(i, 1);
        if (typeof sfx !== 'undefined') sfx.play('hit');
        break;
      }
    }
  }
  
  // Update enemies
  let anyEnemyReachedBottom = false;
  let enemyMoveX = 0;
  const baseEnemySpeed = 50;
  
  // Wave state logic
  state.waveAdvanceTimer += dt;
  if (state.waveState === 'descending' && state.waveAdvanceTimer > 3) {
    state.waveState = 'shifting';
    state.waveAdvanceTimer = 0;
  } else if (state.waveState === 'shifting' && state.waveAdvanceTimer > 1) {
    state.waveDirection = state.waveDirection === 'right' ? 'left' : 'right';
    state.waveState = 'descending';
    state.waveAdvanceTimer = 0;
    state.waveSpeedMultiplier += 0.1;
  }
  
  // Calculate enemy movement
  if (state.waveState === 'descending') {
    enemyMoveX = (state.waveDirection === 'right' ? 1 : -1) * 
                 baseEnemySpeed * state.waveSpeedMultiplier * dt;
  }
  
  for (let i = state.enemies.length - 1; i >= 0; i--) {
    const enemy = state.enemies[i];
    
    // Update position
    enemy.x += enemyMoveX;
    if (state.waveState === 'descending') {
      enemy.y += baseEnemySpeed * state.waveSpeedMultiplier * dt;
    }
    
    // Clamp to screen edges
    if (enemy.x < 0) enemy.x = 0;
    if (enemy.x > w - enemy.width) enemy.x = w - enemy.width;
    
    // Check if reached bottom
    if (enemy.y + enemy.height > state.player.y) {
      anyEnemyReachedBottom = true;
    }
    
    // Update hit animation
    if (enemy.isHitAnimation) {
      enemy.hitTimer -= dt;
      if (enemy.hitTimer <= 0) {
        enemy.isHitAnimation = false;
      }
    }
    
    // Check projectile collisions
    for (let j = state.projectiles.length - 1; j >= 0; j--) {
      const proj = state.projectiles[j];
      const projRect = { 
        x: proj.x - proj.radius, 
        y: proj.y - proj.radius,
        width: proj.radius * 2, 
        height: proj.radius * 2 
      };
      
      if (rectRect(projRect, enemy)) {
        enemy.health--;
        if (enemy.health <= 0) {
          state.score += enemy.pointValue;
          state.enemies.splice(i, 1);
          if (typeof sfx !== 'undefined') sfx.play('explode');
        } else {
          enemy.isHitAnimation = true;
          enemy.hitTimer = 0.1;
          if (typeof sfx !== 'undefined') sfx.play('hit');
        }
        state.projectiles.splice(j, 1);
        break;
      }
    }
  }
  
  // Enemy reaches bottom penalty
  if (anyEnemyReachedBottom) {
    state.lives--;
    if (state.lives <= 0) {
      state.gameOver = true;
    }
    // Reset enemy positions slightly
    for (let enemy of state.enemies) {
      enemy.y -= 50;
    }
  }
  
  // Update mystery ship
  if (!state.mysteryShip.active) {
    state.mysteryShip.spawnTimer += dt;
    if (state.mysteryShip.spawnTimer > state.mysteryShip.spawnInterval) {
      state.mysteryShip.active = true;
      state.mysteryShip.x = -state.mysteryShip.width;
      state.mysteryShip.y = 30;
      state.mysteryShip.spawnTimer = 0;
      state.mysteryShip.spawnInterval = 15 + Math.random() * 15;
    }
  } else {
    state.mysteryShip.x += state.mysteryShip.velocity * dt;
    if (state.mysteryShip.x > w) {
      state.mysteryShip.active = false;
    }
    
    // Check collision with projectiles
    const shipRect = {
      x: state.mysteryShip.x,
      y: state.mysteryShip.y - state.mysteryShip.height / 2,
      width: state.mysteryShip.width,
      height: state.mysteryShip.height
    };
    
    for (let j = state.projectiles.length - 1; j >= 0; j--) {
      const proj = state.projectiles[j];
      const projRect = { 
        x: proj.x - proj.radius, 
        y: proj.y - proj.radius,
        width: proj.radius * 2, 
        height: proj.radius * 2 
      };
      
      if (rectRect(projRect, shipRect)) {
        state.score += 500;
        state.mysteryShip.active = false;
        state.projectiles.splice(j, 1);
        if (typeof sfx !== 'undefined') sfx.play('collect');
        break;
      }
    }
  }
  
  // Win condition
  if (state.enemies.length === 0) {
    state.winCondition = true;
    state.gameOver = true;
  }
};

const draw = (state, ctx, w, h) => {
  // Clear canvas
  ctx.fillStyle = COLORS.BG;
  ctx.fillRect(0, 0, w, h);
  
  // Draw parallax stars
  for (let layer = 0; layer < state.stars.length; layer++) {
    const layerStars = state.stars[layer];
    ctx.fillStyle = `rgba(255, 255, 255, ${0.3 + layer * 0.2})`;
    for (let star of layerStars) {
      ctx.fillRect(star.x, star.y, star.size, star.size);
    }
  }
  
  // Draw player
  ctx.fillStyle = state.player.color;
  ctx.fillRect(
    state.player.x - state.player.width / 2,
    state.player.y - state.player.height,
    state.player.width,
    state.player.height
  );
  
  // Draw projectiles
  for (let proj of state.projectiles) {
    ctx.fillStyle = proj.color;
    ctx.beginPath();
    ctx.arc(proj.x, proj.y, proj.radius, 0, Math.PI * 2);
    ctx.fill();
  }
  
  // Draw enemies
  for (let enemy of state.enemies) {
    if (enemy.isHitAnimation) {
      ctx.fillStyle = COLORS.TEXT;
    } else {
      ctx.fillStyle = enemy.color;
    }
    ctx.fillRect(enemy.x, enemy.y, enemy.width, enemy.height);
  }
  
  // Draw barriers
  for (let barrier of state.barriers) {
    if (barrier.health > 0) {
      ctx.fillStyle = barrier.color;
      const segmentHeight = barrier.height / 3;
      for (let i = 0; i < barrier.health; i++) {
        ctx.fillRect(
          barrier.x,
          barrier.y + (3 - barrier.health + i) * segmentHeight,
          barrier.width,
          segmentHeight
        );
      }
    }
  }
  
  // Draw mystery ship
  if (state.mysteryShip.active) {
    ctx.fillStyle = state.mysteryShip.color;
    ctx.beginPath();
    ctx.moveTo(state.mysteryShip.x, state.mysteryShip.y);
    ctx.lineTo(state.mysteryShip.x + state.mysteryShip.width, 
               state.mysteryShip.y - state.mysteryShip.height / 2);
    ctx.lineTo(state.mysteryShip.x + state.mysteryShip.width,
               state.mysteryShip.y + state.mysteryShip.height / 2);
    ctx.closePath();
    ctx.fill();
  }
  
  // Draw UI
  ctx.fillStyle = COLORS.TEXT;
  ctx.font = '16px monospace';
  ctx.textAlign = 'left';
  ctx.fillText(`Score: ${state.score}`, 10, 25);
  
  ctx.textAlign = 'center';
  ctx.fillText(`Level: ${state.level}`, w / 2, 25);
  
  ctx.textAlign = 'right';
  ctx.fillText(`Lives: ${state.lives}`, w - 10, 25);
  
  // Draw wave speed indicator
  ctx.textAlign = 'center';
  ctx.fillText(`Speed: ${state.waveSpeedMultiplier.toFixed(1)}x`, w / 2, h - 10);
  
  // Game over messages
  if (state.gameOver) {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(0, 0, w, h);
    
    ctx.fillStyle = COLORS.TEXT;
    ctx.font = '24px monospace';
    ctx.textAlign = 'center';
    
    if (state.winCondition) {
      ctx.fillText('VICTORY!', w / 2, h / 2 - 20);
      ctx.font = '16px monospace';
      ctx.fillText(`Final Score: ${state.score}`, w / 2, h / 2 + 20);
    } else {
      ctx.fillText('GAME OVER', w / 2, h / 2 - 20);
      ctx.font = '16px monospace';
      ctx.fillText(`Score: ${state.score}`, w / 2, h / 2 + 20);
    }
    
    ctx.fillText('Refresh to play again', w / 2, h / 2 + 60);
  }
};

return { init, update, draw };