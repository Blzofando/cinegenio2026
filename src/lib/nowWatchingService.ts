// Simple service to save "now watching" when player opens
import { db } from '@/lib/firebase/client';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';

export interface NowWatchingItem {
    id: number;
    mediaType: 'movie' | 'tv';
    title: string;
    posterUrl?: string;
    backdropUrl?: string; // 16:9 image for Continue Watching
    season?: number;
    episode?: number;
    lastServer?: 'videasy' | 'vidking';
    timestamp?: number; // Current playback position in seconds
    duration?: number; // Total duration in seconds
    viewed?: boolean; // true = currently watching, false = prefetched next episode
    startedAt: any;
    lastWatchedAt: any;
}

/**
 * Save when user STARTS watching (clicks "Assistir")
 * USES SINGLE DOCUMENT PER SERIES/MOVIE (not per episode!)
 */
export const saveStartWatching = async (
    userId: string,
    item: Omit<NowWatchingItem, 'startedAt' | 'lastWatchedAt'>
): Promise<void> => {
    // ⭐ SINGLE DOCUMENT PER SERIES/MOVIE ⭐
    const docId = item.mediaType === 'movie'
        ? `movie_${item.id}`
        : `tv_${item.id}`; // NO season/episode in document ID!

    const docRef = doc(db, 'users', userId, 'nowWatching', docId);

    // Build object explicitly (avoid undefined)
    const dataToSave: any = {
        id: item.id,
        mediaType: item.mediaType,
        title: item.title,
        startedAt: serverTimestamp(),
        lastWatchedAt: serverTimestamp(),
    };

    // Only add if exists
    if (item.posterUrl) dataToSave.posterUrl = item.posterUrl;
    if (item.backdropUrl) dataToSave.backdropUrl = item.backdropUrl; // Save backdrop for 16:9
    if (item.season !== undefined) dataToSave.season = item.season;
    if (item.episode !== undefined) dataToSave.episode = item.episode;
    if (item.lastServer) dataToSave.lastServer = item.lastServer;
    if (item.timestamp !== undefined) dataToSave.timestamp = item.timestamp;
    if (item.duration !== undefined) dataToSave.duration = item.duration;
    if (item.viewed !== undefined) dataToSave.viewed = item.viewed;

    await setDoc(docRef, dataToSave);

    console.log('✅ Saved to Firebase (single doc):', docId, dataToSave);
};

/**
 * Update when user CLOSES player (clicks X)
 */
export const saveStopWatching = async (
    userId: string,
    id: number,
    mediaType: 'movie' | 'tv',
    season?: number,
    episode?: number
): Promise<void> => {
    // ⭐ SINGLE DOCUMENT PER SERIES/MOVIE ⭐
    const docId = mediaType === 'movie'
        ? `movie_${id}`
        : `tv_${id}`; // NO season/episode!

    const docRef = doc(db, 'users', userId, 'nowWatching', docId);

    await setDoc(docRef, {
        lastWatchedAt: serverTimestamp(),
    }, { merge: true });

    console.log('✅ Updated last watched:', docId);
};
