import { db } from './firebase/client';
import { doc, setDoc, deleteDoc, getDoc, serverTimestamp } from 'firebase/firestore';

/**
 * Marca um item como abandonado
 * Remove de nowWatching e adiciona à collection dropped
 */
export async function markAsDropped(
    userId: string,
    item: {
        id: number;
        mediaType: 'movie' | 'tv';
        title: string;
        posterUrl: string;
    },
    reason: 'manual' | 'auto' = 'manual'
): Promise<void> {
    try {
        const docId = item.mediaType === 'movie' ? `movie_${item.id}` : `tv_${item.id}`;
        const nowWatchingRef = doc(db, 'users', userId, 'nowWatching', docId);
        const droppedRef = doc(db, 'users', userId, 'dropped', `${item.mediaType}_${item.id}`);

        // 1. Buscar dados atuais do nowWatching (se existir)
        const nowWatchingSnap = await getDoc(nowWatchingRef);
        let progressData: any = {
            timestamp: 0,
            duration: 0,
        };

        if (nowWatchingSnap.exists()) {
            const data = nowWatchingSnap.data();
            progressData = {
                timestamp: data.timestamp || 0,
                duration: data.duration || 0,
                season: data.season || null,
                episode: data.episode || null,
                lastWatchedAt: data.lastWatchedAt || null,
            };
        }

        // 2. Criar documento em dropped
        await setDoc(droppedRef, {
            id: item.id,
            mediaType: item.mediaType,
            title: item.title,
            posterUrl: item.posterUrl,
            droppedAt: serverTimestamp(),
            droppedReason: reason,
            progressWhenDropped: progressData,
        });

        // 3. **REMOVER de nowWatching** (estava faltando!)
        if (nowWatchingSnap.exists()) {
            await deleteDoc(nowWatchingRef);
            console.log(`✅ [DroppedService] Removido de nowWatching`);
        }

        console.log(`✅ [DroppedService] "${item.title}" marcado como abandonado`);
    } catch (error) {
        console.error('[DroppedService] Erro ao marcar como abandonado:', error);
        throw error;
    }
}

/**
 * Retoma um item abandonado
 * Remove de dropped e adiciona de volta ao nowWatching
 */
export async function resumeDropped(
    userId: string,
    item: {
        id: number;
        mediaType: 'movie' | 'tv';
        title: string;
        posterUrl: string;
    }
): Promise<void> {
    try {
        const droppedRef = doc(db, 'users', userId, 'dropped', `${item.mediaType}_${item.id}`);
        const docId = item.mediaType === 'movie' ? `movie_${item.id}` : `tv_${item.id}`;
        const nowWatchingRef = doc(db, 'users', userId, 'nowWatching', docId);

        // 1. Buscar dados do dropped
        const droppedSnap = await getDoc(droppedRef);

        if (!droppedSnap.exists()) {
            throw new Error('Item não encontrado em abandonados');
        }

        const droppedData = droppedSnap.data();
        const progress = droppedData.progressWhenDropped || {};

        // 2. Restaurar em nowWatching
        await setDoc(nowWatchingRef, {
            id: item.id,
            mediaType: item.mediaType,
            title: item.title,
            posterUrl: item.posterUrl,
            timestamp: progress.timestamp || 0,
            duration: progress.duration || 0,
            season: progress.season,
            episode: progress.episode,
            lastWatchedAt: serverTimestamp(),
            lastServer: null,
        });

        // 3. Remover de dropped
        await deleteDoc(droppedRef);

        console.log(`✅ [DroppedService] "${item.title}" retomado`);
    } catch (error) {
        console.error('[DroppedService] Erro ao retomar:', error);
        throw error;
    }
}

/**
 * Remove permanentemente um item abandonado
 */
export async function removeDropped(
    userId: string,
    itemId: number,
    mediaType: 'movie' | 'tv'
): Promise<void> {
    try {
        const droppedRef = doc(db, 'users', userId, 'dropped', `${mediaType}_${itemId}`);
        await deleteDoc(droppedRef);
        console.log(`✅ [DroppedService] Item ${itemId} removido de abandonados`);
    } catch (error) {
        console.error('[DroppedService] Erro ao remover:', error);
        throw error;
    }
}
