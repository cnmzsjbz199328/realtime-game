import React, { useEffect, useRef, useState } from 'react';
import { GameDefinition, InputState } from '../types';

interface GameHarnessProps {
  gameDef: GameDefinition;
  onCrash: (error: string) => void;
}

export const GameHarness: React.FC<GameHarnessProps> = ({ gameDef, onCrash }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const requestRef = useRef<number | null>(null);
  const stateRef = useRef<any>({});
  
  // Input handling
  const inputRef = useRef<InputState>({ x: 0, y: 0, isDown: false, keys: {} });

  const [runtimeError, setRuntimeError] = useState<string | null>(null);

  // Setup Input Listeners
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!canvasRef.current) return;
      const rect = canvasRef.current.getBoundingClientRect();
      inputRef.current.x = e.clientX - rect.left;
      inputRef.current.y = e.clientY - rect.top;
    };
    const handleMouseDown = () => { inputRef.current.isDown = true; };
    const handleMouseUp = () => { inputRef.current.isDown = false; };
    const handleKeyDown = (e: KeyboardEvent) => { inputRef.current.keys[e.key] = true; };
    const handleKeyUp = (e: KeyboardEvent) => { inputRef.current.keys[e.key] = false; };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mouseup', handleMouseUp);
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
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

    // Reset State
    stateRef.current = {};
    setRuntimeError(null);

    let setupFunc: Function;
    let updateFunc: Function;

    try {
      // Create functions from string (The Harness)
      // We pass the dependencies as argument names, and the code string as body
      // eslint-disable-next-line no-new-func
      setupFunc = new Function('ctx', 'canvas', 'state', gameDef.setupCode);
      // eslint-disable-next-line no-new-func
      updateFunc = new Function('ctx', 'canvas', 'state', 'input', gameDef.updateCode);
      
      // Run Setup
      setupFunc(ctx, canvas, stateRef.current);

    } catch (e: any) {
      const msg = `Compilation/Setup Error: ${e.message}`;
      console.error(msg);
      setRuntimeError(msg);
      onCrash(msg);
      return;
    }

    // Run Loop
    const animate = () => {
      try {
        updateFunc(ctx, canvas, stateRef.current, inputRef.current);
        requestRef.current = requestAnimationFrame(animate);
      } catch (e: any) {
        const msg = `Runtime Error: ${e.message}`;
        console.error(msg);
        setRuntimeError(msg);
        onCrash(msg);
        // Stop loop on error
        if (requestRef.current !== null) cancelAnimationFrame(requestRef.current);
      }
    };

    requestRef.current = requestAnimationFrame(animate);

    return () => {
      if (requestRef.current !== null) cancelAnimationFrame(requestRef.current);
    };
  }, [gameDef, onCrash]);

  return (
    <div className="relative w-full h-full flex flex-col items-center justify-center bg-black/50 rounded-xl overflow-hidden border border-zinc-700">
      {runtimeError ? (
        <div className="absolute inset-0 flex items-center justify-center bg-black/90 text-red-500 p-8 text-center font-mono z-20">
          <div>
            <h3 className="text-xl font-bold mb-4">CRITICAL SYSTEM FAILURE</h3>
            <p className="bg-red-900/20 p-4 rounded border border-red-900">{runtimeError}</p>
            <p className="mt-4 text-zinc-500 text-sm">Agent Engineer has been notified.</p>
          </div>
        </div>
      ) : null}
      
      <canvas 
        ref={canvasRef}
        width={800}
        height={600}
        className="max-w-full max-h-full shadow-2xl cursor-crosshair bg-[#050505]"
      />
      
      {/* UI Overlay for game instructions */}
      <div className="absolute top-4 left-4 pointer-events-none">
        <h2 className="text-2xl font-black text-white drop-shadow-md tracking-tighter uppercase italic bg-black/50 px-2">
          {gameDef.title}
        </h2>
        <p className="text-sm text-zinc-300 bg-black/50 px-2 mt-1 max-w-md">
          {gameDef.description}
        </p>
      </div>

       <div className="absolute bottom-4 right-4 text-xs text-zinc-600 font-mono">
         HARNESS v1.0.4 :: RENDER_LOOP_ACTIVE
       </div>
    </div>
  );
};