import { WatchProviders, TMDbSearchResult, WatchProvider } from "@/types";

const API_KEY = process.env.NEXT_PUBLIC_TMDB_API_KEY;
const BASE_URL = 'https://api.themoviedb.org/3';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const requestQueue: (() => Promise<any>)[] = [];
let isProcessing = false;
const DELAY_BETWEEN_REQUESTS = 250;

const processQueue = async () => {
    if (isProcessing || requestQueue.length === 0) return;
    isProcessing = true;
    const requestTask = requestQueue.shift();
    if (requestTask) {
        try {
            await requestTask();
        } catch {
            // Silencioso, o erro é tratado na chamada original
        }
    }
    setTimeout(() => {
        isProcessing = false;
        processQueue();
    }, DELAY_BETWEEN_REQUESTS);
};

const addToQueue = <T>(requestFn: () => Promise<T>): Promise<T> => {
    return new Promise((resolve, reject) => {
        const task = () => requestFn().then(resolve).catch(reject);
        requestQueue.push(task);
        if (!isProcessing) processQueue();
    });
};

const internalSearchByTitleAndYear = async (title: string, year: number, mediaType: 'movie' | 'tv'): Promise<TMDbSearchResult | null> => {
    const endpoint = mediaType === 'movie' ? 'movie' : 'tv';
    const yearParam = mediaType === 'movie' ? 'year' : 'first_air_date_year';
    const url = `${BASE_URL}/search/${endpoint}?query=${encodeURIComponent(title)}&${yearParam}=${year}&include_adult=false&language=pt-BR&page=1&api_key=${API_KEY}`;

    const response = await fetch(url);
    if (!response.ok) {
        console.error(`Busca por ${title} (${year}) falhou com status: ${response.status}`);
        return null;
    }
    const data = await response.json();
    const result = data.results?.[0];
    if (result) {
        result.media_type = mediaType;
        return result;
    }
    return null;
};

const internalSearchTMDb = async (query: string): Promise<TMDbSearchResult[]> => {
    const url = `${BASE_URL}/search/multi?query=${encodeURIComponent(query)}&include_adult=false&language=pt-BR&page=1&api_key=${API_KEY}`;
    const response = await fetch(url);
    if (!response.ok) throw new Error(`A busca no TMDb falhou com o status: ${response.status}`);
    const data = await response.json();
    return data.results?.filter((r: { media_type: string }) => (r.media_type === 'movie' || r.media_type === 'tv')) || [];
};

const internalGetTMDbDetails = async (id: number, mediaType: 'movie' | 'tv') => {
    const primaryUrl = `${BASE_URL}/${mediaType}/${id}?language=pt-BR&api_key=${API_KEY}&append_to_response=watch/providers,credits`;
    let response = await fetch(primaryUrl);

    if (response.status === 404) {
        console.warn(`[TMDbService] ID ${id} não encontrado como '${mediaType}'. Tentando tipo oposto.`);
        const fallbackMediaType = mediaType === 'movie' ? 'tv' : 'movie';
        const fallbackUrl = `${BASE_URL}/${fallbackMediaType}/${id}?language=pt-BR&api_key=${API_KEY}&append_to_response=watch/providers,credits`;
        response = await fetch(fallbackUrl);
    }

    if (response.status === 404) {
        const fallbackUrlEn = `${BASE_URL}/${mediaType}/${id}?language=en-US&api_key=${API_KEY}&append_to_response=watch/providers,credits`;
        response = await fetch(fallbackUrlEn);
    }

    if (!response.ok) {
        throw new Error(`A busca de detalhes no TMDb falhou com o status: ${response.status}`);
    }

    const data = await response.json();
    if (!data.media_type) {
        const successfulUrl = new URL(response.url);
        data.media_type = successfulUrl.pathname.split('/')[2];
    }
    return data;
};

