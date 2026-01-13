import React, { useState } from 'react';
import { GameDefinition } from '../../../core/domain/types';

interface RemixOverlayProps {
    game: GameDefinition;
    onClose: () => void;
    onSuccess: (newGame: GameDefinition) => void;
    onCrash: (error: string) => void;
}

export const RemixOverlay: React.FC<RemixOverlayProps> = ({ game, onClose, onSuccess, onCrash }) => {
    const [isRemixing, setIsRemixing] = useState(false);
    const [remixPrompt, setRemixPrompt] = useState('');

    const handleRemixConfirm = async () => {
        if (!game || !remixPrompt.trim()) return;

        setIsRemixing(true);
        try {
            const { FrontendRemixer } = await import('../../../infrastructure/ai/FrontendAIService');
            const remixer = new FrontendRemixer();
            const newGame = await remixer.remix(game, remixPrompt);
            onSuccess(newGame);
        } catch (error: any) {
            console.error("Remix failed:", error);
            onCrash(error.message || "Remix failed");
        } finally {
            setIsRemixing(false);
        }
    };

    return (
        <div className="absolute top-20 left-6 z-50 w-96 bg-black/90 backdrop-blur-xl border border-purple-500/50 rounded-xl p-4 shadow-2xl animate-in fade-in slide-in-from-top-4">
            <h3 className="text-purple-400 font-bold mb-2 flex items-center gap-2">
                <span className="text-xl">✨</span> AI Remix
            </h3>
            <p className="text-gray-400 text-xs mb-3">
                Describe how you want to modify the game. The AI will preserve the core logic but apply your changes.
            </p>
            <textarea
                autoFocus
                className="w-full bg-white/5 border border-white/10 rounded-lg p-3 text-sm text-white focus:outline-none focus:border-purple-500 h-24 resize-none mb-3"
                placeholder="e.g., Make the player faster, Add double jump, Change enemies to red..."
                value={remixPrompt}
                onChange={e => setRemixPrompt(e.target.value)}
                onKeyDown={e => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleRemixConfirm();
                    }
                }}
            />
            <div className="flex justify-end gap-2">
                <button
                    onClick={onClose}
                    className="px-3 py-1.5 text-xs text-gray-400 hover:text-white transition-colors"
                >
                    Cancel
                </button>
                <button
                    onClick={handleRemixConfirm}
                    disabled={isRemixing || !remixPrompt.trim()}
                    className="px-4 py-1.5 bg-purple-600 hover:bg-purple-500 text-white rounded-lg text-xs font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                    {isRemixing ? (
                        <>
                            <svg className="animate-spin h-3 w-3 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            Generating...
                        </>
                    ) : (
                        'Remix It!'
                    )}
                </button>
            </div>
        </div>
    );
};
