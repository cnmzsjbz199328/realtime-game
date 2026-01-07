import React, { useState } from 'react';
import { IInputSource } from '../../../core/domain/types';
import { AgentStatus } from '../../../core/domain/types';

interface InputSectionProps {
    inputSource: IInputSource;
    onGenerate: (value: string) => void;
    status: AgentStatus;
}

export const InputSection: React.FC<InputSectionProps> = ({ inputSource, onGenerate, status }) => {
    const [inputValue, setInputValue] = useState('');

    const handleGenerate = async () => {
        try {
            // For DirectInputSource, we pass the current input value.
            // For other sources (e.g. RSS), getValue might ignore the argument.
            const topic = await inputSource.getValue(inputValue);
            onGenerate(topic);
        } catch (e) {
            console.error("Input Error", e);
        }
    };

    const isBusy = status !== AgentStatus.IDLE && status !== AgentStatus.DEPLOYED && status !== AgentStatus.FAILED;

    return (
        <section className="w-full max-w-3xl mx-auto text-center space-y-6 pt-8 pb-4">
            <h2 className="text-4xl md:text-5xl font-black tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white via-zinc-200 to-zinc-500">
                Turn News Into Gameplay.
            </h2>
            <p className="text-zinc-400 text-lg max-w-xl mx-auto">
                Enter a headline or topic. Our autonomous agent swarm will design, code, and test a playable micro-game for you in seconds.
            </p>

            <div className="flex gap-2 max-w-lg mx-auto relative group">
                <input
                    type="text"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    placeholder="e.g. 'Cyberpunk Squirrel trying to find a nut'"
                    className="flex-1 bg-zinc-900/50 border border-zinc-700 rounded-xl px-5 py-4 text-white placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500 transition-all"
                    onKeyDown={(e) => e.key === 'Enter' && handleGenerate()}
                    disabled={isBusy}
                />
                <button
                    onClick={handleGenerate}
                    disabled={!inputValue || isBusy}
                    className="bg-white text-black font-bold px-6 py-4 rounded-xl hover:bg-zinc-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-[0_0_20px_rgba(255,255,255,0.1)]"
                >
                    Generate
                </button>
            </div>
        </section>
    );
};
