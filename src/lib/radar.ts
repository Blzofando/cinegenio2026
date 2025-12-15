import { db } from '@/lib/firebase/client';
import { doc, getDoc, setDoc, Timestamp } from "firebase/firestore";
import { AllManagedWatchedData, RelevantRadarItem, TMDbRadarItem, TMDbSearchResult } from '@/types';
import { getNowPlayingMovies, getOnTheAirTV, getTopMixedOnProvider, getTrending, getUpcomingMovies, getTopRatedMovies, getPopularMovies, getTopRatedTV, getPopularTV } from './tmdb';
import { fetchPersonalizedRadar, formatWatchedDataForPrompt } from './aiService';
import { setRelevantReleases, setTMDbRadarCache, getWatchedItems } from './firestore';

// --- LÓGICA PARA O RADAR GERAL (TMDb) ---

const METADATA_TMDb_ID = 'tmdbRadarMetadata';

const shouldUpdateTMDbRadar = async (): Promise<boolean> => {
    const metadataRef = doc(db, 'metadata', METADATA_TMDb_ID);
    const metadataSnap = await getDoc(metadataRef);

    if (!metadataSnap.exists()) {
        console.log("Metadados do Radar TMDb não encontrados. Primeira atualização necessária.");
        return true;
    }

    const lastUpdate = (metadataSnap.data().lastUpdate as Timestamp).toDate();
    const today = new Date();

    // Comparamos apenas a data (AAAA-MM-DD), ignorando a hora
    const lastUpdateDateString = lastUpdate.toISOString().split('T')[0];
    const todayDateString = today.toISOString().split('T')[0];

    if (lastUpdateDateString !== todayDateString) {
        console.log(`A última atualização foi em ${lastUpdateDateString}. Nova atualização para o dia ${todayDateString} necessária.`);
        return true;
    }

    console.log(`Cache do Radar TMDb já atualizado para hoje (${todayDateString}).`);
    return false;
};

const toTMDbRadarItem = (item: TMDbSearchResult, listType: TMDbRadarItem['listType'], providerId?: number): TMDbRadarItem | null => {
    const releaseDate = item.release_date || item.first_air_date;
    if (!releaseDate) return null;

    const mediaType = item.media_type || (item.title ? 'movie' : 'tv');
    const fullTitle = item.title || item.name;
    const yearRegex = /\(\d{4}\)/;
    const titleWithYear = yearRegex.test(fullTitle || '')
        ? fullTitle
        : `${fullTitle} (${new Date(releaseDate).getFullYear()})`;

    const radarItem: TMDbRadarItem = {
        id: item.id,
        tmdbMediaType: mediaType,
        media_type: mediaType, // Add for compatibility with category pages
        title: titleWithYear || 'Título Desconhecido',
        releaseDate: releaseDate,
        type: mediaType,
        listType: listType,
    };

    if (item.poster_path) {
        radarItem.posterUrl = `https://image.tmdb.org/t/p/w500${item.poster_path}`;
    }
    if (providerId) {
        radarItem.providerId = providerId;
    }

    return radarItem;
};

