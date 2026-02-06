const init = (state, w, h) => {
    // Initialize core state
    state.score = 0;
    state.level = 1;
    state.lives = 3;
    state.gameState = 'playing';
    state.lastDown = false;
    
    // Initialize paddle
    state.paddle = {
        x: 0,
        y: 0,
        width: w * 0.2,
        height: h * 0.02,
        speed: 500
    };
    
    // Initialize ball
    state.ball = {
        position: new Vector(0, 0),
        velocity: new Vector(0, 0),
        radius: h * 0.015,
        speed: w * 0.07
    };
    
    // Initialize collections
    state.bricks = [];
    state.powerups = [];
    state.particles = [];
    state.activePowerups = {};
    
    // Set positions
    state.paddle.y = h - state.paddle.height * 2;
    state.paddle.x = (w - state.paddle.width) / 2;
    
    // Create level
    createLevel(state, w, h);
    
    // Reset ball to starting position
    resetBall(state, w, h);
};

const resetBall = (state, w, h) => {
    // Position ball on paddle
    state.ball.position = new Vector(
        state.paddle.x + state.paddle.width / 2,
        state.paddle.y - state.ball.radius - 1
    );
    
    // Launch ball with random angle
    const angle = -Math.PI / 4 + Math.random() * Math.PI / 2;
    state.ball.velocity = new Vector(
        Math.cos(angle) * state.ball.speed,
        Math.sin(angle) * state.ball.speed
    );
};

const createLevel = (state, w, h) => {
    const bricks = [];
    const brickWidth = w * 0.08;
    const brickHeight = h * 0.03;
    const gap = w * 0.01;
    const rows = 5;
    const cols = Math.floor((w - gap) / (brickWidth + gap));
    const startY = h * 0.1;
    
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
                movingSpeed: w * 0.05
            };
            
            // Level variations
            if (state.level > 1 && r === 1 && c === Math.floor(cols/2)) {
                brick.type = 'armored';
                brick.hitsNeeded = 3;
                brick.color = '#FF00FF';
            }
            if (state.level > 2 && r === 2) {
                brick.type = 'moving';
            }
            
            bricks.push(brick);
        }
    }
    
    state.bricks = bricks;
};

const addParticles = (state, x, y, color) => {
    for (let i = 0; i < 15; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = 50 + Math.random() * 100;
        state.particles.push({
            position: new Vector(x, y),
            velocity: new Vector(Math.cos(angle) * speed, Math.sin(angle) * speed),
            color: color,
            lifetime: 0.5 + Math.random() * 0.5,
            size: 2 + Math.random() * 3
        });
    }
};

const dropPowerup = (state, x, y) => {
    const types = ['multi_ball', 'laser_paddle'];
    const type = types[Math.floor(Math.random() * types.length)];
    
    state.powerups.push({
        x: x - 10,
        y: y,
        type: type,
        color: type === 'multi_ball' ? '#00FF00' : '#FF0000',
        size: 20,
        velocity: new Vector(0, 150),
        active: true,
        lifetime: 10
    });
};

const activatePowerup = (state, type) => {
    if (type === 'multi_ball') {
        // Create additional balls
        for (let i = 0; i < 2; i++) {
            const angle = -Math.PI / 3 + Math.random() * Math.PI / 1.5;
            state.powerups.push({
                type: 'extra_ball',
                position: new Vector(state.paddle.x + state.paddle.width / 2, state.paddle.y),
                velocity: new Vector(Math.cos(angle) * state.ball.speed, Math.sin(angle) * state.ball.speed),
                radius: state.ball.radius,
                active: true,
                lifetime: 5
            });
        }
        sfx.play('collect');
    } else if (type === 'laser_paddle') {
        state.activePowerups.laser = 10; // Duration in seconds
        sfx.play('collect');
    }
};

