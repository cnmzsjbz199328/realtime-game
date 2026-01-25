/**
 * Game Export Utility
 * Responsible for wrapping raw game logic code into standalone, runnable HTML formats.
 * This separates the "Engine Harness" logic from the UI components.
 */

import { LIBRARY_SOURCE } from '../runtime/StandardLibrary';

export const getStandaloneHTML = (title: string, code: string): string => {
    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>${title}</title>
    <style>
        body { margin: 0; overflow: hidden; background: #000; color: #fff; font-family: monospace; }
        canvas { display: block; }
        #info { position: absolute; top: 10px; left: 10px; pointer-events: none; opacity: 0.7; }
    </style>
</head>
<body>
    <div id="info">Generated with Realtime-Game-Agent</div>
    <canvas id="canvas"></canvas>
    <script>
        /**
         * STANDARD LIBRARY (INJECTED CONDITIONALLY)
         * ----------------------------------------------------
         * Provides global classes if the game code doesn't define them.
         */
        ${(() => {
            const hasVectorRedef = /class\s+Vector\b|const\s+Vector\b|var\s+Vector\b|function\s+Vector\b/.test(code);
            const hasColorsRedef = /const\s+COLORS\b|var\s+COLORS\b|let\s+COLORS\b/.test(code);

            // If the code defines its own Vector/COLORS, we should be careful.
            // However, LIBRARY_SOURCE currently exports everything as a block.
            // Strategy: Inject it ONLY if Vector is missing. 
            // In the future, we should split LIBRARY_SOURCE. 
            // For now, if AI defines Vector, we assume it's self-contained and SKIP the library to avoid "Identifier declared".

            if (hasVectorRedef || hasColorsRedef) {
                return '// Standard Library injection skipped (User code defines Vector/COLORS)';
            } else {
                return LIBRARY_SOURCE;
            }
        })()}

        /**
         * GAME LOGIC SECTION (AI GENERATED)
         * ----------------------------------------------------
         */
        const gameFactory = function() {
${code}
        };

        /**
         * ENGINE HARNESS SECTION (STATIC SHELL)
         * ----------------------------------------------------
         * This simulates the environment provided by the React App (GameHarness.tsx).
         * It provides the Game Loop, Input Handling, and State Management.
         */
        
        // 1. Setup Canvas
        const gameDef = gameFactory();
        const canvas = document.getElementById('canvas');
        const ctx = canvas.getContext('2d');
        
        // 2. State Container
        let state = {
            width: window.innerWidth,
            height: window.innerHeight,
            scene: 'MENU',
            score: 0,
            game: null,
            wasDown: false,
            // Add any other standard state properties here
        };
        
        // 3. Input Container
        let input = {
            keys: {},
            isDown: false,
            x: 0,
            y: 0
        };

        // 4. Input Listeners
        function resize() {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
            state.width = canvas.width;
            state.height = canvas.height;
        }
        window.addEventListener('resize', resize);
        resize();

        window.addEventListener('keydown', e => {
            input.keys[e.code] = true;
            input[e.code] = true;
            if (e.key === ' ') input[' '] = true;
            input[e.key.toLowerCase()] = true;
            
            // Basic aliases for AI compatibility
            if (e.key === 'ArrowLeft') input.left = true;
            if (e.key === 'ArrowRight') input.right = true;
            if (e.key === 'ArrowUp') input.up = true;
            if (e.key === 'ArrowDown') input.down = true;
            if (e.key === ' ') input.Space = true;
        });
        window.addEventListener('keyup', e => {
            input.keys[e.code] = false;
            input[e.code] = false;
            if (e.key === ' ') input[' '] = false;
            input[e.key.toLowerCase()] = false;

            if (e.key === 'ArrowLeft') input.left = false;
            if (e.key === 'ArrowRight') input.right = false;
            if (e.key === 'ArrowUp') input.up = false;
            if (e.key === 'ArrowDown') input.down = false;
            if (e.key === ' ') input.Space = false;
        });
        window.addEventListener('mousedown', e => {
            input.isDown = true;
            updateCoord(e.clientX, e.clientY);
        });
        window.addEventListener('mouseup', () => input.isDown = false);
        window.addEventListener('mousemove', e => {
            updateCoord(e.clientX, e.clientY);
        });

        // Touch supports
        window.addEventListener('touchstart', e => {
            input.isDown = true;
            if (e.touches.length > 0) updateCoord(e.touches[0].clientX, e.touches[0].clientY);
            if (e.target === canvas) e.preventDefault();
        }, { passive: false });
        window.addEventListener('touchmove', e => {
            if (e.touches.length > 0) updateCoord(e.touches[0].clientX, e.touches[0].clientY);
            if (e.target === canvas) e.preventDefault();
        }, { passive: false });
        window.addEventListener('touchend', e => {
            input.isDown = false;
            // if (e.target === canvas) e.preventDefault();
        });

        function updateCoord(clientX, clientY) {
            const rect = canvas.getBoundingClientRect();
            const scaleX = canvas.width / rect.width;
            const scaleY = canvas.height / rect.height;
            input.x = (clientX - rect.left) * scaleX;
            input.y = (clientY - rect.top) * scaleY;
        }


        // 5. Game Loop
        let lastTime = performance.now();
        
        // Init Call
        if (gameDef.init) gameDef.init(state, canvas.width, canvas.height);

        function loop(timestamp) {
            const deltaTime = (timestamp - lastTime) / 1000; // Seconds
            lastTime = timestamp;
            const safeDelta = Math.min(deltaTime, 0.1); 

            try {
                if (gameDef.update) gameDef.update(state, input, safeDelta, canvas.width, canvas.height);
                if (gameDef.draw) gameDef.draw(state, ctx, canvas.width, canvas.height);
            } catch (e) {
                console.error("Game Loop Error:", e);
                ctx.fillStyle = "red";
                ctx.font = "20px monospace";
                ctx.fillText("Runtime Error: " + e.message, 50, 50);
                return; // Stop loop on error
            }

            requestAnimationFrame(loop);
        }

        requestAnimationFrame(loop);
    <\/script>
</body>
</html>`;
};
