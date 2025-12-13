// Service to save episodes with FULL TMDB DATA
import { db } from '@/lib/firebase/client';
import { doc, setDoc, serverTimestamp, collection, getDocs, deleteDoc } from 'firebase/firestore';

interface EpisodeInfo {
    season: number;
    episode: number;
}

interface EpisodeData {
    season: number;
    episode: number;
    timestamp: number;
    duration: number;
    viewed: boolean;
    lastWatchedAt: any;
}

/**
 * Fetch FULL series data from TMDb (overview, genres, etc.)
 */
const fetchFullSeriesData = async (seriesId: number): Promise<any> => {
    try {
        console.log(`[TMDb] Fetching FULL series data for ID ${seriesId}...`);
        const response = await fetch(
            `https://api.themoviedb.org/3/tv/${seriesId}?api_key=${process.env.NEXT_PUBLIC_TMDB_API_KEY}&language=pt-BR&append_to_response=credits`
        );
        const data = await response.json();
        console.log(`[TMDb] ✅ Got full series data:`, {
            title: data.name,
            overview: data.overview?.substring(0, 50),
            genres: data.genres?.length
        });
        return data;
    } catch (error) {
        console.error('[TMDb] Error fetching series data:', error);
        return null;
    }
};

/**
 * Fetch episode duration from TMDb API (in seconds)
 */
const fetchEpisodeDuration = async (seriesId: number, season: number, episode: number): Promise<number> => {
    try {
        console.log(`[TMDb] Fetching S${season}E${episode} duration...`);
        const response = await fetch(
            `https://api.themoviedb.org/3/tv/${seriesId}/season/${season}/episode/${episode}?api_key=${process.env.NEXT_PUBLIC_TMDB_API_KEY}`
        );
        const data = await response.json();
        const runtime = data.runtime || 0; // in minutes
        const durationSeconds = runtime * 60;
        console.log(`[TMDb] ✅ S${season}E${episode} runtime: ${runtime}min (${durationSeconds}s)`);
        return durationSeconds;
    } catch (error) {
        console.error('[TMDb] Error fetching duration:', error);
        return 0;
    }
};

/**
 * Save current episode (viewed:true) + next episode (viewed:false) with FULL TMDB DATA
 */
