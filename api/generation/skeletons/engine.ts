export const ENGINE_CORE = `
class Engine {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.entities = [];
    this.particles = [];
    this.input = { keys: {}, mouse: { x: 0, y: 0, down: false, clicked: false } };
    this.score = 0;
    this.time = 0;
    this.shakeAmount = 0;
    this.gameState = 'MENU';
    this.setupInput();
  }
  shake(amount = 10) { this.shakeAmount = amount; }
  playSound(name) { /* Stub: Audio not implemented */ }
  stopSound(name) { /* Stub: Audio not implemented */ }
  spawnParticles(x, y, color, count = 8) {
    for (let i = 0; i < count; i++) {
      this.particles.push({ x, y, vx: (Math.random()-0.5)*10, vy: (Math.random()-0.5)*10, life: 1.0, color: color||'#fff' });
    }
  }
  setupInput() {
    document.addEventListener('keydown', (e) => { this.input.keys[e.key.toLowerCase()] = true; });
    document.addEventListener('keyup', (e) => { this.input.keys[e.key.toLowerCase()] = false; });
    this.canvas.addEventListener('mousemove', (e) => {
      const rect = this.canvas.getBoundingClientRect();
      this.input.mouse.x = e.clientX - rect.left;
      this.input.mouse.y = e.clientY - rect.top;
    });
    this.canvas.addEventListener('mousedown', () => { this.input.mouse.down = true; this.input.mouse.clicked = true; });
    this.canvas.addEventListener('mouseup', () => { this.input.mouse.down = false; });
  }
  spawn(entity) { this.entities.push(entity); return entity; }
  start() {
    const loop = () => {
      try { this.update(); this.draw(); this.input.mouse.clicked = false; requestAnimationFrame(loop); }
      catch (e) {
         console.error('Game crashed:', e);
         this.ctx.fillStyle = '#f00'; this.ctx.font = '24px Arial';
         this.ctx.fillText('ERROR: ' + e.message, 50, 300);
      }
    };
    loop();
  }
  update() {
    this.time++;
    this.entities = this.entities.filter(e => e.active);
    this.entities.forEach(e => e.update && e.update(this));
    this.particles.forEach(p => { p.x += p.vx; p.y += p.vy; p.life -= 0.02; });
    this.particles = this.particles.filter(p => p.life > 0);
    if (this.shakeAmount > 0) this.shakeAmount *= 0.9;
    for (let i = 0; i < this.entities.length; i++) {
      for (let j = i + 1; j < this.entities.length; j++) {
        const a = this.entities[i], b = this.entities[j];
        if (a.isColliding && a.isColliding(b)) {
          a.onCollision && a.onCollision(b, this);
          b.onCollision && b.onCollision(a, this);
        }
      }
    }
  }
  draw() {
    this.ctx.save();
    if (this.shakeAmount > 0.5) { this.ctx.translate((Math.random()-0.5)*this.shakeAmount, (Math.random()-0.5)*this.shakeAmount); }
    this.ctx.fillStyle = '#000';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    this.entities.forEach(e => e.draw && e.draw(this.ctx));
    this.particles.forEach(p => { this.ctx.globalAlpha = p.life; this.ctx.fillStyle = p.color; this.ctx.fillRect(p.x, p.y, 4, 4); });
    this.ctx.globalAlpha = 1.0;
    this.ctx.restore();
    this.ctx.fillStyle = '#fff';
    this.ctx.font = '20px Arial';
    this.ctx.fillText('Score: ' + this.score, 10, 30);
  }
}
class GameObject {
  constructor(x, y, w, h, tag) { this.w=w; this.h=h; this.tag=tag; this.x=x; this.y=y; this.vx=0; this.vy=0; this.active=true; this.color='#fff'; }
  isColliding(other) { return this.x < other.x+other.w && this.x+this.w > other.x && this.y < other.y+other.h && this.y+this.h > other.y; }
  update(game) { this.x += this.vx; this.y += this.vy; }
  draw(ctx) { ctx.fillStyle = this.color; ctx.fillRect(this.x, this.y, this.w, this.h); }
  onCollision(other, game) {}
}
`;

export const ENGINE_INTERFACE = `
class Engine { spawn(entity); shake(amount?); spawnParticles(x,y,color,count?); playSound(name); stopSound(name); start(); }
class GameObject { constructor(x,y,w,h,tag); x,y,w,h,vx,vy:number; tag:string; active:boolean; color:string; isColliding(other); update(game); draw(ctx); onCollision(other,game); }
`;
