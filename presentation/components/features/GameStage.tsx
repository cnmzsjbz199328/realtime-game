import React, { useState, useEffect } from 'react';
import { GameHarness } from '../../../components/GameHarness';
import { AgentStatus, GameDefinition } from '../../../core/domain/types';
import { getStandaloneHTML } from '../../../core/utils/gameExport';
import { RemixOverlay } from './RemixOverlay';
import { AuthorSignatureModal } from './AuthorSignatureModal';
import { StageInfoPanel } from './StageInfoPanel';

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
    const [viewMode, setViewMode] = useState<'fragment' | 'full'>('full');
    const [editedCode, setEditedCode] = useState('');
    const [showRemixInput, setShowRemixInput] = useState(false);
    const [showAuthorModal, setShowAuthorModal] = useState(false);

    useEffect(() => {
        if (status === AgentStatus.DEPLOYED) {
            setIsInfoExpanded(true);
            const timer = setTimeout(() => setIsInfoExpanded(false), 2500);
            return () => clearTimeout(timer);
        }
    }, [status, game]);

    const INJECTION_HEADER = '// Environment provides: Vector, COLORS\n';
    const stripHeader = (code: string) =>
        code.startsWith(INJECTION_HEADER) ? code.substring(INJECTION_HEADER.length) : code;

    useEffect(() => {
        if (game?.code) {
            // Prepend header for display, but prevent double stacking
            const code = game.code.startsWith(INJECTION_HEADER) ? game.code : INJECTION_HEADER + game.code;
            setEditedCode(code);
        }
    }, [game?.code]);

    const handleSave = () => {
        if (!game) return;
        const hasId = (game as any).id;
        if (!hasId) {
            setShowAuthorModal(true);
            return;
        }
        performSave(game);
    };

    const performSave = (gameToSave: GameDefinition) => {
        const cleanCode = stripHeader(editedCode);

        onSave({ ...gameToSave, code: cleanCode });
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
        setShowAuthorModal(false);
    };

    const handleApplyCode = () => {
        const cleanCode = stripHeader(editedCode);

        if (onUpdateCode && cleanCode !== game?.code) {
            onUpdateCode(cleanCode);
        }
    };

    const cleanEditedCode = stripHeader(editedCode);

    const codeToDisplay = viewMode === 'full' && game
        ? getStandaloneHTML(game.title, editedCode)
        : editedCode;

    return (
        <section className={`w-full h-full transition-all duration-700 ${status === AgentStatus.DEPLOYED ? 'opacity-100 translate-y-0' : 'opacity-40 translate-y-4 grayscale'}`}>
            {status === AgentStatus.DEPLOYED && game ? (
                <div className="w-full h-full relative overflow-hidden bg-black rounded-xl border border-brand-cyan/20 flex flex-col">
                    {/* TABS */}
                    <div className="absolute top-6 left-6 right-6 z-50 flex gap-2 flex-wrap sm:flex-nowrap select-none">
                        {[
                            { id: 'play', label: 'PLAY', active: tab === 'play', onClick: () => setTab('play') },
                            { id: 'code', label: 'SOURCE', active: tab === 'code', onClick: () => { setTab('code'); setViewMode('fragment'); } },
                            { id: 'remix', label: '✨ REMIX', active: showRemixInput, activeClass: 'bg-purple-500 text-white border-purple-500', inactiveClass: 'bg-black/40 text-purple-400 border-purple-500/30', onClick: () => setShowRemixInput(!showRemixInput) },
                            { id: 'info', label: 'ℹ️ INFO', active: isInfoExpanded, activeClass: 'bg-zinc-700 text-white border-zinc-500', onClick: () => setIsInfoExpanded(!isInfoExpanded) }
                        ].map(btn => (
                            <button
                                key={btn.id}
                                onClick={btn.onClick}
                                className={`px-4 py-2 rounded-full font-bold text-xs border whitespace-nowrap transition-all ${btn.active
                                    ? (btn.activeClass || 'bg-brand-cyan text-black border-brand-cyan')
                                    : (btn.inactiveClass || 'bg-black/40 text-gray-400 border-white/10')
                                    }`}
                            >
                                {btn.label}
                            </button>
                        ))}
                    </div>

                    {showRemixInput && (
                        <RemixOverlay game={game} onClose={() => setShowRemixInput(false)} onCrash={onCrash} onSuccess={(newGame) => {
                            if (onUpdateCode) onUpdateCode(newGame.code);
                            setEditedCode(newGame.code);
                            setShowRemixInput(false);
                            setTab('play');
                        }} />
                    )}

                    <div className="flex-1 relative overflow-hidden">
                        {tab === 'play' ? (
                            <>
                                <GameHarness key={`${game.title}-${restartKey}`} gameDef={game} onCrash={onCrash} />
                                <StageInfoPanel game={game} isExpanded={isInfoExpanded} onToggle={() => setIsInfoExpanded(!isInfoExpanded)} />
                            </>
                        ) : (
                            <div className="w-full h-full bg-[#0d1117] flex flex-col">
                                <div className="h-14 border-b border-white/10 flex items-center justify-end px-6 gap-4 bg-black/20">
                                    <div className="flex items-center gap-4">
                                        <div className="flex bg-black/40 rounded-lg p-1 border border-white/10">
                                            <button
                                                onClick={(e) => { e.stopPropagation(); setViewMode('fragment'); }}
                                                className={`px-4 py-1.5 text-[10px] uppercase font-bold tracking-wider rounded transition-colors ${viewMode === 'fragment' ? 'bg-brand-cyan/20 text-brand-cyan shadow-sm' : 'text-zinc-500 hover:text-zinc-300'}`}
                                            >
                                                Editor
                                            </button>
                                            <button
                                                onClick={(e) => { e.stopPropagation(); setViewMode('full'); }}
                                                className={`px-4 py-1.5 text-[10px] uppercase font-bold tracking-wider rounded transition-colors ${viewMode === 'full' ? 'bg-brand-cyan/20 text-brand-cyan shadow-sm' : 'text-zinc-500 hover:text-zinc-300'}`}
                                            >
                                                Full HTML
                                            </button>
                                        </div>

                                        {viewMode === 'fragment' && (
                                            <button onClick={handleApplyCode} disabled={cleanEditedCode === game.code} className={`px-4 py-1.5 rounded text-xs font-bold transition-all ${cleanEditedCode !== game.code ? 'bg-brand-cyan text-black hover:bg-brand-cyan/90' : 'bg-white/5 text-white/20 cursor-not-allowed'}`}>APPLY</button>
                                        )}
                                        <button onClick={() => navigator.clipboard.writeText(codeToDisplay)} className="px-4 py-1.5 bg-white/5 hover:bg-white/10 border border-white/5 rounded text-xs text-zinc-400 transition-colors">COPY</button>
                                    </div>
                                </div>

                                <div className="flex-1 overflow-hidden relative group">
                                    {viewMode === 'fragment' ? (
                                        <textarea
                                            className="w-full h-full bg-[#0d1117] text-gray-300 p-6 font-mono text-xs leading-5 focus:outline-none resize-none selection:bg-brand-cyan/30"
                                            value={editedCode}
                                            onChange={(e) => setEditedCode(e.target.value)}
                                            spellCheck={false}
                                            placeholder="// Write your game code here..."
                                        />
                                    ) : (
                                        <pre className="w-full h-full overflow-auto p-6 text-zinc-400 font-mono text-xs leading-5 select-text cursor-text">{codeToDisplay}</pre>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="absolute top-6 right-6 flex items-center gap-3 z-50 transition-opacity duration-300 opacity-60 hover:opacity-100 select-none">
                        <button onClick={onBack} className="w-10 h-10 flex items-center justify-center rounded-full bg-black/50 text-gray-400 border border-white/10" style={{ WebkitTouchCallout: 'none' }} title="Back"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path></svg></button>
                        {tab === 'play' && (
                            <>
                                <button onClick={() => setRestartKey(k => k + 1)} className="w-10 h-10 flex items-center justify-center rounded-full bg-black/50 text-gray-400 border border-white/10" style={{ WebkitTouchCallout: 'none' }} title="Restart"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path></svg></button>
                                <button onClick={handleSave} className={`w-10 h-10 flex items-center justify-center rounded-full border transition-all ${saved ? 'bg-red-500/20 border-red-500 text-red-500' : 'bg-black/50 border-white/10 text-gray-400'}`} style={{ WebkitTouchCallout: 'none' }} title="Save"><svg className="w-5 h-5" fill={saved ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"></path></svg></button>
                            </>
                        )}
                    </div>

                    {showAuthorModal && <AuthorSignatureModal game={game} onClose={() => setShowAuthorModal(false)} onConfirm={performSave} />}
                </div>
            ) : (
                <div className="h-full border border-dashed border-zinc-800 rounded-2xl flex flex-col items-center justify-center text-zinc-600 bg-zinc-900/20">
                    <p>Waiting for deployment...</p>
                </div>
            )}
        </section>
    );
};
