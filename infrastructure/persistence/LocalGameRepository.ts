import { GameDefinition, IGameRepository, SavedGame } from '../../core/domain/types';

export class LocalGameRepository implements IGameRepository {
    private STORAGE_KEY = 'gengame_collection';

    async save(game: GameDefinition): Promise<SavedGame> {
        // Check if game already has an ID (is a SavedGame)
        const existingId = (game as Partial<SavedGame>).id;
        const current = await this.getAll();

        if (existingId) {
            const exists = current.find(g => g.id === existingId);
            if (exists) {
                // Determine logic: 
                // User requirement: "If user thinks generated game is good... preserve logic"
                // "If future users... keep playing... click like... increment likes"
                // Since this is a local repo, "clicking save" on an existing game is effectively a "like"
                await this.like(existingId);
                return { ...exists, likes: exists.likes + 1 };
            }
        }

        // Create new
        const savedGame: SavedGame = {
            ...game,
            id: Math.random().toString(36).substr(2, 9),
            likes: 0,
            timestamp: Date.now()
        };

        const updated = [savedGame, ...current];
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(updated));

        return savedGame;
    }

    async getAll(): Promise<SavedGame[]> {
        const raw = localStorage.getItem(this.STORAGE_KEY);
        if (!raw) return [];
        try {
            return JSON.parse(raw) as SavedGame[];
        } catch {
            return [];
        }
    }

    async like(id: string): Promise<void> {
        const current = await this.getAll();
        const updated = current.map(g => {
            if (g.id === id) {
                return { ...g, likes: g.likes + 1 };
            }
            return g;
        });
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(updated));
    }
}
