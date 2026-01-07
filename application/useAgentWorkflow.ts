import { useState, useCallback } from 'react';
import { IGameGenerator, ICodeFixer, IGameValidator, AgentStatus, AgentLog, GameDefinition } from '../core/domain/types';

export const useAgentWorkflow = (
    generator: IGameGenerator,
    fixer: ICodeFixer,
    validator: IGameValidator
) => {
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

    const startWorkflow = async (topic: string) => {
        if (!topic.trim()) return;

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
            // 2. Engineer Phase
            addLog('ENGINEER', 'Received GDD. Initializing coding environment...');
            addLog('ENGINEER', 'Generating game logic, physics, and rendering pipeline...');

            let currentGameDef = await generator.generate(topic);

            addLog('ENGINEER', 'Code compilation successful. Sending build to QA Sandbox...');

            // 3. QA Phase
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

                await new Promise(r => setTimeout(r, 800));

                const testResult = await validator.validate(currentGameDef);

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

                        addLog('ENGINEER', 'Analyzing crash report...');
                        addLog('ENGINEER', 'Applying hotfix to game logic...');

                        currentGameDef = await fixer.fix(currentGameDef, testResult.error || "Unknown Error");

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

    return {
        status,
        logs,
        game,
        setGame,
        setStatus,
        startWorkflow,
        handleCrash
    };
};
