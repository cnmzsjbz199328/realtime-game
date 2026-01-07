import React from 'react';

interface HeaderProps {
    activeTab: 'home' | 'leaderboard';
    onTabChange: (tab: 'home' | 'leaderboard') => void;
}

export const Header: React.FC<HeaderProps> = ({ activeTab, onTabChange }) => (
    <nav className="w-full flex justify-between items-center p-6 max-w-7xl mx-auto z-50 relative">
        <div
            className="flex items-center gap-2 group cursor-pointer"
            onClick={() => onTabChange('home')}
        >
            <div className="w-8 h-8 bg-gradient-to-br from-brand-cyan to-blue-600 rounded-lg flex items-center justify-center transform group-hover:rotate-12 transition-transform shadow-[0_0_15px_rgba(0,229,255,0.3)]">
                <svg className="w-5 h-5 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"></path><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
            </div>
            <span className="font-bold text-xl tracking-wide text-white">GenGame</span>
        </div>

        <div className="glass-panel rounded-full px-1 py-1 flex gap-1">
            <button
                onClick={() => onTabChange('home')}
                className={`px-6 py-2 rounded-full text-sm font-medium transition-all ${activeTab === 'home'
                    ? 'bg-brand-cyan text-black shadow-[0_0_15px_rgba(0,229,255,0.4)]'
                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                    }`}
            >
                Home
            </button>
            <button
                onClick={() => onTabChange('leaderboard')}
                className={`px-6 py-2 rounded-full text-sm font-medium transition-all ${activeTab === 'leaderboard'
                    ? 'bg-brand-cyan text-black shadow-[0_0_15px_rgba(0,229,255,0.4)]'
                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                    }`}
            >
                Leaderboard
            </button>
        </div>

        <div className="w-8"></div> {/* Spacer for center alignment */}
    </nav>
);
