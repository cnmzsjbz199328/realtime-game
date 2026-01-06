export enum AgentStatus {
  IDLE = 'IDLE',
  DIRECTOR_THINKING = 'DIRECTOR_THINKING',
  ENGINEER_CODING = 'ENGINEER_CODING',
  QA_TESTING = 'QA_TESTING',
  DEPLOYED = 'DEPLOYED',
  FAILED = 'FAILED'
}

export interface GameDefinition {
  title: string;
  description: string;
  setupCode: string; // Javascript code string
  updateCode: string; // Javascript code string
}

export interface AgentLog {
  id: string;
  agent: 'DIRECTOR' | 'ENGINEER' | 'QA';
  message: string;
  timestamp: number;
}

export interface InputState {
  x: number;
  y: number;
  isDown: boolean;
  keys: Record<string, boolean>;
}