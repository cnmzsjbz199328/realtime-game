// Constants
const GRID_SIZE = 40;
const WAYPOINTS = [
  { x: 50, y: 100 },
  { x: 150, y: 100 },
  { x: 150, y: 250 },
  { x: 300, y: 250 },
  { x: 300, y: 400 },
  { x: 500, y: 400 },
  { x: 500, y: 150 },
  { x: 650, y: 150 }
];

const TowerConfig = {
  rapidFire: { 
    cost: 50, 
    upgradeCostMultiplier: 1.5, 
    baseRange: 150, 
    baseDamage: 10, 
    baseFireRate: 5,
    bulletSpeed: 500,
    color: '#ffff00'
  },
  frost: { 
    cost: 75, 
    upgradeCostMultiplier: 1.7, 
    baseRange: 120, 
    baseDamage: 5, 
    baseFireRate: 2,
    bulletSpeed: 400,
    color: '#00ffff',
    effect: { type: 'slow', value: 0.5, duration: 2 }
  },
  mortar: { 
    cost: 100, 
    upgradeCostMultiplier: 1.8, 
    baseRange: 180, 
    baseDamage: 25, 
    baseFireRate: 1,
    bulletSpeed: 300,
    color: '#ff0066',
    effect: { type: 'aoe', value: 50, duration: 0 }
  }
};

const EnemyConfig = {
  basic: { health: 30, speed: 50, gold: 10, color: '#ff5555' },
  fast: { health: 15, speed: 80, gold: 15, color: '#ffaa00' },
  armored: { health: 100, speed: 30, gold: 30, color: '#aaaaaa' },
  elite: { health: 200, speed: 60, gold: 50, color: '#ff00ff' }
};

// Helper functions
function generateId() {
  return Math.random().toString(36).substr(2, 9);
}

function snapToGrid(x, y) {
  return {
    x: Math.floor(x / GRID_SIZE) * GRID_SIZE + GRID_SIZE/2,
    y: Math.floor(y / GRID_SIZE) * GRID_SIZE + GRID_SIZE/2
  };
}

function getGridCell(x, y) {
  return {
    x: Math.floor(x / GRID_SIZE),
    y: Math.floor(y / GRID_SIZE)
  };
}

function isOnPath(x, y) {
  const cell = getGridCell(x, y);
  const pathCells = WAYPOINTS.map(wp => ({
    x: Math.floor(wp.x / GRID_SIZE),
    y: Math.floor(wp.y / GRID_SIZE)
  }));
  
  // Check if cell is near any waypoint (within 1 cell)
  for (const pathCell of pathCells) {
    if (Math.abs(cell.x - pathCell.x) <= 1 && Math.abs(cell.y - pathCell.y) <= 1) {
      return true;
    }
  }
  return false;
}

function isOccupiedByTower(state, x, y) {
  const cell = getGridCell(x, y);
  return state.towers.some(t => {
    const tCell = getGridCell(t.position.x, t.position.y);
    return tCell.x === cell.x && tCell.y === cell.y;
  });
}

function distance(v1, v2) {
  return Vector.distance(v1, v2);
}

function normalize(v) {
  const mag = Math.sqrt(v.x * v.x + v.y * v.y);
  if (mag === 0) return { x: 0, y: 0 };
  return { x: v.x / mag, y: v.y / mag };
}

// Game functions
function init(state, w, h) {
  state.score = 0;
  state.wave = 1;
  state.coreHealth = 100;
  state.gold = 100;
  state.waveTimer = 10.0;
  state.waveState = 'waiting'; // waiting, active, completed
  state.towers = [];
  state.enemies = [];
  state.projectiles = [];
  state.placementGhost = null;
  state.selectedTower = null;
  state.ui = {
    buttonHover: [
      { type: 'rapidFire', hover: false, x: 20, y: h - 120, width: 100, height: 50 },
      { type: 'frost', hover: false, x: 140, y: h - 120, width: 100, height: 50 },
      { type: 'mortar', hover: false, x: 260, y: h - 120, width: 100, height: 50 }
    ]
  };
  state.lastDown = false;
}

