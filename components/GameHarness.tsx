import React, { useEffect, useRef, useState } from 'react';
import { GameDefinition, InputState } from '../core/domain/types';
import { useGameInput } from './hooks/useGameInput';
import { VirtualControls } from './VirtualControls';

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

  // Extracted Hook
  const inputRef = useGameInput(canvasRef);

  const [runtimeError, setRuntimeError] = useState<string | null>(null);
  const [isTouchDevice, setIsTouchDevice] = useState(false);

  // Detect touch device on mount
  useEffect(() => {
    const hasTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    setIsTouchDevice(hasTouch);
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
      <VirtualControls inputRef={inputRef} isVisible={isTouchDevice} />

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
