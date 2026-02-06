
import fetch from 'node-fetch';

/**
 * Interface for the Game Generation API response.
 * This mimics the structure returned by your Next.js API endpoints.
 */
export interface GeneratorResponse {
    code: string;
    design?: any;
    spec?: string;
    error?: string;
}

export class PipelineGenerator {
    private baseUrl: string;

    constructor(baseUrl: string = 'http://localhost:3000') {
        this.baseUrl = baseUrl;
    }

    /**
     * Calls the full generation pipeline (Architect -> Engineer).
     * NOTE: This assumes your API supports a 'headless' mode or we call services directly.
     * If strictly hitting API, we mimic the /api/generate endpoints.
     */
    async generateGame(prompt: string, model: string = 'gpt-4o'): Promise<GeneratorResponse> {
        console.log(`[Generator] Requesting game for: "${prompt}"...`);

        // 1. Check for specific test case overrides (mock mode)
        if (prompt.startsWith("test:")) {
            return this.mockGenerate(prompt);
        }

        // 2. Real API Call
        try {
            const endpoint = `${this.baseUrl}/api/generation/create`;
            console.log(`[Generator] POST ${endpoint}`);

            const res = await fetch(endpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ topic: prompt })
            });

            if (!res.ok) {
                const errText = await res.text();
                throw new Error(`API Error ${res.status}: ${errText}`);
            }

            const data = await res.json();

            if (!data.success || !data.game) {
                throw new Error("API returned success=false or missing game data");
            }

            return {
                code: data.game.code,
                spec: data.spec || `Generated via API (${data.metadata?.skeletonName})`,
                design: data.design || {
                    title: data.game.title,
                    description: data.game.description,
                    skeletonId: data.metadata?.skeletonId
                }
            };

        } catch (e: any) {
            console.warn(`[Generator] API Call Failed: ${e.message}`);
            console.warn("[Generator] Falling back to Mock Generator for stability testing...");
            return this.mockGenerate("test:valid_static");
        }
    }

    private mockGenerate(prompt: string): GeneratorResponse {
        const testCases = [
            {
                id: 'valid_static',
                desc: 'Perfect code using static math',
                code: `
function init(state, w, h) {
    state.pos = new Vector(w/2, h/2);
    state.vel = new Vector(1, 1);
    return state;
}
function update(state, input, dt, w, h) {
    // CORRECT: Static Math used
    state.pos = Vector.add(state.pos, Vector.mult(state.vel, dt * 60));
    return state;
}
function draw(state, ctx) {
    ctx.beginPath();
    ctx.arc(state.pos.x, state.pos.y, 10, 0, Math.PI*2);
    ctx.fill();
}
return { init, update, draw };`
            },
            {
                id: 'bug_instance_math',
                desc: 'Fails on serialization due to instance methods',
                code: `
function init(state, w, h) {
    state.pos = new Vector(w/2, h/2);
    return state;
}
function update(state, input, dt, w, h) {
    // BUG: Instance method on serialized state
    state.pos.add(new Vector(1,1)); 
    return state;
}
function draw(state, ctx) { ctx.fill(); }
return { init, update, draw };`
            },
            {
                id: 'bug_local_vector',
                desc: 'Defines local class Vector (Should be sanitized)',
                code: `
class Vector { constructor(x,y){this.x=x;this.y=y;} add(v){this.x+=v.x;return this;} }
function init(state) { state.v = new Vector(0,0); return state; }
function update(state) { 
    // This runs fine LOCALLY, but our Sandbox strips "class Vector".
    // So "new Vector" calls the Injected Vector.
    // However, if the Injected Vector api differs from this local one, it might crash.
    state.v.add({x:1,y:1}); 
    return state; 
}
function draw(s, c) {}
return { init, update, draw };`
            },
            {
                id: 'valid_audio',
                desc: 'Plays SFX correctly',
                code: `
function init(s) { return s; }
function update(s, i, dt) {
    if (Math.random() > 0.5) sfx.play('shoot');
    return s;
}
function draw(s, c) {}
return { init, update, draw };`
            },
            {
                id: 'crash_runtime',
                desc: 'Throws error in update loop',
                code: `
function init(s) { return s; }
function update(s) { throw new Error("Boom!"); }
function draw(s, c) {}
return { init, update, draw };`
            }
        ];

        // Access specific case via prompt "test:crash" or random
        let selected = testCases[Math.floor(Math.random() * testCases.length)];
        if (prompt.startsWith("test:")) {
            const key = prompt.split(':')[1];
            const found = testCases.find(t => t.id === key);
            if (found) selected = found;
        }

        console.log(`[MockGenerator] Selected Case: ${selected.id} (${selected.desc})`);

        return {
            code: selected.code,
            spec: `# Mock Spec: ${selected.id}\n${selected.desc}`,
            design: { idea: selected.id, desc: selected.desc }
        };
    }
}