export const updateTMDbRadarCache = async (): Promise<void> => {
    if (!(await shouldUpdateTMDbRadar())) return;

    console.log("SERVER ACTION: Iniciando atualização do cache do Radar TMDb...");

    const PROVIDER_IDS = { netflix: 8, prime: 119, max: 1899, disney: 337 };

    try {
        const [
            nowPlayingMovies,
            trending,
            topNetflix,
            topPrime,
            topMax,
            topDisney,
            topRatedMoviesData,
            popularMoviesData,
            upcomingMovies,
            topRatedTVData,
            popularTVData,
            onTheAirTV
        ] = await Promise.all([
            getNowPlayingMovies(),
            getTrending(),
            getTopMixedOnProvider(PROVIDER_IDS.netflix),
            getTopMixedOnProvider(PROVIDER_IDS.prime),
            getTopMixedOnProvider(PROVIDER_IDS.max),
            getTopMixedOnProvider(PROVIDER_IDS.disney),
            getTopRatedMovies(1),
            getPopularMovies(1),
            getUpcomingMovies(),
            getTopRatedTV(1),
            getPopularTV(1),
            getOnTheAirTV()
        ]);

        const allItems = [
            ...nowPlayingMovies.map(m => toTMDbRadarItem(m, 'now_playing')),
            ...trending.map(t => toTMDbRadarItem(t, 'trending')),
            ...topNetflix.map(m => toTMDbRadarItem(m, 'top_rated_provider', PROVIDER_IDS.netflix)),
            ...topPrime.map(m => toTMDbRadarItem(m, 'top_rated_provider', PROVIDER_IDS.prime)),
            ...topMax.map(m => toTMDbRadarItem(m, 'top_rated_provider', PROVIDER_IDS.max)),
            ...topDisney.map(m => toTMDbRadarItem(m, 'top_rated_provider', PROVIDER_IDS.disney)),
            // Novas Categorias (Filmes)
            ...topRatedMoviesData.results.map(m => toTMDbRadarItem(m, 'top_rated')),
            ...popularMoviesData.results.map(m => toTMDbRadarItem(m, 'popular')),
            ...upcomingMovies.map(m => toTMDbRadarItem(m, 'upcoming')),
            // Novas Categorias (Séries)
            ...topRatedTVData.results.map(m => toTMDbRadarItem(m, 'top_rated')),
            ...popularTVData.results.map(m => toTMDbRadarItem(m, 'popular')),
            ...onTheAirTV.map(m => toTMDbRadarItem(m, 'on_the_air'))
        ].filter((i): i is TMDbRadarItem => !!i);

        const allItemsMap = new Map<string, TMDbRadarItem>();
        allItems.forEach(item => {
            const uniqueId = `${item.listType}-${item.providerId || ''}-${item.id}`;
            if (!allItemsMap.has(uniqueId)) {
                allItemsMap.set(uniqueId, item);
            }
        });

        const allItemsArray = Array.from(allItemsMap.values());

        // Save to old radarCache structure (for backward compatibility)
        await setTMDbRadarCache(allItemsArray);

        // Save to new public structure (1-hour cache)
        const CACHE_DURATION = 60 * 60 * 1000; // 1 hour
        const now = Date.now();
        const expiresAt = now + CACHE_DURATION;

        // Save trending
        const trendingItems = allItemsArray.filter(i => i.listType === 'trending');
        if (trendingItems.length > 0) {
            await setDoc(doc(db, 'public', 'trending'), {
                items: trendingItems,
                lastUpdated: now,
                expiresAt,
                cacheType: 'trending'
            });
        }

        // Save now-playing
        const nowPlayingItems = allItemsArray.filter(i => i.listType === 'now_playing');
        if (nowPlayingItems.length > 0) {
            await setDoc(doc(db, 'public', 'now-playing'), {
                items: nowPlayingItems,
                lastUpdated: now,
                expiresAt,
                cacheType: 'now-playing'
            });
        }

        // Save upcoming
        const upcomingItems = allItemsArray.filter(i => i.listType === 'upcoming');
        if (upcomingItems.length > 0) {
            await setDoc(doc(db, 'public', 'upcoming'), {
                items: upcomingItems,
                lastUpdated: now,
                expiresAt,
                cacheType: 'upcoming'
            });
        }

        // Save on-the-air
        const onTheAirItems = allItemsArray.filter(i => i.listType === 'on_the_air');
        if (onTheAirItems.length > 0) {
            await setDoc(doc(db, 'public', 'on-the-air'), {
                items: onTheAirItems,
                lastUpdated: now,
                expiresAt,
                cacheType: 'on-the-air'
            });
        }

        // Save popular-movies
        const popularMoviesItems = allItemsArray.filter(i => i.listType === 'popular' && i.tmdbMediaType === 'movie');
        if (popularMoviesItems.length > 0) {
            await setDoc(doc(db, 'public', 'popular-movies'), {
                items: popularMoviesItems,
                lastUpdated: now,
                expiresAt,
                cacheType: 'popular-movies'
            });
        }

        // Save popular-tv
        const popularTVItems = allItemsArray.filter(i => i.listType === 'popular' && i.tmdbMediaType === 'tv');
        if (popularTVItems.length > 0) {
            await setDoc(doc(db, 'public', 'popular-tv'), {
                items: popularTVItems,
                lastUpdated: now,
                expiresAt,
                cacheType: 'popular-tv'
            });
        }

        await setDoc(doc(db, 'metadata', METADATA_TMDb_ID), { lastUpdate: new Date() });

        console.log(`Cache do Radar TMDb atualizado! ${allItemsMap.size} itens salvos.`);
        console.log(`[Public Cache] Saved to public: trending(${trendingItems.length}), now-playing(${nowPlayingItems.length}), upcoming(${upcomingItems.length}), on-the-air(${onTheAirItems.length}), popular-movies(${popularMoviesItems.length}), popular-tv(${popularTVItems.length})`);
    } catch (error) {
        console.error("Falha ao atualizar o cache do Radar TMDb:", error);
    }
};

