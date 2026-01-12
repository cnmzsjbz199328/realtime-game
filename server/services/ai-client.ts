/**
 * Direct AI Client for Backend Services
 * Calls the unified AI backend directly without going through Vercel API again
 */

const UPSTREAM_API = 'https://unified-ai-backend.tj15982183241.workers.dev/v1/models/large';

export async function callAI(messages: any[]): Promise<string> {
    console.log('[AI-CLIENT] Calling upstream AI...');
    console.log('[AI-CLIENT] >>> REQUEST MESSAGES >>>');
    console.log(JSON.stringify(messages, null, 2));
    console.log('[AI-CLIENT] <<< END REQUEST MESSAGES <<<');
    const response = await fetch(UPSTREAM_API, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages })
    });

    if (!response.ok) {
        throw new Error(`Upstream AI Error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json() as any;

    if (!data.success) {
        throw new Error(data.message || 'Unknown AI error');
    }

    console.log('[AI-CLIENT] >>> RAW RESPONSE >>>');
    console.log(data.content);
    console.log('[AI-CLIENT] <<< END RAW RESPONSE <<<');

    return data.content;
}
