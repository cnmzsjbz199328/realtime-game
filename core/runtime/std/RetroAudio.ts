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

    // --- NEW: Procedural Audio API ---
    // Ported from InjectionSource string for dev parity
    note(freq: string | number, duration: number = 0.5, type: OscillatorType = 'sine', vol: number = 0.5) {
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
        const NOTE_FREQS: Record<string, number> = {
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
