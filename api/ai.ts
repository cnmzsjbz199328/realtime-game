import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
    if (req.method !== 'POST') return res.status(405).send('Method Not Allowed');

    try {
        const { messages } = req.body;

        // In a real scenario, you might inject hidden prompts or API keys here
        const response = await fetch(
            'https://unified-ai-backend.tj15982183241.workers.dev/v1/models/large',
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ messages })
            }
        );

        if (!response.ok) {
            throw new Error(`Upstream Error: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();
        return res.status(200).json(data);

    } catch (error: any) {
        console.error("API Error:", error);
        return res.status(500).json({ error: error.message || "Internal Server Error" });
    }
}
