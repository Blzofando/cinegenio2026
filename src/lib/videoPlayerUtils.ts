import { DisplayableItem } from '@/types';

export const getPlayerUrl = (
  item: DisplayableItem,
  server: 'videasy' | 'vidking',
  selectedSeason?: number,
  selectedEpisode?: number
) => {
  const isTV = item.tmdbMediaType === 'tv';
  
  if (server === 'videasy') {
    const baseUrl = 'https://player.videasy.online';
    return isTV
      ? `${baseUrl}/tv/${item.id}/${selectedSeason}/${selectedEpisode}`
      : `${baseUrl}/movie/${item.id}`;
  } else {
    const baseUrl = 'https://api.vidking.link/embed';
    return isTV
      ? `${baseUrl}/tv/${item.id}/${selectedSeason}/${selectedEpisode}`
      : `${baseUrl}/movie/${item.id}`;
  }
};
