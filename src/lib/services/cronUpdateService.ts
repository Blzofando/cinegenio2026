import { adminDb as db } from '@/lib/firebase/admin';
import { getTMDbDetails } from '@/lib/tmdb';
import { RadarItem } from '@/types';
import { filterStartedSeasons } from './seriesMetadataCache';

const API_BASE_URL = 'https://top-10-streamings.onrender.com';
const CACHE_VALIDITY = {
    TOP_10: 30 * 60 * 1000, // 30 minutos
    TMDB_CAROUSELS: 60 * 60 * 1000, // 1 hora
    CALENDAR: 6 * 60 * 60 * 1000, // 6 hours
};

export type StreamingService = 'netflix' | 'prime' | 'disney' | 'hbo' | 'apple';

interface QuickItemID {
    position: number;
    title: string;
    type: 'movie' | 'tv';
    tmdb_id: number;
}

interface QuickOverallResponse {
    netflix: QuickItemID[];
    prime: QuickItemID[];
    disney: QuickItemID[];
    hbo: QuickItemID[];
    apple: QuickItemID[];
    global: {
        movies: QuickItemID[];
        series: QuickItemID[];
    };
}

/**
 * Get cache staleness for prioritization
 */
export async function getCacheStaleness() {
    const now = Date.now();
    const staleness: { type: string; age: number; priority: number }[] = [];

    const services: StreamingService[] = ['netflix', 'prime', 'disney', 'hbo', 'apple'];

    // Check Top 10 caches
    for (const service of services) {
        const docRef = db.collection('public').doc(`top10-${service}`);
        const doc = await docRef.get();

        if (doc.exists) {
            const data = doc.data();
            const age = now - (data?.lastUpdated || 0);
            staleness.push({
                type: `top10-${service}`,
                age,
                priority: age > CACHE_VALIDITY.TOP_10 ? 1 : 0,
            });
        } else {
            staleness.push({ type: `top10-${service}`, age: Infinity, priority: 1 });
        }
    }

    // Check global caches
    const globalTypes = ['global-movies', 'global-series'];
    for (const type of globalTypes) {
        const docRef = db.collection('public').doc(type);
        const doc = await docRef.get();

        if (doc.exists) {
            const data = doc.data();
            const age = now - (data?.lastUpdated || 0);
            staleness.push({
                type,
                age,
                priority: age > CACHE_VALIDITY.TOP_10 ? 1 : 0,
            });
        } else {
            staleness.push({ type, age: Infinity, priority: 1 });
        }
    }

    // Check TMDB carousel caches
    const carouselTypes = ['now-playing', 'popular-movies', 'on-the-air', 'popular-tv', 'trending'];
    for (const type of carouselTypes) {
        const docRef = db.collection('public').doc(type);
        const doc = await docRef.get();

        if (doc.exists) {
            const data = doc.data();
            const age = now - (data?.lastUpdated || 0);
            staleness.push({
                type,
                age,
                priority: age > CACHE_VALIDITY.TMDB_CAROUSELS ? 2 : 0,
            });
        } else {
            staleness.push({ type, age: Infinity, priority: 2 });
        }
    }

    // Check calendar caches
    const calendarTypes = ['calendar-movies', 'calendar-tv', 'calendar-overall'];
    for (const type of calendarTypes) {
        const docRef = db.collection('public').doc(type);
        const doc = await docRef.get();

        if (doc.exists) {
            const data = doc.data();
            const age = now - (data?.lastUpdated || 0);
            staleness.push({
                type,
                age,
                priority: age > CACHE_VALIDITY.CALENDAR ? 3 : 0, // Lower priority than Top10 but check them
            });
        } else {
            staleness.push({ type, age: Infinity, priority: 3 });
        }
    }

    // Sort by priority (highest first), then by age (oldest first)
    return staleness.sort((a, b) => {
        if (b.priority !== a.priority) return b.priority - a.priority;
        return b.age - a.age;
    });
}

