import React from 'react';
import { SavedGame, GameDefinition } from '../../../core/domain/types';

interface LeaderboardProps {
    games: SavedGame[];
    onLike: (id: string) => void;
    onPlay: (game: GameDefinition) => void;
}

export const Leaderboard: React.FC<LeaderboardProps> = ({ games, onLike, onPlay }) => {
    if (games.length === 0) return null;

    // Sort by likes descending just in case, though usually repo handles this
    const sortedGames = [...games].sort((a, b) => b.likes - a.likes);

    const getRankStyles = (index: number) => {
        if (index === 0) return {
            border: 'border-yellow-500/50',
            bg: 'from-yellow-900/40',
            text: 'text-yellow-400',
            icon: '🥇',
            scale: 'scale-105 z-10 shadow-[0_0_30px_rgba(250,204,21,0.2)]'
        };
        if (index === 1) return {
            border: 'border-gray-400/30',
            bg: 'from-gray-700/20',
            text: 'text-gray-300',
            icon: '🥈',
            scale: ''
        };
        if (index === 2) return {
            border: 'border-orange-700/30',
            bg: 'from-orange-900/20',
            text: 'text-orange-500',
            icon: '🥉',
            scale: ''
        };
        return {
            border: 'border-brand-cyan/20',
            bg: 'from-brand-teal/20',
            text: 'text-brand-cyan',
            icon: `#${index + 1}`,
            scale: ''
        };
    };

    return (
        <div id="view-leaderboard" className="flex flex-col w-full animate-fade-in-up mt-12 px-4 max-w-4xl mx-auto">
            <div className="text-center mb-12">
                <h2 className="text-4xl font-bold uppercase tracking-wider mb-2 text-white">Leaderboard</h2>
                <div className="text-brand-cyan text-sm font-mono tracking-[0.3em]">Season 1 Rankings</div>
            </div>

            <div className="flex flex-col gap-6 mb-12 w-full">
                {sortedGames.map((game, index) => {
                    const style = getRankStyles(index);
                    // Calculate relative width for the "progress bar" background (max 95%, min 20%)
                    const maxLikes = sortedGames[0].likes || 1;
                    const widthPercent = Math.max(20, Math.min(95, (game.likes / maxLikes) * 95));

                    return (
                        <div
                            key={game.id}
                            className={`glass-panel p-6 rounded-xl relative overflow-hidden group hover:border-brand-cyan/50 transition-all cursor-pointer ${style.border} ${style.scale}`}
                            onClick={() => onPlay(game)}
                        >
                            {/* Background Bar */}
                            <div
                                className={`absolute top-0 bottom-0 left-0 bg-gradient-to-r ${style.bg} to-transparent transition-all duration-1000 group-hover:w-[${widthPercent + 3}%]`}
                                style={{ width: `${widthPercent}%` }}
                            ></div>

                            <div className="relative flex justify-between items-center z-10">
                                <div className="flex items-center gap-4 overflow-hidden">
                                    <div className={`w-12 h-12 shrink-0 rounded-full bg-gray-800 border-2 ${style.border.split(' ')[0]} flex items-center justify-center text-xl font-bold`}>
                                        {style.icon}
                                    </div>
                                    <div className="min-w-0">
                                        <h3 className={`text-2xl font-bold group-hover:text-white transition-colors truncate ${style.text}`}>
                                            {game.title}
                                        </h3>
                                        <p className="text-sm text-gray-400 truncate max-w-md">
                                            {game.description}
                                        </p>
                                    </div>
                                </div>
                                <div className="text-right pl-4 shrink-0">
                                    <div className={`text-3xl font-mono font-bold ${style.text}`}>
                                        {game.likes.toLocaleString()}
                                    </div>
                                    <button
                                        onClick={(e) => { e.stopPropagation(); onLike(game.id); }}
                                        className="text-xs text-gray-500 hover:text-red-500 uppercase tracking-widest transition-colors flex items-center justify-end gap-1 ml-auto mt-1"
                                    >
                                        <span>❤️ LIKE</span>
                                    </button>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};
