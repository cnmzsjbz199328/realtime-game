import type { VercelRequest, VercelResponse } from '@vercel/node';
import { prisma } from '../server/lib/prisma.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
    try {
        if (req.method === 'GET') {
            const games = await prisma.savedGame.findMany({
                orderBy: { likes: 'desc' },
                take: 50
            });
            return res.status(200).json(games);
        }

        if (req.method === 'POST') {
            const { id, title, description, code } = req.body;

            if (!title || typeof title !== 'string' || title.trim().length === 0) {
                return res.status(400).json({ error: 'title is required and must be a non-empty string' });
            }
            if (title.length > 200) {
                return res.status(400).json({ error: 'title must be 200 characters or fewer' });
            }
            if (!code || typeof code !== 'string' || code.trim().length === 0) {
                return res.status(400).json({ error: 'code is required and must be a non-empty string' });
            }
            if (code.length > 500_000) {
                return res.status(400).json({ error: 'code exceeds maximum allowed size' });
            }
            if (description !== undefined && typeof description !== 'string') {
                return res.status(400).json({ error: 'description must be a string' });
            }

            // Check if game already exists (if ID provided)
            if (id) {
                const existing = await prisma.savedGame.findUnique({ where: { id: String(id) } });
                if (existing) {
                    const updated = await prisma.savedGame.update({
                        where: { id: String(id) },
                        data: { likes: { increment: 1 } }
                    });
                    return res.status(200).json(updated);
                }
            }

            const game = await prisma.savedGame.create({
                data: {
                    id: id || undefined,
                    title,
                    description,
                    code,
                    likes: 0
                }
            });
            return res.status(200).json(game);
        }

        if (req.method === 'PATCH') {
            const { id } = req.body; // Expect ID in body for PATCH
            if (!id) return res.status(400).json({ error: 'Missing ID' });

            const updated = await prisma.savedGame.update({
                where: { id: String(id) },
                data: { likes: { increment: 1 } }
            });
            return res.status(200).json(updated);
        }

        return res.status(405).send('Method Not Allowed');
    } catch (error: any) {
        console.error(error);
        return res.status(500).json({ error: error.message });
    }
}
