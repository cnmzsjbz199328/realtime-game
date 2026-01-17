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
    code: string; // Single block containing setup, update, and classes
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

// Port: Two-stage game generation

// Director: Classifies topic and expands design
export interface IDirector {
    classify(topic: string): Promise<DirectorResult>;
}

export interface DirectorResult {
    skeletonId: string;
    expandedDesign: string;
}

// Engineer: Generates code with skeleton context
export interface IEngineer {
    generate(
        skeletonContext: SkeletonContext,
        expandedDesign: string
    ): Promise<GameDefinition>;
}

export interface SkeletonContext {
    id: string;
    description: string;      // 简短游戏类型描述（如 "Paddle/Ball Physics"）
    interfaceContext: string;
    systemPromptAddon: string;
}

// Fixer: Repairs broken code
export interface IFixer {
    fix(game: GameDefinition, error: string): Promise<GameDefinition>;
}

// Remix: Modifies existing code based on user instructions
export interface IRemix {
    remix(game: GameDefinition, instruction: string): Promise<GameDefinition>;
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
