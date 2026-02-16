import { COLORS } from './Colors';

// === EXPORT FOR IFRAME INJECTION ===
// We need these as strings to inject into the HTML template for GamePreview.tsx
export const LIBRARY_SOURCE = `
const COLORS = ${JSON.stringify(COLORS)};

// ⚠️ [READ ONLY] This is a MIRROR of core/runtime/std/Vector.ts
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
    
    // Static Utilities - Basic Operations
    static distance(v1, v2) { return Math.sqrt(Math.pow(v1.x - v2.x, 2) + Math.pow(v1.y - v2.y, 2)); }
    static dist(v1, v2) { return Vector.distance(v1, v2); } // Alias for consistency with Vector.ts
    static add(v1, v2) { return new Vector(v1.x + v2.x, v1.y + v2.y); }
    static sub(v1, v2) { return new Vector(v1.x - v2.x, v1.y - v2.y); }
    static mult(v, n) { return new Vector(v.x * n, v.y * n); }
    static div(v, n) { return new Vector(v.x / n, v.y / n); }
    static random2D() { const a = Math.random() * Math.PI * 2; return new Vector(Math.cos(a), Math.sin(a)); }
    static fromAngle(angle, length = 1) { return new Vector(length * Math.cos(angle), length * Math.sin(angle)); }
    
    // Static Utilities - Advanced Operations (Pure Functions)
    static mag(v) { return Math.sqrt(v.x * v.x + v.y * v.y); }
    static magSq(v) { return v.x * v.x + v.y * v.y; }
    static normalize(v) {
        const m = Math.sqrt(v.x * v.x + v.y * v.y);
        if (m === 0) return new Vector(0, 0);
        return new Vector(v.x / m, v.y / m);
    }
    static setMag(v, n) {
        const normalized = Vector.normalize(v);
        return new Vector(normalized.x * n, normalized.y * n);
    }
    static limit(v, max) {
        const m = Vector.mag(v);
        if (m > max) return Vector.setMag(v, max);
        return new Vector(v.x, v.y);
    }
    static heading(v) { return Math.atan2(v.y, v.x); }
    static rotate(v, angle) {
        const newHeading = Vector.heading(v) + angle;
        const m = Vector.mag(v);
        return new Vector(Math.cos(newHeading) * m, Math.sin(newHeading) * m);
    }
    static lerp(v1, v2, amt) {
        return new Vector(
            v1.x + (v2.x - v1.x) * amt,
            v1.y + (v2.y - v1.y) * amt
        );
    }
    static dot(v1, v2) { return v1.x * v2.x + v1.y * v2.y; }
    static cross(v1, v2) { return v1.x * v2.y - v1.y * v2.x; }
    static angleBetween(v1, v2) {
        const dot = Vector.dot(v1, v2);
        const val = Math.max(-1, Math.min(1, dot / (Vector.mag(v1) * Vector.mag(v2))));
        return Math.acos(val);
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
    // --- NEW: Procedural Audio API ---
    note(freq, duration = 0.5, type = 'sine', vol = 0.5) {
        if (!this.initialized || this.ctx.state === 'suspended') this.resume();
        const t = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const g = this.ctx.createGain();

        // Safety: Limit duration to prevent infinite loops
        const safeDuration = Math.min(Math.max(duration, 0.05), 5.0);
        
        osc.connect(g);
        g.connect(this.master);
        
        osc.type = type;
        
        // Handling Note Names (e.g. 'C4') vs Frequencies
        const NOTE_FREQS = {
            'C3': 130.81, 'C#3': 138.59, 'D3': 146.83, 'D#3': 155.56, 'E3': 164.81, 'F3': 174.61, 'F#3': 185.00, 'G3': 196.00, 'G#3': 207.65, 'A3': 220.00, 'A#3': 233.08, 'B3': 246.94,
            'C4': 261.63, 'C#4': 277.18, 'D4': 293.66, 'D#4': 311.13, 'E4': 329.63, 'F4': 349.23, 'F#4': 369.99, 'G4': 391.99, 'G#4': 415.30, 'A4': 440.00, 'A#4': 466.16, 'B4': 493.88,
            'C5': 523.25, 'C#5': 554.37, 'D5': 587.33, 'D#5': 622.25, 'E5': 659.25, 'F5': 698.46, 'F#5': 739.99, 'G5': 783.99, 'G#5': 830.61, 'A5': 880.00, 'A#5': 932.33, 'B5': 987.77
        };

        if (typeof freq === 'string' && NOTE_FREQS[freq]) {
            osc.frequency.setValueAtTime(NOTE_FREQS[freq], t);
        } else if (typeof freq === 'number' && Number.isFinite(freq)) {
            osc.frequency.setValueAtTime(freq, t);
        } else {
            return; // Invalid frequency
        }

        // Simple Envelope (ADSR-lite)
        g.gain.setValueAtTime(0, t);
        g.gain.linearRampToValueAtTime(vol, t + 0.05); // Attack
        g.gain.setValueAtTime(vol, t + safeDuration - 0.05);
        g.gain.linearRampToValueAtTime(0.001, t + safeDuration); // Release

        osc.start(t);
        osc.stop(t + safeDuration);
    }
}
`;
