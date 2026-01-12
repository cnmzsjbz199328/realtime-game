/**
 * Markdown Skeleton Loader
 * Parses .md files to extract metadata, interface, prompt, and runtime code.
 */
import * as fs from 'fs';
import * as path from 'path';
import { ENGINE_CORE, ENGINE_INTERFACE } from './engine.js';

export interface SkeletonDefinition {
    id: string;
    name: string;
    description: string;
    interfaceContext: string;
    systemPromptAddon: string;
    runtimeCode: string;
}

export function loadSkeleton(filename: string): SkeletonDefinition | null {
    try {
        const filePath = path.join(process.cwd(), 'server/skeletons/definitions', filename);
        const content = fs.readFileSync(filePath, 'utf-8');

        // 1. Parse Frontmatter (handle both \n and \r\n)
        const frontmatterMatch = content.match(/^---[\r\n]+([\s\S]*?)[\r\n]+---/);
        if (!frontmatterMatch) throw new Error('No frontmatter found');

        const frontmatter = frontmatterMatch[1];
        const idMatch = frontmatter.match(/id:\s*(.+)/);
        const nameMatch = frontmatter.match(/name:\s*(.+)/);
        const descMatch = frontmatter.match(/description:\s*(.+)/);

        const id = idMatch ? idMatch[1].trim() : 'unknown';
        const name = nameMatch ? nameMatch[1].trim() : 'Unknown Skeleton';
        const description = descMatch ? descMatch[1].trim() : '';

        // 2. Extract code blocks from sections
        const interfaceMatch = content.match(/# Interface[\s\S]*?```[\w]*[\r\n]+([\s\S]*?)[\r\n]+```/);
        const promptMatch = content.match(/# System Prompt[\r\n]+([\s\S]*?)(?=[\r\n]+# Runtime Code)/);
        const runtimeMatch = content.match(/# Runtime Code[\s\S]*?```[\w]*[\r\n]+([\s\S]*?)[\r\n]+```/);

        return {
            id,
            name,
            description,
            interfaceContext: ENGINE_INTERFACE + '\n' + (interfaceMatch ? interfaceMatch[1].trim() : ''),
            systemPromptAddon: promptMatch ? promptMatch[1].trim() : '',
            runtimeCode: ENGINE_CORE + '\n' + (runtimeMatch ? runtimeMatch[1].trim() : ''),
        };

    } catch (e: any) {
        console.error(`[LOADER] Failed to load ${filename}:`, e.message);
        return null;
    }
}
