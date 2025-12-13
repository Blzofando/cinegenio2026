// src/types.ts (Completo e Corrigido)

export type MediaType = 'Filme' | 'Série' | 'Anime' | 'Programa';
export type Rating = 'amei' | 'gostei' | 'meh' | 'naoGostei';

export interface WatchProvider {
  provider_id: number;
  provider_name: string;
  logo_path: string;
}

export interface WatchProviders {
  link: string;
  flatrate?: WatchProvider[];
}

export interface WatchedItem {
  id: number;
  tmdbMediaType: 'movie' | 'tv';
  title: string;
  type: MediaType;
  genre: string;
}

export interface ManagedWatchedItem extends WatchedItem {
  rating: Rating;
  synopsis?: string;
  createdAt: number;
  posterUrl?: string;
  voteAverage?: number;
  watchProviders?: WatchProviders;
}

export interface WatchlistItem {
  id: number;
  tmdbMediaType: 'movie' | 'tv';
  title: string;
  posterUrl?: string;
  addedAt: number;
  loveProbability?: number;
  // Campos adicionados para o cache de detalhes
  synopsis?: string;
  watchProviders?: WatchProviders;
  genre?: string;
  voteAverage?: number;
  type?: MediaType;
}

// ESTRUTURA DO DESAFIO ATUALIZADA
export interface ChallengeStep {
  title: string; // Título já formatado com o ano
  tmdbId: number;
  tmdbMediaType: 'movie' | 'tv'; // Tipo de mídia guardado
  posterUrl?: string; // Pôster já guardado
  completed: boolean;
}

export interface Challenge {
  id: string;
  challengeType: string;
  reason: string;
  status: 'active' | 'completed' | 'lost';
  // Um desafio agora é sempre uma lista de passos, mesmo que tenha apenas um.
  steps: ChallengeStep[];
}


export interface RadarItem {
  id: number;
  tmdbMediaType: 'movie' | 'tv';
  title: string;
  posterUrl?: string;
  releaseDate: string;
  type: 'movie' | 'tv';
  listType: 'upcoming' | 'now_playing' | 'top_rated_provider' | 'trending' | 'top_rated' | 'popular' | 'on_the_air';
  providerId?: number;
  nextEpisodeToAir?: {
    air_date: string;
    episode_number: number;
    season_number: number;
  };
  reason?: string;

  // DADOS COMPLETOS DO TMDB (para evitar request adicional no modal)
  backdropUrl?: string;           // Backdrop 16:9
  overview?: string;               // Sinopse
  voteAverage?: number;            // Avaliação
  voteCount?: number;              // Número de votos
  genres?: string[];               // Gêneros
  runtime?: number;                // Duração (filmes)
  numberOfSeasons?: number;        // Número de temporadas (séries)
  numberOfEpisodes?: number;       // Número de episódios (séries)
  originalLanguage?: string;       // Idioma original
  originalTitle?: string;          // Título original
  popularity?: number;             // Popularidade
  adult?: boolean;                 // Conteúdo adulto
}
export type TMDbRadarItem = RadarItem;
export type RelevantRadarItem = RadarItem;

// --- FLIXPATROL API TYPES ---

export interface FlixPatrolTMDB {
  id: number;
  title: string;
  original_title?: string;
  overview: string;
  poster_path: string;
  backdrop_path: string;
  vote_average: number;
  vote_count: number;
  release_date: string;
  genres: string[];
  runtime?: number;
  number_of_seasons?: number;
}

export interface FlixPatrolItem {
  position: number;
  title: string;
  popularity: number;
  year: number;
  type: 'movie' | 'series';
  tmdb: FlixPatrolTMDB;
  timestamp: string;
}

export interface FlixPatrolResponse {
  service: string;
  date: string;
  overall?: FlixPatrolItem[];
  movies?: FlixPatrolItem[];
  tvShows?: FlixPatrolItem[];
}

export interface FlixPatrolCacheDoc {
  service: 'netflix' | 'prime' | 'disney' | 'hbo' | 'apple';
  items: RadarItem[];
  lastUpdated: number;
  expiresAt: number;
}

export type AllManagedWatchedData = {
  [key in Rating]: ManagedWatchedItem[];
};

export interface Recommendation {
  id: number;
  tmdbMediaType: 'movie' | 'tv';
  title: string;
  type: MediaType;
  genre: string;
  synopsis: string;
  probabilities: {
    amei: number;
    gostei: number;
    meh: number;
    naoGostei: number;
  };
  analysis: string;
  posterUrl?: string;
}

export interface DuelResult {
  title1: {
    title: string;
    posterUrl?: string;
    analysis: string;
    probability: number;
  };
  title2: {
    title: string;
    posterUrl?: string;
    analysis: string;
    probability: number;
  };
  verdict: string;
}

export interface TMDbSearchResult {
  id: number;
  title?: string;
  name?: string;
  overview: string;
  popularity: number;
  media_type: 'movie' | 'tv';
  poster_path: string | null;
  genre_ids: number[];
  release_date?: string;
  first_air_date?: string;
}

export type SuggestionFilters = {
  category: MediaType | null;
  genres: string[];
  keywords: string;
};

// --- NOVOS TIPOS PARA "RELEVANTES DA SEMANA" ---

export interface WeeklyRelevantItem {
  id: number;
  tmdbMediaType: 'movie' | 'tv';
  title: string;
  posterUrl?: string;
  genre: string;
  synopsis: string;
  reason: string; // O motivo pelo qual a IA recomendou este item
}

export interface WeeklyRelevantCategory {
  categoryTitle: string;
  items: WeeklyRelevantItem[];
}

export interface WeeklyRelevants {
  generatedAt: number; // Usaremos um timestamp para saber quando a lista foi gerada
  categories: WeeklyRelevantCategory[];
}

export enum View {
  MENU,
  RANDOM,
  SUGGESTION,
  PREDICT,
  COLLECTION,
  STATS,
  WATCHLIST,
  DUEL,
  RADAR,
  WEEKLY_RELEVANTS,
  CHALLENGE,
  CHAT
}

// --- NOVO TIPO PARA O MODAL COMPARTILHADO ---
export interface DisplayableItem {
  id: number;
  tmdbMediaType: 'movie' | 'tv';
  title: string;
  name?: string;
  posterUrl?: string | null;
  backdropUrl?: string | null; // 16:9 image
  releaseDate?: string;
  overview?: string;
  popularity?: number;
  poster_path?: string | null;
  genre_ids?: number[];
  media_type?: 'movie' | 'tv';
  release_date?: string;
  first_air_date?: string;
}

// --- VIDEO PLAYER TYPES ---

export interface VideoProgress {
  id: number;
  mediaType: 'movie' | 'tv';
  timestamp: number;
  duration: number;
  progress: number;
  lastUpdated: number;
  season?: number;
  episode?: number;
  lastServer?: 'videasy' | 'vidking'; // Track which server was used
}

export interface PlayerEvent {
  type: 'PLAYER_EVENT';
  data: {
    event: 'timeupdate' | 'play' | 'pause' | 'ended' | 'seeked';
    currentTime: number;
    duration: number;
    progress: number;
    id: string;
    mediaType: 'movie' | 'tv';
    season?: number;
    episode?: number;
    timestamp: number;
  };
}
