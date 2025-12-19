// Service to collect and cache highlight items for hero carousel
import { db } from '@/lib/firebase/client';
import { doc, getDoc, setDoc } from 'firebase/firestore';

export interface HighlightItem {
    id: number;
    tmdbMediaType: 'movie' | 'tv';
    title: string;
    overview: string;
    backdropUrl: string;
    logoUrl: string | null;
    voteAverage: number;
    releaseDate: string;
    genres: string[];
    source: string;
}

interface HighlightCache {
    items: HighlightItem[];
    expiresAt: number;
    lastFetched: number;
}

const CACHE_DURATION = 4 * 60 * 60 * 1000; // 4 hours
const MAX_HIGHLIGHTS = 7; // Increased to 7

/**
 * Fetch title logo (PNG) from TMDB Images API
 */
async function fetchTitleLogo(tmdbId: number, mediaType: 'movie' | 'tv'): Promise<string | null> {
    try {
        const response = await fetch(
            `https://api.themoviedb.org/3/${mediaType}/${tmdbId}/images?api_key=${process.env.NEXT_PUBLIC_TMDB_API_KEY}&include_image_language=pt,en,null`
        );
        const data: { logos?: Array<{ iso_639_1: string | null; file_path: string }> } = await response.json();

        // Prefer Portuguese logos, then English, then null language
        const logos = data.logos || [];
        const ptLogo = logos.find((l) => l.iso_639_1 === 'pt');
        const enLogo = logos.find((l) => l.iso_639_1 === 'en');
        const nullLogo = logos.find((l) => !l.iso_639_1);

        const selectedLogo = ptLogo || enLogo || nullLogo;

        if (selectedLogo) {
            return `https://image.tmdb.org/t/p/original${selectedLogo.file_path}`;
        }

        return null;
    } catch (error) {
        console.error(`[Highlights] Error fetching logo for ${mediaType} ${tmdbId}:`, error);
        return null;
    }
}

/**
 * Fetch complete TMDB details for a title
 */
async function fetchTMDBDetails(tmdbId: number, mediaType: 'movie' | 'tv'): Promise<any> {
    try {
        const response = await fetch(
            `https://api.themoviedb.org/3/${mediaType}/${tmdbId}?api_key=${process.env.NEXT_PUBLIC_TMDB_API_KEY}&language=pt-BR`
        );
        const data = await response.json();

        return {
            id: data.id,
            tmdbMediaType: mediaType,
            title: data.title || data.name,
            overview: data.overview || '',
            backdropUrl: data.backdrop_path ? `https://image.tmdb.org/t/p/original${data.backdrop_path}` : '',
            voteAverage: data.vote_average || 0,
            releaseDate: data.release_date || data.first_air_date || '',
            genres: data.genres?.map((g: any) => g.name) || [],
        };
    } catch (error) {
        console.error(`[Highlights] Error fetching TMDB details for ${mediaType} ${tmdbId}:`, error);
        return null;
    }
}

/**
 * Collect highlights from Firebase Top 10 collections
 */
async function collectHighlights(): Promise<HighlightItem[]> {
    const highlights: HighlightItem[] = [];
    const seenIds = new Set<number>();

    console.log('[Highlights] 🔍 Fetching from Firebase Top 10 collections...');

    const streamingServices = [
        { id: 'top10-netflix', name: 'Top 10 Netflix' },
        { id: 'top10-prime', name: 'Top 10 Prime Video' },
        { id: 'top10-disney', name: 'Top 10 Disney+' },
        { id: 'top10-hbo', name: 'Top 10 HBO Max' },
        { id: 'top10-apple', name: 'Top 10 Apple TV+' },
        { id: 'trending', name: 'Tendências da Semana' },
        { id: 'now-playing', name: 'Nos Cinemas' },
    ];

    try {
        for (const service of streamingServices) {
            if (highlights.length >= MAX_HIGHLIGHTS) break;

            const docRef = doc(db, 'public', service.id);
            const docSnap = await getDoc(docRef);

            if (docSnap.exists()) {
                const data = docSnap.data();
                const items = data.items || [];

                console.log(`[Highlights] 📊 ${service.name}: ${items.length} items`);

                // Get first item that's not a duplicate
                for (const item of items) {
                    if (seenIds.has(item.id)) continue;
                    if (highlights.length >= MAX_HIGHLIGHTS) break;

                    // For trending/now-playing, fetch complete data from TMDB
                    let completeItem = item;
                    if (service.id === 'trending' || service.id === 'now-playing') {
                        console.log(`[Highlights] 🔄 Fetching complete data from TMDB for ID ${item.id}...`);
                        const tmdbData = await fetchTMDBDetails(item.id, item.tmdbMediaType || 'movie');
                        if (tmdbData) {
                            completeItem = tmdbData;
                        }
                    }

                    seenIds.add(completeItem.id);
                    highlights.push({
                        id: completeItem.id,
                        tmdbMediaType: completeItem.tmdbMediaType,
                        title: completeItem.title,
                        overview: completeItem.overview || '',
                        backdropUrl: completeItem.backdropUrl || '',
                        logoUrl: null, // Will be fetched later
                        voteAverage: completeItem.voteAverage || 0,
                        releaseDate: completeItem.releaseDate || '',
                        genres: completeItem.genres || [],
                        source: service.name,
                    });

                    console.log(`[Highlights] ✅ Added "${completeItem.title}" from ${service.name}`);
                    break; // Only take first item
                }
            } else {
                console.log(`[Highlights] ⚠️ ${service.name} not found in Firebase`);
            }
        }
    } catch (error) {
        console.error('[Highlights] ❌ Error collecting:', error);
    }

    console.log(`[Highlights] ✅ Collected ${highlights.length} items TOTAL`);
    console.log('[Highlights] Items:', highlights.map(h => h.title));

    // Fetch logos for all highlights
    for (const highlight of highlights) {
        highlight.logoUrl = await fetchTitleLogo(highlight.id, highlight.tmdbMediaType);
    }

    return highlights.slice(0, MAX_HIGHLIGHTS);
}

