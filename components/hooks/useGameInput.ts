import { InputState } from '../../core/domain/types';
import React, { useEffect, useRef } from 'react';

export const useGameInput = (
    canvasRef: React.RefObject<HTMLCanvasElement>,
    initialInput: InputState = { x: 0, y: 0, isDown: false, keys: {} }
) => {
    const inputRef = useRef<InputState>(initialInput);

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

            // Alias common keys
            if (e.key === 'ArrowLeft') (inputRef.current as any).left = true;
            if (e.key === 'ArrowRight') (inputRef.current as any).right = true;
            if (e.key === 'ArrowUp') (inputRef.current as any).up = true;
            if (e.key === 'ArrowDown') (inputRef.current as any).down = true;
            if (e.key === ' ') (inputRef.current as any).Space = true;
        };

        const handleKeyUp = (e: KeyboardEvent) => {
            inputRef.current.keys[e.code] = false;
            (inputRef.current as any)[e.code] = false;
            // Clear aliases
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
    }, [canvasRef]);

    return inputRef;
};
