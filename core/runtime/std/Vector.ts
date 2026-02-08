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

    // --- Static Utilities - Basic Operations ---
    static distance(v1: { x: number, y: number }, v2: { x: number, y: number }): number {
        const dx = v1.x - v2.x;
        const dy = v1.y - v2.y;
        return Math.sqrt(dx * dx + dy * dy);
    }

    static dist(v1: { x: number, y: number }, v2: { x: number, y: number }): number {
        return Vector.distance(v1, v2);
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

    // --- Static Utilities - Advanced Operations (Pure Functions) ---
    static mag(v: { x: number, y: number }): number {
        return Math.sqrt(v.x * v.x + v.y * v.y);
    }

    static magSq(v: { x: number, y: number }): number {
        return v.x * v.x + v.y * v.y;
    }

    static normalize(v: { x: number, y: number }): Vector {
        const m = Math.sqrt(v.x * v.x + v.y * v.y);
        if (m === 0) return new Vector(0, 0);
        return new Vector(v.x / m, v.y / m);
    }

    static setMag(v: { x: number, y: number }, n: number): Vector {
        const normalized = Vector.normalize(v);
        return new Vector(normalized.x * n, normalized.y * n);
    }

    static limit(v: { x: number, y: number }, max: number): Vector {
        const m = Vector.mag(v);
        if (m > max) return Vector.setMag(v, max);
        return new Vector(v.x, v.y);
    }

    static heading(v: { x: number, y: number }): number {
        return Math.atan2(v.y, v.x);
    }

    static rotate(v: { x: number, y: number }, angle: number): Vector {
        const newHeading = Vector.heading(v) + angle;
        const m = Vector.mag(v);
        return new Vector(Math.cos(newHeading) * m, Math.sin(newHeading) * m);
    }

    static lerp(v1: { x: number, y: number }, v2: { x: number, y: number }, amt: number): Vector {
        return new Vector(
            v1.x + (v2.x - v1.x) * amt,
            v1.y + (v2.y - v1.y) * amt
        );
    }

    static dot(v1: { x: number, y: number }, v2: { x: number, y: number }): number {
        return v1.x * v2.x + v1.y * v2.y;
    }

    static cross(v1: { x: number, y: number }, v2: { x: number, y: number }): number {
        return v1.x * v2.y - v1.y * v2.x;
    }

    static angleBetween(v1: { x: number, y: number }, v2: { x: number, y: number }): number {
        const dot = Vector.dot(v1, v2);
        const val = Math.max(-1, Math.min(1, dot / (Vector.mag(v1) * Vector.mag(v2))));
        return Math.acos(val);
    }
}
