import { GameDefinition, IGameRepository, SavedGame } from '../../core/domain/types';

export class PostgresGameRepository implements IGameRepository {
    async save(game: GameDefinition): Promise<SavedGame> {
        const res = await fetch('/api/games', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(game)
        });

        if (!res.ok) throw new Error('Failed to save game');
        return await res.json();
    }

    async getAll(): Promise<SavedGame[]> {
        const res = await fetch('/api/games');
        if (!res.ok) return [];
        return await res.json();
    }

    async like(id: string): Promise<void> {
        await fetch('/api/games', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id })
        });
    }
}
