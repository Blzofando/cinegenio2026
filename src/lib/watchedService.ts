import { db } from './firebase/client';
import { doc, setDoc, deleteDoc, collection, getDocs, serverTimestamp } from 'firebase/firestore';

export interface WatchedItem {
    id: number;
    title: string;
    posterUrl: string;
    tmdbMediaType: 'movie' | 'tv';
    rating: 'amei' | 'gostei' | 'meh' | 'nao_gostei';
    comment?: string;
    watchedAt: any;
}

export type RatingType = 'amei' | 'gostei' | 'meh' | 'nao_gostei';

/**
 * Marca um item como "assistindo" (watching)
 * Adiciona ao nowWatching com timestamp = 0 para controle manual
 */
export async function markAsWatching(
    userId: string,
    item: {
        id: number;
        mediaType: 'movie' | 'tv';
        title: string;
        posterUrl: string;
    }
) {
    try {
        const docRef = doc(db, 'users', userId, 'nowWatching', String(item.id));

        await setDoc(docRef, {
            id: item.id,
            mediaType: item.mediaType,
            title: item.title,
            posterUrl: item.posterUrl,
            timestamp: 0,
            duration: 0,
            lastWatchedAt: serverTimestamp(),
            lastServer: null,
        });

        console.log('[WatchedService] Marcado como assistindo:', item.title);
        return true;
    } catch (error) {
        console.error('[WatchedService] Erro ao marcar como assistindo:', error);
        throw error;
    }
}

/**
 * Salva um item como watched com avaliação
 * Armazena em users/{userId}/watchedItems/{rating}/{itemId}
 */
export async function markAsWatched(
    userId: string,
    item: {
        id: number;
        mediaType: 'movie' | 'tv';
        title: string;
        posterUrl: string;
    },
    rating: RatingType,
    comment?: string
) {
    try {
        const docRef = doc(db, 'users', userId, 'watchedItems', rating, String(item.id));

        const watchedData: WatchedItem = {
            id: item.id,
            title: item.title,
            posterUrl: item.posterUrl,
            tmdbMediaType: item.mediaType,
            rating,
            comment: comment || '',
            watchedAt: serverTimestamp(),
        };

        await setDoc(docRef, watchedData);

        console.log('[WatchedService] Salvo como watched:', item.title, 'Rating:', rating);
        return true;
    } catch (error) {
        console.error('[WatchedService] Erro ao salvar watched:', error);
        throw error;
    }
}

/**
 * Recomeça um item (reseta timestamp para 0)
 * Para filmes: reseta em nowWatching
 * Para séries: reseta episódio atual
 */
export async function restartItem(
    userId: string,
    itemId: number,
    mediaType: 'movie' | 'tv'
) {
    try {
        const docRef = doc(db, 'users', userId, 'nowWatching', String(itemId));

        if (mediaType === 'movie') {
            // Para filmes, simplesmente reseta timestamp
            await setDoc(docRef, {
                timestamp: 0,
                lastWatchedAt: serverTimestamp(),
            }, { merge: true });
        } else {
            // Para séries, precisaria resetar para S01E01
            // Por enquanto só reseta timestamp
            await setDoc(docRef, {
                timestamp: 0,
                lastWatchedAt: serverTimestamp(),
            }, { merge: true });
        }

        console.log('[WatchedService] Item reiniciado:', itemId);
        return true;
    } catch (error) {
        console.error('[WatchedService] Erro ao reiniciar:', error);
        throw error;
    }
}

/**
 * Busca items por rating
 */
export async function getItemsByRating(userId: string, rating: RatingType): Promise<WatchedItem[]> {
    try {
        const collectionRef = collection(db, 'users', userId, 'watchedItems', rating);
        const snapshot = await getDocs(collectionRef);

        const items: WatchedItem[] = [];
        snapshot.forEach(doc => {
            items.push(doc.data() as WatchedItem);
        });

        return items;
    } catch (error) {
        console.error('[WatchedService] Erro ao buscar items:', error);
        return [];
    }
}

/**
 * Remove um item de watched
 */
export async function removeFromWatched(
    userId: string,
    itemId: number,
    rating: RatingType
) {
    try {
        const docRef = doc(db, 'users', userId, 'watchedItems', rating, String(itemId));
        await deleteDoc(docRef);

        console.log('[WatchedService] Removido de watched:', itemId);
        return true;
    } catch (error) {
        console.error('[WatchedService] Erro ao remover:', error);
        throw error;
    }
}

/**
 * Verifica se um item está em alguma categoria de watched
 */
export async function checkWatchedStatus(
    userId: string,
    itemId: number
): Promise<RatingType | null> {
    try {
        const ratings: RatingType[] = ['amei', 'gostei', 'meh', 'nao_gostei'];

        for (const rating of ratings) {
            const docRef = doc(db, 'users', userId, 'watchedItems', rating, String(itemId));
            const snapshot = await getDocs(collection(db, 'users', userId, 'watchedItems', rating));

            const exists = snapshot.docs.some(d => d.id === String(itemId));
            if (exists) {
                return rating;
            }
        }

        return null;
    } catch (error) {
        console.error('[WatchedService] Erro ao verificar status:', error);
        return null;
    }
}
