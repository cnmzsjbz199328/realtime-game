import React, { useState } from 'react';
import { GameDefinition } from '../../../core/domain/types';

interface AuthorSignatureModalProps {
    game: GameDefinition;
    onClose: () => void;
    onConfirm: (finalGame: GameDefinition) => void;
}

export const AuthorSignatureModal: React.FC<AuthorSignatureModalProps> = ({ game, onClose, onConfirm }) => {
    const [authorName, setAuthorName] = useState('');

    const handleSignAndSave = () => {
        let finalTitle = game.title;
        if (authorName.trim()) {
            finalTitle = `[${authorName.trim()}] ${game.title}`;
        }
        onConfirm({ ...game, title: finalTitle });
    };

    return (
        <div className="absolute inset-0 z-[60] flex items-center justify-center p-6 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
            <div className="w-full max-w-sm bg-[#051014] border border-brand-cyan/50 rounded-2xl p-6 shadow-[0_0_50px_rgba(0,255,255,0.15)] animate-in zoom-in-95 duration-300">
                <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-full bg-brand-cyan/10 flex items-center justify-center border border-brand-cyan/30">
                        <svg className="w-5 h-5 text-brand-cyan" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                        </svg>
                    </div>
                    <h3 className="text-xl font-bold text-white tracking-tight">Sign Your Work</h3>
                </div>

                <p className="text-gray-400 text-sm mb-5 leading-relaxed">
                    Would you like to add your name to the title before saving this creation to the grid?
                </p>

                <div className="space-y-4">
                    <div className="relative group">
                        <input
                            autoFocus
                            type="text"
                            placeholder="Enter your name..."
                            className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-brand-cyan transition-all placeholder:text-gray-600"
                            value={authorName}
                            onChange={(e) => setAuthorName(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleSignAndSave()}
                        />
                        <div className="absolute inset-0 rounded-xl bg-brand-cyan/5 opacity-0 group-focus-within:opacity-100 pointer-events-none transition-opacity" />
                    </div>

                    <div className="flex flex-col gap-2">
                        <button
                            onClick={handleSignAndSave}
                            className="w-full py-3 bg-brand-cyan text-black font-bold rounded-xl text-sm hover:bg-cyan-400 transition-all shadow-[0_0_20px_rgba(0,255,255,0.2)]"
                        >
                            {authorName.trim() ? `Sign as "${authorName}" & Save` : 'Save with Tag'}
                        </button>

                        <div className="flex gap-2">
                            <button
                                onClick={() => onConfirm(game)}
                                className="flex-1 py-2.5 bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white rounded-xl text-xs transition-all border border-white/5"
                            >
                                Skip Signature
                            </button>
                            <button
                                onClick={onClose}
                                className="flex-1 py-2.5 text-gray-500 hover:text-gray-300 text-xs transition-all"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