/**
 * Check if any cache type needs update based on priority
 */
export function needsUpdate(staleness: { type: string; age: number; priority: number }[], types: string[]): boolean {
    return staleness.some((s) => {
        // Verifica se é um dos tipos procurados E se tem prioridade (está vencido)
        const matchesType = types.some(type => s.type.startsWith(type));
        return matchesType && s.priority > 0;
    });
}

/**
 * Enrich with TMDB data quickly (background season filter)
 */
async function enrichWithTMDB(tmdbId: number, mediaType: 'movie' | 'tv', providerId?: number): Promise<RadarItem | null> {
    try {
        const tmdbData = await getTMDbDetails(tmdbId, mediaType);

        const radarItem: RadarItem = {
            id: tmdbId,
            tmdbMediaType: mediaType,
            title: tmdbData.title || tmdbData.name || '',
            releaseDate: tmdbData.release_date || tmdbData.first_air_date || '',
            type: mediaType,
            listType: 'top_rated_provider',
            posterUrl: tmdbData.poster_path ? `https://image.tmdb.org/t/p/w500${tmdbData.poster_path}` : undefined,
            backdropUrl: tmdbData.backdrop_path ? `https://image.tmdb.org/t/p/original${tmdbData.backdrop_path}` : undefined,
            overview: tmdbData.overview || undefined,
            voteAverage: tmdbData.vote_average || undefined,
            voteCount: tmdbData.vote_count || undefined,
            popularity: tmdbData.popularity || undefined,
            originalLanguage: tmdbData.original_language || undefined,
            originalTitle: tmdbData.original_title || tmdbData.original_name || undefined,
            adult: tmdbData.adult || undefined,
            genres: tmdbData.genres?.map((g: any) => g.name) || undefined,
            runtime: mediaType === 'movie' ? tmdbData.runtime : undefined,
            numberOfSeasons: mediaType === 'tv' ? tmdbData.number_of_seasons : undefined,
            numberOfEpisodes: mediaType === 'tv' ? tmdbData.number_of_episodes : undefined,
        };

        if (providerId) {
            radarItem.providerId = providerId;
        }

        if (mediaType === 'tv' && tmdbData.next_episode_to_air) {
            radarItem.nextEpisodeToAir = {
                air_date: tmdbData.next_episode_to_air.air_date,
                episode_number: tmdbData.next_episode_to_air.episode_number,
                season_number: tmdbData.next_episode_to_air.season_number,
            };
        }

        // Filter seasons for TV shows
        if (mediaType === 'tv' && tmdbData.seasons) {
            const startedSeasons = await filterStartedSeasons(tmdbId, tmdbData.seasons);
            radarItem.numberOfSeasons = startedSeasons.length;
            radarItem.numberOfEpisodes = startedSeasons.reduce((sum: number, s: any) => sum + (s.episode_count || 0), 0);
        }

        return radarItem;
    } catch (error) {
        console.error(`[Cron] Error enriching TMDB ${tmdbId}:`, error);
        return null;
    }
}

/**
 * Remove undefined fields for Firestore
 */
function removeUndefined<T extends Record<string, any>>(obj: T): T {
    const cleaned = { ...obj };
    Object.keys(cleaned).forEach(key => {
        if (cleaned[key] === undefined) {
            delete cleaned[key];
        }
    });
    return cleaned;
}

/**
 * Update Top 10 cache for all services
 */
