import React, { useEffect, useRef, useState } from 'react';

interface TerminalLogsProps {
    logs: string[];
    isVisible: boolean;
}

// Helper to parse potential JSON logs
const parseLog = (logItem: string | any) => {
    let content = logItem;
    let agent = 'SYSTEM';
    let isError = false;

    // Try to parse if it's a JSON string
    if (typeof logItem === 'string' && logItem.trim().startsWith('{')) {
        try {
            const parsed = JSON.parse(logItem);
            if (parsed.agent && parsed.message) {
                agent = parsed.agent;
                content = parsed.message;
            }
        } catch (e) {
            // Not JSON, just plain text
        }
    } else if (typeof logItem === 'object') {
        agent = logItem.agent || 'SYSTEM';
        content = logItem.message || JSON.stringify(logItem);
    }

    // Determine error state
    if (typeof content === 'string' && (content.toLowerCase().includes('error') || content.toLowerCase().includes('fail'))) {
        isError = true;
    }

    return { agent, content, isError };
};

// ASCII Progress Bar Component (Asymptotic)
const ProgressBar = () => {
    const [progress, setProgress] = useState(0);

    useEffect(() => {
        const interval = setInterval(() => {
            setProgress(old => {
                // If we are already very high, move tiny amounts (Zeno's paradox)
                if (old > 99) return old;

                // 1. Fast start (0-60%)
                if (old < 60) {
                    return old + Math.random() * 15;
                }

                // 2. Slow down (60-80%)
                if (old < 80) {
                    return old + Math.random() * 2;
                }

                // 3. Crawler (80-99%)
                return old + Math.random() * 0.5;
            });
        }, 800);

        return () => clearInterval(interval);
    }, []);

    const bars = Math.floor(progress / 5); // 20 chars for 100%
    const filled = '/'.repeat(bars);
    const empty = '.'.repeat(20 - bars);

    return (
        <div className="mt-2 text-yellow-400 font-bold animate-pulse">
            {`[${filled}${empty}] ${Math.min(99, Math.floor(progress))}% PROCESSING...`}
        </div>
    );
};

export const TerminalLogs: React.FC<TerminalLogsProps> = ({ logs, isVisible }) => {
    const containerRef = useRef<HTMLDivElement>(null);

    // Auto-scroll to bottom
    useEffect(() => {
        if (containerRef.current) {
            containerRef.current.scrollTop = containerRef.current.scrollHeight;
        }
    }, [logs]);

    if (!isVisible) return null;

    return (
        <div
            ref={containerRef}
            className="w-full max-w-3xl mt-8 font-mono text-xs md:text-sm bg-black/90 border border-gray-800 rounded-lg p-6 h-80 overflow-y-auto relative shadow-2xl animate-fade-in"
        >
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-brand-cyan to-transparent opacity-50 z-20"></div>

            <div className="space-y-3 relative z-10 font-medium">
                <div className="text-gray-500 border-b border-gray-800 pb-2 mb-4">
                    {'>'} SYSTEM_INIT :: ALLOCATING_RESOURCES... [OK]
                </div>

                {(logs || []).map((log, i) => {
                    const { agent, content, isError } = parseLog(log);

                    // Style based on agent
                    let agentColor = 'text-gray-400';
                    if (agent === 'DIRECTOR') agentColor = 'text-purple-400';
                    if (agent === 'ENGINEER') agentColor = 'text-brand-cyan';
                    if (agent === 'QA') agentColor = 'text-yellow-400';
                    if (agent === 'SYSTEM') agentColor = 'text-gray-500';

                    const textColor = isError ? 'text-red-500 font-bold bg-red-900/10 p-1 rounded' : 'text-gray-300';

                    return (
                        <div key={i} className="animate-fade-in flex flex-col md:flex-row md:gap-2 break-all">
                            <span className="opacity-40 text-xs shrink-0 w-20 pt-1">
                                {new Date().toLocaleTimeString().split(' ')[0]}
                            </span>
                            <div className="flex-1">
                                <span className={`${agentColor} font-bold mr-2`}>[{agent}]</span>
                                <span className={textColor}>{content}</span>
                            </div>
                        </div>
                    );
                })}

                {/* Show progress bar if we are visible (implying work is being done) */}
                <ProgressBar />

                <div className="animate-pulse text-brand-cyan mt-4">{'>'} _</div>
            </div>

            {/* Scanline effect */}
            <div className="absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] z-10 pointer-events-none bg-[length:100%_4px,3px_100%] sticky top-0"></div>
        </div>
    );
};
