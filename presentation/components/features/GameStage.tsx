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

    useEffect(() => {
        if (game?.code) setEditedCode(game.code);
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
        onSave(gameToSave);
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
        setShowAuthorModal(false);
    };

    const handleApplyCode = () => {
        if (onUpdateCode && editedCode !== game?.code) {
            onUpdateCode(editedCode);
        }
    };

    const codeToDisplay = viewMode === 'full' && game
        ? getStandaloneHTML(game.title, editedCode)
        : editedCode;

    return (
        <section className={`w-full h-full transition-all duration-700 ${status === AgentStatus.DEPLOYED ? 'opacity-100 translate-y-0' : 'opacity-40 translate-y-4 grayscale'}`}>
            {status === AgentStatus.DEPLOYED && game ? (
                <div className="w-full h-full relative overflow-hidden bg-black rounded-xl border border-brand-cyan/20 flex flex-col">
                    {/* TABS */}
                    <div className="absolute top-6 left-6 z-50 flex gap-2">
                        <button onClick={() => setTab('play')} className={`px-4 py-2 rounded-full font-bold text-xs border ${tab === 'play' ? 'bg-brand-cyan text-black border-brand-cyan' : 'bg-black/40 text-gray-400 border-white/10'}`}>PLAY</button>
                        <button onClick={() => { setTab('code'); setViewMode('fragment'); }} className={`px-4 py-2 rounded-full font-bold text-xs border ${tab === 'code' ? 'bg-brand-cyan text-black border-brand-cyan' : 'bg-black/40 text-gray-400 border-white/10'}`}>SOURCE</button>
                        <button onClick={() => setShowRemixInput(!showRemixInput)} className={`px-4 py-2 rounded-full font-bold text-xs border ${showRemixInput ? 'bg-purple-500 text-white' : 'bg-black/40 text-purple-400 border-purple-500/30'}`}>✨ REMIX</button>
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
                                    <div className="flex bg-black/40 rounded-lg p-1 border border-white/10">
                                        <button onClick={() => setViewMode('fragment')} className={`px-3 py-1 text-[10px] rounded ${viewMode === 'fragment' ? 'bg-brand-cyan/20 text-brand-cyan' : 'text-gray-500'}`}>EDITOR</button>
                                        <button onClick={() => setViewMode('full')} className={`px-3 py-1 text-[10px] rounded ${viewMode === 'full' ? 'bg-brand-cyan/20 text-brand-cyan' : 'text-gray-500'}`}>FULL HTML</button>
                                    </div>
                                    {viewMode === 'fragment' && (
                                        <button onClick={handleApplyCode} disabled={editedCode === game.code} className={`px-3 py-1.5 rounded text-xs ${editedCode !== game.code ? 'bg-brand-cyan text-black' : 'opacity-30'}`}>APPLY</button>
                                    )}
                                    <button onClick={() => navigator.clipboard.writeText(codeToDisplay)} className="px-3 py-1.5 bg-white/10 rounded text-xs text-white">COPY</button>
                                </div>
                                <div className="flex-1 overflow-hidden relative">
                                    {viewMode === 'fragment' ? (
                                        <textarea className="w-full h-full bg-[#0d1117] text-gray-300 p-6 font-mono text-xs leading-5 focus:outline-none" value={editedCode} onChange={(e) => setEditedCode(e.target.value)} spellCheck={false} />
                                    ) : (
                                        <pre className="w-full h-full overflow-auto p-6 text-gray-400 font-mono text-xs leading-5">{codeToDisplay}</pre>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="absolute top-6 right-6 flex items-center gap-3 z-50 transition-opacity duration-300 opacity-60 hover:opacity-100">
                        <button onClick={onBack} className="w-10 h-10 flex items-center justify-center rounded-full bg-black/50 text-gray-400 border border-white/10" title="Back"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path></svg></button>
                        {tab === 'play' && (
                            <>
                                <button onClick={() => setRestartKey(k => k + 1)} className="w-10 h-10 flex items-center justify-center rounded-full bg-black/50 text-gray-400 border border-white/10" title="Restart"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path></svg></button>
                                <button onClick={handleSave} className={`w-10 h-10 flex items-center justify-center rounded-full border transition-all ${saved ? 'bg-red-500/20 border-red-500 text-red-500' : 'bg-black/50 border-white/10 text-gray-400'}`} title="Save"><svg className="w-5 h-5" fill={saved ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"></path></svg></button>
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
