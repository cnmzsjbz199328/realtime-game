/**
 * Engine Core & Interface
 * Provides the shared environment and base classes for all games.
 */

export const ENGINE_CORE = `
class Vector {
    constructor(x, y) { this.x = x || 0; this.y = y || 0; }
    add(v) { this.x += v.x; this.y += v.y; return this; }
    copy() { return new Vector(this.x, this.y); }
    static distance(v1, v2) { return Math.sqrt((v1.x - v2.x)**2 + (v1.y - v2.y)**2); }
}

class GameObject {
    constructor(x, y, radius, color) {
        this.x = x;
        this.y = y;
        this.radius = radius || 10;
        this.color = color || '#fff';
        this.active = true;
        this.velocity = new Vector(0, 0);
    }
    update(dt, state) {
        this.x += this.velocity.x * dt;
        this.y += this.velocity.y * dt;
    }
    draw(ctx) {
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fill();
    }
}

const COLORS = {
    BG: "#050510",
    PLAYER: "#00ffff",
    ENEMY: "#ff0044",
    ACCENT: "#ff00ff",
    TEXT: "#ffffff"
};
`;

export const ENGINE_INTERFACE = `
// Available Globals in the sandbox:
// state (managed by engine), input (keys/mouse), deltaTime: number

class Vector { constructor(x,y); x,y:number; add(v); static distance(v1,v2); }
class GameObject { constructor(x,y,radius,color); x,y,radius:number; color:string; active:boolean; velocity:Vector; update(dt, state); draw(ctx); }

/** 
 * input: { 
 *   x, y: number (mouse/touch), 
 *   isDown: boolean (primary button),
 *   keys: Record<string, boolean>, // e.g. keys['ArrowLeft']
 *   [key: string]: boolean // Direct access allowed: e.g. input.ArrowLeft, input.a, input.left, input.Space
 * } 
 */
const COLORS = { BG, PLAYER, ENEMY, ACCENT, TEXT };
`;
