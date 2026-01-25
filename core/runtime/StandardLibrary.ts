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
    }

    // --- Basic Arithmetic ---
    add(v: { x: number, y: number }): Vector {
        this.x += v.x;
        this.y += v.y;
        return this;
    }

    sub(v: { x: number, y: number }): Vector {
        this.x -= v.x;
        this.y -= v.y;
        return this;
    }

    multiply(s: number): Vector { // Standard multiply
        this.x *= s;
        this.y *= s;
        return this;
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
        }
        return this;
    }

    div(s: number): Vector { // Alias (p5.js style)
        return this.divide(s);
    }

    // --- Magnitude & Normalization ---
    mag(): number {
        return Math.sqrt(this.x * this.x + this.y * this.y);
    }

    magSq(): number { // Performance optimization
        return this.x * this.x + this.y * this.y;
    }

    normalize(): Vector {
        const m = this.mag();
        if (m > 0) this.divide(m);
        return this;
    }

    setMag(n: number): Vector {
        return this.normalize().multiply(n);
    }

    limit(max: number): Vector {
        if (this.magSq() > max * max) {
            this.setMag(max);
        }
        return this;
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
        return this;
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
        return this;
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

    static random2D(): Vector {
        const angle = Math.random() * Math.PI * 2;
        return new Vector(Math.cos(angle), Math.sin(angle));
    }

    static fromAngle(angle: number, length: number = 1): Vector {
        return new Vector(length * Math.cos(angle), length * Math.sin(angle));
    }
}

// 3. GAMEOBJECT BASE CLASS
// The engine interface implies a base class for update/draw
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

    // Default implementations to prevent crashes if super.update() is called
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

// === EXPORT FOR IFRAME INJECTION ===
// We need these as strings to inject into the HTML template for GamePreview.tsx
export const LIBRARY_SOURCE = `
const COLORS = ${JSON.stringify(COLORS)};

class Vector {
    constructor(x = 0, y = 0) {
        this.x = x;
        this.y = y;
    }
    
    // Basic Arithmetic
    add(v) { this.x += v.x; this.y += v.y; return this; }
    sub(v) { this.x -= v.x; this.y -= v.y; return this; }
    multiply(s) { this.x *= s; this.y *= s; return this; }
    multiplyScalar(s) { return this.multiply(s); }
    scale(s) { return this.multiply(s); }
    mult(s) { return this.multiply(s); }
    divide(s) { if (s !== 0) { this.x /= s; this.y /= s; } return this; }
    div(s) { return this.divide(s); }

    // Magnitude & Normalization
    mag() { return Math.sqrt(this.x * this.x + this.y * this.y); }
    magSq() { return this.x * this.x + this.y * this.y; }
    
    normalize() { 
        const m = this.mag(); 
        if (m > 0) this.divide(m); 
        return this; 
    }
    
    setMag(n) { return this.normalize().multiply(n); }
    limit(max) { if (this.magSq() > max * max) this.setMag(max); return this; }
    
    // Direction & Rotation
    heading() { return Math.atan2(this.y, this.x); }
    rotate(angle) {
        const newHeading = this.heading() + angle;
        const mag = this.mag();
        this.x = Math.cos(newHeading) * mag;
        this.y = Math.sin(newHeading) * mag;
        return this;
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
        return this;
    }

    copy() { return new Vector(this.x, this.y); }
    
    // Static Utilities
    static distance(v1, v2) { return Math.sqrt(Math.pow(v1.x - v2.x, 2) + Math.pow(v1.y - v2.y, 2)); }
    static add(v1, v2) { return new Vector(v1.x + v2.x, v1.y + v2.y); }
    static sub(v1, v2) { return new Vector(v1.x - v2.x, v1.y - v2.y); }
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
`;