const update = (state, input, dt, w, h) => {
    // Store previous mouse state for click detection
    const wasDown = state.lastDown;
    state.lastDown = input.isDown;
    
    // Handle game states
    if (state.gameState === 'paused') {
        if (input.isDown && !wasDown) {
            state.gameState = 'playing';
        }
        return;
    }
    
    if (state.gameState === 'win' || state.gameState === 'lose') {
        if (input.isDown && !wasDown) {
            // Restart game
            init(state, w, h);
        }
        return;
    }
    
    // Pause with space
    if (input.keys['Space'] && !state.lastSpace) {
        state.gameState = state.gameState === 'playing' ? 'paused' : 'playing';
    }
    state.lastSpace = input.keys['Space'];
    
    // Paddle movement
    if (input.x !== undefined) {
        state.paddle.x = input.x - state.paddle.width / 2;
    }
    
    if (input.keys['ArrowLeft'] || input.keys['a']) {
        state.paddle.x -= state.paddle.speed * dt;
    }
    if (input.keys['ArrowRight'] || input.keys['d']) {
        state.paddle.x += state.paddle.speed * dt;
    }
    
    // Clamp paddle to screen
    state.paddle.x = Math.max(0, Math.min(w - state.paddle.width, state.paddle.x));
    
    // Update moving bricks
    state.bricks.forEach(brick => {
        if (brick.active && brick.type === 'moving') {
            brick.x = brick.initialX + Math.sin(Date.now() / 1000) * brick.movingSpeed;
        }
    });
    
    // Update ball position
    state.ball.position = Vector.add(state.ball.position, Vector.mult(state.ball.velocity, dt));
    
    // Ball collision with walls
    if (state.ball.position.y - state.ball.radius < 0) {
        state.ball.position.y = state.ball.radius;
        state.ball.velocity.y = -state.ball.velocity.y;
        sfx.play('hit');
    }
    
    if (state.ball.position.x - state.ball.radius < 0) {
        state.ball.position.x = state.ball.radius;
        state.ball.velocity.x = -state.ball.velocity.x;
        sfx.play('hit');
    }
    
    if (state.ball.position.x + state.ball.radius > w) {
        state.ball.position.x = w - state.ball.radius;
        state.ball.velocity.x = -state.ball.velocity.x;
        sfx.play('hit');
    }
    
    // Ball collision with paddle
    const paddleLeft = state.paddle.x;
    const paddleRight = state.paddle.x + state.paddle.width;
    const paddleTop = state.paddle.y;
    
    if (state.ball.position.y + state.ball.radius > paddleTop &&
        state.ball.position.y < paddleTop + state.paddle.height &&
        state.ball.position.x + state.ball.radius > paddleLeft &&
        state.ball.position.x - state.ball.radius < paddleRight) {
        
        state.ball.position.y = paddleTop - state.ball.radius;
        const hitPos = (state.ball.position.x - (state.paddle.x + state.paddle.width / 2)) / (state.paddle.width / 2);
        const newVx = hitPos * state.ball.speed * 0.7 + state.ball.velocity.x * 0.3;
        const speed = Math.sqrt(newVx * newVx + state.ball.velocity.y * state.ball.velocity.y);
        const scale = state.ball.speed / speed;
        
        state.ball.velocity = new Vector(newVx * scale, -Math.abs(state.ball.velocity.y) * scale);
        sfx.play('hit');
    }
    
    // Ball falls below paddle
    if (state.ball.position.y - state.ball.radius > h) {
        state.lives--;
        if (state.lives <= 0) {
            state.gameState = 'lose';
            sfx.play('explode');
        } else {
            resetBall(state, w, h);
        }
    }
    
    // Brick collisions
    for (let i = state.bricks.length - 1; i >= 0; i--) {
        const brick = state.bricks[i];
        if (!brick.active) continue;
        
        // AABB collision
        const closestX = Math.max(brick.x, Math.min(state.ball.position.x, brick.x + brick.width));
        const closestY = Math.max(brick.y, Math.min(state.ball.position.y, brick.y + brick.height));
        const dx = state.ball.position.x - closestX;
        const dy = state.ball.position.y - closestY;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance < state.ball.radius) {
            brick.hitsNeeded--;
            state.score += 10;
            sfx.play('hit');
            addParticles(state, closestX, closestY, brick.color);
            
            if (brick.hitsNeeded <= 0) {
                brick.active = false;
                sfx.play('explode');
                if (Math.random() < 0.1) {
                    dropPowerup(state, brick.x + brick.width / 2, brick.y + brick.height / 2);
                }
            } else {
                // Bounce
                const absDx = Math.abs(state.ball.position.x - (brick.x + brick.width / 2));
                const absDy = Math.abs(state.ball.position.y - (brick.y + brick.height / 2));
                
                if (absDx > absDy) {
                    state.ball.velocity.x = -state.ball.velocity.x;
                    state.ball.position.x += (state.ball.radius - distance) * (dx > 0 ? 1 : -1);
                } else {
                    state.ball.velocity.y = -state.ball.velocity.y;
                    state.ball.position.y += (state.ball.radius - distance) * (dy > 0 ? 1 : -1);
                }
            }
            break;
        }
    }
    
    // Update powerups
    for (let i = state.powerups.length - 1; i >= 0; i--) {
        const p = state.powerups[i];
        if (!p.active) continue;
        
        if (p.type === 'extra_ball') {
            // Extra ball logic
            p.position = Vector.add(p.position, Vector.mult(p.velocity, dt));
            p.lifetime -= dt;
            
            // Wall collisions
            if (p.position.y - p.radius < 0) p.velocity.y = -p.velocity.y;
            if (p.position.x - p.radius < 0 || p.position.x + p.radius > w) p.velocity.x = -p.velocity.x;
            
            // Paddle collision
            if (p.position.y + p.radius > paddleTop &&
                p.position.y < paddleTop + state.paddle.height &&
                p.position.x + p.radius > paddleLeft &&
                p.position.x - p.radius < paddleRight) {
                p.velocity.y = -Math.abs(p.velocity.y);
                const hitPos = (p.position.x - (state.paddle.x + state.paddle.width / 2)) / (state.paddle.width / 2);
                p.velocity.x = hitPos * state.ball.speed * 0.5;
            }
            
            // Fall below
            if (p.position.y - p.radius > h || p.lifetime <= 0) {
                p.active = false;
            }
        } else {
            // Falling powerup
            p.y += p.velocity.y * dt;
            p.lifetime -= dt;
            
            // Collection
            if (p.y + p.size > state.paddle.y &&
                p.y < state.paddle.y + state.paddle.height &&
                p.x + p.size > state.paddle.x &&
                p.x < state.paddle.x + state.paddle.width) {
                activatePowerup(state, p.type);
                p.active = false;
            }
            
            if (p.y > h || p.lifetime <= 0) {
                p.active = false;
            }
        }
    }
    
    // Clean up inactive powerups
    state.powerups = state.powerups.filter(p => p.active);
    
    // Update active powerup timers
    if (state.activePowerups.laser) {
        state.activePowerups.laser -= dt;
        if (state.activePowerups.laser <= 0) {
            delete state.activePowerups.laser;
        }
    }
    
    // Update particles
    for (let i = state.particles.length - 1; i >= 0; i--) {
        const p = state.particles[i];
        p.position = Vector.add(p.position, Vector.mult(p.velocity, dt));
        p.lifetime -= dt;
        if (p.lifetime <= 0) {
            state.particles.splice(i, 1);
        }
    }
    
    // Win condition
    if (state.bricks.every(b => !b.active)) {
        state.gameState = 'win';
    }
};

