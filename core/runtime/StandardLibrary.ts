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

// 2. VECTOR CLASS
export class Vector {
    x: number;
    y: number;

    constructor(x: number = 0, y: number = 0) {
        this.x = x;
        this.y = y;
    }

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

    multiplyScalar(s: number): Vector {
        this.x *= s;
        this.y *= s;
        return this;
    }

    scale(s: number): Vector {
        return this.multiplyScalar(s);
    }

    multiply(s: number): Vector {
        return this.multiplyScalar(s);
    }

    divide(s: number): Vector {
        if (s !== 0) {
            this.x /= s;
            this.y /= s;
        }
        return this;
    }

    mag(): number {
        return Math.sqrt(this.x * this.x + this.y * this.y);
    }

    dist(v: { x: number, y: number }): number {
        const dx = this.x - v.x;
        const dy = this.y - v.y;
        return Math.sqrt(dx * dx + dy * dy);
    }

    normalize(): Vector {
        const m = this.mag();
        if (m > 0) {
            this.divide(m);
        }
        return this;
    }

    copy(): Vector {
        return new Vector(this.x, this.y);
    }

    static distance(v1: { x: number, y: number }, v2: { x: number, y: number }): number {
        const dx = v1.x - v2.x;
        const dy = v1.y - v2.y;
        return Math.sqrt(dx * dx + dy * dy);
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
    
    add(v) {
        this.x += v.x;
        this.y += v.y;
        return this;
    }
    
    sub(v) {
        this.x -= v.x;
        this.y -= v.y;
        return this;
    }
    
    multiplyScalar(s) {
        this.x *= s;
        this.y *= s;
        return this;
    }
    
    scale(s) {
        return this.multiplyScalar(s);
    }

    multiply(s) {
        return this.multiplyScalar(s);
    }

    divide(s) {
        if(s!==0) { this.x /= s; this.y /= s; } 
        return this;
    }

    mag() {
        return Math.sqrt(this.x*this.x + this.y*this.y);
    }
    
    dist(v) {
        const dx = this.x - v.x;
        const dy = this.y - v.y;
        return Math.sqrt(dx*dx + dy*dy);
    }

    normalize() {
        const m = this.mag();
        if(m>0) this.divide(m);
        return this;
    }
    
    copy() {
        return new Vector(this.x, this.y);
    }
    
    static distance(v1, v2) {
        return Math.sqrt(Math.pow(v1.x - v2.x, 2) + Math.pow(v1.y - v2.y, 2));
    }
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
