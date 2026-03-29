import { DisplayableItem } from '@/types';

// ===== TIPOS DE SERVIDOR =====
export type ServerType = 'videasy' | 'vidking' | 'embedplay' | 'superflix' | 'megaembed' | 'embedmovies';

export interface ServerConfig {
  id: ServerType;
  name: string;
  region: 'global' | 'br';
  regionLabel: string;
  autoProgress: boolean;
}

// ===== CATÁLOGO DE SERVIDORES =====
export const SERVERS: ServerConfig[] = [
  { id: 'videasy',     name: 'Videasy',      region: 'global', regionLabel: '🌍 Global', autoProgress: true },
  { id: 'vidking',     name: 'Vidking',       region: 'global', regionLabel: '🌍 Global', autoProgress: true },
  { id: 'embedplay',   name: 'EmbedPlay',     region: 'br',     regionLabel: '🇧🇷 Brasil', autoProgress: false },
  { id: 'superflix',   name: 'SuperFlix',     region: 'br',     regionLabel: '🇧🇷 Brasil', autoProgress: false },
  { id: 'megaembed',   name: 'MegaEmbed',     region: 'br',     regionLabel: '🇧🇷 Brasil', autoProgress: false },
  { id: 'embedmovies', name: 'EmbedMovies',   region: 'br',     regionLabel: '🇧🇷 Brasil', autoProgress: false },
];

export const DEFAULT_SERVER: ServerType = 'videasy';

// ===== GERADOR DE URL =====
export const getPlayerUrl = (
  item: DisplayableItem,
  server: ServerType,
  selectedSeason?: number,
  selectedEpisode?: number
): string => {
  const id = item.id;
  const isTV = item.tmdbMediaType === 'tv';
  const s = selectedSeason;
  const e = selectedEpisode;

  switch (server) {
    case 'videasy':
      return isTV
        ? `https://player.videasy.net/tv/${id}/${s}/${e}`
        : `https://player.videasy.net/movie/${id}`;

    case 'vidking':
      return isTV
        ? `https://www.vidking.net/embed/tv/${id}/${s}/${e}`
        : `https://www.vidking.net/embed/movie/${id}`;

    case 'embedplay':
      return isTV
        ? `https://embedplayapi.site/embed/${id}/${s}/${e}`
        : `https://embedplayapi.site/embed/${id}`;

    case 'superflix':
      return isTV
        ? `https://superflixapi.rest/serie/${id}/${s}/${e}`
        : `https://superflixapi.rest/filme/${id}`;

    case 'megaembed':
      return isTV
        ? `https://megaembed.com/embed/${id}/${s}/${e}`
        : `https://megaembed.com/embed/${id}`;

    case 'embedmovies':
      return isTV
        ? `https://cdn-embed.com/serie/${id}/${s}/${e}`
        : `https://cdn-embed.com/filme/${id}`;

    default:
      return isTV
        ? `https://player.videasy.net/tv/${id}/${s}/${e}`
        : `https://player.videasy.net/movie/${id}`;
  }
};
