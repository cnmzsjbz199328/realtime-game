import React from 'react';
import { GameHarness } from '../../../components/GameHarness';
import { AgentStatus, GameDefinition } from '../../../core/domain/types';

interface GameStageProps {
    status: AgentStatus;
    game: GameDefinition | null;
    onCrash: (error: string) => void;
}

export const GameStage: React.FC<GameStageProps> = ({ status, game, onCrash }) => {
    return (
        <section className={`flex-1 min-h-[500px] transition-all duration-700 ${status === AgentStatus.DEPLOYED ? 'opacity-100 translate-y-0' : 'opacity-40 translate-y-4 grayscale'}`}>
            {status === AgentStatus.DEPLOYED && game ? (
                <div className="h-full border-2 border-purple-500/30 rounded-2xl p-1 shadow-[0_0_50px_rgba(168,85,247,0.15)] bg-zinc-900/50 backdrop-blur-sm">
                    <GameHarness gameDef={game} onCrash={onCrash} />
                </div>
            ) : (
                <div className="h-full border border-dashed border-zinc-800 rounded-2xl flex flex-col items-center justify-center text-zinc-600 bg-zinc-900/20">
                    <div className="text-6xl mb-4 opacity-20">🎮</div>
                    <p>Waiting for deployment...</p>
                </div>
            )}
        </section>
    );
};
