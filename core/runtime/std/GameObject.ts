import { Vector } from './Vector';

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
