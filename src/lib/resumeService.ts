// Service to load from SUBCOLLECTION: nowWatching/tv_id/episodes/s1e1
import { db } from '@/lib/firebase/client';
import { collection, getDocs, doc as firestoreDoc } from 'firebase/firestore';
import { getSeasonEpisodes } from './services/seriesMetadataCache';

export interface ResumeData {
    id: number;
    mediaType: 'movie' | 'tv';
    title: string;
    posterUrl?: string;
    backdropUrl?: string; // 16:9 image for Continue Watching
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
 * Verifica se próximo episódio está disponível
 */
async function isNextEpisodeAvailable(
    seriesId: number,
    currentSeason: number,
    currentEpisode: number
): Promise<boolean> {
    try {
        // Buscar todos os episódios da temporada atual
        const episodes = await getSeasonEpisodes(seriesId, currentSeason);

        // Procurar próximo episódio na mesma temporada
        const nextEpisode = episodes.find(ep => ep.episode_number === currentEpisode + 1);

        if (nextEpisode) {
            // Se encontrou próximo episódio, verificar se está disponível
            return nextEpisode.isAvailable;
        }

        // Se não tem próximo na temporada, verificar próxima temporada
        const nextSeasonEpisodes = await getSeasonEpisodes(seriesId, currentSeason + 1);
        if (nextSeasonEpisodes.length > 0) {
            // Verificar se primeiro episódio da próxima temporada está disponível
            return nextSeasonEpisodes[0].isAvailable;
        }

        // Não há mais episódios
        return false;
    } catch (error) {
        console.error('[Resume] Error checking next episode:', error);
        return true; // Em caso de erro, mostrar mesmo assim
    }
}

/**
 * Get items for "Continue Watching"
 * - Movies: loaded from nowWatching where mediaType='movie' 
 * - Series: loaded from episodes subcollection (dual-episode logic)
 * - Smart removal: hide series if ALL episodes watched AND next not available
 */
export const getContinueWatchingItems = async (userId: string): Promise<ResumeData[]> => {
    try {
        const nowWatchingRef = collection(db, 'users', userId, 'nowWatching');
        const seriesSnapshot = await getDocs(nowWatchingRef);

        const items: ResumeData[] = [];

        for (const seriesDoc of seriesSnapshot.docs) {
            const seriesData = seriesDoc.data();

            // ========== MOVIES ==========
            if (seriesData.mediaType === 'movie') {
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
                        backdropUrl: seriesData.backdropUrl,
                        timestamp: seriesData.timestamp || 0,
                        duration: seriesData.duration || 0,
                        progress,
                        lastServer: seriesData.lastServer,
                        lastWatchedAt: seriesData.lastWatchedAt,
                    });

                    console.log(`[Resume] Movie: ${seriesData.title} (${Math.floor(seriesData.timestamp)}s / ${Math.floor(seriesData.duration)}s)`);
                }
            }
            // ========== TV SERIES (INTELLIGENT LOGIC) ==========
            else if (seriesData.mediaType === 'tv') {
                const episodesRef = collection(firestoreDoc(db, 'users', userId, 'nowWatching', seriesDoc.id), 'episodes');
                const episodesSnapshot = await getDocs(episodesRef);

                // Find the viewed:true episode
                for (const epDoc of episodesSnapshot.docs) {
                    const epData = epDoc.data();

                    if (epData.viewed === true) {
                        // ✅ Check if next episode is available
                        const nextAvailable = await isNextEpisodeAvailable(
                            seriesData.id,
                            epData.season,
                            epData.episode
                        );

                        if (!nextAvailable) {
                            console.log(`[Resume] Hiding ${seriesData.title} S${epData.season}E${epData.episode} - next episode not released yet`);
                            continue; // Skip this series
                        }

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
                            backdropUrl: seriesData.backdropUrl || epData.backdropUrl,
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
