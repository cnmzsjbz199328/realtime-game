import { GameDefinition } from '../../core/domain/types.js';

/**
 * Strip ```json ... ``` or ``` ... ``` fences so the remainder can be JSON.parsed.
 */
export function stripJsonFences(raw: string): string {
    return raw
        .trim()
        .replace(/```json\s*/g, '')
        .replace(/```\s*/g, '');
}

/**
 * Strip a leading ``` fence (with optional language tag) and trailing ``` from a response
 * that wraps its content in a single code block.
 */
export function stripCodeFences(raw: string): string {
    let content = raw.trim();
    if (content.startsWith('```')) {
        content = content.replace(/^```[a-z]*\n/, '').replace(/```$/, '');
    }
    return content;
}

/**
 * Parse an AI response that follows the TITLE / DESCRIPTION / CODE format.
 * Throws if any of the three sections is missing.
 */
export function parseGameDefinition(content: string): GameDefinition {
    const titleMatch = content.match(/TITLE:\s*(.+)/);
    const descMatch = content.match(/DESCRIPTION:\s*(.+)/);
    const codeMatch = content.match(/CODE:[\s\S]*?```(?:javascript|js)?\s*([\s\S]*?)```/);

    if (!titleMatch || !descMatch || !codeMatch) {
        throw new Error('Failed to parse AI response. Expected format: TITLE, DESCRIPTION, CODE block.');
    }

    return {
        title: titleMatch[1].trim(),
        description: descMatch[1].trim(),
        code: codeMatch[1].trim()
    };
}