export async function updateTop10Cache(): Promise<string[]> {
    // Server-side: try without NEXT_PUBLIC_ prefix first
    const apiKey = process.env.FLIXPATROL_API_KEY || process.env.NEXT_PUBLIC_FLIXPATROL_API_KEY;
    if (!apiKey) {
        throw new Error('FlixPatrol API key not found');
    }

    const updates: string[] = [];

    try {
        // Fetch all data with format=id (lightweight)
        const response = await fetch(`${API_BASE_URL}/api/quick/overall?format=id`, {
            headers: { 'X-API-Key': apiKey },
        });

        if (!response.ok) {
            throw new Error(`FlixPatrol API error: ${response.status}`);
        }

        const data: QuickOverallResponse = await response.json();

        const providerMap: Record<StreamingService, number> = {
            netflix: 8,
            prime: 119,
            disney: 337,
            hbo: 1899,
            apple: 350,
        };

        // Update each service
        for (const service of Object.keys(data) as (keyof QuickOverallResponse)[]) {
            if (service === 'global') continue;

            const items = data[service] as QuickItemID[];
            console.log(`[Cron] Processing ${items.length} items for ${service}`);

            const enrichedItems: RadarItem[] = [];

            for (const item of items.slice(0, 10)) {
                // Usar o type da resposta da API (movie ou tv)
                const mediaType = item.type === 'movie' ? 'movie' : 'tv';
                const enriched = await enrichWithTMDB(item.tmdb_id, mediaType, providerMap[service]);

                if (enriched) {
                    enrichedItems.push(enriched);
                }

                await new Promise(resolve => setTimeout(resolve, 100));
            }

            // Save to Firebase
            const cleanedItems = enrichedItems.map(item => removeUndefined(item));
            const docRef = db.collection('public').doc(`top10-${service}`);
            await docRef.set({
                items: cleanedItems,
                lastUpdated: Date.now(),
                expiresAt: Date.now() + CACHE_VALIDITY.TOP_10,
                cacheType: `top10-${service}`,
            });

            updates.push(`top10-${service} (${enrichedItems.length} items)`);
            console.log(`[Cron] ✅ Updated top10-${service}`);
        }

        // Update global movies and series
        if (data.global) {
            const { movies, series } = data.global;

            // Movies
            if (movies?.length) {
                const enrichedMovies: RadarItem[] = [];
                for (const item of movies.slice(0, 10)) {
                    const enriched = await enrichWithTMDB(item.tmdb_id, 'movie');
                    if (enriched) enrichedMovies.push(enriched);
                    await new Promise(resolve => setTimeout(resolve, 100));
                }

                const cleanedMovies = enrichedMovies.map(item => removeUndefined(item));
                await db.collection('public').doc('global-movies').set({
                    items: cleanedMovies,
                    lastUpdated: Date.now(),
                    expiresAt: Date.now() + CACHE_VALIDITY.TOP_10,
                    cacheType: 'global-movies',
                });

                updates.push(`global-movies (${enrichedMovies.length} items)`);
                console.log(`[Cron] ✅ Updated global-movies`);
            }

            // Series
            if (series?.length) {
                const enrichedSeries: RadarItem[] = [];
                for (const item of series.slice(0, 10)) {
                    const enriched = await enrichWithTMDB(item.tmdb_id, 'tv');
                    if (enriched) enrichedSeries.push(enriched);
                    await new Promise(resolve => setTimeout(resolve, 100));
                }

                const cleanedSeries = enrichedSeries.map(item => removeUndefined(item));
                await db.collection('public').doc('global-series').set({
                    items: cleanedSeries,
                    lastUpdated: Date.now(),
                    expiresAt: Date.now() + CACHE_VALIDITY.TOP_10,
                    cacheType: 'global-series',
                });

                updates.push(`global-series (${enrichedSeries.length} items)`);
                console.log(`[Cron] ✅ Updated global-series`);
            }
        }

        return updates;
    } catch (error) {
        console.error('[Cron] Error updating Top 10:', error);
        throw error;
    }
}

/**
 * Detect media type (movie vs tv) by trying both
 */
