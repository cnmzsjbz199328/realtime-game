import React from 'react';
import { InputState } from '../core/domain/types';

interface VirtualControlsProps {
    inputRef: React.MutableRefObject<InputState>;
    isVisible: boolean;
}

export const VirtualControls: React.FC<VirtualControlsProps> = ({ inputRef, isVisible }) => {

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
        <div className={`absolute inset-0 pointer-events-none z-10 ${isVisible ? 'block' : 'hidden'}`}>
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
    );
};
