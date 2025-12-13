// Service para cache de metadados de séries (7 dias)
import { db } from '@/lib/firebase/client';
import { doc, getDoc, setDoc } from 'firebase/firestore';

const CACHE_DURATION = 7 * 24 * 60 * 60 * 1000; // 7 dias

export interface SeasonData {
    season_number: number;
    name: string;
    air_date: string | null;
    episode_count: number;
    poster_path: string | null;
    overview: string;

    // Computed fields
    isStarted: boolean;          // Pelo menos 1 episódio já lançou?
    hasAllEpisodes: boolean;     // Todos episódios já lançaram?
    daysUntilStart: number | null;
}

export interface EpisodeData {
    episode_number: number;
    season_number: number;
    name: string;
    air_date: string | null;
    still_path: string | null;
    overview: string;
    runtime: number;

    // Computed fields
    isAvailable: boolean;
    daysUntilRelease: number | null;
}

export interface SeriesMetadata {
    id: number;
    title: string;
    posterUrl: string;
    backdropUrl: string;
    overview: string;
    genres: string[];
    voteAverage: number;
    numberOfSeasons: number;

    // Cache data
    seasonsCache: {
        data: SeasonData[];
        lastFetched: number;
        expiresAt: number;
    };
}

/**
 * Calcula dias até uma data futura
 */
function calculateDaysUntil(dateString: string): number | null {
    if (!dateString) return null;
    const futureDate = new Date(dateString);
    const today = new Date();
    const diff = futureDate.getTime() - today.getTime();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

/**
 * Verifica se temporada já começou (pelo menos 1 ep lançou)
 */
async function checkSeasonStarted(seriesId: number, seasonNumber: number): Promise<boolean> {
    try {
        const response = await fetch(
            `https://api.themoviedb.org/3/tv/${seriesId}/season/${seasonNumber}?api_key=${process.env.NEXT_PUBLIC_TMDB_API_KEY}&language=pt-BR`
        );
        const data = await response.json();

        // Verificar se pelo menos 1 episódio já foi lançado
        const today = new Date();
        const hasLaunchedEpisode = data.episodes?.some((ep: any) => {
            if (!ep.air_date) return false;
            return new Date(ep.air_date) <= today;
        });

        return hasLaunchedEpisode || false;
    } catch (error) {
        console.error(`[Cache] Error checking season ${seasonNumber}:`, error);
        return false;
    }
}

/**
 * Busca TODOS os episódios de uma temporada com status
 */
export async function getSeasonEpisodes(
    seriesId: number,
    seasonNumber: number
): Promise<EpisodeData[]> {
    try {
        const response = await fetch(
            `https://api.themoviedb.org/3/tv/${seriesId}/season/${seasonNumber}?api_key=${process.env.NEXT_PUBLIC_TMDB_API_KEY}&language=pt-BR`
        );
        const data = await response.json();

        const today = new Date();

        return data.episodes?.map((ep: any) => {
            const isAvailable = ep.air_date ? new Date(ep.air_date) <= today : false;
            const daysUntil = ep.air_date ? calculateDaysUntil(ep.air_date) : null;

            return {
                episode_number: ep.episode_number,
                season_number: seasonNumber,
                name: ep.name,
                air_date: ep.air_date,
                still_path: ep.still_path,
                overview: ep.overview,
                runtime: ep.runtime || 0,
                isAvailable,
                daysUntilRelease: daysUntil,
            };
        }) || [];
    } catch (error) {
        console.error(`[Cache] Error fetching episodes S${seasonNumber}:`, error);
        return [];
    }
}

/**
 * Busca metadados completos de série com cache de 7 dias
 */
export async function getSeriesMetadata(
    userId: string,
    seriesId: number,
    forceRefresh = false
): Promise<SeriesMetadata | null> {
    const docRef = doc(db, 'users', userId, 'nowWatching', `tv_${seriesId}`);

    try {
        // 1. Tentar ler do cache
        if (!forceRefresh) {
            const docSnap = await getDoc(docRef);
            if (docSnap.exists()) {
                const data = docSnap.data() as SeriesMetadata;

                // Verificar se cache ainda é válido
                if (data.seasonsCache?.expiresAt > Date.now()) {
                    console.log(`[Cache] HIT for series ${seriesId} (valid until ${new Date(data.seasonsCache.expiresAt).toLocaleString()})`);
                    return data;
                }

                console.log(`[Cache] EXPIRED for series ${seriesId}`);
            }
        }

        // 2. Cache miss ou forçado - buscar do TMDB
        console.log(`[Cache] Fetching fresh data from TMDB for series ${seriesId}`);

        const response = await fetch(
            `https://api.themoviedb.org/3/tv/${seriesId}?api_key=${process.env.NEXT_PUBLIC_TMDB_API_KEY}&language=pt-BR`
        );
        const tmdbData = await response.json();

        // 3. Processar temporadas (APENAS as que já começaram)
        const seasonsData: SeasonData[] = [];

        for (const season of tmdbData.seasons || []) {
            if (season.season_number === 0) continue; // Skip specials

            const hasStarted = await checkSeasonStarted(seriesId, season.season_number);

            // ✅ SÓ adicionar se temporada já começou
            if (hasStarted) {
                const today = new Date();
                const seasonAirDate = season.air_date ? new Date(season.air_date) : null;
                const isStarted = seasonAirDate ? seasonAirDate <= today : false;

                seasonsData.push({
                    season_number: season.season_number,
                    name: season.name,
                    air_date: season.air_date,
                    episode_count: season.episode_count,
                    poster_path: season.poster_path,
                    overview: season.overview || '',
                    isStarted,
                    hasAllEpisodes: false, // Calcular depois
                    daysUntilStart: season.air_date ? calculateDaysUntil(season.air_date) : null,
                });
            }
        }

        // 4. Construir metadata completa
        const metadata: SeriesMetadata = {
            id: seriesId,
            title: tmdbData.name,
            posterUrl: tmdbData.poster_path ? `https://image.tmdb.org/t/p/w500${tmdbData.poster_path}` : '',
            backdropUrl: tmdbData.backdrop_path ? `https://image.tmdb.org/t/p/original${tmdbData.backdrop_path}` : '',
            overview: tmdbData.overview || '',
            genres: tmdbData.genres?.map((g: any) => g.name) || [],
            voteAverage: tmdbData.vote_average || 0,
            numberOfSeasons: seasonsData.length, // Só temporadas iniciadas

            seasonsCache: {
                data: seasonsData,
                lastFetched: Date.now(),
                expiresAt: Date.now() + CACHE_DURATION,
            },
        };

        // 5. Salvar no Firebase
        await setDoc(docRef, metadata, { merge: true });

        console.log(`[Cache] Saved fresh metadata for series ${seriesId} (expires in 7 days)`);

        return metadata;
    } catch (error) {
        console.error(`[Cache] Error getting metadata:`, error);
        return null;
    }
}