/**
 * Collect highlights for Movies page
 */
async function collectMoviesHighlights(): Promise<HighlightItem[]> {
    const highlights: HighlightItem[] = [];
    const seenIds = new Set<number>();

    console.log('[Highlights] 🎬 Fetching Movies highlights...');

    const sources = [
        { id: 'global-movies', name: 'Top 10 Global' },
        { endpoint: 'firebase:calendar-movies', name: 'Em Breve' }, // FlixPatrol Calendar (only movies)
        { id: 'popular-movies', name: 'Populares' },
        { endpoint: '/movie/now_playing', name: 'Nos Cinemas' },
    ];

    try {
        for (const source of sources) {
            if (highlights.length >= 5) break; // Max 5 for movies

            if ('id' in source) {
                // Fetch from Firebase
                const docRef = doc(db, 'public', source.id as string);
                const docSnap = await getDoc(docRef);

                if (docSnap.exists()) {
                    const data = docSnap.data();
                    const items = data.items || [];

                    for (const item of items) {
                        if (seenIds.has(item.id)) continue;
                        if (highlights.length >= 5) break;

                        // Fetch complete data from TMDB
                        const tmdbData = await fetchTMDBDetails(item.id, 'movie');
                        if (tmdbData) {
                            seenIds.add(tmdbData.id);
                            highlights.push({
                                ...tmdbData,
                                logoUrl: null,
                                source: source.name,
                            });
                            console.log(`[Highlights] ✅ Added "${tmdbData.title}" from ${source.name}`);
                            break;
                        }
                    }
                }
            } else if ('endpoint' in source) {
                const endpoint = source.endpoint as string;

                // Check if it's a Firebase reference
                if (endpoint.startsWith('firebase:')) {
                    const firebaseId = endpoint.replace('firebase:', '');
                    const docRef = doc(db, 'public', firebaseId);
                    const docSnap = await getDoc(docRef);

                    if (docSnap.exists()) {
                        const data = docSnap.data();
                        const items = data.items || [];

                        for (const item of items) {
                            if (seenIds.has(item.id)) continue;
                            if (highlights.length >= 5) break;

                            // Fetch complete data from TMDB
                            const tmdbData = await fetchTMDBDetails(item.id, item.tmdbMediaType || 'movie');
                            if (tmdbData) {
                                seenIds.add(tmdbData.id);
                                highlights.push({
                                    ...tmdbData,
                                    logoUrl: null,
                                    source: source.name,
                                });
                                console.log(`[Highlights] ✅ Added "${tmdbData.title}" from ${source.name}`);
                                break;
                            }
                        }
                    }
                } else {
                    // Fetch from TMDB API
                    const response = await fetch(
                        `https://api.themoviedb.org/3${endpoint}?api_key=${process.env.NEXT_PUBLIC_TMDB_API_KEY}&language=pt-BR&page=1`
                    );
                    const data = await response.json();
                    const items = data.results || [];

                    for (const item of items) {
                        if (seenIds.has(item.id)) continue;
                        if (highlights.length >= 5) break;

                        seenIds.add(item.id);
                        highlights.push({
                            id: item.id,
                            tmdbMediaType: 'movie',
                            title: item.title,
                            overview: item.overview || '',
                            backdropUrl: item.backdrop_path ? `https://image.tmdb.org/t/p/original${item.backdrop_path}` : '',
                            logoUrl: null,
                            voteAverage: item.vote_average || 0,
                            releaseDate: item.release_date || '',
                            genres: [], // Will be filled from full details if needed
                            source: source.name,
                        });
                        console.log(`[Highlights] ✅ Added "${item.title}" from ${source.name}`);
                        break;
                    }
                }
            }
        }
    } catch (error) {
        console.error('[Highlights] ❌ Error collecting movies:', error);
    }

    console.log(`[Highlights] 🎬 Collected ${highlights.length} movies highlights`);
    return highlights;
}

/**
 * Collect highlights for TV page
 */