const draw = (state, ctx, w, h) => {
    // Clear with background
    ctx.fillStyle = COLORS.BG;
    ctx.fillRect(0, 0, w, h);
    
    // Draw bricks
    ctx.shadowBlur = 15;
    state.bricks.forEach(brick => {
        if (!brick.active) return;
        
        ctx.fillStyle = brick.color;
        ctx.fillRect(brick.x, brick.y, brick.width, brick.height);
        
        // Armored brick indicator
        if (brick.type === 'armored' && brick.hitsNeeded > 1) {
            ctx.fillStyle = '#FFFFFF';
            ctx.fillRect(brick.x + 5, brick.y + 5, brick.width - 10, 3);
        }
    });
    ctx.shadowBlur = 0;
    
    // Draw paddle with laser effect if active
    ctx.fillStyle = COLORS.PLAYER;
    ctx.fillRect(state.paddle.x, state.paddle.y, state.paddle.width, state.paddle.height);
    
    if (state.activePowerups.laser) {
        ctx.fillStyle = '#FF0000';
        ctx.fillRect(state.paddle.x, state.paddle.y - 5, state.paddle.width, 3);
    }
    
    // Draw ball with glow
    ctx.shadowBlur = 20;
    ctx.shadowColor = COLORS.ACCENT;
    ctx.fillStyle = COLORS.ACCENT;
    ctx.beginPath();
    ctx.arc(state.ball.position.x, state.ball.position.y, state.ball.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;
    
    // Draw extra balls
    state.powerups.forEach(p => {
        if (p.type === 'extra_ball') {
            ctx.beginPath();
            ctx.arc(p.position.x, p.position.y, p.radius, 0, Math.PI * 2);
            ctx.fillStyle = '#00FF00';
            ctx.fill();
        }
    });
    
    // Draw falling powerups
    state.powerups.forEach(p => {
        if (p.type !== 'extra_ball') {
            ctx.fillStyle = p.color;
            ctx.fillRect(p.x, p.y, p.size, p.size);
        }
    });
    
    // Draw particles
    state.particles.forEach(p => {
        const alpha = Math.max(0, p.lifetime / 0.5);
        ctx.fillStyle = p.color.replace(')', `, ${alpha})`);
        ctx.beginPath();
        ctx.arc(p.position.x, p.position.y, p.size, 0, Math.PI * 2);
        ctx.fill();
    });
    
    // Draw UI
    ctx.fillStyle = COLORS.TEXT;
    ctx.font = '24px Arial';
    ctx.textAlign = 'left';
    ctx.fillText(`Score: ${state.score}`, 10, 30);
    
    ctx.textAlign = 'right';
    ctx.fillText(`Lives: ${state.lives}`, w - 10, 30);
    
    ctx.textAlign = 'center';
    ctx.fillText(`Level: ${state.level}`, w / 2, 30);
    
    // Game state messages
    if (state.gameState === 'paused') {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(0, 0, w, h);
        ctx.fillStyle = COLORS.TEXT;
        ctx.font = '48px Arial';
        ctx.fillText('PAUSED', w / 2, h / 2);
        ctx.font = '24px Arial';
        ctx.fillText('Press SPACE to continue', w / 2, h / 2 + 50);
    } else if (state.gameState === 'win') {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(0, 0, w, h);
        ctx.fillStyle = COLORS.TEXT;
        ctx.font = '48px Arial';
        ctx.fillText('LEVEL COMPLETE!', w / 2, h / 2);
        ctx.font = '24px Arial';
        ctx.fillText(`Score: ${state.score}`, w / 2, h / 2 + 50);
        ctx.fillText('Click to continue', w / 2, h / 2 + 100);
    } else if (state.gameState === 'lose') {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(0, 0, w, h);
        ctx.fillStyle = COLORS.TEXT;
        ctx.font = '48px Arial';
        ctx.fillText('GAME OVER', w / 2, h / 2);
        ctx.font = '24px Arial';
        ctx.fillText(`Score: ${state.score}`, w / 2, h / 2 + 50);
        ctx.fillText('Click to restart', w / 2, h / 2 + 100);
    }
};

return { init, update, draw };