function update(state, input, dt, w, h) {
  // Update UI button positions (in case h changed)
  state.ui.buttonHover[0].y = h - 120;
  state.ui.buttonHover[1].y = h - 120;
  state.ui.buttonHover[2].y = h - 120;
  
  // Input handling
  const mousePressed = input.isDown && !state.lastDown;
  state.lastDown = input.isDown;
  
  // Update button hover states
  for (const button of state.ui.buttonHover) {
    button.hover = input.x >= button.x && 
                  input.x <= button.x + button.width &&
                  input.y >= button.y && 
                  input.y <= button.y + button.height;
    
    // Click to start placing tower
    if (mousePressed && button.hover) {
      const config = TowerConfig[button.type];
      if (state.gold >= config.cost) {
        state.placementGhost = {
          x: input.x,
          y: input.y,
          towerType: button.type,
          valid: true
        };
      }
    }
  }
  
  // Update placement ghost
  if (state.placementGhost) {
    const snapped = snapToGrid(input.x, input.y);
    state.placementGhost.x = snapped.x;
    state.placementGhost.y = snapped.y;
    
    // Check if placement is valid
    state.placementGhost.valid = 
      !isOnPath(snapped.x, snapped.y) && 
      !isOccupiedByTower(state, snapped.x, snapped.y) &&
      state.gold >= TowerConfig[state.placementGhost.towerType].cost;
    
    // Place tower on click
    if (mousePressed && state.placementGhost.valid) {
      const type = state.placementGhost.towerType;
      const config = TowerConfig[type];
      
      state.gold -= config.cost;
      
      state.towers.push({
        id: generateId(),
        type: type,
        position: { x: snapped.x, y: snapped.y },
        level: 1,
        fireCooldown: 0,
        targetEnemyId: null,
        range: config.baseRange,
        damage: config.baseDamage,
        fireRate: config.baseFireRate,
        bulletSpeed: config.bulletSpeed,
        effect: config.effect || null
      });
      
      state.placementGhost = null;
    }
    
    // Cancel placement with right click or escape
    if (input.keys.Escape || (input.isDown && input.button === 2)) {
      state.placementGhost = null;
    }
  }
  
  // Select tower on click
  if (mousePressed && !state.placementGhost) {
    state.selectedTower = null;
    for (const tower of state.towers) {
      if (distance({ x: input.x, y: input.y }, tower.position) < 20) {
        state.selectedTower = tower.id;
        break;
      }
    }
  }
  
  // Wave management
  if (state.waveState === 'waiting') {
    state.waveTimer -= dt;
    if (state.waveTimer <= 0) {
      state.waveState = 'active';
      spawnWave(state, state.wave);
    }
  } else if (state.waveState === 'active') {
    if (state.enemies.length === 0) {
      state.waveState = 'completed';
      state.waveTimer = 15.0;
      state.gold += 50 + state.wave * 10;
    }
  } else if (state.waveState === 'completed') {
    state.waveTimer -= dt;
    if (state.waveTimer <= 0) {
      state.waveState = 'waiting';
      state.wave += 1;
      state.waveTimer = 10.0;
    }
  }
  
  // Update towers
  for (const tower of state.towers) {
    // Update cooldown
    tower.fireCooldown = Math.max(0, tower.fireCooldown - dt);
    
    // Find target
    if (!tower.targetEnemyId || tower.fireCooldown > 0) {
      let closestEnemy = null;
      let closestDist = tower.range;
      
      for (const enemy of state.enemies) {
        const dist = distance(tower.position, enemy.position);
        if (dist < closestDist) {
          closestDist = dist;
          closestEnemy = enemy;
        }
      }
      
      if (closestEnemy) {
        tower.targetEnemyId = closestEnemy.id;
      }
    }
    
    // Fire at target
    if (tower.fireCooldown === 0 && tower.targetEnemyId) {
      const targetEnemy = state.enemies.find(e => e.id === tower.targetEnemyId);
      if (targetEnemy && distance(tower.position, targetEnemy.position) <= tower.range) {
        // Create projectile
        const dir = normalize(Vector.sub(targetEnemy.position, tower.position));
        const velocity = Vector.mult(dir, tower.bulletSpeed);
        
        state.projectiles.push({
          id: generateId(),
          type: tower.type === 'mortar' ? 'mortarShell' : (tower.type === 'frost' ? 'frost' : 'bullet'),
          position: { ...tower.position },
          velocity: velocity,
          damage: tower.damage,
          shooterId: tower.id,
          targetId: targetEnemy.id,
          radius: tower.type === 'mortar' ? 50 : 0,
          impactEffect: tower.effect,
          // Mortar shells have gravity-like arc
          gravity: tower.type === 'mortar' ? 200 : 0
        });
        
        tower.fireCooldown = 1.0 / tower.fireRate;
      } else {
        tower.targetEnemyId = null;
      }
    }
  }
  
  // Update projectiles
  for (let i = state.projectiles.length - 1; i >= 0; i--) {
    const p = state.projectiles[i];
    
    // Apply gravity for mortar shells
    if (p.gravity) {
      p.velocity.y += p.gravity * dt;
    }
    
    // Update position
    p.position = Vector.add(p.position, Vector.mult(p.velocity, dt));
    
    // Check for hits
    if (p.type === 'bullet' || p.type === 'frost') {
      const target = state.enemies.find(e => e.id === p.targetId);
      if (!target || distance(p.position, target.position) < 10) {
        if (target) {
          // Apply damage
          target.health -= p.damage;
          
          // Apply effects
          if (p.impactEffect) {
            if (p.impactEffect.type === 'slow') {
              target.isFrozen = true;
              target.frozenTimer = p.impactEffect.duration;
              target.slowMultiplier = p.impactEffect.value;
            }
          }
          
          // Check if enemy died
          if (target.health <= 0) {
            state.gold += EnemyConfig[target.type].gold;
            state.score += 100;
            state.enemies = state.enemies.filter(e => e.id !== target.id);
          }
        }
        state.projectiles.splice(i, 1);
        continue;
      }
    } else if (p.type === 'mortarShell') {
      // Mortar shells explode when they hit the ground or reach target
      const target = state.enemies.find(e => e.id === p.targetId);
      const shouldExplode = !target || 
                          distance(p.position, target.position) < 20 || 
                          p.position.y > h - 50;
      
      if (shouldExplode) {
        // Find enemies in blast radius
        const explosionPos = target ? target.position : p.position;
        for (const enemy of state.enemies) {
          if (distance(explosionPos, enemy.position) < p.radius) {
            enemy.health -= p.damage;
            if (enemy.health <= 0) {
              state.gold += EnemyConfig[enemy.type].gold;
              state.score += 100;
            }
          }
        }
        // Remove killed enemies
        state.enemies = state.enemies.filter(e => e.health > 0);
        state.projectiles.splice(i, 1);
        continue;
      }
    }
    
    // Remove projectiles that go off-screen
    if (p.position.x < -100 || p.position.x > w + 100 || 
        p.position.y < -100 || p.position.y > h + 100) {
      state.projectiles.splice(i, 1);
    }
  }
  
  // Update enemies
  for (let i = state.enemies.length - 1; i >= 0; i--) {
    const enemy = state.enemies[i];
    
    // Update frozen state
    if (enemy.isFrozen) {
      enemy.frozenTimer -= dt;
      if (enemy.frozenTimer <= 0) {
        enemy.isFrozen = false;
      }
    }
    
    // Move along path
    if (enemy.pathIndex < WAYPOINTS.length) {
      const targetWaypoint = WAYPOINTS[enemy.pathIndex];
      const dir = normalize(Vector.sub(targetWaypoint, enemy.position));
      
      // Apply slow if frozen
      const speed = enemy.isFrozen ? 
                    enemy.baseSpeed * (enemy.slowMultiplier || 0.5) : 
                    enemy.baseSpeed;
      
      const movement = Vector.mult(dir, speed * dt);
      enemy.position = Vector.add(enemy.position, movement);
      
      // Check if reached waypoint
      if (distance(enemy.position, targetWaypoint) < 5) {
        enemy.pathIndex++;
        
        // Check if reached core
        if (enemy.pathIndex >= WAYPOINTS.length) {
          state.coreHealth -= 10;
          state.enemies.splice(i, 1);
          continue;
        }
      }
    }
  }
  
  // Game over check
  if (state.coreHealth <= 0) {
    state.coreHealth = 0;
    // Could add game over state here
  }
}

