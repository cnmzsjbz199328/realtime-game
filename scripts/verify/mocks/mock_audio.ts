
// Mock Audio System for Headless Environment
export const createMockSfx = () => {
    const logs: string[] = [];

    return {
        play: (soundId: string) => {
            logs.push(`SFX: ${soundId}`);
            // console.log(`[MockAudio] Playing: ${soundId}`);
        },
        note: (freq: string | number, duration: number, type: string) => {
            logs.push(`NOTE: ${freq} (${duration}s, ${type})`);
        },
        _getLogs: () => [...logs],
        _clearLogs: () => { logs.length = 0; }
    };
};
