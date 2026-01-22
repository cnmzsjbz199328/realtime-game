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
            const topic = await inputSource.getValue(inputValue);
            onGenerate(topic);
            setInputValue('');
        } catch (e) {
            console.error("Input Error", e);
        }
    };

    const isBusy = status !== AgentStatus.IDLE && status !== AgentStatus.DEPLOYED && status !== AgentStatus.FAILED;

    // If busy, we might want to hide the input to show the terminal clearly, 
    // or just disable it. For the Flip animation, the whole front side flips, 
    // so we just keep it visible but disabled until the flip happens.
    // BUT the user requested: "The terminal appears... input box should be hidden/transformed".
    // Let's hide the input container when busy to make room for terminal.

    return (
        <div className="flex flex-col items-center text-center space-y-8 w-full">

            {/* Input Box - Only visible when NOT busy */}
            {!isBusy && (
                <div className="w-full max-w-2xl mt-8 md:mt-12 relative group input-glow rounded-xl transition-all duration-300 z-20 animate-fade-in-up">
                    <div className="glass-panel rounded-xl p-1 md:p-2 flex items-center gap-2 md:gap-4">
                        <div className="pl-3 md:pl-4 text-brand-cyan opacity-50 shrink-0">
                            <svg className="w-5 h-5 md:w-6 md:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
                        </div>
                        <input
                            type="text"
                            placeholder="Describe your game idea..."
                            value={inputValue}
                            onChange={(e) => setInputValue(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleGenerate()}
                            className="flex-1 bg-transparent border-none outline-none text-white text-base md:text-lg font-mono placeholder-gray-600 h-12 md:h-14 min-w-0"
                        />
                        <div className="h-6 md:h-8 w-[1px] bg-gray-700 shrink-0"></div>
                        <button
                            onClick={handleGenerate}
                            disabled={!inputValue}
                            className="bg-brand-cyan hover:bg-cyan-300 text-black font-bold py-2 md:py-3 px-4 md:px-8 rounded-lg flex items-center gap-2 transition-all shadow-[0_0_20px_rgba(0,229,255,0.3)] hover:shadow-[0_0_30px_rgba(0,229,255,0.5)] transform hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed text-xs md:text-base shrink-0"
                        >
                            <svg className="w-4 h-4 md:w-5 md:h-5 hidden xs:block" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>
                            <span className="whitespace-nowrap">GENERATE</span>
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};
