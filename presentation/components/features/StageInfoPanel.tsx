import React from 'react';
import { GameDefinition } from '../../../core/domain/types';

interface StageInfoPanelProps {
    game: GameDefinition;
    isExpanded: boolean;
    onToggle: () => void;
}

export const StageInfoPanel: React.FC<StageInfoPanelProps> = ({ game, isExpanded, onToggle }) => {
    return (
        <div className="absolute bottom-6 left-6 z-40 max-w-md pointer-events-auto transition-all duration-500">
            <div
                className={`
                    relative transition-all duration-500 ease-in-out cursor-pointer overflow-hidden
                    ${isExpanded
                        ? 'bg-black/90 backdrop-blur-md p-5 rounded-r-xl shadow-2xl border-l-4 border-brand-cyan translate-y-0'
                        : 'bg-transparent p-2 border-l-0 translate-y-2'
                    }
                `}
                onClick={onToggle}
            >
                <div className="flex items-center gap-3">
                    <h2 className={`font-bold text-white tracking-tight transition-all duration-300 drop-shadow-md ${isExpanded ? 'text-xl' : 'text-sm opacity-50 hover:opacity-100'}`}>
                        {game.title}
                    </h2>
                    {!isExpanded && (
                        <span className="text-[10px] text-brand-cyan uppercase tracking-widest opacity-50 drop-shadow-sm">Info</span>
                    )}
                </div>

                <div className={`transition-all duration-500 ease-in-out overflow-hidden ${isExpanded ? 'max-h-40 opacity-100 mt-2' : 'max-h-0 opacity-0 mt-0'}`}>
                    <p className="text-sm text-gray-300 leading-relaxed">
                        {game.description}
                    </p>
                    <div className="mt-3 flex gap-2 text-[10px] font-mono text-brand-cyan opacity-80">
                        <span className="bg-brand-cyan/10 px-1.5 py-0.5 rounded border border-brand-cyan/20">WASD/ARROWS</span>
                        <span className="bg-brand-cyan/10 px-1.5 py-0.5 rounded border border-brand-cyan/20">SPACE/CLICK</span>
                    </div>
                </div>
            </div>
        </div>
    );
};
