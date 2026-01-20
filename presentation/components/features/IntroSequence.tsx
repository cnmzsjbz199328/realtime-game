import React, { useState, useEffect, useRef } from 'react';
import './IntroSequence.css';

type IntroPhase = 'BOOTING' | 'LOADING' | 'SHOW' | 'EXITING';

interface IntroSequenceProps {
    onComplete: () => void;
}

const BOOT_LOGS = [
    '> INITIALIZING KERNEL...',
    '> LOADING NEURAL MODULES [OK]',
    '> ESTABLISHING UPLINK TO GEMINI CLUSTER...',
    '> ALLOCATING VRAM FOR CANVAS RENDERER...',
    '> MOUNTING VIRTUAL DOM...',
    '> SYSTEM INTEGRITY CHECK: 100%',
    '> BOOT SEQUENCE COMPLETE.'
];

/**
 * Strip the leading "> " from a log line for display.
 */
const displayLog = (log: string | undefined) => (log || '').replace(/^>\s*/, '');

export const IntroSequence: React.FC<IntroSequenceProps> = ({ onComplete }) => {
    const [phase, setPhase] = useState<IntroPhase>('BOOTING');
    const [visibleLogs, setVisibleLogs] = useState<string[]>([]);
    const [progress, setProgress] = useState(0);
    const [showCursor, setShowCursor] = useState(true);

    const timersRef = useRef<number[]>([]);
    const rafRef = useRef<number | null>(null);

    // ---------- Cleanup ----------
    useEffect(() => {
        return () => {
            timersRef.current.forEach(clearTimeout);
            if (rafRef.current) cancelAnimationFrame(rafRef.current);
        };
    }, []);

    // ---------- Phase: BOOTING ----------
    useEffect(() => {
        if (phase !== 'BOOTING') return;
        console.log('[Intro] BOOTING phase start');
        let idx = 0;
        const nextLog = () => {
            if (idx < BOOT_LOGS.length) {
                setVisibleLogs(v => [...v, BOOT_LOGS[idx]]);
                console.log('[Intro] log added:', BOOT_LOGS[idx]);
                idx++;
                const t = window.setTimeout(nextLog, 200 + Math.random() * 150);
                timersRef.current.push(t);
            } else {
                const t = window.setTimeout(() => {
                    console.log('[Intro] Transition to LOADING');
                    setPhase('LOADING');
                }, 300);
                timersRef.current.push(t);
            }
        };
        const start = window.setTimeout(nextLog, 300);
        timersRef.current.push(start);
        const cursor = window.setInterval(() => setShowCursor(c => !c), 530);
        timersRef.current.push(cursor);
        return () => {
            // Do NOT clear the transition timer here – keep it for LOADING.
            timersRef.current.forEach(clearTimeout);
            timersRef.current = [];
        };
    }, [phase]);

    // ---------- Phase: LOADING (progress bar) ----------
    useEffect(() => {
        if (phase !== 'LOADING') return;
        console.log('[Intro] LOADING phase start');
        const duration = 2500; // 2.5 s
        const start = performance.now();
        const step = (now: number) => {
            const elapsed = now - start;
            const pct = Math.min((elapsed / duration) * 100, 100);
            setProgress(pct);
            // Log progress every 25 % for debugging
            if (Math.round(pct) % 25 === 0) {
                console.log('[Intro] progress', Math.round(pct) + '%');
            }
            if (pct < 100) {
                rafRef.current = requestAnimationFrame(step);
            } else {
                const t = window.setTimeout(() => {
                    console.log('[Intro] Transition to SHOW');
                    setPhase('SHOW');
                }, 500);
                timersRef.current.push(t);
            }
        };
        rafRef.current = requestAnimationFrame(step);
        return () => {
            if (rafRef.current) cancelAnimationFrame(rafRef.current);
        };
    }, [phase]);

    // ---------- Phase: SHOW (brand displayed before exit) ----------
    useEffect(() => {
        if (phase !== 'SHOW') return;
        console.log('[Intro] SHOW phase start (brand visible)');
        const t = window.setTimeout(() => {
            console.log('[Intro] Transition to EXITING');
            setPhase('EXITING');
        }, 800); // keep brand visible ~0.8 s
        timersRef.current.push(t);
        return () => clearTimeout(t);
    }, [phase]);

    // ---------- Phase: EXITING (fade out) ----------
    useEffect(() => {
        if (phase !== 'EXITING') return;
        console.log('[Intro] EXITING phase start');
        const t = window.setTimeout(() => {
            console.log('[Intro] Intro complete, calling onComplete');
            onComplete();
        }, 800);
        timersRef.current.push(t);
        return () => clearTimeout(t);
    }, [phase, onComplete]);

    // ---------- Render ----------
    return (
        <div
            className={`fixed inset-0 z-[9999] bg-black flex items-center justify-center transition-opacity duration-800 ${phase === 'EXITING' ? 'opacity-0 scale-110 blur-sm' : 'opacity-100 scale-100'
                }`}
        >
            <div className="w-full max-w-4xl px-6 flex flex-col items-center">
                {/* BOOTING */}
                {phase === 'BOOTING' && (
                    <div className="w-full font-mono text-xl space-y-2">
                        {visibleLogs.map((log, i) => (
                            <div key={i} className={i === visibleLogs.length - 1 ? 'text-brand-cyan' : 'text-zinc-600'}>
                                <span className="text-emerald-900">&gt;</span> {displayLog(log)}
                            </div>
                        ))}
                        {showCursor && <div className="text-brand-cyan inline-block animate-pulse">_</div>}
                    </div>
                )}
                {/* LOADING / SHOW / EXITING */}
                {(phase === 'LOADING' || phase === 'SHOW' || phase === 'EXITING') && (
                    <div
                        className={`w-full flex flex-col items-center space-y-8 ${phase === 'LOADING' ? 'loading-fade-in' : phase === 'EXITING' ? 'loading-fade-out' : ''
                            }`}
                    >
                        {/* Title with Glitch Effect */}
                        <h1
                            className="glitch-wrapper relative text-6xl md:text-8xl font-black tracking-tighter text-brand-cyan neon-text"
                            data-text="GENGAME STUDIO"
                        >
                            GENGAME STUDIO
                        </h1>
                        <p className="text-base text-zinc-400 font-mono tracking-wider">
                            {phase === 'LOADING' ? 'SYSTEM LOADING...' : 'READY'}
                        </p>
                        <div className="w-full max-w-2xl h-2 bg-zinc-900 rounded-full overflow-hidden">
                            <div
                                className="h-full bg-brand-cyan rounded-full transition-all duration-100"
                                style={{ width: `${progress}%`, boxShadow: '0 0 20px rgba(0, 229, 255, 0.6)' }}
                            />
                        </div>
                        <p className="text-sm text-brand-cyan font-mono">{Math.floor(progress)}%</p>
                        <p className="text-sm text-zinc-700 font-mono mt-8">Proprietary Neural Interface v2.4.1</p>
                    </div>
                )}
            </div>
        </div>
    );
};
