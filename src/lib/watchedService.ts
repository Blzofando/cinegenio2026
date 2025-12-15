import { db } from './firebase/client';
import { doc, setDoc, deleteDoc, collection, getDocs, getDoc, serverTimestamp, updateDoc, deleteField } from 'firebase/firestore';

export interface RatingHistory {
    rating: RatingType;
    comment?: string | null;
    watchedAt: any;
    season?: number | null; // Only for TV
    scope: 'series' | 'season'; // 'series' = avaliou tudo até agora
}

export interface WatchedItem {
    id: number;
    title: string;
    posterUrl: string;
    tmdbMediaType: 'movie' | 'tv';
    rating: RatingType;
    comment?: string;
    watchedAt: any;
    history: RatingHistory[]; // ✅ History support
    season?: number | null;
}

export type RatingType = 'amei' | 'gostei' | 'meh' | 'nao_gostei';

/**
 * Helper to generate document ID
 */
export const generateRatingDocId = (mediaType: 'movie' | 'tv', id: number) => `${mediaType}_${id}`;

/**
 * Marca um item como "assistindo" (watching)
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
        const docRef = doc(db, 'users', userId, 'nowWatching', item.mediaType === 'movie' ? `movie_${item.id}` : `tv_${item.id}`);

        await setDoc(docRef, {
            id: item.id,
            mediaType: item.mediaType,
            title: item.title,
            posterUrl: item.posterUrl,
            timestamp: 0,
            duration: 0,
            lastWatchedAt: serverTimestamp(),
        }, { merge: true });

        console.log('[WatchedService] Marcado como assistindo:', item.title);
        return true;
    } catch (error) {
        console.error('[WatchedService] Erro ao marcar como assistindo:', error);
        throw error;
    }
}

/**
 * Helper to generate Map Key
 * Series: tv_123
 * Season: tv_123_S1
 * Movie: movie_123
 */
export const generateRatingKey = (mediaType: 'movie' | 'tv', id: number, season?: number | null) => {
    if (mediaType === 'tv' && season) return `tv_${id}_S${season}`;
    return `${mediaType}_${id}`;
};

/**
 * Salva um item como watched com avaliação
 * Schema 3.0: users/{userId}/ratings/{rating} (Documento) -> Field: {key}: {data}
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
    comment?: string,
    scope: 'series' | 'season' = 'series',
    season?: number
) {
    try {
        const ratingDocRef = doc(db, 'users', userId, 'ratings', rating);
        const key = generateRatingKey(item.mediaType, item.id, season);
        const baseKey = generateRatingKey(item.mediaType, item.id); // For cleaning up old status

        // 1. Prepare Data
        const entryData: WatchedItem = {
            id: item.id,
            title: item.title,
            posterUrl: item.posterUrl,
            tmdbMediaType: item.mediaType,
            rating,
            comment: comment || '',
            watchedAt: new Date().toISOString(), // Use string for easier Map handling
            season: season || null,
            history: [{
                rating,
                comment: comment || null,
                watchedAt: new Date().toISOString(),
                scope,
                season: season || null
            }]
        };

        // 2. Remove from OTHER rating docs (move logic)
        const allRatings: RatingType[] = ['amei', 'gostei', 'meh', 'nao_gostei'];
        for (const r of allRatings) {
            if (r === rating) continue; // Don't delete from target

            const oldDocRef = doc(db, 'users', userId, 'ratings', r);
            const oldDocSnap = await getDoc(oldDocRef);
            if (oldDocSnap.exists() && oldDocSnap.data()[key]) {
                const updatePayload: any = {};
                updatePayload[key] = deleteField();
                await updateDoc(oldDocRef, updatePayload);
                console.log(`[WatchedService] Moved ${key} from ${r} to ${rating}`);
            }
        }

        // 3. Save to Target Document
        const savePayload: any = {};
        savePayload[key] = entryData;
        await setDoc(ratingDocRef, savePayload, { merge: true });

        // 4. Clean up lists (Dropped/NowWatching)
        if (scope === 'series' || !season) {
            const droppedRef = doc(db, 'users', userId, 'dropped', baseKey);
            await deleteDoc(droppedRef);

            const nowWatchingId = item.mediaType === 'movie' ? `movie_${item.id}` : `tv_${item.id}`;
            const nowWatchingRef = doc(db, 'users', userId, 'nowWatching', nowWatchingId);
            await deleteDoc(nowWatchingRef);

            // Cleanup Flat version if exists (from previous schema)
            const flatRef = doc(db, 'users', userId, 'ratings', baseKey);
            await deleteDoc(flatRef);
        }

        console.log('[WatchedService] Salvo como watched (Map):', key);
        return true;
    } catch (error) {
        console.error('[WatchedService] Erro ao salvar watched:', error);
        throw error;
    }
}

/**
 * Remove um item de watched
 */