const internalGetUpcomingMovies = async (): Promise<TMDbSearchResult[]> => {
    const url = `${BASE_URL}/movie/upcoming?language=pt-BR&page=1&region=BR&api_key=${API_KEY}`;
    const response = await fetch(url);
    if (!response.ok) throw new Error(`A busca de próximos lançamentos de filmes falhou: ${response.status}`);
    const data = await response.json();
    return data.results || [];
};

const internalGetOnTheAirTV = async (): Promise<TMDbSearchResult[]> => {
    const url = `${BASE_URL}/tv/on_the_air?language=pt-BR&page=1&api_key=${API_KEY}`;
    const response = await fetch(url);
    if (!response.ok) throw new Error(`A busca de séries no ar falhou: ${response.status}`);
    const data = await response.json();
    return data.results || [];
};

const internalGetNowPlayingMovies = async (): Promise<TMDbSearchResult[]> => {
    const url = `${BASE_URL}/movie/now_playing?language=pt-BR&page=1&region=BR&api_key=${API_KEY}`;
    const response = await fetch(url);
    if (!response.ok) throw new Error(`Falha ao buscar filmes nos cinemas: ${response.status}`);
    const data = await response.json();
    return data.results || [];
};

const internalGetTopMoviesOnProvider = async (providerId: number): Promise<TMDbSearchResult[]> => {
    const url = `${BASE_URL}/discover/movie?language=pt-BR&watch_region=BR&sort_by=popularity.desc&with_watch_providers=${providerId}&with_watch_monetization_types=flatrate&page=1&api_key=${API_KEY}`;
    const response = await fetch(url);
    if (!response.ok) throw new Error(`Falha ao buscar Top 10 filmes do provedor: ${response.status}`);
    const data = await response.json();
    return data.results?.slice(0, 10).map((item: TMDbSearchResult) => ({ ...item, media_type: 'movie' as const })) || [];
};

const internalGetTopTVOnProvider = async (providerId: number): Promise<TMDbSearchResult[]> => {
    const url = `${BASE_URL}/discover/tv?language=pt-BR&watch_region=BR&sort_by=popularity.desc&with_watch_providers=${providerId}&with_watch_monetization_types=flatrate&page=1&api_key=${API_KEY}`;
    const response = await fetch(url);
    if (!response.ok) throw new Error(`Falha ao buscar Top 10 séries do provedor: ${response.status}`);
    const data = await response.json();
    return data.results?.slice(0, 10).map((item: TMDbSearchResult) => ({ ...item, media_type: 'tv' as const })) || [];
};

const internalGetTopMixedOnProvider = async (providerId: number): Promise<TMDbSearchResult[]> => {
    const [movies, tvShows] = await Promise.all([
        internalGetTopMoviesOnProvider(providerId),
        internalGetTopTVOnProvider(providerId)
    ]);

    const combined = [...movies, ...tvShows].sort((a, b) => b.popularity - a.popularity);
    return combined.slice(0, 10);
};

const internalGetTrending = async (): Promise<TMDbSearchResult[]> => {
    const url = `${BASE_URL}/trending/all/week?language=pt-BR&api_key=${API_KEY}`;
    const response = await fetch(url);
    if (!response.ok) throw new Error(`Falha ao buscar tendências: ${response.status}`);
    const data = await response.json();
    return data.results || [];
};

export const searchByTitleAndYear = (title: string, year: number, mediaType: 'movie' | 'tv') => {
    return addToQueue(() => internalSearchByTitleAndYear(title, year, mediaType));
};

export const searchTMDb = (query: string) => {
    return addToQueue(() => internalSearchTMDb(query));
};

export const getTMDbDetails = (id: number, mediaType: 'movie' | 'tv') => {
    return addToQueue(() => internalGetTMDbDetails(id, mediaType));
};

type TMDbProviderData = {
    'watch/providers'?: {
        results?: {
            BR?: {
                link: string;
                flatrate?: WatchProvider[];
            };
        };
    };
};
export const getProviders = (data: TMDbProviderData): WatchProviders | undefined => {
    const providers = data?.['watch/providers']?.results?.BR;
    if (!providers) return undefined;
    return {
        link: providers.link,
        flatrate: providers.flatrate,
    };
};

