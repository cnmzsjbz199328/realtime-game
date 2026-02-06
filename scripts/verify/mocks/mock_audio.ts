
// Mock Audio System for Headless Environment
export const createMockSfx = () => {
    const logs: string[] = [];

    return {
        play: (soundId: string) => {
            logs.push(`SFX: ${soundId}`);
            // console.log(`[MockAudio] Playing: ${soundId}`);
        },
        _getLogs: () => [...logs],
        _clearLogs: () => { logs.length = 0; }
    };
};
