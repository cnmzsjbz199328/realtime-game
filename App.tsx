import React, { useState } from 'react';
import { Header } from './presentation/components/layout/Header';
import { InputSection } from './presentation/components/features/InputSection';
import { GameStage } from './presentation/components/features/GameStage';
import { Leaderboard } from './presentation/components/features/Leaderboard';
import { TerminalLogs } from './presentation/components/features/TerminalLogs';
import { FlipContainer } from './presentation/components/layout/FlipContainer';
import { IntroSequence } from './presentation/components/features/IntroSequence';
import { useAgentWorkflow } from './application/useAgentWorkflow';
import { useGameCollection } from './application/useGameCollection';
import { FrontendGameGenerator, FrontendFixer } from './infrastructure/ai/FrontendAIService';
import { HeadlessBrowserValidator } from './infrastructure/qa/HeadlessBrowserValidator';
import { DirectInputSource } from './infrastructure/input/DirectInputSource';
import { PostgresGameRepository } from './infrastructure/persistence/PostgresGameRepository';
import { AgentStatus, GameDefinition } from './core/domain/types';

// Composition Root: Instantiate Frontend Services
const generator = new FrontendGameGenerator();
const fixer = new FrontendFixer();
const validator = new HeadlessBrowserValidator();
const directInput = new DirectInputSource();
const gameRepo = new PostgresGameRepository();
console.log('[APP] Frontend services initialized (backend AI logic via API)');

function App() {
  const [showIntro, setShowIntro] = useState(true);
  const [activeTab, setActiveTab] = useState<'home' | 'leaderboard'>('home');

  // Inject Services into Application Logic
  const { status, logs, game, setGame, setStatus, startWorkflow, handleCrash } = useAgentWorkflow(
    generator,
    fixer,
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
    <div className="min-h-screen bg-[#020C10] text-[#E0F2F1] flex flex-col font-sans selection:bg-brand-cyan/30 selection:text-white overflow-x-hidden">
      {/* Intro Sequence Overlay */}
      {showIntro && <IntroSequence onComplete={() => setShowIntro(false)} />}

      <Header activeTab={activeTab} onTabChange={setActiveTab} />

      <main className="flex-1 w-full flex flex-col items-center px-4 md:px-6">

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
              <GameStage
                status={status}
                game={game}
                onCrash={handleCrash}
                onSave={async (g) => {
                  const saved = await saveGame(g);
                  setGame(saved);
                }}
                onUpdateCode={(code) => {
                  if (game) {
                    const { id, likes, timestamp, ...rest } = game as any;
                    setGame({ ...rest, code });
                  }
                }}
                onBack={handleBackToTerminal}
              />
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