import React from 'react';
import { AgentVisualizer } from './components/AgentVisualizer';
import { Header } from './presentation/components/layout/Header';
import { InputSection } from './presentation/components/features/InputSection';
import { GameStage } from './presentation/components/features/GameStage';
import { useAgentWorkflow } from './application/useAgentWorkflow';
import { RemoteAIService } from './infrastructure/ai/RemoteAIService';
import { HeadlessBrowserValidator } from './infrastructure/qa/HeadlessBrowserValidator';
import { DirectInputSource } from './infrastructure/input/DirectInputSource';

// Composition Root: Instantiate Services
const aiService = new RemoteAIService();
const validator = new HeadlessBrowserValidator();
const directInput = new DirectInputSource();

function App() {
  // Inject Services into Application Logic
  const { status, logs, game, startWorkflow, handleCrash } = useAgentWorkflow(
    aiService,
    aiService,
    validator
  );

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
        />
      </main>
    </div>
  );
}

export default App;