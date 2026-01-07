import React, { useState } from 'react';
import { Header } from './presentation/components/layout/Header';
import { InputSection } from './presentation/components/features/InputSection';
import { GameStage } from './presentation/components/features/GameStage';
import { Leaderboard } from './presentation/components/features/Leaderboard';
import { TerminalLogs } from './presentation/components/features/TerminalLogs';
import { FlipContainer } from './presentation/components/layout/FlipContainer';
import { useAgentWorkflow } from './application/useAgentWorkflow';
import { useGameCollection } from './application/useGameCollection';
import { RemoteAIService } from './infrastructure/ai/RemoteAIService';
import { HeadlessBrowserValidator } from './infrastructure/qa/HeadlessBrowserValidator';
import { DirectInputSource } from './infrastructure/input/DirectInputSource';
import { PostgresGameRepository } from './infrastructure/persistence/PostgresGameRepository';
import { AgentStatus, GameDefinition } from './core/domain/types';

// Composition Root: Instantiate Services
const aiService = new RemoteAIService();
const validator = new HeadlessBrowserValidator();
const directInput = new DirectInputSource();
const gameRepo = new PostgresGameRepository();

function App() {
  const [activeTab, setActiveTab] = useState<'home' | 'leaderboard'>('home');

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
    setActiveTab('home'); // Switch to home to show the game
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleBackToTerminal = () => {
    setStatus(AgentStatus.IDLE);
  };

  const isWorking = status !== AgentStatus.IDLE && status !== AgentStatus.DEPLOYED && status !== AgentStatus.FAILED;
  const isFlipped = status === AgentStatus.DEPLOYED;

  return (
    <div className="min-h-screen bg-[#020C10] text-[#E0F2F1] flex flex-col font-sans selection:bg-brand-cyan/30 selection:text-white">
      <Header activeTab={activeTab} onTabChange={setActiveTab} />

      <main className="flex-1 w-full flex flex-col items-center">

        {/* HOME TAB */}
        <div className={`w-full transition-opacity duration-500 ${activeTab === 'home' ? 'opacity-100 flex' : 'opacity-0 hidden'}`}>
          <FlipContainer
            isFlipped={isFlipped}
            front={
              <div className="w-full flex flex-col items-center">
                <InputSection
                  inputSource={directInput}
                  onGenerate={startWorkflow}
                  status={status}
                />
                <TerminalLogs logs={logs} isVisible={isWorking || status === AgentStatus.FAILED} />
              </div>
            }
            back={
              <div className="w-full h-full flex flex-col">
                <div className="flex-1 w-full bg-black/50 relative overflow-hidden">
                  <GameStage
                    status={status}
                    game={game}
                    onCrash={handleCrash}
                    onSave={async (g) => {
                      const saved = await saveGame(g);
                      setGame(saved);
                    }}
                  />
                </div>
                {/* Floating Back Button (for when in game) */}
                <div className="absolute top-4 right-4 z-50">
                  <button
                    onClick={handleBackToTerminal}
                    className="px-4 py-2 bg-black/50 hover:bg-black/80 text-gray-400 hover:text-white text-xs font-mono border border-gray-700 rounded transition-colors backdrop-blur-md"
                  >
                    ← BACK TO TERMINAL
                  </button>
                </div>
              </div>
            }
          />
        </div>

        {/* LEADERBOARD TAB */}
        <div className={`w-full transition-opacity duration-500 ${activeTab === 'leaderboard' ? 'opacity-100 flex' : 'opacity-0 hidden'}`}>
          <Leaderboard
            games={savedGames}
            onLike={likeGame}
            onPlay={handlePlayGame}
          />
        </div>

      </main>

      <footer className="w-full p-4 text-center text-gray-600 text-xs font-mono pointer-events-none fixed bottom-0 z-0">
        &copy; 2024 GenGame Studio. All systems nominal.
      </footer>
    </div>
  );
}

export default App;