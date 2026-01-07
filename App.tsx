import React from 'react';
import { AgentVisualizer } from './components/AgentVisualizer';
import { Header } from './presentation/components/layout/Header';
import { InputSection } from './presentation/components/features/InputSection';
import { GameStage } from './presentation/components/features/GameStage';
import { Leaderboard } from './presentation/components/features/Leaderboard';
import { useAgentWorkflow } from './application/useAgentWorkflow';
import { useGameCollection } from './application/useGameCollection';
import { RemoteAIService } from './infrastructure/ai/RemoteAIService';
import { HeadlessBrowserValidator } from './infrastructure/qa/HeadlessBrowserValidator';
import { DirectInputSource } from './infrastructure/input/DirectInputSource';
// import { LocalGameRepository } from './infrastructure/persistence/LocalGameRepository';
import { PostgresGameRepository } from './infrastructure/persistence/PostgresGameRepository';
import { AgentStatus, GameDefinition } from './core/domain/types';

// Composition Root: Instantiate Services
const aiService = new RemoteAIService();
const validator = new HeadlessBrowserValidator();
const directInput = new DirectInputSource();
// const gameRepo = new LocalGameRepository();
const gameRepo = new PostgresGameRepository();

function App() {
  // Inject Services into Application Logic
  const { status, logs, game, setGame, setStatus, startWorkflow, handleCrash } = useAgentWorkflow(
    aiService,
    aiService,
    validator
  );

  const { savedGames, saveGame, likeGame } = useGameCollection(gameRepo);

  const handlePlayGame = (gameDef: GameDefinition) => {
    setGame(gameDef);
    setStatus(AgentStatus.DEPLOYED);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-[#09090b] text-zinc-100 flex flex-col font-sans selection:bg-purple-500/30">
      <Header />

      <main className="flex-1 max-w-7xl mx-auto w-full p-6 flex flex-col gap-8">
        <InputSection
          inputSource={directInput}
          onGenerate={startWorkflow}
          status={status}
        />

        <section className="h-[300px]">
          <AgentVisualizer status={status} logs={logs} />
        </section>

        <GameStage
          status={status}
          game={game}
          onCrash={handleCrash}
          onSave={async (game) => {
            const saved = await saveGame(game);
            // Updating the game state ensures we now have the ID associated with the current session
            // So subsequent clicks will find the ID and increment likes instead of duplicating.
            // We cast because setGame expects GameDefinition (base) but SavedGame is compatible.
            setGame(saved);
          }}
        />

        <Leaderboard
          games={savedGames}
          onLike={likeGame}
          onPlay={handlePlayGame}
        />
      </main>
    </div>
  );
}

export default App;