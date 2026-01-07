import React, { useEffect, useRef } from 'react';
import { AgentStatus, AgentLog } from '../core/domain/types';

interface AgentVisualizerProps {
  status: AgentStatus;
  logs: AgentLog[];
}

const AgentCard: React.FC<{
  role: string;
  isActive: boolean;
  icon: string;
  color: string
}> = ({ role, isActive, icon, color }) => (
  <div className={`p-4 rounded-lg border transition-all duration-300 ${isActive ? `border-${color}-500 bg-${color}-500/10 shadow-[0_0_15px_rgba(var(--${color}-rgb),0.3)] scale-105` : 'border-zinc-800 bg-zinc-900/50 opacity-60'}`}>
    <div className="flex items-center gap-3 mb-2">
      <div className={`w-10 h-10 rounded-full flex items-center justify-center text-xl ${isActive ? `bg-${color}-500 text-black` : 'bg-zinc-800 text-zinc-500'}`}>
        {icon}
      </div>
      <div>
        <h3 className={`font-bold ${isActive ? 'text-white' : 'text-zinc-500'}`}>{role}</h3>
        <p className="text-xs text-zinc-400 font-mono">
          {isActive ? 'PROCESSING...' : 'WAITING'}
        </p>
      </div>
    </div>
    {isActive && (
      <div className="h-1 w-full bg-zinc-800 rounded-full overflow-hidden mt-2">
        <div className={`h-full bg-${color}-500 animate-progress`}></div>
      </div>
    )}
  </div>
);

export const AgentVisualizer: React.FC<AgentVisualizerProps> = ({ status, logs }) => {
  const logContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (logContainerRef.current) {
      logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
    }
  }, [logs]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-full">
      {/* Agents Column */}
      <div className="flex flex-col gap-4">
        <AgentCard
          role="The Director"
          icon="🎬"
          color="purple"
          isActive={status === AgentStatus.DIRECTOR_THINKING}
        />
        <AgentCard
          role="The Engineer"
          icon="💻"
          color="blue"
          isActive={status === AgentStatus.ENGINEER_CODING}
        />
        <AgentCard
          role="Quality Assurance"
          icon="🛡️"
          color="green"
          isActive={status === AgentStatus.QA_TESTING}
        />
      </div>

      {/* Terminal Output */}
      <div className="lg:col-span-2 bg-black border border-zinc-800 rounded-lg p-4 font-mono text-sm relative overflow-hidden flex flex-col">
        <div className="absolute top-0 left-0 right-0 h-8 bg-zinc-900 border-b border-zinc-800 flex items-center px-4 gap-2">
          <div className="w-3 h-3 rounded-full bg-red-500/50"></div>
          <div className="w-3 h-3 rounded-full bg-yellow-500/50"></div>
          <div className="w-3 h-3 rounded-full bg-green-500/50"></div>
          <span className="ml-2 text-zinc-500 text-xs">agent_workflow.log</span>
        </div>

        <div ref={logContainerRef} className="mt-8 flex-1 overflow-y-auto space-y-2 pr-2">
          {logs.length === 0 && (
            <div className="text-zinc-600 italic">Waiting for input stream...</div>
          )}
          {logs.map((log) => (
            <div key={log.id} className="flex gap-3 animate-fade-in">
              <span className="text-zinc-600 shrink-0">
                [{new Date(log.timestamp).toLocaleTimeString([], { hour12: false, second: '2-digit' })}]
              </span>
              <span className={`font-bold shrink-0 w-24 ${log.agent === 'DIRECTOR' ? 'text-purple-400' :
                  log.agent === 'ENGINEER' ? 'text-blue-400' : 'text-green-400'
                }`}>
                {log.agent}:
              </span>
              <span className="text-zinc-300 break-words">{log.message}</span>
            </div>
          ))}
          {status === AgentStatus.FAILED && (
            <div className="text-red-500 font-bold mt-2">
              CRITICAL ERROR: Workflow halted.
            </div>
          )}
        </div>
      </div>

      <style>{`
        .animate-progress {
          animation: progress 2s infinite linear;
          width: 50%;
        }
        @keyframes progress {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(200%); }
        }
        .animate-fade-in {
          animation: fadeIn 0.3s ease-out forwards;
          opacity: 0;
        }
        @keyframes fadeIn {
          to { opacity: 1; }
        }
      `}</style>
    </div>
  );
};