import React, { useState, useEffect } from 'react';
import { GameHarness } from '../../../components/GameHarness';
import { AgentStatus, GameDefinition } from '../../../core/domain/types';
import { getStandaloneHTML } from '../../../core/utils/gameExport';

interface GameStageProps {
    status: AgentStatus;
    game: GameDefinition | null;
    onCrash: (error: string) => void;
    onSave: (game: GameDefinition) => void;
    onUpdateCode?: (code: string) => void;
    onBack: () => void;
}

export const GameStage: React.FC<GameStageProps> = ({ status, game, onCrash, onSave, onUpdateCode, onBack }) => {
    const [saved, setSaved] = useState(false);
    const [isInfoExpanded, setIsInfoExpanded] = useState(true);
    const [restartKey, setRestartKey] = useState(0);
    const [tab, setTab] = useState<'play' | 'code'>('play');
    const [viewMode, setViewMode] = useState<'fragment' | 'full'>('full'); // Default to full per user request

    // Configurable Code State
    const [editedCode, setEditedCode] = useState('');

    useEffect(() => {
        if (status === AgentStatus.DEPLOYED) {
            setIsInfoExpanded(true);
            const timer = setTimeout(() => {
                setIsInfoExpanded(false);
            }, 2500);
            return () => clearTimeout(timer);
        }
    }, [status, game]);

    // Sync edited code when game changes (external update)
    useEffect(() => {
        if (game?.code) {
            setEditedCode(game.code);
        }
    }, [game?.code]);

    const handleSave = () => {
        if (game) {
            onSave(game);
            setSaved(true);
            setTimeout(() => setSaved(false), 2000);
        }
    };

    const handleRestart = () => {
        setRestartKey(prev => prev + 1);
    };

    const handleApplyCode = () => {
        if (onUpdateCode && editedCode !== game?.code) {
            onUpdateCode(editedCode);
            // Optionally switch back to play tab or show success toast
            // setTab('play'); 
        }
    };

    const codeToDisplay = viewMode === 'full' && game
        ? getStandaloneHTML(game.title, editedCode) // Use edited code for preview if possible? Logic is complicated. Let's strictly separate.
        : editedCode;

    // Actually, if we are editing, we probably want to see the 'Logic' by default.
    // If ViewMode is FULL, we should probably generate HTML from the *edited* code so user can see what it would look like?
    // Yes, let's use `editedCode` for the generation.

    const handleCopyCode = () => {
        if (codeToDisplay) {
            navigator.clipboard.writeText(codeToDisplay);
            // could add toast here
        }
    };

    return (
        <section className={`w-full h-full transition-all duration-700 ${status === AgentStatus.DEPLOYED ? 'opacity-100 translate-y-0' : 'opacity-40 translate-y-4 grayscale'}`}>
            {status === AgentStatus.DEPLOYED && game ? (
                <div className="w-full h-full relative group overflow-hidden bg-black rounded-xl border border-brand-cyan/20 flex flex-col">

                    {/* TOP LEFT TABS */}
                    <div className="absolute top-6 left-6 z-50 flex gap-2">
                        <button
                            onClick={() => setTab('play')}
                            className={`px-4 py-2 rounded-full font-bold text-xs tracking-wider transition-all backdrop-blur-md border ${tab === 'play'
                                ? 'bg-brand-cyan text-black border-brand-cyan shadow-[0_0_15px_rgba(0,255,255,0.4)]'
                                : 'bg-black/40 text-gray-400 border-white/10 hover:border-white/30 hover:text-white'
                                }`}
                        >
                            PLAY
                        </button>
                        <button
                            onClick={() => {
                                setTab('code');
                                setViewMode('fragment'); // Default to edit mode when clicking source
                            }}
                            className={`px-4 py-2 rounded-full font-bold text-xs tracking-wider transition-all backdrop-blur-md border ${tab === 'code'
                                ? 'bg-brand-cyan text-black border-brand-cyan shadow-[0_0_15px_rgba(0,255,255,0.4)]'
                                : 'bg-black/40 text-gray-400 border-white/10 hover:border-white/30 hover:text-white'
                                }`}
                        >
                            SOURCE
                        </button>
                    </div>

                    {/* RENDER LAYER */}
                    <div className="flex-1 relative overflow-hidden">
                        {tab === 'play' ? (
                            <>
                                {/* GAME CANVAS LAYER */}
                                <GameHarness key={`${game.title}-${restartKey}`} gameDef={game} onCrash={onCrash} />

                                {/* BOTTOM LEFT INFO PANEL (Auto-Collapsing) - Only in Play Mode */}
                                <div className="absolute bottom-6 left-6 z-40 max-w-md pointer-events-auto transition-all duration-500">
                                    <div
                                        className={`
                                            relative transition-all duration-500 ease-in-out cursor-pointer overflow-hidden
                                            ${isInfoExpanded
                                                ? 'bg-black/90 backdrop-blur-md p-5 rounded-r-xl shadow-2xl border-l-4 border-brand-cyan translate-y-0'
                                                : 'bg-transparent p-2 border-l-0 translate-y-2'
                                            }
                                        `}
                                        onClick={() => setIsInfoExpanded(!isInfoExpanded)}
                                    >
                                        <div className="flex items-center gap-3">
                                            <h2 className={`font-bold text-white tracking-tight transition-all duration-300 drop-shadow-md ${isInfoExpanded ? 'text-xl' : 'text-sm opacity-50 hover:opacity-100'}`}>
                                                {game.title}
                                            </h2>
                                            {!isInfoExpanded && (
                                                <span className="text-[10px] text-brand-cyan uppercase tracking-widest opacity-50 drop-shadow-sm">Info</span>
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
                            </>
                        ) : (
                            <div className="w-full h-full bg-[#0d1117] text-gray-300 flex flex-col">
                                {/* Code Toolbar */}
                                <div className="h-14 border-b border-white/10 flex items-center justify-end px-6 gap-4 bg-black/20">
                                    <div className="flex bg-black/40 rounded-lg p-1 border border-white/10">
                                        <button
                                            onClick={() => setViewMode('fragment')}
                                            className={`px-3 py-1 text-[10px] rounded transition-all ${viewMode === 'fragment' ? 'bg-brand-cyan/20 text-brand-cyan' : 'text-gray-500 hover:text-gray-300'}`}
                                        >
                                            EDITOR (LOGIC)
                                        </button>
                                        <button
                                            onClick={() => setViewMode('full')}
                                            className={`px-3 py-1 text-[10px] rounded transition-all ${viewMode === 'full' ? 'bg-brand-cyan/20 text-brand-cyan' : 'text-gray-500 hover:text-gray-300'}`}
                                        >
                                            FULL HTML (READ ONLY)
                                        </button>
                                    </div>

                                    {viewMode === 'fragment' && onUpdateCode && (
                                        <button
                                            onClick={handleApplyCode}
                                            disabled={editedCode === game.code}
                                            className={`px-3 py-1.5 rounded border text-xs transition-all flex items-center gap-2 ${editedCode !== game.code
                                                ? 'bg-brand-cyan text-black border-brand-cyan hover:bg-cyan-400'
                                                : 'bg-white/5 text-gray-500 border-white/10 cursor-not-allowed'}`}
                                        >
                                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
                                            APPLY CHANGES
                                        </button>
                                    )}

                                    <button
                                        onClick={handleCopyCode}
                                        className="px-3 py-1.5 bg-white/10 hover:bg-white/20 rounded border border-white/10 text-xs text-white transition-all flex items-center gap-2"
                                    >
                                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"></path></svg>
                                        COPY
                                    </button>
                                </div>

                                {/* Code Editor Area */}
                                <div className="flex-1 overflow-hidden relative">
                                    {viewMode === 'fragment' ? (
                                        <textarea
                                            className="w-full h-full bg-[#0d1117] text-gray-300 p-6 font-mono text-xs leading-5 resize-none focus:outline-none custom-scrollbar"
                                            value={editedCode}
                                            onChange={(e) => setEditedCode(e.target.value)}
                                            spellCheck={false}
                                        />
                                    ) : (
                                        <pre className="w-full h-full overflow-auto p-6 custom-scrollbar">
                                            <code className="language-html text-gray-400 font-mono text-xs leading-5">
                                                {codeToDisplay}
                                            </code>
                                        </pre>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>


                    {/* TOP RIGHT ACTIONS (Overlay) */}
                    <div className="absolute top-6 right-6 flex items-center gap-3 z-50 transition-opacity duration-300 opacity-60 hover:opacity-100">
                        {/* Back Button - Keep */}
                        <button
                            onClick={onBack}
                            className="w-10 h-10 flex items-center justify-center rounded-full bg-black/50 hover:bg-black/80 backdrop-blur-sm text-gray-400 hover:text-white transition-all border border-white/10"
                            title="Back to Terminal"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path></svg>
                        </button>

                        {tab === 'play' && (
                            <>
                                <button
                                    onClick={handleRestart}
                                    className="w-10 h-10 flex items-center justify-center rounded-full bg-black/50 hover:bg-black/80 backdrop-blur-sm text-gray-400 hover:text-white transition-all border border-white/10"
                                    title="Restart Game"
                                >
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path></svg>
                                </button>

                                <button
                                    onClick={handleSave}
                                    className={`w-10 h-10 flex items-center justify-center rounded-full backdrop-blur-sm transition-all border ${saved ? 'bg-red-500/20 border-red-500 text-red-500' : 'bg-black/50 border-white/10 text-gray-400 hover:text-red-500'}`}
                                    title="Like / Save"
                                >
                                    <svg className="w-5 h-5" fill={saved ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"></path></svg>
                                </button>
                            </>
                        )}
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
