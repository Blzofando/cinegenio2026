// src/lib/utils/genreUtils.ts

import { ManagedWatchedItem } from '@/types';

/**
 * Retorna os gêneros mais assistidos/curtidos pelo usuário com base nos dados do Firestore.
 * 
 * @param amei Lista de itens marcados como 'amei'
 * @param gostei Lista de itens marcados como 'gostei'
 * @param count Quantidade de gêneros a retornar (padrão: 10)
 * @returns Array de strings com os nomes dos gêneros
 */
export const getTopGenres = (amei: ManagedWatchedItem[], gostei: ManagedWatchedItem[], count = 10): string[] => {
    const genreCounts = new Map<string, number>();

    // Peso 2 para 'amei'
    amei.forEach(item => {
        if (item.genre) {
            genreCounts.set(item.genre, (genreCounts.get(item.genre) || 0) + 2);
        }
    });

    // Peso 1 para 'gostei'
    gostei.forEach(item => {
        if (item.genre) {
            genreCounts.set(item.genre, (genreCounts.get(item.genre) || 0) + 1);
        }
    });

    const sortedGenres = [...genreCounts.entries()]
        .sort(([, countA], [, countB]) => countB - countA)
        .map(([genre]) => genre);

    const topGenres = [...new Set(sortedGenres)];
    const defaultGenres = ['Ação', 'Comédia', 'Drama', 'Ficção Científica', 'Suspense', 'Terror', 'Romance', 'Aventura', 'Mistério', 'Fantasia'];

    // Preenche com gêneros padrão caso o usuário não tenha histórico suficiente
    let i = 0;
    while (topGenres.length < count && i < defaultGenres.length) {
        const nextDefault = defaultGenres[i];
        if (!topGenres.includes(nextDefault)) {
            topGenres.push(nextDefault);
        }
        i++;
    }

    return topGenres.slice(0, count);
};
