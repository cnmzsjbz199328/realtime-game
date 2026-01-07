import { useState, useEffect } from 'react';
import { IGameRepository, SavedGame, GameDefinition } from '../core/domain/types';

export const useGameCollection = (repository: IGameRepository) => {
    const [savedGames, setSavedGames] = useState<SavedGame[]>([]);

    useEffect(() => {
        loadGames();
    }, []);

    const loadGames = async () => {
        const games = await repository.getAll();
        setSavedGames(games);
    };

    const saveGame = async (game: GameDefinition) => {
        const result = await repository.save(game);
        await loadGames();
        return result;
    };

    const likeGame = async (id: string) => {
        await repository.like(id);
        await loadGames();
    };

    return {
        savedGames,
        saveGame,
        likeGame
    };
};
