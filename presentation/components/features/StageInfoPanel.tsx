import React from 'react';
import { GameDefinition } from '../../../core/domain/types';

interface StageInfoPanelProps {
    game: GameDefinition;
    isExpanded: boolean;
    onToggle: () => void;
}

export const StageInfoPanel: React.FC<StageInfoPanelProps> = ({ game, isExpanded, onToggle }) => {
    return (
        <div
            className={`absolute top-[72px] left-6 z-40 max-w-md pointer-events-auto transition-all duration-500 ${isExpanded ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4 pointer-events-none'
                }`}
        >
            <div className="bg-black/80 backdrop-blur-xl p-5 rounded-2xl shadow-2xl border border-white/10 ring-1 ring-white/5">
                <div className="flex items-center justify-between gap-4 mb-3">
                    <h2 className="font-bold text-white text-xl tracking-tight">
                        {game.title}
                    </h2>
                    <button
                        onClick={onToggle}
                        className="p-1 hover:bg-white/10 rounded-full transition-colors text-gray-400"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                        </svg>
                    </button>
                </div>

                <div className="space-y-4">
                    <p className="text-sm text-gray-300 leading-relaxed">
                        {game.description}
                    </p>

                    <div className="flex flex-col gap-2">
                        <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Controls</span>
                        <div className="flex gap-2 text-[10px] font-mono text-brand-cyan">
                            <span className="bg-brand-cyan/10 px-2 py-1 rounded border border-brand-cyan/20">WASD/ARROWS</span>
                            <span className="bg-brand-cyan/10 px-2 py-1 rounded border border-brand-cyan/20">SPACE/CLICK</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
