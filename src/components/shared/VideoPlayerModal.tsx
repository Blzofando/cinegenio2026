'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { X, Calendar, Clock, Star, Users, Layout } from 'lucide-react';
import Image from 'next/image';
import { useAuth } from '@/contexts/AuthContext';
import { DisplayableItem } from '@/types';
import { Button } from '@/components/ui/Button';
import { getPlayerUrl } from '@/lib/videoPlayerUtils';
import { useVideoPlayerProgress } from '@/hooks/useVideoPlayerProgress';

// Novos componentes modulares
import PlayerFrame from './VideoPlayer/PlayerFrame';
import ServerToggle from './VideoPlayer/ServerToggle';
import EpisodeSelector from './EpisodeSelector';

interface VideoPlayerModalProps {
  item: DisplayableItem;
  isOpen: boolean;
  onClose: () => void;
}

const VideoPlayerModal: React.FC<VideoPlayerModalProps> = ({ item, isOpen, onClose }) => {
  const { user } = useAuth();
  
  // Estados básicos
  const [server, setServer] = useState<'videasy' | 'vidking'>('videasy');
  const [selectedSeason, setSelectedSeason] = useState(item.season || 1);
  const [selectedEpisode, setSelectedEpisode] = useState(item.episode || 1);
  const [showEpisodeSelector, setShowEpisodeSelector] = useState(!item.episode);
  const [isHovering, setIsHovering] = useState(false);
  const [tvDetails, setTvDetails] = useState<any>(null);
  const [movieDetails, setMovieDetails] = useState<any>(null);

  // Hook customizado para progresso e estado inicial
  const {
    initialLoadDone,
    initialResumeTime,
    handlePlayerMessage
  } = useVideoPlayerProgress({
    user,
    item,
    server,
    setServer,
    selectedSeason,
    setSelectedSeason,
    selectedEpisode,
    setSelectedEpisode,
    setShowEpisodeSelector,
    movieDetails,
  });

  // Carregar detalhes (TMDB) - Mantendo aqui por enquanto para simplicidade do modal
  useEffect(() => {
    const fetchDetails = async () => {
      try {
        const type = item.tmdbMediaType === 'tv' ? 'tv' : 'movie';
        const res = await fetch(
          `https://api.themoviedb.org/3/${type}/${item.id}?api_key=${process.env.NEXT_PUBLIC_TMDB_API_KEY}&language=pt-BR&append_to_response=credits,videos`
        );
        const data = await res.json();
        if (type === 'tv') setTvDetails(data);
        else setMovieDetails(data);
      } catch (error) {
        console.error('Erro ao buscar detalhes:', error);
      }
    };

    if (isOpen) fetchDetails();
  }, [isOpen, item.id, item.tmdbMediaType]);

  // Sincronizar mensagens do iframe
  useEffect(() => {
    const messageHandler = (event: MessageEvent) => {
      if (event.data?.type === 'PLAYER_EVENT') {
        handlePlayerMessage(event.data);
      }
    };

    window.addEventListener('message', messageHandler);
    return () => window.removeEventListener('message', messageHandler);
  }, [handlePlayerMessage]);

  // Gerar URL do Player
  const playerUrl = useMemo(() => {
    const base = getPlayerUrl(item, server, selectedSeason, selectedEpisode);
    if (item.tmdbMediaType === 'movie' && initialResumeTime) {
      return `${base}?t=${initialResumeTime}`;
    }
    return base;
  }, [item, server, selectedSeason, selectedEpisode, initialResumeTime]);

  if (!isOpen) return null;

  const isTV = item.tmdbMediaType === 'tv';
  const details = isTV ? tvDetails : movieDetails;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-8 bg-black/95 backdrop-blur-xl animate-in fade-in duration-300">
      {/* Background Decorativo */}
      {item.backdropUrl && (
        <div className="absolute inset-0 z-[-1] opacity-20 overflow-hidden">
          <Image
            src={item.backdropUrl.startsWith('http') ? item.backdropUrl : `https://image.tmdb.org/t/p/original${item.backdropUrl}`}
            alt=""
            fill
            className="object-cover blur-3xl scale-110"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black via-transparent to-black" />
        </div>
      )}

      {/* Botão Fechar */}
      <Button
        variant="glass"
        size="icon"
        onClick={onClose}
        className="absolute top-6 right-6 rounded-full transition-all hover:rotate-90 z-[110] p-3"
      >
        <X className="w-6 h-6 text-white" />
      </Button>

      <div className="w-full max-w-7xl h-full flex flex-col gap-6 overflow-y-auto custom-scrollbar pr-2">
        {/* Header/Info */}
        <div className="flex flex-col md:flex-row gap-6 mt-12 md:mt-0">
          <div className="flex-1 space-y-4">
            <h2 className="text-3xl md:text-5xl font-bold text-white tracking-tight">
              {item.title || item.name}
            </h2>
            
            <div className="flex flex-wrap items-center gap-4 text-gray-400 text-sm md:text-base">
              {details?.release_date && (
                <span className="flex items-center gap-1.5 bg-white/5 px-3 py-1 rounded-full border border-white/10">
                  <Calendar className="w-4 h-4 text-purple-400" />
                  {new Date(details.release_date).getFullYear()}
                </span>
              )}
              {details?.runtime && (
                <span className="flex items-center gap-1.5 bg-white/5 px-3 py-1 rounded-full border border-white/10">
                  <Clock className="w-4 h-4 text-purple-400" />
                  {details.runtime} min
                </span>
              )}
              <span className="flex items-center gap-1.5 bg-white/5 px-3 py-1 rounded-full border border-white/10">
                <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                {details?.vote_average?.toFixed(1) || 'N/A'}
              </span>
              <span className="px-3 py-1 rounded-full border border-white/10 bg-purple-500/10 text-purple-400 font-bold uppercase tracking-wider text-xs">
                {item.tmdbMediaType === 'tv' ? 'Série' : 'Filme'}
              </span>
            </div>

            <p className="text-gray-300 text-base md:text-lg leading-relaxed max-w-3xl line-clamp-3 md:line-clamp-none">
              {item.overview}
            </p>
          </div>
        </div>

        {/* Player Area */}
        <div className="relative group/player">
          {(!isTV || !showEpisodeSelector) && (
            <PlayerFrame 
              playerUrl={playerUrl} 
              onMouseEnter={() => setIsHovering(true)}
              onMouseLeave={() => setIsHovering(false)}
            >
              <ServerToggle 
                server={server} 
                onToggle={() => setServer(server === 'videasy' ? 'vidking' : 'videasy')} 
              />
              
              {isTV && (
                <Button
                  variant="outline-purple"
                  onClick={() => setShowEpisodeSelector(true)}
                  className="absolute top-4 right-4 bg-black/40 hover:bg-black/60 backdrop-blur-md"
                >
                  Selecionar Episódio
                </Button>
              )}
            </PlayerFrame>
          )}

          {/* Seletor de Episódios */}
          {isTV && showEpisodeSelector && tvDetails && (
            <div className="bg-zinc-900/50 backdrop-blur-xl rounded-2xl border border-white/10 p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold flex items-center gap-2">
                  <Layout className="w-5 h-5 text-purple-500" />
                  Episódios
                </h3>
              </div>
              <EpisodeSelector
                showId={item.id}
                onSelect={(season, ep) => {
                  setSelectedSeason(season);
                  setSelectedEpisode(ep);
                  setShowEpisodeSelector(false);
                }}
                onClose={() => setShowEpisodeSelector(false)}
              />
            </div>
          )}
        </div>

        {/* Footer/Elenco */}
        {details?.credits?.cast && (
          <div className="space-y-4">
            <h4 className="text-lg font-semibold flex items-center gap-2 text-white/80">
              <Users className="w-5 h-5 text-purple-500" />
              Elenco Principal
            </h4>
            <div className="flex gap-4 overflow-x-auto pb-4 custom-scrollbar">
              {details.credits.cast.slice(0, 10).map((person: any) => (
                <div key={person.id} className="flex-shrink-0 w-24 md:w-32 group">
                  <div className="relative aspect-[2/3] rounded-xl overflow-hidden bg-zinc-800 mb-2 border border-white/10 group-hover:border-purple-500/50 transition-colors">
                    <Image
                      src={person.profile_path ? `https://image.tmdb.org/t/p/w185${person.profile_path}` : '/placeholder-actor.jpg'}
                      alt={person.name}
                      fill
                      className="object-cover group-hover:scale-110 transition-transform duration-500"
                    />
                  </div>
                  <p className="text-xs md:text-sm font-medium text-white truncate">{person.name}</p>
                  <p className="text-[10px] md:text-xs text-gray-400 truncate">{person.character}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default VideoPlayerModal;
