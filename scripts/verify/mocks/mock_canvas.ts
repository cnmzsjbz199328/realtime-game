
// Mock CanvasRenderingContext2D for Headless Environment
// Only implements the subset of API used by the AI Engineer
export class MockContext {
    logs: string[] = [];

    // Helper to log calls
    private log(method: string, args: any[]) {
        // Optimization: Don't log detailed args for massive draw loops to save memory
        // this.logs.push(`${method}(${args.join(', ')})`);
    }

    save() { this.log('save', []); }
    restore() { this.log('restore', []); }
    translate(x: number, y: number) { this.log('translate', [x, y]); }
    rotate(angle: number) { this.log('rotate', [angle]); }
    scale(x: number, y: number) { this.log('scale', [x, y]); }

    beginPath() { }
    closePath() { }
    moveTo(x: number, y: number) { }
    lineTo(x: number, y: number) { }
    arc(x: number, y: number, r: number, sa: number, ea: number) { }
    fill() { }
    stroke() { }
    fillRect(x: number, y: number, w: number, h: number) { }
    strokeRect(x: number, y: number, w: number, h: number) { }
    clearRect(x: number, y: number, w: number, h: number) { }
    fillText(text: string, x: number, y: number) { }
    setLineDash(segments: number[]) { }
    createLinearGradient(x0: number, y0: number, x1: number, y1: number) {
        return { addColorStop: () => { } };
    }
    setTransform(a: number, b: number, c: number, d: number, e: number, f: number) { }

    // Properties
    fillStyle: string = '#000';
    strokeStyle: string = '#000';
    lineWidth: number = 1;
    font: string = '10px sans-serif';
    textAlign: string = 'start';
    textBaseline: string = 'alphabetic';
    shadowBlur: number = 0;
    shadowColor: string = '#000';
    globalAlpha: number = 1.0;
    lineCap: string = 'butt';
}
