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
type CacheType = `top10-${StreamingService}` | 'global-movies' | 'global-series';

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
 * Enriquece dados com TMDB completo
 */
async function enrichWithTMDB(quickItem: QuickItemFull, providerId?: number): Promise<RadarItem | null> {
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

        // Filtrar temporadas iniciadas para séries
        if (mediaType === 'tv' && tmdbData.seasons) {
            const startedSeasons = await filterStartedSeasons(tmdbId, tmdbData.seasons);
            radarItem.numberOfSeasons = startedSeasons.length;
            radarItem.numberOfEpisodes = startedSeasons.reduce((sum: number, s: any) => sum + (s.episode_count || 0), 0);
        }

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
 * Checks Firebase cache (stale-while-revalidate)
 */
async function getFromFirebaseCache(
    cacheType: CacheType,
    revalidateFn?: () => Promise<void>
): Promise<RadarItem[] | null> {
    try {
        const memCached = memoryCache.get(cacheType);
        if (memCached && Date.now() < memCached.expiresAt) {
            console.log(`[Public Cache] Memory hit: ${cacheType}`);
            return memCached.data;
        }

        const docRef = doc(db, 'public', cacheType);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
            const data = docSnap.data() as PublicCacheDoc;

            if (Date.now() < data.expiresAt) {
                console.log(`[Public Cache] Firebase hit (valid): ${cacheType}`);
                memoryCache.set(cacheType, { data: data.items, expiresAt: data.expiresAt });
                return data.items;
            } else {
                console.log(`[Public Cache] Stale data - serving + revalidating`);
                if (revalidateFn) {
                    revalidateFn().catch(err => console.error(`[Public Cache] Revalidation failed:`, err));
                }
                return data.items;
            }
        }

        return null;
    } catch (error) {
        console.error(`[Public Cache] Error reading cache:`, error);
        return null;
    }
}

/**
 * Saves data to Firebase cache (remove undefined fields)
 */
async function saveToFirebaseCache(cacheType: CacheType, items: RadarItem[]): Promise<void> {
    try {
        const now = Date.now();
        const expiresAt = now + CACHE_DURATION;

        // Remover campos undefined de cada item
        const cleanedItems = items.map(item => removeUndefined(item));

        const cacheDoc = removeUndefined({
            items: cleanedItems,
            lastUpdated: now,
            expiresAt,
            cacheType,
        });

        const docRef = doc(db, 'public', cacheType);
        await setDoc(docRef, cacheDoc);

        memoryCache.set(cacheType, { data: items, expiresAt });

        console.log(`[Public Cache] Saved ${items.length} items to ${cacheType}`);
    } catch (error) {
        console.error(`[Public Cache] Error saving cache:`, error);
    }
}

/**
 * Fetches from FlixPatrol /api/quick with TMDB enrichment
 */
async function fetchFromFlixPatrolAPI(service: StreamingService): Promise<RadarItem[]> {
    const apiKey = process.env.NEXT_PUBLIC_FLIXPATROL_API_KEY;

    if (!apiKey) {
        console.error('[FlixPatrol] API Key not found');
        return [];
    }

    try {
        const url = `${API_BASE_URL}/api/quick/${service}`;
        console.log(`[FlixPatrol] Fetching ${service}`);

        const response = await fetch(url, {
            headers: { 'X-API-Key': apiKey },
        });

        if (!response.ok) {
            console.error(`[FlixPatrol] HTTP ${response.status}`);
            return [];
        }

        const data: { overall?: QuickItemFull[] } = await response.json();
        const items = data.overall || [];

        console.log(`[FlixPatrol] Received ${items.length} items for ${service}`);

        // Enriquecer com TMDB completo (um por vez para evitar rate limit)
        const providerId = getProviderId(service);
        const enrichedItems: RadarItem[] = [];

        for (const item of items) {
            const enriched = await enrichWithTMDB(item, providerId);
            if (enriched) {
                enrichedItems.push(enriched);
            }
            // Pequeno delay
            await new Promise(resolve => setTimeout(resolve, 100));
        }

        console.log(`[FlixPatrol] Enriched ${enrichedItems.length}/${items.length} items`);

        return enrichedItems;
    } catch (error) {
        console.error(`[FlixPatrol] Error:`, error);
        return [];
    }
}