export const saveDualEpisodes = async (
    userId: string,
    seriesId: number,
    title: string,
    posterUrl: string | undefined,
    backdropUrl: string | undefined,
    currentEpisode: EpisodeInfo,
    nextEpisode: EpisodeInfo | null,
    server: 'videasy' | 'vidking',
    timestamp: number = 0,
    currentDuration: number = 0
): Promise<void> => {
    // Fetch FULL TMDb data
    const tmdbData = await fetchFullSeriesData(seriesId);

    // Extract COMPLETE data
    const fullBackdropUrl = tmdbData?.backdrop_path
        ? `https://image.tmdb.org/t/p/original${tmdbData.backdrop_path}`
        : (backdropUrl || null);

    const fullPosterUrl = tmdbData?.poster_path
        ? `https://image.tmdb.org/t/p/w500${tmdbData.poster_path}`
        : (posterUrl || null);

    const overview = tmdbData?.overview || null;
    const genres = tmdbData?.genres?.map((g: any) => g.name) || [];
    const voteAverage = tmdbData?.vote_average || null;
    const voteCount = tmdbData?.vote_count || null;
    const numberOfSeasons = tmdbData?.number_of_seasons || null;
    const numberOfEpisodes = tmdbData?.number_of_episodes || null;
    const originalLanguage = tmdbData?.original_language || null;
    const originalName = tmdbData?.original_name || null;
    const firstAirDate = tmdbData?.first_air_date || null;

    const seriesDocRef = doc(db, 'users', userId, 'nowWatching', `tv_${seriesId}`);

    // Save FULL series metadata
    await setDoc(seriesDocRef, {
        id: seriesId,
        mediaType: 'tv',
        title,
        posterUrl: fullPosterUrl,
        backdropUrl: fullBackdropUrl, // 16:9 backdrop

        // FULL TMDB DATA (for modal without request)
        overview,
        genres,
        voteAverage,
        voteCount,
        numberOfSeasons,
        numberOfEpisodes,
        originalLanguage,
        originalName,
        firstAirDate,
    }, { merge: true });

    const episodesRef = collection(seriesDocRef, 'episodes');

    // Save CURRENT episode
    const currentEpId = `s${currentEpisode.season}e${currentEpisode.episode}`;
    const currentEpRef = doc(episodesRef, currentEpId);

    await setDoc(currentEpRef, {
        season: currentEpisode.season,
        episode: currentEpisode.episode,
        id: seriesId,
        title,
        posterUrl: fullPosterUrl,
        backdropUrl: fullBackdropUrl,
        mediaType: 'tv',
        timestamp,
        duration: currentDuration,
        lastServer: server,
        viewed: true,

        // FULL TMDB DATA
        overview,
        genres,
        voteAverage,

        startedAt: serverTimestamp(),
        lastWatchedAt: serverTimestamp(),
    });

    console.log(`✅ Saved current: S${currentEpisode.season}E${currentEpisode.episode} with FULL TMDB data`);

    // Prefetch NEXT episode
    if (nextEpisode) {
        const nextDuration = await fetchEpisodeDuration(seriesId, nextEpisode.season, nextEpisode.episode);

        const nextEpId = `s${nextEpisode.season}e${nextEpisode.episode}`;
        const nextEpRef = doc(episodesRef, nextEpId);

        await setDoc(nextEpRef, {
            season: nextEpisode.season,
            episode: nextEpisode.episode,
            id: seriesId,
            title,
            posterUrl: fullPosterUrl,
            backdropUrl: fullBackdropUrl,
            mediaType: 'tv',
            timestamp: 0,
            duration: nextDuration,
            lastServer: server,
            viewed: false,

            // FULL TMDB DATA
            overview,
            genres,
            voteAverage,

            startedAt: serverTimestamp(),
            lastWatchedAt: serverTimestamp(),
        });

        console.log(`✅ Prefetched NEXT: S${nextEpisode.season}E${nextEpisode.episode} (${Math.floor(nextDuration / 60)}min)`);
    }

    // CLEANUP: Delete old episodes
    const allEpisodes = await getDocs(episodesRef);
    for (const episodeDoc of allEpisodes.docs) {
        const epData = episodeDoc.data() as EpisodeData;
        const isCurrent = episodeDoc.id === currentEpId;
        const isNext = nextEpisode && episodeDoc.id === `s${nextEpisode.season}e${nextEpisode.episode}`;

        if (!isCurrent && !isNext) {
            await deleteDoc(episodeDoc.ref);
            console.log(`🗑️ Deleted old: S${epData.season}E${epData.episode}`);
        }
    }
};

/**
 * Swap episodes when 90% reached
 */
export const swapToNextEpisode = async (
    userId: string,
    seriesId: number
): Promise<void> => {
    const seriesDocRef = doc(db, 'users', userId, 'nowWatching', `tv_${seriesId}`);
    const episodesRef = collection(seriesDocRef, 'episodes');

    const snapshot = await getDocs(episodesRef);

    const episodes = snapshot.docs.map(doc => ({
        id: doc.id,
        ref: doc.ref,
        data: doc.data() as EpisodeData
    }));

    const current = episodes.find(ep => ep.data.viewed === true);
    const next = episodes.find(ep => ep.data.viewed === false);

    if (current && next) {
        await setDoc(current.ref, {
            viewed: false,
            lastWatchedAt: serverTimestamp(),
        }, { merge: true });

        await setDoc(next.ref, {
            viewed: true,
            lastWatchedAt: serverTimestamp(),
        }, { merge: true });

        console.log(`✅ Swapped: S${current.data.season}E${current.data.episode} → S${next.data.season}E${next.data.episode}`);

        for (const ep of episodes) {
            if (ep.id !== current.id && ep.id !== next.id) {
                await deleteDoc(ep.ref);
                console.log(`🗑️ Deleted: S${ep.data.season}E${ep.data.episode}`);
            }
        }
    }
};