async function detectMediaType(tmdbId: number): Promise<'movie' | 'tv'> {
    const apiKey = process.env.TMDB_API_KEY || process.env.NEXT_PUBLIC_TMDB_API_KEY;

    try {
        // Try movie first
        const movieRes = await fetch(
            `https://api.themoviedb.org/3/movie/${tmdbId}?api_key=${apiKey}`
        );
        if (movieRes.ok) return 'movie';

        // Otherwise it's tv
        return 'tv';
    } catch {
        return 'movie'; // Default fallback
    }
}


/**
 * Update TMDB carousels (upcoming, now-playing, popular)
 */
export async function updateTMDBCarousels(): Promise<string[]> {
    // Server-side: try without NEXT_PUBLIC_ prefix first
    const apiKey = process.env.TMDB_API_KEY || process.env.NEXT_PUBLIC_TMDB_API_KEY;
    if (!apiKey) {
        throw new Error('TMDB API key not found');
    }

    const updates: string[] = [];

    try {
        // Now playing movies
        const nowPlayingRes = await fetch(
            `https://api.themoviedb.org/3/movie/now_playing?api_key=${apiKey}&language=pt-BR&region=BR&page=1`
        );
        const nowPlayingData = await nowPlayingRes.json();
        const nowPlayingItems = nowPlayingData.results.slice(0, 20).map((item: any) => ({
            id: item.id,
            tmdbMediaType: 'movie' as const,
            title: item.title,
            releaseDate: item.release_date,
            type: 'movie' as const,
            listType: 'now_playing',
            posterUrl: item.poster_path ? `https://image.tmdb.org/t/p/w500${item.poster_path}` : undefined,
            backdropUrl: item.backdrop_path ? `https://image.tmdb.org/t/p/original${item.backdrop_path}` : undefined,
            overview: item.overview,
            voteAverage: item.vote_average,
        })).map(removeUndefined);

        await db.collection('public').doc('now-playing').set({
            items: nowPlayingItems,
            lastUpdated: Date.now(),
            expiresAt: Date.now() + CACHE_VALIDITY.TMDB_CAROUSELS,
        });
        updates.push(`now-playing (${nowPlayingItems.length} items)`);

        // Popular movies
        const popularRes = await fetch(
            `https://api.themoviedb.org/3/movie/popular?api_key=${apiKey}&language=pt-BR&region=BR&page=1`
        );
        const popularData = await popularRes.json();
        const popularItems = popularData.results.slice(0, 20).map((item: any) => ({
            id: item.id,
            tmdbMediaType: 'movie' as const,
            title: item.title,
            releaseDate: item.release_date,
            type: 'movie' as const,
            listType: 'popular',
            posterUrl: item.poster_path ? `https://image.tmdb.org/t/p/w500${item.poster_path}` : undefined,
            backdropUrl: item.backdrop_path ? `https://image.tmdb.org/t/p/original${item.backdrop_path}` : undefined,
            overview: item.overview,
            voteAverage: item.vote_average,
        })).map(removeUndefined);

        await db.collection('public').doc('popular-movies').set({
            items: popularItems,
            lastUpdated: Date.now(),
            expiresAt: Date.now() + CACHE_VALIDITY.TMDB_CAROUSELS,
        });
        updates.push(`popular-movies (${popularItems.length} items)`);

        // On the air TV shows
        const onTheAirRes = await fetch(
            `https://api.themoviedb.org/3/tv/on_the_air?api_key=${apiKey}&language=pt-BR&page=1`
        );
        const onTheAirData = await onTheAirRes.json();
        const onTheAirItems = onTheAirData.results.slice(0, 20).map((item: any) => ({
            id: item.id,
            tmdbMediaType: 'tv' as const,
            title: item.name,
            releaseDate: item.first_air_date,
            type: 'tv' as const,
            listType: 'on_the_air',
            posterUrl: item.poster_path ? `https://image.tmdb.org/t/p/w500${item.poster_path}` : undefined,
            backdropUrl: item.backdrop_path ? `https://image.tmdb.org/t/p/original${item.backdrop_path}` : undefined,
            overview: item.overview,
            voteAverage: item.vote_average,
        })).map(removeUndefined);

        await db.collection('public').doc('on-the-air').set({
            items: onTheAirItems,
            lastUpdated: Date.now(),
            expiresAt: Date.now() + CACHE_VALIDITY.TMDB_CAROUSELS,
        });
        updates.push(`on-the-air (${onTheAirItems.length} items)`);

        // Popular TV shows
        const popularTVRes = await fetch(
            `https://api.themoviedb.org/3/tv/popular?api_key=${apiKey}&language=pt-BR&page=1`
        );
        const popularTVData = await popularTVRes.json();
        const popularTVItems = popularTVData.results.slice(0, 20).map((item: any) => ({
            id: item.id,
            tmdbMediaType: 'tv' as const,
            title: item.name,
            releaseDate: item.first_air_date,
            type: 'tv' as const,
            listType: 'popular',
            posterUrl: item.poster_path ? `https://image.tmdb.org/t/p/w500${item.poster_path}` : undefined,
            backdropUrl: item.backdrop_path ? `https://image.tmdb.org/t/p/original${item.backdrop_path}` : undefined,
            overview: item.overview,
            voteAverage: item.vote_average,
        })).map(removeUndefined);

        await db.collection('public').doc('popular-tv').set({
            items: popularTVItems,
            lastUpdated: Date.now(),
            expiresAt: Date.now() + CACHE_VALIDITY.TMDB_CAROUSELS,
        });
        updates.push(`popular-tv (${popularTVItems.length} items)`);

        // Trending (movies + series)
        const trendingRes = await fetch(
            `https://api.themoviedb.org/3/trending/all/week?api_key=${apiKey}&language=pt-BR`
        );
        const trendingData = await trendingRes.json();
        const trendingItems = trendingData.results.slice(0, 20).map((item: any) => {
            const mediaType = item.media_type === 'movie' ? 'movie' : 'tv';
            return {
                id: item.id,
                tmdbMediaType: mediaType as 'movie' | 'tv',
                title: item.title || item.name,
                releaseDate: item.release_date || item.first_air_date,
                type: mediaType as 'movie' | 'tv',
                listType: 'trending',
                posterUrl: item.poster_path ? `https://image.tmdb.org/t/p/w500${item.poster_path}` : undefined,
                backdropUrl: item.backdrop_path ? `https://image.tmdb.org/t/p/original${item.backdrop_path}` : undefined,
                overview: item.overview,
                voteAverage: item.vote_average,
            };
        }).map(removeUndefined);

        await db.collection('public').doc('trending').set({
            items: trendingItems,
            lastUpdated: Date.now(),
            expiresAt: Date.now() + CACHE_VALIDITY.TMDB_CAROUSELS,
        });
        updates.push(`trending (${trendingItems.length} items)`);

        console.log('[Cron] ✅ Updated TMDB carousels');
        return updates;
    } catch (error) {
        console.error('[Cron] Error updating TMDB carousels:', error);
        throw error;
    }
}

