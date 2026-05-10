/**
 * AI Client with dual endpoints:
 * - callAI: Main endpoint (multi-model rotation, fast)
 * - callAIReasoning: DeepSeek R1 (reasoning capability)
 */

const MAIN_API = 'https://unified-ai-backend.tj15982183241.workers.dev/v1/models/large';
const SMALL_API = 'https://unified-ai-backend.tj15982183241.workers.dev/v1/models/small';
const DEEPSEEK_API = 'https://unified-ai-backend.tj15982183241.workers.dev/v1/models/large/deepseek-r1';

/**
 * Standard AI call (Director, Fixer, Remix)
 * Uses main endpoint with model rotation
 */
export async function callAI(messages: any[]): Promise<string> {
    return callAIInternal(MAIN_API, messages, 'Main AI');
}

/**
 * Fast/Architect AI call (Architect)
 * Uses Small endpoint (Gemini)
 */
export async function callAISmall(messages: any[]): Promise<string> {
    return callAIInternal(SMALL_API, messages, 'Small AI (Gemini)');
}

/**
 * Reasoning AI call (Engineer)
 * Uses DeepSeek R1 for complex game logic
 */
export async function callAIReasoning(messages: any[]): Promise<string> {
    return callAIInternal(DEEPSEEK_API, messages, 'DeepSeek-R1');
}

/**
 * Shared implementation for both endpoints
 */
async function callAIInternal(endpoint: string, messages: any[], modelName: string): Promise<string> {
    console.log(`[AI-CLIENT] Calling ${modelName} (${messages.length} messages)...`);

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 25_000);

    let response: Response;
    try {
        response = await fetch(endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ messages }),
            signal: controller.signal
        });
    } finally {
        clearTimeout(timeout);
    }

    if (!response.ok) {
        throw new Error(`${modelName} API Error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json() as any;

    if (!data.success) {
        throw new Error(data.message || 'Unknown AI error');
    }

    const contentLength = typeof data.content === 'string' ? data.content.length : 0;
    console.log(`[AI-CLIENT] ${modelName} OK — response ${contentLength} chars`);

    if (data.reasoning_content && modelName === 'DeepSeek-R1') {
        console.log('[AI-CLIENT] [REASONING] Available (length:', data.reasoning_content.length, 'chars)');
    }

    return data.content;
}