/**
 * Fetches global Top 10 (movies or series)
 */
async function fetchGlobalTop10(type: 'movies' | 'series'): Promise<RadarItem[]> {
    const apiKey = process.env.NEXT_PUBLIC_FLIXPATROL_API_KEY;

    if (!apiKey) {
        console.error('[FlixPatrol] API Key not found');
        return [];
    }

    try {
        // Endpoint correto: /api/quick/global (retorna .movies e .series)
        const url = `${API_BASE_URL}/api/quick/global`;
        console.log(`[FlixPatrol] Fetching global ${type}`);

        const response = await fetch(url, {
            headers: { 'X-API-Key': apiKey },
        });

        if (!response.ok) {
            console.error(`[FlixPatrol] HTTP ${response.status}`);
            return [];
        }

        const data: { movies?: QuickItemFull[], series?: QuickItemFull[] } = await response.json();
        const items = type === 'movies' ? (data.movies || []) : (data.series || []);

        console.log(`[FlixPatrol] Received ${items.length} global ${type}`);

        // Enriquecer com TMDB completo
        const enrichedItems: RadarItem[] = [];

        for (const item of items) {
            const enriched = await enrichWithTMDB(item); // Sem providerId para global
            if (enriched) {
                enrichedItems.push(enriched);
            }
            await new Promise(resolve => setTimeout(resolve, 100));
        }

        console.log(`[FlixPatrol] Enriched ${enrichedItems.length}/${items.length} global ${type}`);

        return enrichedItems;
    } catch (error) {
        console.error(`[FlixPatrol] Error:`, error);
        return [];
    }
}

/**
 * Gets Top 10 for a streaming service
 */
export async function getTop10(service: StreamingService): Promise<RadarItem[]> {
    const cacheType: CacheType = `top10-${service}`;

    const revalidate = async () => {
        const freshData = await fetchFromFlixPatrolAPI(service);
        if (freshData.length > 0) {
            await saveToFirebaseCache(cacheType, freshData);
        }
    };

    const cachedData = await getFromFirebaseCache(cacheType, revalidate);
    if (cachedData && cachedData.length > 0) {
        return cachedData;
    }

    console.log(`[Public Cache] Cache miss for ${cacheType}`);
    const freshData = await fetchFromFlixPatrolAPI(service);

    if (freshData.length > 0) {
        await saveToFirebaseCache(cacheType, freshData);
    }

    return freshData;
}

/**
 * Gets global Top 10 (movies or series)
 */
export async function getGlobalTop10(type: 'movies' | 'series'): Promise<RadarItem[]> {
    const cacheType: CacheType = `global-${type}`;

    const revalidate = async () => {
        const freshData = await fetchGlobalTop10(type);
        if (freshData.length > 0) {
            await saveToFirebaseCache(cacheType, freshData);
        }
    };

    const cachedData = await getFromFirebaseCache(cacheType, revalidate);
    if (cachedData && cachedData.length > 0) {
        return cachedData;
    }

    console.log(`[Public Cache] Cache miss for ${cacheType}`);
    const freshData = await fetchGlobalTop10(type);

    if (freshData.length > 0) {
        await saveToFirebaseCache(cacheType, freshData);
    }

    return freshData;
}

/**
 * Forces a refresh
 */
export async function forceRefresh(service: StreamingService): Promise<RadarItem[]> {
    const freshData = await fetchFromFlixPatrolAPI(service);
    if (freshData.length > 0) {
        await saveToFirebaseCache(`top10-${service}`, freshData);
    }
    return freshData;
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
