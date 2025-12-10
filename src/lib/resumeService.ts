// Service to load from SUBCOLLECTION: nowWatching/tv_id/episodes/s1e1
import { db } from '@/lib/firebase/client';
import { collection, getDocs, doc as firestoreDoc } from 'firebase/firestore';

export interface ResumeData {
    id: number;
    mediaType: 'movie' | 'tv';
    title: string;
    posterUrl?: string;
    season?: number;
    episode?: number;
    progress?: number; // Percentage watched
    timestamp?: number; // Current time in seconds
    duration?: number; // Total duration in seconds
    lastServer?: 'videasy' | 'vidking';
    lastWatchedAt: any;
    viewed?: boolean; // Filter: only show viewed:true
}

/**
 * Get items for "Continue Watching"
 * - Movies: loaded from nowWatching where mediaType='movie' 
 * - Series: loaded from episodes subcollection (dual-episode logic)
 */
export const getContinueWatchingItems = async (userId: string): Promise<ResumeData[]> => {
    try {
        const nowWatchingRef = collection(db, 'users', userId, 'nowWatching');
        const seriesSnapshot = await getDocs(nowWatchingRef);

        const items: ResumeData[] = [];

        for (const seriesDoc of seriesSnapshot.docs) {
            const seriesData = seriesDoc.data();

            // ========== MOVIES ==========
            // Load movies directly from nowWatching collection
            if (seriesData.mediaType === 'movie') {
                // Calculate progress
                let progress = 0;
                if (seriesData.timestamp && seriesData.duration && seriesData.duration > 0) {
                    progress = (seriesData.timestamp / seriesData.duration) * 100;
                }

                // Show if has timestamp and not finished (< 95%)
                if (seriesData.timestamp && seriesData.timestamp > 0 && progress < 95) {
                    items.push({
                        id: seriesData.id,
                        mediaType: seriesData.mediaType,
                        title: seriesData.title,
                        posterUrl: seriesData.posterUrl,
                        timestamp: seriesData.timestamp || 0,
                        duration: seriesData.duration || 0,
                        progress,
                        lastServer: seriesData.lastServer,
                        lastWatchedAt: seriesData.lastWatchedAt,
                    });

                    console.log(`[Resume] Movie: ${seriesData.title} (${Math.floor(seriesData.timestamp)}s / ${Math.floor(seriesData.duration)}s)`);
                }
            }
            // ========== TV SERIES (DUAL-EPISODE LOGIC - DO NOT TOUCH!) ==========
            else if (seriesData.mediaType === 'tv') {
                // Load episodes subcollection
                const episodesRef = collection(firestoreDoc(db, 'users', userId, 'nowWatching', seriesDoc.id), 'episodes');
                const episodesSnapshot = await getDocs(episodesRef);

                // Find the viewed:true episode
                for (const epDoc of episodesSnapshot.docs) {
                    const epData = epDoc.data();

                    if (epData.viewed === true) {
                        // Calculate progress
                        let progress = 0;
                        if (epData.timestamp && epData.duration) {
                            progress = (epData.timestamp / epData.duration) * 100;
                        }

                        items.push({
                            id: seriesData.id,
                            mediaType: seriesData.mediaType,
                            title: seriesData.title,
                            posterUrl: seriesData.posterUrl,
                            season: epData.season,
                            episode: epData.episode,
                            timestamp: epData.timestamp || 0,
                            duration: epData.duration || 0,
                            progress,
                            lastServer: seriesData.lastServer,
                            lastWatchedAt: epData.lastWatchedAt,
                            viewed: epData.viewed,
                        });

                        console.log(`[Resume] Series: ${seriesData.title} S${epData.season}E${epData.episode} (${Math.floor(epData.timestamp)}s / ${Math.floor(epData.duration)}s)`);
                    }
                }
            }
        }

        // Sort by most recent
        return items.sort((a, b) => {
            const aTime = a.lastWatchedAt?.seconds || 0;
            const bTime = b.lastWatchedAt?.seconds || 0;
            return bTime - aTime;
        });
    } catch (error) {
        console.error('[Resume] Error loading:', error);
        return [];
    }
};