export async function removeFromWatched(
    userId: string,
    itemId: number,
    mediaType: 'movie' | 'tv',
    rating: RatingType,
    season?: number
) {
    try {
        const key = generateRatingKey(mediaType, itemId, season);
        const docRef = doc(db, 'users', userId, 'ratings', rating);

        const updatePayload: any = {};
        updatePayload[key] = deleteField();

        await updateDoc(docRef, updatePayload);

        console.log('[WatchedService] Removido de watched:', key);
        return true;
    } catch (error) {
        console.error('[WatchedService] Erro ao remover:', error);
        throw error;
    }
}

/**
 * Verifica se um item está em alguma categoria de watched
 * Aggregates all keys matching the ID (movie_123, tv_123, tv_123_S1, etc)
 */
export async function checkWatchedStatus(
    userId: string,
    itemId: number,
    mediaType: 'movie' | 'tv'
): Promise<{ rating: RatingType, history: RatingHistory[] } | null> {
    try {
        const allRatings: RatingType[] = ['amei', 'gostei', 'meh', 'nao_gostei'];
        const baseKey = `${mediaType}_${itemId}`;

        let foundMainRating: RatingType | null = null;
        let aggregatedHistory: RatingHistory[] = [];

        // Fetch ALL 4 docs in parallel
        const docs = await Promise.all(
            allRatings.map(r => getDoc(doc(db, 'users', userId, 'ratings', r)))
        );

        docs.forEach((snap, index) => {
            if (snap.exists()) {
                const data = snap.data();
                const ratingCtx = allRatings[index];

                // Check all fields in this document
                Object.keys(data).forEach(fieldKey => {
                    // Match "tv_123", "tv_123_S1", "tv_123_S2"...
                    if (fieldKey === baseKey || fieldKey.startsWith(`${baseKey}_S`)) {
                        const itemData = data[fieldKey] as WatchedItem;

                        // Use item's internal history if valid, else construct from item
                        if (itemData.history && Array.isArray(itemData.history)) {
                            aggregatedHistory.push(...itemData.history);
                        } else {
                            // Fallback
                            aggregatedHistory.push({
                                rating: ratingCtx,
                                watchedAt: itemData.watchedAt,
                                comment: itemData.comment,
                                season: itemData.season || (itemData as any).season,
                                scope: 'season'
                            } as any);
                        }

                        if (fieldKey === baseKey) {
                            foundMainRating = ratingCtx;
                        }
                    }
                });
            }
        });

        // Also check Flat location (migration fallback)
        const flatRef = doc(db, 'users', userId, 'ratings', baseKey);
        const flatSnap = await getDoc(flatRef);
        if (flatSnap.exists()) {
            const data = flatSnap.data();
            foundMainRating = data.rating;
            if (data.history) aggregatedHistory.push(...data.history);
        }

        if (aggregatedHistory.length > 0) {
            // Sort history desc
            aggregatedHistory.sort((a, b) => new Date(b.watchedAt).getTime() - new Date(a.watchedAt).getTime());

            const resolvedRating = foundMainRating || aggregatedHistory[0].rating;

            return {
                rating: resolvedRating,
                history: aggregatedHistory
            };
        }

        return null;
    } catch (error) {
        console.error('[WatchedService] Erro ao verificar status:', error);
        return null; // Fail gracefully
    }
}

/**
 * Recomeça um item (reseta timestamp para 0)
 */
export async function restartItem(
    userId: string,
    itemId: number,
    mediaType: 'movie' | 'tv'
) {
    try {
        const nowWatchingId = mediaType === 'movie' ? `movie_${itemId}` : `tv_${itemId}`;
        const docRef = doc(db, 'users', userId, 'nowWatching', nowWatchingId);

        await setDoc(docRef, {
            timestamp: 0,
            lastWatchedAt: serverTimestamp(),
        }, { merge: true });

        console.log('[WatchedService] Item reiniciado:', itemId);
        return true;
    } catch (error) {
        console.error('[WatchedService] Erro ao reiniciar:', error);
        throw error;
    }
}
