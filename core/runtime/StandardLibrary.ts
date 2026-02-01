/**
 * The "Standard Library" for the Game Engine.
 * These classes and constants are implicitly promised to the AI by the System Prompt.
 * We must inject them into the execution scope 
 */

// 1. COLORS CONSTANT
export const COLORS = {
    BG: '#050505',
    PLAYER: '#00ffff',
    ENEMY: '#ff3366',
    ACCENT: '#ffcc00',
    TEXT: '#ffffff'
};

// 2. VECTOR CLASS (Comprehensive API)
export class Vector {
    x: number;
    y: number;

    constructor(x: number = 0, y: number = 0) {
        this.x = x;
        this.y = y;
        this._clean();
    }

    // PHASE 2 DEFENSE: Self-Healing Mechanism
    private _clean(): Vector {
        if (!Number.isFinite(this.x) || !Number.isFinite(this.y)) {
            this.x = 0;
            this.y = 0;
        }
        return this;
    }

    set(x: number | { x: number, y: number }, y?: number): Vector {
        if (typeof x === 'object' && x !== null) {
            this.x = x.x;
            this.y = x.y;
        } else if (typeof x === 'number' && typeof y === 'number') {
            this.x = x;
            this.y = y;
        }
        return this._clean();
    }

    // --- Basic Arithmetic ---
    add(v: { x: number, y: number } | number): Vector {
        if (typeof v === 'number') {
            this.x += v;
            this.y += v;
        } else {
            this.x += v.x;
            this.y += v.y;
        }
        return this._clean();
    }

    sub(v: { x: number, y: number } | number): Vector {
        if (typeof v === 'number') {
            this.x -= v;
            this.y -= v;
        } else {
            this.x -= v.x;
            this.y -= v.y;
        }
        return this._clean();
    }

    multiply(s: number): Vector { // Standard multiply
        this.x *= s;
        this.y *= s;
        return this._clean();
    }

    multiplyScalar(s: number): Vector { // Alias
        return this.multiply(s);
    }

    scale(s: number): Vector { // Alias
        return this.multiply(s);
    }

    mult(s: number): Vector { // Alias (p5.js style)
        return this.multiply(s);
    }

    divide(s: number): Vector {
        if (s !== 0) {
            this.x /= s;
            this.y /= s;
        } else {
            this.x = 0;
            this.y = 0;
        }
        return this._clean();
    }

    div(s: number): Vector { // Alias (p5.js style)
        return this.divide(s);
    }

    // --- Magnitude & Normalization ---
    mag(): number {
        return Math.sqrt(this.x * this.x + this.y * this.y);
    }

    magnitude(): number { // Alias for common AI mistake
        return this.mag();
    }

    magSq(): number { // Performance optimization
        return this.x * this.x + this.y * this.y;
    }

    normalize(): Vector {
        const m = this.mag();
        if (m > 0) this.divide(m);
        else { this.x = 0; this.y = 0; }
        return this._clean();
    }

    setMag(n: number): Vector {
        return this.normalize().multiply(n);
    }

    limit(max: number): Vector {
        if (this.magSq() > max * max) {
            this.setMag(max);
        }
        return this._clean();
    }

    // --- Direction & Rotation ---
    heading(): number {
        return Math.atan2(this.y, this.x);
    }

    rotate(angle: number): Vector {
        const newHeading = this.heading() + angle;
        const mag = this.mag();
        this.x = Math.cos(newHeading) * mag;
        this.y = Math.sin(newHeading) * mag;
        return this._clean();
    }

    // --- Relationship ---
    dist(v: { x: number, y: number }): number {
        const dx = this.x - v.x;
        const dy = this.y - v.y;
        return Math.sqrt(dx * dx + dy * dy);
    }

    distSq(v: { x: number, y: number }): number {
        const dx = this.x - v.x;
        const dy = this.y - v.y;
        return dx * dx + dy * dy;
    }

    dot(v: { x: number, y: number }): number {
        return this.x * v.x + this.y * v.y;
    }

    cross(v: { x: number, y: number }): number { // 2D Cross product (Z-component)
        return this.x * v.y - this.y * v.x;
    }

    angleBetween(v: Vector): number {
        const dot = this.dot(v);
        // Clamp to -1..1 to handle float errors
        const val = Math.max(-1, Math.min(1, dot / (this.mag() * v.mag())));
        return Math.acos(val);
    }

    lerp(v: Vector, amt: number): Vector {
        this.x += (v.x - this.x) * amt;
        this.y += (v.y - this.y) * amt;
        return this._clean();
    }

    copy(): Vector {
        return new Vector(this.x, this.y);
    }

