import React from 'react';
import { SavedGame, GameDefinition } from '../../../core/domain/types';

interface LeaderboardProps {
    games: SavedGame[];
    onLike: (id: string) => void;
    onPlay: (game: GameDefinition) => void;
}

export const Leaderboard: React.FC<LeaderboardProps> = ({ games, onLike, onPlay }) => {
    if (games.length === 0) return null;

    return (
        <section className="mt-12 w-full max-w-7xl mx-auto">
            <h3 className="text-2xl font-bold mb-6 text-zinc-300 flex items-center gap-2">
                <span>🏆</span> Community Showcase
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {games.map((game) => (
                    <div key={game.id} className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4 hover:border-zinc-700 transition-all group">
                        <div className="flex justify-between items-start mb-2">
                            <h4 className="font-bold text-lg text-white group-hover:text-purple-400 transition-colors cursor-pointer" onClick={() => onPlay(game)}>
                                {game.title}
                            </h4>
                            <button
                                onClick={() => onLike(game.id)}
                                className="flex items-center gap-1.5 bg-zinc-900 px-2 py-1 rounded-md border border-zinc-800 hover:border-red-500/50 hover:bg-red-500/10 transition-colors"
                            >
                                <span className="text-red-500">❤️</span>
                                <span className="text-xs font-mono text-zinc-400">{game.likes}</span>
                            </button>
                        </div>
                        <p className="text-zinc-500 text-sm line-clamp-2 mb-4 h-10">
                            {game.description}
                        </p>
                        <div className="flex justify-between items-center mt-auto pt-4 border-t border-zinc-800/50">
                            <span className="text-xs text-zinc-600 font-mono">
                                {new Date(game.timestamp).toLocaleDateString()}
                            </span>
                            <button
                                onClick={() => onPlay(game)}
                                className="text-xs font-bold text-zinc-300 bg-zinc-800 px-3 py-1.5 rounded-full hover:bg-white hover:text-black transition-colors"
                            >
                                PLAY NOW
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </section>
    );
};
