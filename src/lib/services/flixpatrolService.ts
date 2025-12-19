import { RadarItem } from '@/types';
import { db } from '@/lib/firebase/client';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { getTMDbDetails } from '@/lib/tmdb';
import { filterStartedSeasons } from './seriesMetadataCache';

const API_BASE_URL = 'https://top-10-streamings.onrender.com';
const CACHE_DURATION = 60 * 60 * 1000; // 1 hour

// In-memory cache
const memoryCache: Map<string, { data: RadarItem[], expiresAt: number }> = new Map();

type StreamingService = 'netflix' | 'prime' | 'disney' | 'hbo' | 'apple';
type CacheType = `top10-${StreamingService}` | 'global-movies' | 'global-series' | 'calendar-movies' | 'calendar-tv' | 'calendar-overall';

// FlixPatrol Quick API response (format padrão - dados completos)
interface QuickItemFull {
    position: number;
    title: string;
    popularity: number;
    year: number;
    type: 'movie' | 'series' | 'overall';
    tmdb: {
        tmdb_id: number;
        type: 'movie' | 'tv';
        title: string;
        overview: string;
        poster_path: string;
        backdrop_path: string;
        vote_average: number;
        release_date: string;
        genres: string[];
    };
}

// Calendar API response types
interface CalendarMovie {
    title: string;
    date: string;
    imdb_id: string;
    type: 'movie';
    season_info: string; // e.g., "estréia"
    tmdb?: {
        tmdb_id: number;
        type: 'movie';
        title: string;
        overview: string;
        poster_path: string;
        backdrop_path: string;
        vote_average: number;
        release_date: string;
        genres: string[];
    };
}

interface CalendarTVShow {
    title: string;
    date: string;
    platform: string;
    country: string;
    genres: string[];
    type: 'tv';
    season_info: string; // e.g., "estréia", "T2", etc.
    tmdb?: {
        tmdb_id: number;
        type: 'tv';
        title: string;
        overview: string;
        poster_path: string;
        backdrop_path: string;
        vote_average: number;
        release_date: string;
        genres: string[];
    };
}

type CalendarItem = CalendarMovie | CalendarTVShow;


interface PublicCacheDoc {
    items: RadarItem[];
    lastUpdated: number;
    expiresAt: number;
    cacheType: CacheType;
}

/**
 * Gets provider ID for each streaming service
 */
function getProviderId(service: StreamingService): number {
    const providerMap: Record<StreamingService, number> = {
        netflix: 8,
        prime: 119,
        disney: 337,
        hbo: 1899,
        apple: 350,
    };
    return providerMap[service];
}

/**
 * Enriquece dados com TMDB - RÁPIDO (sem filtro de temporadas)
 * Retorna dados básicos imediatamente para exibir visual
 */
async function enrichWithTMDBQuick(quickItem: QuickItemFull, providerId?: number): Promise<RadarItem | null> {
    try {
        const tmdbId = quickItem.tmdb.tmdb_id;
        const mediaType = quickItem.tmdb.type === 'movie' ? 'movie' : 'tv';

        // Buscar dados COMPLETOS do TMDB
        const tmdbData = await getTMDbDetails(tmdbId, mediaType);

        // Criar RadarItem com TODOS os dados (para evitar request adicional no modal)
        const radarItem: RadarItem = {
            id: tmdbId,
            tmdbMediaType: mediaType,
            title: tmdbData.title || tmdbData.name || quickItem.title,
            releaseDate: tmdbData.release_date || tmdbData.first_air_date || '',
            type: mediaType,
            listType: 'top_rated_provider',

            // IMAGENS (poster card + backdrop 16:9)
            posterUrl: tmdbData.poster_path ? `https://image.tmdb.org/t/p/w500${tmdbData.poster_path}` : undefined,
            backdropUrl: tmdbData.backdrop_path ? `https://image.tmdb.org/t/p/original${tmdbData.backdrop_path}` : undefined,

            // DETALHES COMPLETOS
            overview: tmdbData.overview || undefined,
            voteAverage: tmdbData.vote_average || undefined,
            voteCount: tmdbData.vote_count || undefined,
            popularity: tmdbData.popularity || undefined,
            originalLanguage: tmdbData.original_language || undefined,
            originalTitle: tmdbData.original_title || tmdbData.original_name || undefined,
            adult: tmdbData.adult || undefined,

            // GÊNEROS
            genres: tmdbData.genres?.map((g: any) => g.name) || undefined,

            // DADOS ESPECÍFICOS
            runtime: mediaType === 'movie' ? tmdbData.runtime : undefined,
            numberOfSeasons: mediaType === 'tv' ? tmdbData.number_of_seasons : undefined,
            numberOfEpisodes: mediaType === 'tv' ? tmdbData.number_of_episodes : undefined,
        };

        // Adicionar providerId apenas se existir
        if (providerId) {
            radarItem.providerId = providerId;
        }

        // Adicionar nextEpisodeToAir se for série
        if (mediaType === 'tv' && tmdbData.next_episode_to_air) {
            radarItem.nextEpisodeToAir = {
                air_date: tmdbData.next_episode_to_air.air_date,
                episode_number: tmdbData.next_episode_to_air.episode_number,
                season_number: tmdbData.next_episode_to_air.season_number,
            };
        }

        // 🔥 OTIMIZAÇÃO: Filtro de temporadas em BACKGROUND
        if (mediaType === 'tv' && tmdbData.seasons) {
            filterStartedSeasons(tmdbId, tmdbData.seasons).then(startedSeasons => {
                radarItem.numberOfSeasons = startedSeasons.length;
                radarItem.numberOfEpisodes = startedSeasons.reduce((sum: number, s: any) => sum + (s.episode_count || 0), 0);
                console.log(`[FlixPatrol] ✅ Background: Filtered seasons for ${radarItem.title}`);
            }).catch(err => {
                console.error(`[FlixPatrol] ⚠️ Background filter failed for ${radarItem.title}:`, err);
            });
        }

        return radarItem;
    } catch (error) {
        console.error(`[FlixPatrol] Error enriching TMDB data for ${quickItem.title}:`, error);
        return null;
    }
}

