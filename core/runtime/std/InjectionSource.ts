import { COLORS } from './Colors';

// === EXPORT FOR IFRAME INJECTION ===
// We need these as strings to inject into the HTML template for GamePreview.tsx
export const LIBRARY_SOURCE = `
const COLORS = ${JSON.stringify(COLORS)};

class Vector {
    constructor(x = 0, y = 0) {
        this.x = x;
        this.y = y;
        this._clean();
    }

    // PHASE 2 DEFENSE: Self-Healing Mechanism
    _clean() {
        if (!Number.isFinite(this.x) || !Number.isFinite(this.y)) {
            this.x = 0;
            this.y = 0;
        }
        return this;
    }
    
    set(x, y) {
        if (typeof x === 'object' && x !== null) {
            this.x = x.x;
            this.y = x.y;
        } else {
            this.x = x;
            this.y = y;
        }
        return this._clean();
    }
    
    // Basic Arithmetic
    add(v) { 
        if (typeof v === 'number') { this.x += v; this.y += v; }
        else { this.x += v.x; this.y += v.y; }
        return this._clean(); 
    }
    
    sub(v) { 
        if (typeof v === 'number') { this.x -= v; this.y -= v; }
        else { this.x -= v.x; this.y -= v.y; }
        return this._clean(); 
    }
    
    multiply(s) { this.x *= s; this.y *= s; return this._clean(); }
    multiplyScalar(s) { return this.multiply(s); }
    scale(s) { return this.multiply(s); }
    mult(s) { return this.multiply(s); } // Alias for AI consistency
    
    divide(s) { 
        if (s !== 0) { this.x /= s; this.y /= s; } 
        else { this.x = 0; this.y = 0; }
        return this._clean(); 
    }
    div(s) { return this.divide(s); } // Alias for AI consistency

    // Magnitude & Normalization
    mag() { return Math.sqrt(this.x * this.x + this.y * this.y); }
    magSq() { return this.x * this.x + this.y * this.y; }
    magnitude() { return this.mag(); } // Alias
    
    normalize() { 
        const m = this.mag(); 
        if (m > 0) this.divide(m); 
        else { this.x = 0; this.y = 0; }
        return this._clean(); 
    }
    
    setMag(n) { return this.normalize().multiply(n); }
    limit(max) { if (this.magSq() > max * max) this.setMag(max); return this._clean(); }
    
    // Direction & Rotation
    heading() { return Math.atan2(this.y, this.x); }
    
    rotate(angle) {
        const newHeading = this.heading() + angle;
        const mag = this.mag();
        this.x = Math.cos(newHeading) * mag;
        this.y = Math.sin(newHeading) * mag;
        return this._clean();
    }

    // Relationship
    dist(v) { 
        const dx = this.x - v.x; 
        const dy = this.y - v.y; 
        return Math.sqrt(dx * dx + dy * dy); 
    }
    distSq(v) {
        const dx = this.x - v.x; 
        const dy = this.y - v.y; 
        return dx * dx + dy * dy;
    }
    
    dot(v) { return this.x * v.x + this.y * v.y; }
    cross(v) { return this.x * v.y - this.y * v.x; }
    
    angleBetween(v) {
        const dot = this.dot(v);
        const val = Math.max(-1, Math.min(1, dot / (this.mag() * v.mag())));
        return Math.acos(val);
    }
    
    lerp(v, amt) {
        this.x += (v.x - this.x) * amt;
        this.y += (v.y - this.y) * amt;
        return this._clean();
    }

    copy() { return new Vector(this.x, this.y); }
    
    // Static Utilities
    static distance(v1, v2) { return Math.sqrt(Math.pow(v1.x - v2.x, 2) + Math.pow(v1.y - v2.y, 2)); }
    static add(v1, v2) { return new Vector(v1.x + v2.x, v1.y + v2.y); }
    static sub(v1, v2) { return new Vector(v1.x - v2.x, v1.y - v2.y); }
    static mult(v, n) { return new Vector(v.x * n, v.y * n); }
    static div(v, n) { return new Vector(v.x / n, v.y / n); }
    static random2D() { const a = Math.random() * Math.PI * 2; return new Vector(Math.cos(a), Math.sin(a)); }
    static fromAngle(angle, length = 1) { return new Vector(length * Math.cos(angle), length * Math.sin(angle)); }
}

class GameObject {
    constructor(x, y, radius = 10, color = '#ffffff') {
        this.x = x;
        this.y = y;
        this.radius = radius;
        this.color = color;
        this.active = true;
        this.velocity = new Vector(0, 0);
    }
    
    update(dt, state, w, h) {
        if (!this.active) return;
        this.x += this.velocity.x * dt;
        this.y += this.velocity.y * dt;
    }
    
    draw(ctx) {
        if (!this.active) return;
        ctx.save();
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }
}

class RetroAudio {
    constructor() {
        const AudioContextClass = window.AudioContext || window.webkitAudioContext;
        this.ctx = new AudioContextClass();
        this.master = this.ctx.createGain();
        this.master.connect(this.ctx.destination);
        this.master.gain.value = 0.25;
        this.initialized = false;
    }

    resume() {
        if (!this.initialized || this.ctx.state === 'suspended') {
            this.ctx.resume().then(() => { this.initialized = true; }).catch(console.error);
        }
    }

    play(type) {
        if (this.ctx.state === 'suspended') this.resume();
        const t = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const g = this.ctx.createGain();
        osc.connect(g);
        g.connect(this.master);

        if (type === 'shoot' || type === 'laser') {
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(800, t);
            osc.frequency.exponentialRampToValueAtTime(100, t + 0.15);
            g.gain.setValueAtTime(0.8, t);
            g.gain.exponentialRampToValueAtTime(0.01, t + 0.15);
            osc.start(t); osc.stop(t + 0.15);
        } else if (type === 'explode' || type === 'explosion' || type === 'hit') {
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(100, t);
            osc.frequency.exponentialRampToValueAtTime(10, t + 0.2);
            g.gain.setValueAtTime(1.0, t);
            g.gain.exponentialRampToValueAtTime(0.01, t + 0.2);
            osc.start(t); osc.stop(t + 0.2);
        } else if (type === 'jump') {
            osc.type = 'square';
            osc.frequency.setValueAtTime(150, t);
            osc.frequency.linearRampToValueAtTime(300, t + 0.1);
            g.gain.setValueAtTime(0.5, t);
            g.gain.linearRampToValueAtTime(0.01, t + 0.1);
            osc.start(t); osc.stop(t + 0.1);
        } else if (type === 'collect' || type === 'coin') {
            osc.type = 'sine';
            osc.frequency.setValueAtTime(1200, t);
            osc.frequency.setValueAtTime(1600, t + 0.05);
            g.gain.setValueAtTime(0.5, t);
            g.gain.linearRampToValueAtTime(0.01, t + 0.1);
            osc.start(t); osc.stop(t + 0.1);
        } else {
            osc.type = 'sine';
            osc.frequency.setValueAtTime(440, t);
            g.gain.setValueAtTime(0.1, t);
            g.gain.exponentialRampToValueAtTime(0.01, t + 0.05);
            osc.start(t); osc.stop(t + 0.05);
        }
    }
}
`;