async function collectTvHighlights(): Promise<HighlightItem[]> {
    const highlights: HighlightItem[] = [];
    const seenIds = new Set<number>();

    console.log('[Highlights] 📺 Fetching TV highlights...');

    const sources = [
        { id: 'global-series', name: 'Top 10 Global' },
        { id: 'popular-tv', name: 'Populares' },
        { endpoint: '/tv/top_rated', name: 'Mais Bem Avaliadas' },
        { endpoint: '/tv/on_the_air', name: 'No Ar' },
        { endpoint: 'firebase:calendar-tv', name: 'Em Breve' }, // FlixPatrol Calendar
    ];

    try {
        for (const source of sources) {
            if (highlights.length >= 4) break; // Max 4 for TV

            if ('id' in source) {
                // Fetch from Firebase
                const docRef = doc(db, 'public', source.id as string);
                const docSnap = await getDoc(docRef);

                if (docSnap.exists()) {
                    const data = docSnap.data();
                    const items = data.items || [];

                    for (const item of items) {
                        if (seenIds.has(item.id)) continue;
                        if (highlights.length >= 4) break;

                        // Fetch complete data from TMDB
                        const tmdbData = await fetchTMDBDetails(item.id, 'tv');
                        if (tmdbData) {
                            seenIds.add(tmdbData.id);
                            highlights.push({
                                ...tmdbData,
                                logoUrl: null,
                                source: source.name,
                            });
                            console.log(`[Highlights] ✅ Added "${tmdbData.title}" from ${source.name}`);
                            break;
                        }
                    }
                }
            } else if ('endpoint' in source) {
                // Fetch from TMDB API
                const response = await fetch(
                    `https://api.themoviedb.org/3${source.endpoint}?api_key=${process.env.NEXT_PUBLIC_TMDB_API_KEY}&language=pt-BR&page=1`
                );
                const data = await response.json();
                const items = data.results || [];

                for (const item of items) {
                    if (seenIds.has(item.id)) continue;
                    if (highlights.length >= 4) break;

                    seenIds.add(item.id);
                    highlights.push({
                        id: item.id,
                        tmdbMediaType: 'tv',
                        title: item.name,
                        overview: item.overview || '',
                        backdropUrl: item.backdrop_path ? `https://image.tmdb.org/t/p/original${item.backdrop_path}` : '',
                        logoUrl: null,
                        voteAverage: item.vote_average || 0,
                        releaseDate: item.first_air_date || '',
                        genres: [], // Will be filled from full details if needed
                        source: source.name,
                    });
                    console.log(`[Highlights] ✅ Added "${item.name}" from ${source.name}`);
                    break;
                }
            }
        }
    } catch (error) {
        console.error('[Highlights] ❌ Error collecting TV:', error);
    }

    console.log(`[Highlights] 📺 Collected ${highlights.length} TV highlights`);
    return highlights;
}

/**
 * Save highlights to Firebase cache
 */
async function saveToFirebase(highlights: HighlightItem[], cacheId: string = 'principal'): Promise<void> {
    try {
        const docRef = doc(db, 'public', cacheId);
        const cache: HighlightCache = {
            items: highlights,
            expiresAt: Date.now() + CACHE_DURATION,
            lastFetched: Date.now(),
        };

        await setDoc(docRef, cache);
        console.log(`[Highlights] 💾 Saved to Firebase: public/${cacheId}`);
    } catch (error) {
        console.error('[Highlights] Error saving to Firebase:', error);
    }
}

/**
 * Get highlights from cache or fetch new
 */
export async function getHighlights(page: 'dashboard' | 'movies' | 'tv' = 'dashboard'): Promise<HighlightItem[]> {
    const cacheId = page === 'movies' ? 'principalfilmes' : page === 'tv' ? 'principalseries' : 'principal';

    try {
        // Try to get from cache
        const docRef = doc(db, 'public', cacheId);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
            const cache = docSnap.data() as HighlightCache;

            // Check if cache is still valid AND has items
            if (cache.expiresAt > Date.now() && cache.items && cache.items.length > 0) {
                console.log(`[Highlights] ✅ Using Firebase cache (${cacheId}):`, cache.items.length, 'items');
                return cache.items;
            }

            console.log(`[Highlights] ⚠️ Cache (${cacheId}) expired or empty, fetching new...`);
        } else {
            console.log(`[Highlights] ❌ No cache (${cacheId}) found, fetching new...`);
        }

        // Fetch and cache new highlights based on page type
        let highlights: HighlightItem[];

        if (page === 'movies') {
            highlights = await collectMoviesHighlights();
        } else if (page === 'tv') {
            highlights = await collectTvHighlights();
        } else {
            highlights = await collectHighlights();
        }

        if (highlights.length > 0) {
            // Fetch logos for all highlights
            for (const highlight of highlights) {
                highlight.logoUrl = await fetchTitleLogo(highlight.id, highlight.tmdbMediaType);
            }

            await saveToFirebase(highlights, cacheId);
        } else {
            console.error(`[Highlights] ⚠️ No highlights collected for ${page}!`);
        }

        return highlights;
    } catch (error) {
        console.error(`[Highlights] Error getting highlights (${page}):`, error);
        return [];
    }
}