export const fetchPosterUrl = async (title: string): Promise<string | null> => {
    try {
        const results = await searchTMDb(title.replace(/\s*\(\d{4}\)\s*/, ''));
        const bestResult = results?.[0];
        if (bestResult && bestResult.poster_path) {
            return `https://image.tmdb.org/t/p/w500${bestResult.poster_path}`;
        }
        return null;
    } catch (error) {
        console.error(`Error fetching poster for "${title}":`, error);
        return null;
    }
};

export const getUpcomingMovies = () => {
    return addToQueue(() => internalGetUpcomingMovies());
};

export const getOnTheAirTV = () => {
    return addToQueue(() => internalGetOnTheAirTV());
};

export const getNowPlayingMovies = () => {
    return addToQueue(() => internalGetNowPlayingMovies());
};

export const getTopMoviesOnProvider = (id: number) => {
    return addToQueue(() => internalGetTopMoviesOnProvider(id));
};

export const getTopTVOnProvider = (id: number) => {
    return addToQueue(() => internalGetTopTVOnProvider(id));
};

export const getTopMixedOnProvider = (id: number) => {
    return addToQueue(() => internalGetTopMixedOnProvider(id));
};

export const getTrending = () => {
    return addToQueue(() => internalGetTrending());
};

// Funções para categorias com paginação
const internalGetTopRatedMovies = async (page: number = 1): Promise<{ results: TMDbSearchResult[], total_pages: number }> => {
    const url = `${BASE_URL}/movie/top_rated?language=pt-BR&page=${page}&region=BR&api_key=${API_KEY}`;
    const response = await fetch(url);
    if (!response.ok) throw new Error(`Falha ao buscar filmes top rated: ${response.status}`);
    const data = await response.json();
    return { results: data.results || [], total_pages: data.total_pages || 0 };
};

const internalGetPopularMovies = async (page: number = 1): Promise<{ results: TMDbSearchResult[], total_pages: number }> => {
    const url = `${BASE_URL}/movie/popular?language=pt-BR&page=${page}&region=BR&api_key=${API_KEY}`;
    const response = await fetch(url);
    if (!response.ok) throw new Error(`Falha ao buscar filmes populares: ${response.status}`);
    const data = await response.json();
    return { results: data.results || [], total_pages: data.total_pages || 0 };
};

const internalGetTopRatedTV = async (page: number = 1): Promise<{ results: TMDbSearchResult[], total_pages: number }> => {
    const url = `${BASE_URL}/tv/top_rated?language=pt-BR&page=${page}&api_key=${API_KEY}`;
    const response = await fetch(url);
    if (!response.ok) throw new Error(`Falha ao buscar séries top rated: ${response.status}`);
    const data = await response.json();
    return { results: data.results || [], total_pages: data.total_pages || 0 };
};

const internalGetPopularTV = async (page: number = 1): Promise<{ results: TMDbSearchResult[], total_pages: number }> => {
    const url = `${BASE_URL}/tv/popular?language=pt-BR&page=${page}&api_key=${API_KEY}`;
    const response = await fetch(url);
    if (!response.ok) throw new Error(`Falha ao buscar séries populares: ${response.status}`);
    const data = await response.json();
    return { results: data.results || [], total_pages: data.total_pages || 0 };
};

export const getTopRatedMovies = (page: number = 1) => {
    return addToQueue(() => internalGetTopRatedMovies(page));
};

export const getPopularMovies = (page: number = 1) => {
    return addToQueue(() => internalGetPopularMovies(page));
};

export const getTopRatedTV = (page: number = 1) => {
    return addToQueue(() => internalGetTopRatedTV(page));
};

export const getPopularTV = (page: number = 1) => {
    return addToQueue(() => internalGetPopularTV(page));
};