/**
 * Update a single streaming service
 */
export async function updateSingleService(service: StreamingService): Promise<string[]> {
    const apiKey = process.env.FLIXPATROL_API_KEY || process.env.NEXT_PUBLIC_FLIXPATROL_API_KEY;
    if (!apiKey) {
        throw new Error('FlixPatrol API key not found');
    }

    const updates: string[] = [];

    try {
        // Fetch all data
        const response = await fetch(`${API_BASE_URL}/api/quick/overall?format=id`, {
            headers: { 'X-API-Key': apiKey },
        });

        if (!response.ok) {
            throw new Error(`FlixPatrol API error: ${response.status}`);
        }

        const data: QuickOverallResponse = await response.json();

        const providerMap: Record<StreamingService, number> = {
            netflix: 8,
            prime: 119,
            disney: 337,
            hbo: 1899,
            apple: 350,
        };

        const items = data[service] as QuickItemID[];
        console.log(`[Cron] Processing ${items.length} items for ${service}`);

        const enrichedItems: RadarItem[] = [];

        for (const item of items.slice(0, 10)) {
            // Usar tipo direto da API (já vem correto)
            const mediaType = item.type === 'movie' ? 'movie' : 'tv';
            console.log(`[Cron] Item "${item.title}" (${item.tmdb_id}) - type: "${item.type}" -> "${mediaType}"`);
            const enriched = await enrichWithTMDB(item.tmdb_id, mediaType, providerMap[service]);

            if (enriched) {
                enrichedItems.push(enriched);
            }

            await new Promise(resolve => setTimeout(resolve, 100));
        }

        // Save to Firebase
        const cleanedItems = enrichedItems.map(item => removeUndefined(item));
        const docRef = db.collection('public').doc(`top10-${service}`);
        await docRef.set({
            items: cleanedItems,
            lastUpdated: Date.now(),
            expiresAt: Date.now() + CACHE_VALIDITY.TOP_10,
            cacheType: `top10-${service}`,
        });

        updates.push(`top10-${service} (${enrichedItems.length} items)`);
        console.log(`[Cron] ✅ Updated top10-${service}`);

        return updates;
    } catch (error) {
        console.error(`[Cron] Error updating ${service}:`, error);
        throw error;
    }
}