function draw(state, ctx, w, h) {
  // Clear canvas
  ctx.fillStyle = COLORS.BG;
  ctx.fillRect(0, 0, w, h);
  
  // Draw grid (subtle)
  ctx.strokeStyle = '#1a1a1a';
  ctx.lineWidth = 1;
  for (let x = 0; x < w; x += GRID_SIZE) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, h);
    ctx.stroke();
  }
  for (let y = 0; y < h; y += GRID_SIZE) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(w, y);
    ctx.stroke();
  }
  
  // Draw path
  ctx.strokeStyle = COLORS.ACCENT;
  ctx.lineWidth = 15;
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(WAYPOINTS[0].x, WAYPOINTS[0].y);
  for (let i = 1; i < WAYPOINTS.length; i++) {
    ctx.lineTo(WAYPOINTS[i].x, WAYPOINTS[i].y);
  }
  ctx.stroke();
  
  // Draw core
  const corePos = WAYPOINTS[WAYPOINTS.length - 1];
  ctx.fillStyle = COLORS.PLAYER;
  ctx.beginPath();
  ctx.arc(corePos.x, corePos.y, 30, 0, Math.PI * 2);
  ctx.fill();
  
  // Draw core health bar
  const barWidth = 100;
  const barHeight = 10;
  ctx.fillStyle = '#333';
  ctx.fillRect(corePos.x - barWidth/2, corePos.y - 60, barWidth, barHeight);
  ctx.fillStyle = COLORS.ACCENT;
  ctx.fillRect(corePos.x - barWidth/2, corePos.y - 60, (state.coreHealth / 100) * barWidth, barHeight);
  
  // Draw enemies
  for (const enemy of state.enemies) {
    // Enemy body
    ctx.fillStyle = enemy.color;
    ctx.beginPath();
    ctx.arc(enemy.position.x, enemy.position.y, 12, 0, Math.PI * 2);
    ctx.fill();
    
    // Health bar
    const healthWidth = 30;
    ctx.fillStyle = '#333';
    ctx.fillRect(enemy.position.x - healthWidth/2, enemy.position.y - 25, healthWidth, 4);
    ctx.fillStyle = COLORS.ACCENT;
    ctx.fillRect(enemy.position.x - healthWidth/2, enemy.position.y - 25, 
                 (enemy.health / enemy.maxHealth) * healthWidth, 4);
    
    // Frozen effect
    if (enemy.isFrozen) {
      ctx.strokeStyle = '#00ffff';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(enemy.position.x, enemy.position.y, 15, 0, Math.PI * 2);
      ctx.stroke();
    }
  }
  
  // Draw towers
  for (const tower of state.towers) {
    // Tower base
    ctx.fillStyle = COLORS.TEXT;
    ctx.beginPath();
    ctx.arc(tower.position.x, tower.position.y, 15, 0, Math.PI * 2);
    ctx.fill();
    
    // Tower type indicator
    ctx.fillStyle = TowerConfig[tower.type].color;
    ctx.beginPath();
    if (tower.type === 'rapidFire') {
      // Square
      ctx.fillRect(tower.position.x - 8, tower.position.y - 8, 16, 16);
    } else if (tower.type === 'frost') {
      // Triangle
      ctx.moveTo(tower.position.x, tower.position.y - 10);
      ctx.lineTo(tower.position.x - 8, tower.position.y + 8);
      ctx.lineTo(tower.position.x + 8, tower.position.y + 8);
      ctx.closePath();
      ctx.fill();
    } else if (tower.type === 'mortar') {
      // Circle
      ctx.arc(tower.position.x, tower.position.y, 10, 0, Math.PI * 2);
      ctx.fill();
    }
    
    // Range indicator if selected
    if (state.selectedTower === tower.id) {
      ctx.strokeStyle = TowerConfig[tower.type].color + '80';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(tower.position.x, tower.position.y, tower.range, 0, Math.PI * 2);
      ctx.stroke();
    }
  }
  
  // Draw projectiles
  for (const p of state.projectiles) {
    if (p.type === 'bullet') {
      ctx.fillStyle = '#ffff00';
      ctx.beginPath();
      ctx.arc(p.position.x, p.position.y, 3, 0, Math.PI * 2);
      ctx.fill();
    } else if (p.type === 'frost') {
      ctx.fillStyle = '#00ffff';
      ctx.beginPath();
      ctx.arc(p.position.x, p.position.y, 5, 0, Math.PI * 2);
      ctx.fill();
    } else if (p.type === 'mortarShell') {
      ctx.fillStyle = '#ff0066';
      ctx.beginPath();
      ctx.arc(p.position.x, p.position.y, 6, 0, Math.PI * 2);
      ctx.fill();
      
      // Trail
      ctx.strokeStyle = '#ff006640';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(p.position.x - p.velocity.x * 0.1, p.position.y - p.velocity.y * 0.1);
      ctx.lineTo(p.position.x, p.position.y);
      ctx.stroke();
    }
  }
  
  // Draw placement ghost
  if (state.placementGhost) {
    const config = TowerConfig[state.placementGhost.towerType];
    ctx.fillStyle = state.placementGhost.valid ? config.color + '80' : '#ff000080';
    ctx.beginPath();
    ctx.arc(state.placementGhost.x, state.placementGhost.y, 15, 0, Math.PI * 2);
    ctx.fill();
    
    // Show range
    ctx.strokeStyle = config.color + '40';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(state.placementGhost.x, state.placementGhost.y, config.baseRange, 0, Math.PI * 2);
    ctx.stroke();
  }
  
  // Draw UI
  ctx.fillStyle = COLORS.TEXT;
  ctx.font = '20px monospace';
  ctx.fillText(`Gold: ${Math.floor(state.gold)}`, 20, 40);
  ctx.fillText(`Wave: ${state.wave}`, 20, 70);
  ctx.fillText(`Health: ${Math.floor(state.coreHealth)}`, 20, 100);
  
  if (state.waveState === 'waiting') {
    ctx.fillText(`Next wave in: ${Math.ceil(state.waveTimer)}s`, w - 200, 40);
  } else if (state.waveState === 'active') {
    ctx.fillText(`Enemies: ${state.enemies.length}`, w - 200, 40);
  } else {
    ctx.fillText(`Wave complete!`, w - 200, 40);
  }
  
  // Draw tower buttons
  for (const button of state.ui.buttonHover) {
    const config = TowerConfig[button.type];
    
    // Button background
    ctx.fillStyle = button.hover ? '#333' : '#222';
    ctx.fillRect(button.x, button.y, button.width, button.height);
    
    // Button border
    ctx.strokeStyle = config.color;
    ctx.lineWidth = 2;
    ctx.strokeRect(button.x, button.y, button.width, button.height);
    
    // Button text
    ctx.fillStyle = COLORS.TEXT;
    ctx.font = '14px monospace';
    ctx.textAlign = 'center';
    ctx.fillText(
      button.type.charAt(0).toUpperCase() + button.type.slice(1),
      button.x + button.width/2,
      button.y + 30
    );
    
    // Cost
    ctx.font = '12px monospace';
    ctx.fillStyle = state.gold >= config.cost ? '#ffff00' : '#ff5555';
    ctx.fillText(
      `$${config.cost}`,
      button.x + button.width/2,
      button.y + 45
    );
    
    ctx.textAlign = 'left';
  }
  
  // Draw wave status
  ctx.fillStyle = COLORS.TEXT;
  ctx.font = '16px monospace';
  ctx.textAlign = 'center';
  if (state.waveState === 'waiting') {
    ctx.fillText(`Prepare for wave ${state.wave}`, w/2, 40);
  } else if (state.waveState === 'active') {
    ctx.fillText(`Wave ${state.wave} in progress`, w/2, 40);
  }
  ctx.textAlign = 'left';
}

function spawnWave(state, wave) {
  const enemyTypes = ['basic', 'fast', 'armored', 'elite'];
  const count = 5 + wave * 3;
  
  for (let i = 0; i < count; i++) {
    const type = wave < 3 ? 'basic' : 
                 wave < 5 ? enemyTypes[Math.floor(Math.random() * 2)] :
                 wave < 8 ? enemyTypes[Math.floor(Math.random() * 3)] :
                 enemyTypes[Math.floor(Math.random() * 4)];
    
    const config = EnemyConfig[type];
    
    state.enemies.push({
      id: generateId(),
      type: type,
      position: { ...WAYPOINTS[0] },
      pathIndex: 1,
      health: config.health * (1 + (wave - 1) * 0.2),
      maxHealth: config.health * (1 + (wave - 1) * 0.2),
      baseSpeed: config.speed,
      speed: config.speed,
      isFrozen: false,
      frozenTimer: 0,
      gold: config.gold,
      color: config.color
    });
  }
}

return { init, update, draw };