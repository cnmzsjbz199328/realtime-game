import React, { useState, useEffect } from 'react';
import { GameHarness } from '../../../components/GameHarness';
import { AgentStatus, GameDefinition } from '../../../core/domain/types';

interface GameStageProps {
    status: AgentStatus;
    game: GameDefinition | null;
    onCrash: (error: string) => void;
    onSave: (game: GameDefinition) => void;
    onBack: () => void;
}

export const GameStage: React.FC<GameStageProps> = ({ status, game, onCrash, onSave, onBack }) => {
    const [saved, setSaved] = useState(false);
    const [isInfoExpanded, setIsInfoExpanded] = useState(true);

    useEffect(() => {
        if (status === AgentStatus.DEPLOYED) {
            setIsInfoExpanded(true);
            const timer = setTimeout(() => {
                setIsInfoExpanded(false);
            }, 2500);
            return () => clearTimeout(timer);
        }
    }, [status, game]);

    const handleSave = () => {
        if (game) {
            onSave(game);
            setSaved(true);
            setTimeout(() => setSaved(false), 2000);
        }
    };

    return (
        <section className={`w-full h-full transition-all duration-700 ${status === AgentStatus.DEPLOYED ? 'opacity-100 translate-y-0' : 'opacity-40 translate-y-4 grayscale'}`}>
            {status === AgentStatus.DEPLOYED && game ? (
                <div className="w-full h-full relative group overflow-hidden bg-black rounded-xl border border-brand-cyan/20">

                    {/* GAME CANVAS LAYER */}
                    <GameHarness gameDef={game} onCrash={onCrash} />

                    {/* TOP RIGHT ACTIONS (Overlay) */}
                    <div className="absolute top-6 right-6 flex items-center gap-3 z-50 transition-opacity duration-300 opacity-60 hover:opacity-100">
                        <button
                            onClick={onBack}
                            className="w-10 h-10 flex items-center justify-center rounded-full bg-black/50 hover:bg-black/80 backdrop-blur-sm text-gray-400 hover:text-white transition-all border border-white/10"
                            title="Back to Terminal"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path></svg>
                        </button>

                        <button
                            onClick={handleSave}
                            className={`w-10 h-10 flex items-center justify-center rounded-full backdrop-blur-sm transition-all border ${saved ? 'bg-red-500/20 border-red-500 text-red-500' : 'bg-black/50 border-white/10 text-gray-400 hover:text-red-500'}`}
                            title="Like / Save"
                        >
                            <svg className="w-5 h-5" fill={saved ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"></path></svg>
                        </button>
                    </div>

                    {/* BOTTOM LEFT INFO PANEL (Auto-Collapsing) */}
                    <div className="absolute bottom-6 left-6 z-40 max-w-md pointer-events-auto">
                        <div
                            className={`
                                relative backdrop-blur-md border-l-4 border-brand-cyan transition-all duration-500 ease-in-out cursor-pointer overflow-hidden
                                ${isInfoExpanded ? 'bg-black/80 p-5 rounded-r-xl shadow-2xl translate-y-0' : 'bg-black/40 p-3 rounded-r-lg hover:bg-black/60 translate-y-2'}
                            `}
                            onClick={() => setIsInfoExpanded(!isInfoExpanded)}
                            onMouseEnter={() => setIsInfoExpanded(true)}
                        >
                            <div className="flex items-center gap-3">
                                <h2 className={`font-bold text-white tracking-tight transition-all duration-300 ${isInfoExpanded ? 'text-xl' : 'text-sm opacity-80'}`}>
                                    {game.title}
                                </h2>
                                {!isInfoExpanded && (
                                    <span className="text-[10px] text-brand-cyan uppercase tracking-widest animate-pulse">Info</span>
                                )}
                            </div>

                            <div className={`transition-all duration-500 ease-in-out overflow-hidden ${isInfoExpanded ? 'max-h-40 opacity-100 mt-2' : 'max-h-0 opacity-0 mt-0'}`}>
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

                </div>
            ) : (
                <div className="h-full border border-dashed border-zinc-800 rounded-2xl flex flex-col items-center justify-center text-zinc-600 bg-zinc-900/20">
                    <div className="text-6xl mb-4 opacity-20">🎮</div>
                    <p>Waiting for deployment...</p>
                </div>
            )}
        </section>
    );
};
