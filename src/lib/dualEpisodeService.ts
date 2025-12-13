// Service to save episodes as SUBCOLLECTION with episode cleanup
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
 * Save current episode (viewed:true) and prefetch next (viewed:false)
 * Structure: 
 *   tv_1405/ (minimal metadata)
 *   tv_1405/episodes/s1e2 (current episode with ALL data)
 *   tv_1405/episodes/s1e3 (next episode prefetch)
 */
export const saveDualEpisodes = async (
    userId: string,
    seriesId: number,
    title: string,
    posterUrl: string | undefined,
    backdropUrl: string | undefined, // 16:9 image
    currentEpisode: EpisodeInfo,
    nextEpisode: EpisodeInfo | null,
    server: 'videasy' | 'vidking',
    timestamp: number = 0,
    currentDuration: number = 0
): Promise<void> => {
    // Series document reference - ONLY METADATA
    const seriesDocRef = doc(db, 'users', userId, 'nowWatching', `tv_${seriesId}`);

    // Save MINIMAL series metadata (NO episode-specific data!)
    await setDoc(seriesDocRef, {
        id: seriesId,
        mediaType: 'tv',
        title,
        posterUrl: posterUrl || null,
        backdropUrl: backdropUrl || null, // Save backdrop
    }, { merge: true });

    // Episodes subcollection
    const episodesRef = collection(seriesDocRef, 'episodes');

    // Save CURRENT episode with ALL DATA in subcollection
    const currentEpId = `s${currentEpisode.season}e${currentEpisode.episode}`;
    const currentEpRef = doc(episodesRef, currentEpId);

    await setDoc(currentEpRef, {
        // Episode identification
        season: currentEpisode.season,
        episode: currentEpisode.episode,
        id: seriesId,

        // Series metadata (repeated for easy access)
        title,
        posterUrl: posterUrl || null,
        backdropUrl: backdropUrl || null, // Save backdrop
        mediaType: 'tv',

        // Playback data
        timestamp,
        duration: currentDuration,
        lastServer: server,

        // Status
        viewed: true, // This shows in Continue Watching

        // Timestamps
        startedAt: serverTimestamp(),
        lastWatchedAt: serverTimestamp(),
    });

    console.log(`✅ Saved current: S${currentEpisode.season}E${currentEpisode.episode} (${Math.floor(timestamp)}s / ${Math.floor(currentDuration)}s)`);

    // Prefetch NEXT episode with TMDb duration
    if (nextEpisode) {
        const nextDuration = await fetchEpisodeDuration(seriesId, nextEpisode.season, nextEpisode.episode);

        const nextEpId = `s${nextEpisode.season}e${nextEpisode.episode}`;
        const nextEpRef = doc(episodesRef, nextEpId);

        await setDoc(nextEpRef, {
            season: nextEpisode.season,
            episode: nextEpisode.episode,
            id: seriesId,
            title,
            posterUrl: posterUrl || null,
            backdropUrl: backdropUrl || null, // Save backdrop
            mediaType: 'tv',
            timestamp: 0,
            duration: nextDuration, // Real duration from TMDb!
            lastServer: server,
            viewed: false, // Hidden until 90%
            startedAt: serverTimestamp(),
            lastWatchedAt: serverTimestamp(),
        });

        console.log(`✅ Prefetched S${nextEpisode.season}E${nextEpisode.episode} (${Math.floor(nextDuration / 60)}min)`);
    }

    // CLEANUP: Delete old episodes (keep only current and next)
    const allEpisodes = await getDocs(episodesRef);
    for (const episodeDoc of allEpisodes.docs) {
        const epData = episodeDoc.data() as EpisodeData;
        const isCurrent = episodeDoc.id === currentEpId;
        const isNext = nextEpisode && episodeDoc.id === `s${nextEpisode.season}e${nextEpisode.episode}`;

        if (!isCurrent && !isNext) {
            await deleteDoc(episodeDoc.ref);
            console.log(`🗑️ Deleted old episode: S${epData.season}E${epData.episode}`);
        }
    }
};

/**
 * Swap episodes when 90% reached: mark current as viewed:false, next as viewed:true
 * Also delete very old episodes
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

    // Find current (viewed:true) and next (viewed:false)
    const current = episodes.find(ep => ep.data.viewed === true);
    const next = episodes.find(ep => ep.data.viewed === false);

    if (current && next) {
        // Mark current as viewed:false
        await setDoc(current.ref, {
            viewed: false,
            lastWatchedAt: serverTimestamp(),
        }, { merge: true });

        // Mark next as viewed:true
        await setDoc(next.ref, {
            viewed: true,
            lastWatchedAt: serverTimestamp(),
        }, { merge: true });

        console.log(`✅ Swapped: S${current.data.season}E${current.data.episode} → S${next.data.season}E${next.data.episode}`);

        // Delete episodes that are neither current nor next anymore
        for (const ep of episodes) {
            if (ep.id !== current.id && ep.id !== next.id) {
                await deleteDoc(ep.ref);
                console.log(`🗑️ Deleted: S${ep.data.season}E${ep.data.episode}`);
            }
        }
    }
};
