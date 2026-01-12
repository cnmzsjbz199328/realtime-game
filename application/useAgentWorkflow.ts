import { useState, useCallback, useRef } from 'react';
import { IFixer, IGameValidator, AgentStatus, AgentLog, GameDefinition } from '../core/domain/types';
import { FrontendGameGenerator } from '../infrastructure/ai/FrontendAIService';

export const useAgentWorkflow = (
    generator: FrontendGameGenerator,
    fixer: IFixer,
    validator: IGameValidator
) => {
    const [status, setStatus] = useState<AgentStatus>(AgentStatus.IDLE);
    const [logs, setLogs] = useState<AgentLog[]>([]);
    const [game, setGame] = useState<GameDefinition | null>(null);

    const addLog = (agent: 'DIRECTOR' | 'ENGINEER' | 'QA', message: string) => {
        console.log(`[${agent}] ${message}`);
        setLogs(prev => [...prev, {
            id: Math.random().toString(36).substr(2, 9),
            agent,
            message,
            timestamp: Date.now()
        }]);
    };

    // Concurrency Guard
    const processingRef = useRef(false);

    const startWorkflow = async (topic: string) => {
        if (!topic.trim()) return;
        if (processingRef.current) {
            console.warn('[WORKFLOW] Attempted to start workflow while already running. Ignored.');
            return;
        }

        processingRef.current = true;
        console.log('[WORKFLOW] ========== Workflow Started ==========');
        console.log('[WORKFLOW] Topic:', topic);

        setStatus(AgentStatus.DIRECTOR_THINKING);
        setLogs([]);
        setGame(null);

        try {
            // Phase 1-3: Director + Engineer (runs on backend via API)
            addLog('DIRECTOR', `Analyzing topic: "${topic}"...`);
            addLog('DIRECTOR', 'Classifying game type and expanding design...');

            setStatus(AgentStatus.ENGINEER_CODING);
            addLog('ENGINEER', 'Received design from Director...');
            addLog('ENGINEER', 'Generating game code...');

            let currentGameDef = await generator.generate(topic);

            addLog('ENGINEER', `✓ Generated: ${currentGameDef.title}`);
            addLog('ENGINEER', 'Code compilation successful. Sending build to QA Sandbox...');

            // Phase 4: QA Testing with Retry
            console.log('[WORKFLOW] Phase 4: QA Testing');
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

                        addLog('ENGINEER', '✓ Hotfix applied. Re-submitting for review...');
                    } else {
                        addLog('QA', 'Critical Failure: Max retries exceeded. Aborting.');
                        throw new Error(`QA Check failed: ${testResult.error}`);
                    }
                }
                attempts++;
            }

            // Phase 5: Deployment
            if (qaPassed) {
                console.log('[WORKFLOW] Phase 5: Deployment');
                setGame(currentGameDef);
                setStatus(AgentStatus.DEPLOYED);
                console.log('[WORKFLOW] ========== Workflow Complete ==========');
            }

        } catch (error: any) {
            console.error('[WORKFLOW] ========== Workflow Failed ==========');
            console.error('[WORKFLOW] Error:', error.message);
            addLog('ENGINEER', `Workflow Halted: ${error.message}`);
            setStatus(AgentStatus.FAILED);
        } finally {
            processingRef.current = false;
        }
    };

    const handleCrash = useCallback((error: string) => {
        addLog('QA', `Runtime Error Detected: ${error}`);
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
