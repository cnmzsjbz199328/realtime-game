import React from 'react';

export const Header: React.FC = () => (
    <header className="border-b border-zinc-800 bg-black/50 backdrop-blur-md sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-blue-600 rounded-md flex items-center justify-center font-bold text-white shadow-lg shadow-purple-900/20">
                    G
                </div>
                <h1 className="text-xl font-bold tracking-tight">
                    GenGame <span className="text-zinc-500 font-normal">Studio</span>
                </h1>
            </div>
            <div className="flex items-center gap-4">
                <div className="hidden md:flex items-center gap-2 text-xs font-mono text-zinc-500 bg-zinc-900 px-3 py-1.5 rounded-full border border-zinc-800">
                    <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                    SYSTEM ONLINE
                </div>
            </div>
        </div>
    </header>
);