// --- LÓGICA PARA O RADAR RELEVANTE (IA) ---
// NOTA: Esta função foi desabilitada pois requer userId específico,
// tornando-a incompatível com cache global. Considere implementar
// por usuário no futuro.

/*
const METADATA_RELEVANT_ID = 'relevantRadarMetadata';
const UPDATE_INTERVAL_DAYS_RELEVANT = 7;

const shouldUpdateRelevantRadar = async (): Promise<boolean> => {
    const metadataRef = doc(db, 'metadata', METADATA_RELEVANT_ID);
    const metadataSnap = await getDoc(metadataRef);

    if (!metadataSnap.exists()) {
        console.log("Metadados do Radar Relevante não encontrados. Primeira atualização necessária.");
        return true;
    }

    const lastUpdate = (metadataSnap.data().lastUpdate as Timestamp)?.toDate() || new Date(0);
    const daysSinceLastUpdate = (new Date().getTime() - lastUpdate.getTime()) / (1000 * 3600 * 24);

    if (daysSinceLastUpdate >= UPDATE_INTERVAL_DAYS_RELEVANT) {
        console.log(`Já se passaram ${daysSinceLastUpdate.toFixed(1)} dias. Nova atualização do Radar Relevante (IA) necessária.`);
        return true;
    }

    console.log(`Cache do Radar Relevante está atualizado. Última atualização há ${daysSinceLastUpdate.toFixed(1)} dias.`);
    return false;
};

const toRelevantRadarItem = (item: TMDbSearchResult, reason: string): RelevantRadarItem | null => {
    const releaseDate = item.release_date || item.first_air_date;
    if (!releaseDate) return null;

    const mediaType = item.media_type || (item.title ? 'movie' : 'tv');
    const fullTitle = item.title || item.name;
    const yearRegex = /\(\d{4}\)/;
    const titleWithYear = yearRegex.test(fullTitle || '')
        ? fullTitle
        : `${fullTitle} (${new Date(releaseDate).getFullYear()})`;

    const radarItem: RelevantRadarItem = {
        id: item.id,
        tmdbMediaType: mediaType,
        title: titleWithYear || 'Título Desconhecido',
        releaseDate: releaseDate,
        type: mediaType,
        reason: reason,
        listType: 'upcoming',
    };

    if (item.poster_path) {
        radarItem.posterUrl = `https://image.tmdb.org/t/p/w500${item.poster_path}`;
    }

    return radarItem;
};

export const updateRelevantReleases = async (): Promise<void> => {
    if (!(await shouldUpdateRelevantRadar())) return;

    console.log("SERVER ACTION: Iniciando atualização do Radar Relevante (IA)...");
    try {
        const watchedItems = await getWatchedItems(userId); // userId não disponível aqui
        const watchedData: AllManagedWatchedData = {
            amei: watchedItems.filter(i => i.rating === 'amei'),
            gostei: watchedItems.filter(i => i.rating === 'gostei'),
            meh: watchedItems.filter(i => i.rating === 'meh'),
            naoGostei: watchedItems.filter(i => i.rating === 'naoGostei'),
        };

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const [upcomingMovies, onTheAirShows] = await Promise.all([getUpcomingMovies(), getOnTheAirTV()]);

        const futureContent = [...upcomingMovies, ...onTheAirShows].filter(item => {
            const releaseDate = new Date(item.release_date || item.first_air_date || '');
            return releaseDate >= today;
        });

        if (futureContent.length === 0) {
            console.log("Nenhum conteúdo futuro encontrado para análise da IA.");
            return;
        }

        const releasesForPrompt = futureContent.map(r => `- ${r.title || r.name} (ID: ${r.id})`).join('\n');
        const formattedData = await formatWatchedDataForPrompt(watchedData);
        const prompt = `Analise o perfil e a lista de lançamentos e selecione até 20 que sejam mais relevantes.\n\n**PERFIL:**\n${formattedData}\n\n**LANÇAMENTOS:**\n${releasesForPrompt}`;

        const aiResult = await fetchPersonalizedRadar(prompt);

        const relevantItems = aiResult.releases
            .map(release => {
                const original = futureContent.find(r => r.id === release.id);
                return original ? toRelevantRadarItem(original, release.reason) : null;
            })
            .filter((item): item is RelevantRadarItem => item !== null);

        await setRelevantReleases(relevantItems);
        await setDoc(doc(db, 'metadata', METADATA_RELEVANT_ID), { lastUpdate: new Date() });

        console.log(`Radar Relevante (IA) atualizado! ${relevantItems.length} itens salvos.`);
    } catch (error) {
        console.error("Falha ao atualizar o Radar Relevante (IA):", error);
    }
};
*/