/**
 * Remove campos undefined de um objeto (Firebase não aceita)
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
 * READ-ONLY: Gets from Firebase cache (NO API fetching)
 * Cache is updated by cron job at /api/cron/update
 */
async function getFromFirebaseCache(cacheType: CacheType): Promise<RadarItem[] | null> {
    try {
        // Check memory cache first
        const memCached = memoryCache.get(cacheType);
        if (memCached && Date.now() < memCached.expiresAt) {
            console.log(`[FlixPatrol] Memory cache hit: ${cacheType}`);
            return memCached.data;
        }

        // Read from Firebase
        const docRef = doc(db, 'public', cacheType);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
            const data = docSnap.data() as PublicCacheDoc;

            // Cache in memory
            memoryCache.set(cacheType, {
                data: data.items,
                expiresAt: data.expiresAt || Date.now() + CACHE_DURATION
            });

            console.log(`[FlixPatrol] Firebase cache hit: ${cacheType} (${data.items.length} items)`);

            // Warn if stale
            if (Date.now() > (data.expiresAt || 0)) {
                console.warn(`[FlixPatrol] ⚠️ Cache is stale for ${cacheType}. Cron should update it.`);
            }

            return data.items;
        }

        console.warn(`[FlixPatrol] ❌ No cache found for ${cacheType}`);
        return null;
    } catch (error) {
        console.error(`[FlixPatrol] Error reading cache:`, error);
        return null;
    }
}

/**
 * Gets Top 10 for a streaming service (READ-ONLY)
 */
export async function getTop10(service: StreamingService): Promise<RadarItem[]> {
    const cacheType: CacheType = `top10-${service}`;
    const cachedData = await getFromFirebaseCache(cacheType);

    if (cachedData && cachedData.length > 0) {
        return cachedData;
    }

    console.warn(`[FlixPatrol] No data for ${cacheType}. Cron job may not have run yet.`);
    return [];
}

/**
 * Gets global Top 10 (movies or series) (READ-ONLY)
 */
export async function getGlobalTop10(type: 'movies' | 'series'): Promise<RadarItem[]> {
    const cacheType: CacheType = `global-${type}`;
    const cachedData = await getFromFirebaseCache(cacheType);

    if (cachedData && cachedData.length > 0) {
        return cachedData;
    }

    console.warn(`[FlixPatrol] No data for ${cacheType}. Cron job may not have run yet.`);
    return [];
}

/**
 * Gets calendar data for display (READ-ONLY - for frontend)
 * Data is populated by cron job, this function only reads from Firebase cache
 */
