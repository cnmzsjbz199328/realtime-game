/**
 * Game Export Utility
 * Responsible for wrapping raw game logic code into standalone, runnable HTML formats.
 * This separates the "Engine Harness" logic from the UI components.
 */

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
            input.x = e.clientX;
            input.y = e.clientY;
        });
        window.addEventListener('mouseup', () => input.isDown = false);
        window.addEventListener('mousemove', e => {
            input.x = e.clientX;
            input.y = e.clientY;
        });
        // Touch supports
        window.addEventListener('touchstart', e => {
            input.isDown = true;
            input.x = e.touches[0].clientX;
            input.y = e.touches[0].clientY;
        });
        window.addEventListener('touchend', () => input.isDown = false);


        // 5. Game Loop
        let lastTime = performance.now();
        
        // Init Call
        if (gameDef.init) gameDef.init(state, state.width, state.height);

        function loop(timestamp) {
            const deltaTime = (timestamp - lastTime) / 1000; // Seconds
            lastTime = timestamp;
            const safeDelta = Math.min(deltaTime, 0.1); 

            try {
                if (gameDef.update) gameDef.update(state, input, safeDelta);
                if (gameDef.draw) gameDef.draw(state, ctx, state.width, state.height);
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
