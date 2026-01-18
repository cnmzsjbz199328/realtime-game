import React from 'react';

interface FlipContainerProps {
    isFlipped: boolean;
    front: React.ReactNode;
    back: React.ReactNode;
    height?: string;
}

export const FlipContainer: React.FC<FlipContainerProps> = ({ isFlipped, front, back, height = '600px' }) => {
    return (
        <div className={`relative w-full max-w-4xl mx-auto perspective-1000 animate-fade-in-up transition-all duration-500`} style={{ height }}>

            {/* FLIP CARD INNER */}
            <div
                className={`relative w-full h-full transition-transform duration-1000 transform-style-3d ${isFlipped ? 'rotate-y-180' : ''}`}
            >

                {/* FRONT: INPUT & TERMINAL */}
                <div
                    className={`absolute w-full h-full backface-hidden flex flex-col items-center transition-opacity duration-300 ${isFlipped ? 'opacity-0 pointer-events-none invisible' : 'opacity-100'}`}
                    style={{ zIndex: isFlipped ? 0 : 1 }}
                >
                    {front}
                </div>

                {/* BACK: GAME CANVAS */}
                <div
                    className={`absolute w-full h-full backface-hidden rotate-y-180 flex items-center justify-center bg-brand-dark/90 rounded-xl border border-brand-cyan/20 shadow-[0_0_50px_rgba(0,229,255,0.1)] overflow-hidden transition-opacity duration-300 ${isFlipped ? 'opacity-100' : 'opacity-0 pointer-events-none invisible'}`}
                    style={{ zIndex: isFlipped ? 1 : 0 }}
                >
                    {back}
                </div>

            </div>
        </div>
    );
};