/**
 * Update global movies and series cache
 */
export async function updateGlobalCache(): Promise<string[]> {
    const apiKey = process.env.FLIXPATROL_API_KEY || process.env.NEXT_PUBLIC_FLIXPATROL_API_KEY;
    if (!apiKey) {
        throw new Error('FlixPatrol API key not found');
    }

    const updates: string[] = [];

    try {
        // Fetch all data
        const response = await fetch(`${API_BASE_URL}/api/quick/overall?format=id`, {
            headers: { 'X-API-Key': apiKey },
        });

        if (!response.ok) {
            throw new Error(`FlixPatrol API error: ${response.status}`);
        }

        const data: QuickOverallResponse = await response.json();

        if (data.global) {
            const { movies, series } = data.global;

            // Movies
            if (movies?.length) {
                const enrichedMovies: RadarItem[] = [];
                for (const item of movies.slice(0, 10)) {
                    const enriched = await enrichWithTMDB(item.tmdb_id, 'movie');
                    if (enriched) enrichedMovies.push(enriched);
                    await new Promise(resolve => setTimeout(resolve, 100));
                }

                const cleanedMovies = enrichedMovies.map(item => removeUndefined(item));
                await db.collection('public').doc('global-movies').set({
                    items: cleanedMovies,
                    lastUpdated: Date.now(),
                    expiresAt: Date.now() + CACHE_VALIDITY.TOP_10,
                    cacheType: 'global-movies',
                });

                updates.push(`global-movies (${enrichedMovies.length} items)`);
                console.log(`[Cron] ✅ Updated global-movies`);
            }

            // Series
            if (series?.length) {
                const enrichedSeries: RadarItem[] = [];
                for (const item of series.slice(0, 10)) {
                    const enriched = await enrichWithTMDB(item.tmdb_id, 'tv');
                    if (enriched) enrichedSeries.push(enriched);
                    await new Promise(resolve => setTimeout(resolve, 100));
                }

                const cleanedSeries = enrichedSeries.map(item => removeUndefined(item));
                await db.collection('public').doc('global-series').set({
                    items: cleanedSeries,
                    lastUpdated: Date.now(),
                    expiresAt: Date.now() + CACHE_VALIDITY.TOP_10,
                    cacheType: 'global-series',
                });

                updates.push(`global-series (${enrichedSeries.length} items)`);
                console.log(`[Cron] ✅ Updated global-series`);
            }
        }

        return updates;
    } catch (error) {
        console.error('[Cron] Error updating global:', error);
        throw error;
    }
}

/**
 * Update calendar cache for movies, tv, and overall
 */
