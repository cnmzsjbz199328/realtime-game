import React, { useEffect, useRef, useState } from 'react';
import { GameDefinition, InputState } from '../core/domain/types';

interface GameHarnessProps {
  gameDef: GameDefinition;
  onCrash: (error: string) => void;
}

interface GameInterface {
  init: (state: any, width: number, height: number) => void;
  update: (state: any, input: InputState, deltaTime: number, width: number, height: number) => void;
  draw: (state: any, ctx: CanvasRenderingContext2D, width: number, height: number) => void;
}

export const GameHarness: React.FC<GameHarnessProps> = ({ gameDef, onCrash }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const requestRef = useRef<number | null>(null);
  const stateRef = useRef<any>({});
  const lastTimeRef = useRef<number>(0);

  // Input handling
  const inputRef = useRef<InputState>({ x: 0, y: 0, isDown: false, keys: {} });

  const [runtimeError, setRuntimeError] = useState<string | null>(null);
  const [isTouchDevice, setIsTouchDevice] = useState(false);

  // Detect touch device on mount
  useEffect(() => {
    const hasTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    setIsTouchDevice(hasTouch);
  }, []);

  // Setup Input Listeners
  useEffect(() => {
    const updateInputCoord = (clientX: number, clientY: number) => {
      if (!canvasRef.current) return;
      const rect = canvasRef.current.getBoundingClientRect();
      const scaleX = canvasRef.current.width / rect.width;
      const scaleY = canvasRef.current.height / rect.height;
      inputRef.current.x = (clientX - rect.left) * scaleX;
      inputRef.current.y = (clientY - rect.top) * scaleY;
    };

    const handleMouseMove = (e: MouseEvent) => {
      updateInputCoord(e.clientX, e.clientY);
    };
    const handleMouseDown = () => { inputRef.current.isDown = true; };
    const handleMouseUp = () => { inputRef.current.isDown = false; };

    const handleKeyDown = (e: KeyboardEvent) => {
      inputRef.current.keys[e.code] = true;
      (inputRef.current as any)[e.code] = true;
      if (e.key === ' ') (inputRef.current as any)[' '] = true;
      (inputRef.current as any)[e.key.toLowerCase()] = true;

      if (e.key === 'ArrowLeft') (inputRef.current as any).left = true;
      if (e.key === 'ArrowRight') (inputRef.current as any).right = true;
      if (e.key === 'ArrowUp') (inputRef.current as any).up = true;
      if (e.key === 'ArrowDown') (inputRef.current as any).down = true;
      if (e.key === ' ') (inputRef.current as any).Space = true;
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      inputRef.current.keys[e.code] = false;
      (inputRef.current as any)[e.code] = false;
      if (e.key === ' ') (inputRef.current as any)[' '] = false;
      (inputRef.current as any)[e.key.toLowerCase()] = false;

      if (e.key === 'ArrowLeft') (inputRef.current as any).left = false;
      if (e.key === 'ArrowRight') (inputRef.current as any).right = false;
      if (e.key === 'ArrowUp') (inputRef.current as any).up = false;
      if (e.key === 'ArrowDown') (inputRef.current as any).down = false;
      if (e.key === ' ') (inputRef.current as any).Space = false;
    };

    // Touch support
    const handleTouchStart = (e: TouchEvent) => {
      if (e.touches.length > 0) {
        updateInputCoord(e.touches[0].clientX, e.touches[0].clientY);
        inputRef.current.isDown = true;
      }
      if (e.target === canvasRef.current) e.preventDefault();
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches.length > 0) {
        updateInputCoord(e.touches[0].clientX, e.touches[0].clientY);
      }
      if (e.target === canvasRef.current) e.preventDefault();
    };

    const handleTouchEnd = (e: TouchEvent) => {
      inputRef.current.isDown = false;
      if (e.target === canvasRef.current) e.preventDefault();
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mouseup', handleMouseUp);
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    window.addEventListener('touchstart', handleTouchStart, { passive: false });
    window.addEventListener('touchmove', handleTouchMove, { passive: false });
    window.addEventListener('touchend', handleTouchEnd, { passive: false });

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('touchstart', handleTouchStart);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleTouchEnd);
    };
  }, []);

  // Initialize and Run Game
  useEffect(() => {
    if (!canvasRef.current || !gameDef) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      setRuntimeError("Could not get 2D context");
      return;
    }

    stateRef.current = {};
    setRuntimeError(null);
    lastTimeRef.current = performance.now();

    let gameInterface: GameInterface;
    let isActive = true;

    // Use async IIFE to allow awaiting the standard library
    const initGame = async () => {
      try {
        const { Vector, COLORS, RetroAudio } = await import('../core/runtime/StandardLibrary');


        if (!isActive) return;

        // SANDBOX COMPATIBILITY LAYER
        // ----------------------------------------------------
        // Detailed analysis of the code to prevent naming conflicts.

        const code = gameDef.code;

        // Strip comments to prevent false positives in regex checks
        // e.g. "// const sfx = ..." should NOT trigger redeclaration logic
        const codeWithoutComments = code.replace(/\/\*[\s\S]*?\*\/|([^:]|^)\/\/.*$/gm, '$1');

        const hasVectorRedef = /class\s+Vector\b|const\s+Vector\b|var\s+Vector\b|function\s+Vector\b/.test(codeWithoutComments);
        const hasColorsRedef = /const\s+COLORS\b|var\s+COLORS\b|let\s+COLORS\b/.test(codeWithoutComments);

        // Build injection context dynamically
        const argNames = [];
        const argValues = [];

        // 1. Vector: Inject only if not redefined
        if (!hasVectorRedef) {
          argNames.push('Vector');
          argValues.push(Vector);
        }

        // 2. COLORS: Inject only if not redefined
        if (!hasColorsRedef) {
          argNames.push('COLORS');
          argValues.push(COLORS);
        }

        // 3. Audio: Conditional Injection to prevent "Identifier 'sfx' already declared"
        const hasSfxRedef = /const\s+sfx\b|let\s+sfx\b|var\s+sfx\b|function\s+sfx\b/.test(codeWithoutComments);

        let sfx: any; // Keep reference to resume context later

        if (!hasSfxRedef) {
          sfx = new RetroAudio();
          argNames.push('sfx');
          argValues.push(sfx);
        }

        // Resume audio on interaction (only if we injected it or can access it)
        if (sfx) {
          const resumeAudio = () => sfx.resume();
          window.addEventListener('click', resumeAudio, { once: true });
          window.addEventListener('keydown', resumeAudio, { once: true });
        }


        // 3. GameObject: REMOVED from injection (Option B)
        // AI is expected to define its own base class if needed to avoid inheritance conflicts.

        // Create the sandbox function with dynamic arguments
        // 'GameObject' is purposefully omitted.
        const createGame = new Function(...argNames, code);
        const result = createGame(...argValues);

        if (!result || typeof result.init !== 'function' || typeof result.update !== 'function' || typeof result.draw !== 'function') {
          throw new Error("Generated code missing init/update/draw");
        }

        gameInterface = result as GameInterface;
        gameInterface.init(stateRef.current, canvas.width, canvas.height);

        // Start loop only after init is ready
        requestRef.current = requestAnimationFrame(animate);

      } catch (e: any) {
        if (!isActive) return;
        const msg = `Setup Error: ${e.message}`;
        console.error(msg);
        setRuntimeError(msg);
        onCrash(msg);
      }
    };

    const animate = (time: number) => {
      try {
        const deltaTime = (time - lastTimeRef.current) / 1000;
        lastTimeRef.current = time;
        const dt = Math.min(deltaTime, 0.1);

        if (gameInterface) {
          gameInterface.update(stateRef.current, inputRef.current, dt, canvas.width, canvas.height);
          gameInterface.draw(stateRef.current, ctx, canvas.width, canvas.height);
        }

        requestRef.current = requestAnimationFrame(animate);
      } catch (e: any) {
        const msg = `Runtime Error: ${e.message}`;
        console.error(msg);
        setRuntimeError(msg);
        onCrash(msg);
        if (requestRef.current) cancelAnimationFrame(requestRef.current);
      }
    };

    // --- RESIZE OBSERVER (Dynamic Resolution) ---
    const resizeObserver = new ResizeObserver((entries) => {
      if (!entries[0] || !canvas) return;
      const { width, height } = entries[0].contentRect;

      // Update internal resolution to match display size (1:1 pixel ratio for crispness)
      // or you could fix it to a lower retro resolution (e.g. 320x240) and scale up with CSS.
      // Here we choose 1:1 for sharp text rendering.
      canvas.width = width;
      canvas.height = height;

      // Force a redraw/input update immediately
      if (gameInterface) {
        gameInterface.init(stateRef.current, width, height);
      }
    });

    resizeObserver.observe(containerRef.current!);

    // Kick off initialization
    initGame();

    return () => {
      isActive = false;
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
      resizeObserver.disconnect();
    };
  }, [gameDef, onCrash]);

  // Virtual Controls Logic
  const handleVirtualKey = (key: string, isDown: boolean, e: React.TouchEvent | React.MouseEvent) => {
    // Only logic processing here. Event prevention is handled globally by the container.
    e.preventDefault();
    e.stopPropagation(); // Keep it local

    inputRef.current.keys[key] = isDown;
    (inputRef.current as any)[key] = isDown;
    // Common aliases
    if (key === 'ArrowUp') (inputRef.current as any).up = isDown;
    if (key === 'ArrowDown') (inputRef.current as any).down = isDown;
    if (key === 'ArrowLeft') (inputRef.current as any).left = isDown;
    if (key === 'ArrowRight') (inputRef.current as any).right = isDown;
    if (key === 'Space') (inputRef.current as any)[' '] = isDown;
  };

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full flex flex-col items-center justify-center bg-black/50 rounded-xl overflow-hidden border border-zinc-700 select-none"
      // 1. GLOBAL EVENT CAPTURE (The Black Hole Strategy)
      // We prevent DEFAULT on the container for contextmenu, creating a safe zone.
      onContextMenu={(e) => { e.preventDefault(); e.stopPropagation(); }}
      style={{
        touchAction: 'none',             // CSS: Disable browser scrolling/zooming
        WebkitTouchCallout: 'none',      // iOS: Disable Magnifying Glass / Menu
        WebkitUserSelect: 'none',        // iOS: Disable Text Selection
        userSelect: 'none',              // Standard: Disable Text Selection
        WebkitTapHighlightColor: 'transparent' // Standard: Disable Tap Highlight
      }}
    >

      {/* VIRTUAL CONTROLS OVERLAY - Only visible on touch/mobile */}
      <div className={`absolute inset-0 pointer-events-none z-10 ${isTouchDevice ? 'block' : 'hidden'}`}>
        {/* D-PAD Left */}
        <div className="absolute bottom-8 left-8 grid grid-cols-3 gap-2 pointer-events-auto opacity-40 hover:opacity-80 transition-opacity">
          <div />
          <button
            onTouchStart={(e) => handleVirtualKey('ArrowUp', true, e)}
            onTouchEnd={(e) => handleVirtualKey('ArrowUp', false, e)}
            onMouseDown={(e) => handleVirtualKey('ArrowUp', true, e)}
            onMouseUp={(e) => handleVirtualKey('ArrowUp', false, e)}
            className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center active:bg-white/50"
          >↑</button>
          <div />
          <button
            onTouchStart={(e) => handleVirtualKey('ArrowLeft', true, e)}
            onTouchEnd={(e) => handleVirtualKey('ArrowLeft', false, e)}
            onMouseDown={(e) => handleVirtualKey('ArrowLeft', true, e)}
            onMouseUp={(e) => handleVirtualKey('ArrowLeft', false, e)}
            className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center active:bg-white/50"
          >←</button>
          <div className="w-12 h-12 flex items-center justify-center text-white/20">•</div>
          <button
            onTouchStart={(e) => handleVirtualKey('ArrowRight', true, e)}
            onTouchEnd={(e) => handleVirtualKey('ArrowRight', false, e)}
            onMouseDown={(e) => handleVirtualKey('ArrowRight', true, e)}
            onMouseUp={(e) => handleVirtualKey('ArrowRight', false, e)}
            className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center active:bg-white/50"
          >→</button>
          <div />
          <button
            onTouchStart={(e) => handleVirtualKey('ArrowDown', true, e)}
            onTouchEnd={(e) => handleVirtualKey('ArrowDown', false, e)}
            onMouseDown={(e) => handleVirtualKey('ArrowDown', true, e)}
            onMouseUp={(e) => handleVirtualKey('ArrowDown', false, e)}
            className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center active:bg-white/50"
          >↓</button>
          <div />
        </div>

        {/* Action Button Right */}
        <div className="absolute bottom-12 right-12 pointer-events-auto opacity-40 hover:opacity-80 transition-opacity">
          <button
            onTouchStart={(e) => handleVirtualKey('Space', true, e)}
            onTouchEnd={(e) => handleVirtualKey('Space', false, e)}
            onMouseDown={(e) => handleVirtualKey('Space', true, e)}
            onMouseUp={(e) => handleVirtualKey('Space', false, e)}
            className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center text-xl font-bold active:bg-white/50 border-4 border-white/10"
          >A</button>
        </div>
      </div>

      {runtimeError ? (
        <div className="absolute inset-0 flex items-center justify-center bg-black/90 text-red-500 p-8 text-center font-mono z-20">
          <div>
            <h3 className="text-xl font-bold mb-4">CRITICAL SYSTEM FAILURE</h3>
            <p className="bg-red-900/20 p-4 rounded border border-red-900">{runtimeError}</p>
            <p className="mt-4 text-zinc-500 text-sm">Agent Engineer has been notified.</p>
          </div>
        </div>
      ) : null}

      {/* 2. DYNAMIC FULLSCREEN CANVAS */}
      {/* We removed width={800} height={600}. It now fills the container 100%. */}
      {/* The ResizeObserver above handles the internal logical resolution. */}
      <canvas
        ref={canvasRef}
        className="block w-full h-full shadow-2xl cursor-crosshair bg-[#050505]"
      />
    </div>
  );
};