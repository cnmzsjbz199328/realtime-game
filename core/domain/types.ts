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

export interface SavedGame extends GameDefinition {
    id: string;
    likes: number;
    timestamp: number;
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

// Port: Where input comes from
export interface IInputSource {
    id: string;
    label: string;
    getValue(rawInput?: string): Promise<string>;
}

// Port: Who does the work
export interface IGameGenerator {
    generate(topic: string): Promise<GameDefinition>;
}

export interface ICodeFixer {
    fix(game: GameDefinition, error: string): Promise<GameDefinition>;
}

// Port: Who validates the work
export interface IGameValidator {
    validate(game: GameDefinition): Promise<{ passed: boolean; error?: string }>;
}

// Port: Who saves the work
export interface IGameRepository {
    save(game: GameDefinition): Promise<SavedGame>;
    getAll(): Promise<SavedGame[]>;
    like(id: string): Promise<void>;
}