export async function updateCalendarCache(): Promise<string[]> {
    const apiKey = process.env.FLIXPATROL_API_KEY || process.env.NEXT_PUBLIC_FLIXPATROL_API_KEY;
    if (!apiKey) {
        throw new Error('FlixPatrol API key not found');
    }

    const updates: string[] = [];

    try {
        // Fetch only from overall endpoint (has standardized format)
        console.log(`[Cron] Fetching calendar overall...`);

        const response = await fetch(`${API_BASE_URL}/api/quick/calendar/overall`, {
            headers: { 'X-API-Key': apiKey },
        });

        if (!response.ok) {
            console.error(`[Cron] Calendar API error: ${response.status}`);
            throw new Error(`Calendar API returned ${response.status}`);
        }

        const data = await response.json();

        // Extract releases array
        const releases: any[] = data.releases || [];
        console.log(`[Cron] Received ${releases.length} total calendar items`);

        // Convert to RadarItem format
        const radarItems: RadarItem[] = [];
        let skippedCount = 0;

        for (const item of releases) {
            if (item.tmdb_id && item.type) {
                const radarItem: RadarItem = {
                    id: item.tmdb_id,
                    tmdbMediaType: item.type === 'movie' ? 'movie' : 'tv',
                    title: item.title,
                    releaseDate: item.releaseDate,
                    type: item.type === 'movie' ? 'movie' : 'tv',
                    listType: 'upcoming',
                    season_info: item.season_info,
                    posterUrl: item.poster_path ? `https://image.tmdb.org/t/p/w500${item.poster_path}` : undefined,
                    backdropUrl: item.backdrop_path ? `https://image.tmdb.org/t/p/original${item.backdrop_path}` : undefined,
                    overview: item.overview,
                    voteAverage: item.vote_average,
                    genres: item.genres,
                };
                radarItems.push(removeUndefined(radarItem));
            } else {
                skippedCount++;
                if (skippedCount <= 2) {
                    console.log(`[Cron] Skipping item without tmdb_id:`, JSON.stringify(item).substring(0, 150));
                }
            }
        }

        if (skippedCount > 0) {
            console.log(`[Cron] ⚠️ Skipped ${skippedCount}/${releases.length} items without tmdb_id`);
        }

        console.log(`[Cron] Successfully converted ${radarItems.length} calendar items`);

        // Filter and save to each cache type
        const movieItems = radarItems.filter(item => item.type === 'movie');
        const tvItems = radarItems.filter(item => item.type === 'tv');

        // Save calendar-movies
        await db.collection('public').doc('calendar-movies').set({
            items: movieItems,
            lastUpdated: Date.now(),
            expiresAt: Date.now() + CACHE_VALIDITY.CALENDAR,
            cacheType: 'calendar-movies',
        });
        updates.push(`calendar-movies (${movieItems.length} items)`);
        console.log(`[Cron] ✅ Updated calendar-movies`);

        // Save calendar-tv
        await db.collection('public').doc('calendar-tv').set({
            items: tvItems,
            lastUpdated: Date.now(),
            expiresAt: Date.now() + CACHE_VALIDITY.CALENDAR,
            cacheType: 'calendar-tv',
        });
        updates.push(`calendar-tv (${tvItems.length} items)`);
        console.log(`[Cron] ✅ Updated calendar-tv`);

        // Save calendar-overall (all items)
        await db.collection('public').doc('calendar-overall').set({
            items: radarItems,
            lastUpdated: Date.now(),
            expiresAt: Date.now() + CACHE_VALIDITY.CALENDAR,
            cacheType: 'calendar-overall',
        });
        updates.push(`calendar-overall (${radarItems.length} items)`);
        console.log(`[Cron] ✅ Updated calendar-overall`);

        return updates;
    } catch (error) {
        console.error('[Cron] Error updating calendar cache:', error);
        throw error;
    }
}