    // --- Static Utilities ---
    static distance(v1: { x: number, y: number }, v2: { x: number, y: number }): number {
        const dx = v1.x - v2.x;
        const dy = v1.y - v2.y;
        return Math.sqrt(dx * dx + dy * dy);
    }

    static add(v1: Vector, v2: Vector): Vector {
        return new Vector(v1.x + v2.x, v1.y + v2.y);
    }

    static sub(v1: Vector, v2: Vector): Vector {
        return new Vector(v1.x - v2.x, v1.y - v2.y);
    }

    static mult(v: Vector, n: number): Vector {
        return new Vector(v.x * n, v.y * n);
    }

    static div(v: Vector, n: number): Vector {
        return new Vector(v.x / n, v.y / n);
    }

    static random2D(): Vector {
        const angle = Math.random() * Math.PI * 2;
        return new Vector(Math.cos(angle), Math.sin(angle));
    }

    static fromAngle(angle: number, length: number = 1): Vector {
        return new Vector(length * Math.cos(angle), length * Math.sin(angle));
    }
}

// 3. GAMEOBJECT BASE CLASS
export class GameObject {
    x: number;
    y: number;
    radius: number;
    color: string;
    active: boolean;
    velocity: Vector;

    constructor(x: number, y: number, radius: number = 10, color: string = '#ffffff') {
        this.x = x;
        this.y = y;
        this.radius = radius;
        this.color = color;
        this.active = true;
        this.velocity = new Vector(0, 0);
    }

    update(dt: number, state: any, w: number, h: number) {
        this.x += this.velocity.x * dt;
        this.y += this.velocity.y * dt;
    }

    draw(ctx: CanvasRenderingContext2D) {
        if (!this.active) return;
        ctx.save();
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }
}

// 4. RETRO AUDIO SYNTHESIZER
export class RetroAudio {
    ctx: AudioContext;
    master: GainNode;
    initialized: boolean;

    constructor() {
        // @ts-ignore - Handle cross-browser support if needed
        const AudioContextClass = window.AudioContext || window.webkitAudioContext;
        this.ctx = new AudioContextClass();
        this.master = this.ctx.createGain();
        this.master.connect(this.ctx.destination);
        this.master.gain.value = 0.25; // Default volume
        this.initialized = false;
    }

    resume() {
        if (!this.initialized || this.ctx.state === 'suspended') {
            this.ctx.resume().then(() => {
                this.initialized = true;
            }).catch(console.error);
        }
    }

    play(type: string) {
        // Auto-resume on first play attempt
        if (this.ctx.state === 'suspended') this.resume();

        const t = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const g = this.ctx.createGain();
        osc.connect(g);
        g.connect(this.master);

        if (type === 'shoot' || type === 'laser') {
            // Pew Pew: Fast frequency drop
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(800, t);
            osc.frequency.exponentialRampToValueAtTime(100, t + 0.15);
            g.gain.setValueAtTime(0.8, t);
            g.gain.exponentialRampToValueAtTime(0.01, t + 0.15);
            osc.start(t);
            osc.stop(t + 0.15);
        }
        else if (type === 'explode' || type === 'explosion' || type === 'hit') {
            // Boom: Low saw with decay
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(100, t);
            osc.frequency.exponentialRampToValueAtTime(10, t + 0.2);
            g.gain.setValueAtTime(1.0, t);
            g.gain.exponentialRampToValueAtTime(0.01, t + 0.2);
            osc.start(t);
            osc.stop(t + 0.2);
        }
        else if (type === 'jump') {
            // Boing: Frequency slide up
            osc.type = 'square';
            osc.frequency.setValueAtTime(150, t);
            osc.frequency.linearRampToValueAtTime(300, t + 0.1);
            g.gain.setValueAtTime(0.5, t);
            g.gain.linearRampToValueAtTime(0.01, t + 0.1);
            osc.start(t);
            osc.stop(t + 0.1);
        }
        else if (type === 'collect' || type === 'coin') {
            // Ding: Two tones
            osc.type = 'sine';
            osc.frequency.setValueAtTime(1200, t);
            osc.frequency.setValueAtTime(1600, t + 0.05);
            g.gain.setValueAtTime(0.5, t);
            g.gain.linearRampToValueAtTime(0.01, t + 0.1);
            osc.start(t);
            osc.stop(t + 0.1);
        }
        else {
            // Default Blip
            osc.type = 'sine';
            osc.frequency.setValueAtTime(440, t);
            g.gain.setValueAtTime(0.1, t);
            g.gain.exponentialRampToValueAtTime(0.01, t + 0.05);
            osc.start(t);
            osc.stop(t + 0.05);
        }
    }
}

// ------------------------------------------------------------------
// STANDARD LIBRARY (Canvas2D)
// ------------------------------------------------------------------

declare const sfx: any;

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
