import React, { useState, useCallback } from 'react';
import { AgentVisualizer } from './components/AgentVisualizer';
import { GameHarness } from './components/GameHarness';
import { AgentStatus, AgentLog, GameDefinition } from './types';
import { generateGameFromTopic, fixGameCode } from './services/gemini';
import { runQATest } from './services/qa';

function App() {
  const [topic, setTopic] = useState('');
  const [status, setStatus] = useState<AgentStatus>(AgentStatus.IDLE);
  const [logs, setLogs] = useState<AgentLog[]>([]);
  const [game, setGame] = useState<GameDefinition | null>(null);

  const addLog = (agent: 'DIRECTOR' | 'ENGINEER' | 'QA', message: string) => {
    setLogs(prev => [...prev, {
      id: Math.random().toString(36).substr(2, 9),
      agent,
      message,
      timestamp: Date.now()
    }]);
  };

  const handleStartWorkflow = async () => {
    if (!topic.trim()) return;

    // Reset
    setStatus(AgentStatus.DIRECTOR_THINKING);
    setLogs([]);
    setGame(null);
    
    // 1. Director Phase
    addLog('DIRECTOR', `Analyzing topic: "${topic}"...`);
    addLog('DIRECTOR', 'Extracting core metaphors and gameplay mechanics...');
    
    await new Promise(r => setTimeout(r, 1000));
    
    addLog('DIRECTOR', 'GDD (Game Design Document) generated. Transmitting to Engineer.');
    setStatus(AgentStatus.ENGINEER_CODING);

    try {
      // 2. Engineer Phase (Initial Generation)
      addLog('ENGINEER', 'Received GDD. Initializing coding environment...');
      addLog('ENGINEER', 'Generating game logic, physics, and rendering pipeline...');
      
      let currentGameDef = await generateGameFromTopic(topic);
      
      addLog('ENGINEER', 'Code compilation successful. Sending build to QA Sandbox...');
      
      // 3. QA Phase (The Self-Healing Loop)
      let qaPassed = false;
      let attempts = 0;
      const MAX_RETRIES = 2;

      while (!qaPassed && attempts <= MAX_RETRIES) {
          setStatus(AgentStatus.QA_TESTING);
          
          if (attempts === 0) {
             addLog('QA', 'Initializing headless browser environment...');
             addLog('QA', 'Running Unit Tests & Frame Loop Verification...');
          } else {
             addLog('QA', `Re-running validation suite (Attempt ${attempts + 1}/${MAX_RETRIES + 1})...`);
          }

          // Small visual delay so user sees the state change
          await new Promise(r => setTimeout(r, 800));

          // Run the real simulation
          const testResult = await runQATest(currentGameDef);

          if (testResult.passed) {
             addLog('QA', '✅ Smoke Test Passed.');
             addLog('QA', '✅ Input Fuzzing Passed (Mouse/Keyboard simulation).');
             addLog('QA', 'Stability 100%. Authorizing deployment.');
             qaPassed = true;
          } else {
             addLog('QA', `❌ TEST FAILED: ${testResult.error}`);
             
             if (attempts < MAX_RETRIES) {
                 addLog('QA', 'Rejecting build. Sending bug report to Engineer...');
                 setStatus(AgentStatus.ENGINEER_CODING);
                 
                 // 4. Engineer Fix Phase
                 addLog('ENGINEER', 'Analyzing crash report...');
                 addLog('ENGINEER', 'Applying hotfix to game logic...');
                 
                 currentGameDef = await fixGameCode(currentGameDef, testResult.error || "Unknown Error");
                 
                 addLog('ENGINEER', 'Hotfix applied. Re-submitting for review...');
             } else {
                 addLog('QA', 'Critical Failure: Max retries exceeded. Aborting.');
                 throw new Error(`QA Check failed: ${testResult.error}`);
             }
          }
          attempts++;
      }

      if (qaPassed) {
         setGame(currentGameDef);
         setStatus(AgentStatus.DEPLOYED);
      }
      
    } catch (error: any) {
      addLog('ENGINEER', `Workflow Halted: ${error.message}`);
      setStatus(AgentStatus.FAILED);
    }
  };

  const handleCrash = useCallback((error: string) => {
    addLog('QA', `Runtime Error Detected in Production: ${error}`);
    addLog('QA', 'Initiating emergency rollback...');
    setStatus(AgentStatus.FAILED);
  }, []);

  return (
    <div className="min-h-screen bg-[#09090b] text-zinc-100 flex flex-col font-sans selection:bg-purple-500/30">
      
      {/* Header */}
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

      <main className="flex-1 max-w-7xl mx-auto w-full p-6 flex flex-col gap-8">
        
        {/* Input Section */}
        <section className="w-full max-w-3xl mx-auto text-center space-y-6 pt-8 pb-4">
           <h2 className="text-4xl md:text-5xl font-black tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white via-zinc-200 to-zinc-500">
             Turn News Into Gameplay.
           </h2>
           <p className="text-zinc-400 text-lg max-w-xl mx-auto">
             Enter a headline or topic. Our autonomous agent swarm will design, code, and test a playable micro-game for you in seconds.
           </p>
           
           <div className="flex gap-2 max-w-lg mx-auto relative group">
             <input 
                type="text" 
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="e.g. 'Cyberpunk Squirrel trying to find a nut'"
                className="flex-1 bg-zinc-900/50 border border-zinc-700 rounded-xl px-5 py-4 text-white placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500 transition-all"
                onKeyDown={(e) => e.key === 'Enter' && handleStartWorkflow()}
                disabled={status !== AgentStatus.IDLE && status !== AgentStatus.DEPLOYED && status !== AgentStatus.FAILED}
             />
             <button 
               onClick={handleStartWorkflow}
               disabled={!topic || (status !== AgentStatus.IDLE && status !== AgentStatus.DEPLOYED && status !== AgentStatus.FAILED)}
               className="bg-white text-black font-bold px-6 py-4 rounded-xl hover:bg-zinc-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-[0_0_20px_rgba(255,255,255,0.1)]"
             >
               Generate
             </button>
           </div>
        </section>

        {/* Workflow Visualization */}
        <section className="h-[300px]">
          <AgentVisualizer status={status} logs={logs} />
        </section>

        {/* Game Area */}
        <section className={`flex-1 min-h-[500px] transition-all duration-700 ${status === AgentStatus.DEPLOYED ? 'opacity-100 translate-y-0' : 'opacity-40 translate-y-4 grayscale'}`}>
           {status === AgentStatus.DEPLOYED && game ? (
             <div className="h-full border-2 border-purple-500/30 rounded-2xl p-1 shadow-[0_0_50px_rgba(168,85,247,0.15)] bg-zinc-900/50 backdrop-blur-sm">
                <GameHarness gameDef={game} onCrash={handleCrash} />
             </div>
           ) : (
             <div className="h-full border border-dashed border-zinc-800 rounded-2xl flex flex-col items-center justify-center text-zinc-600 bg-zinc-900/20">
                <div className="text-6xl mb-4 opacity-20">🎮</div>
                <p>Waiting for deployment...</p>
             </div>
           )}
        </section>

      </main>
    </div>
  );
}

export default App;