export async function getCalendarData(type: 'movies' | 'tv' | 'overall'): Promise<RadarItem[]> {
    const cacheType: CacheType = `calendar-${type === 'movies' ? 'movies' : type === 'tv' ? 'tv' : 'overall'}`;
    const cachedData = await getFromFirebaseCache(cacheType);

    if (cachedData && cachedData.length > 0) {
        return cachedData;
    }

    console.warn(`[FlixPatrol] No calendar data for ${cacheType}. Cron job may not have run yet.`);
    return [];
}

/**
 * Clears local cache
 */
export async function clearLocalCache(cacheType?: CacheType): Promise<void> {
    if (cacheType) {
        memoryCache.delete(cacheType);
    } else {
        memoryCache.clear();
    }
}

/**
 * Gets calendar data for upcoming releases
 */
export async function getCalendar(type: 'movies' | 'tv-shows' | 'overall'): Promise<RadarItem[]> {
    const apiKey = process.env.NEXT_PUBLIC_FLIXPATROL_API_KEY;

    if (!apiKey) {
        console.error('[FlixPatrol] API Key not found');
        return [];
    }

    try {
        const url = `${API_BASE_URL}/api/quick/calendar/${type}`;
        console.log(`[FlixPatrol] Fetching calendar ${type} from ${url}`);

        const response = await fetch(url, {
            headers: { 'X-API-Key': apiKey },
        });

        if (!response.ok) {
            console.error(`[FlixPatrol] HTTP ${response.status}`);
            return [];
        }

        const items: CalendarItem[] = await response.json();
        console.log(`[FlixPatrol] Received ${items.length} calendar items for ${type}`);

        // Enriquecer com TMDB se não tiver dados
        const enrichedItems: RadarItem[] = [];

        for (const item of items) {
            if (item.tmdb) {
                // Já tem dados TMDB, converter para RadarItem
                const radarItem: RadarItem = {
                    id: item.tmdb.tmdb_id,
                    tmdbMediaType: item.tmdb.type,
                    title: item.tmdb.title,
                    releaseDate: item.date,
                    type: item.tmdb.type,
                    listType: 'upcoming',
                    season_info: item.season_info, // Include season info from API
                    posterUrl: item.tmdb.poster_path ? `https://image.tmdb.org/t/p/w500${item.tmdb.poster_path}` : undefined,
                    backdropUrl: item.tmdb.backdrop_path ? `https://image.tmdb.org/t/p/original${item.tmdb.backdrop_path}` : undefined,
                    overview: item.tmdb.overview,
                    voteAverage: item.tmdb.vote_average,
                    genres: item.tmdb.genres,
                };
                enrichedItems.push(removeUndefined(radarItem));
            }
            await new Promise(resolve => setTimeout(resolve, 50));
        }

        return enrichedItems;
    } catch (error) {
        console.error(`[FlixPatrol] Calendar error:`, error);
        return [];
    }
}

/**
 * Gets historical Top 10 for a specific date
 * @param service - Streaming service (netflix, disney, hbo, prime, apple, globoplay)
 * @param type - Type (movies, shows, overall)
 * @param date - Date in YYYY-MM-DD format
 */
export async function getHistoricalTop10(
    service: 'netflix' | 'disney' | 'hbo' | 'prime' | 'apple' | 'globoplay',
    type: 'movies' | 'shows' | 'overall',
    date: string
): Promise<RadarItem[]> {
    const apiKey = process.env.NEXT_PUBLIC_FLIXPATROL_API_KEY;

    if (!apiKey) {
        console.error('[FlixPatrol] API Key not found');
        return [];
    }

    try {
        const url = `${API_BASE_URL}/api/firebase/history/${service}/${type}/${date}`;
        console.log(`[FlixPatrol] Fetching historical ${service} ${type} for ${date}`);

        const response = await fetch(url, {
            headers: { 'X-API-Key': apiKey },
        });

        if (!response.ok) {
            console.error(`[FlixPatrol] HTTP ${response.status}`);
            return [];
        }

        const data: { [key: string]: QuickItemFull[] } = await response.json();
        const items = data[type] || [];

        console.log(`[FlixPatrol] Received ${items.length} historical items`);

        // Enriquecer com TMDB
        const providerId = service === 'globoplay' ? undefined : getProviderId(service as StreamingService);
        const enrichedItems: RadarItem[] = [];

        for (const item of items) {
            const enriched = await enrichWithTMDBQuick(item, providerId);
            if (enriched) {
                enrichedItems.push(enriched);
            }
            await new Promise(resolve => setTimeout(resolve, 100));
        }

        return enrichedItems;
    } catch (error) {
        console.error(`[FlixPatrol] Historical data error:`, error);
        return [];
    }
}
