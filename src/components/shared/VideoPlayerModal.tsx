'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { X, Layout, Server } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { DisplayableItem, PlayerPhase } from '@/types';
import { Button } from '@/components/ui/Button';
import { getPlayerUrl, ServerType, DEFAULT_SERVER } from '@/lib/videoPlayerUtils';
import { useVideoPlayerProgress } from '@/hooks/useVideoPlayerProgress';
import { saveStartWatching } from '@/lib/nowWatchingService';

// Componentes modulares
import PlayerFrame from './VideoPlayer/PlayerFrame';
import ServerToggle from './VideoPlayer/ServerToggle';
import ServerSelector from './VideoPlayer/ServerSelector';
import EpisodeSelector from './EpisodeSelector';

interface VideoPlayerModalProps {
  item: DisplayableItem;
  isOpen: boolean;
  onClose: () => void;
}

const VideoPlayerModal: React.FC<VideoPlayerModalProps> = ({ item, isOpen, onClose }) => {
  const { user } = useAuth();

  // Estados básicos
  const [server, setServer] = useState<ServerType>(DEFAULT_SERVER);
  const [selectedSeason, setSelectedSeason] = useState(item.season || 1);
  const [selectedEpisode, setSelectedEpisode] = useState(item.episode || 1);
  const [showEpisodeSelector, setShowEpisodeSelector] = useState(!item.episode);
  const [phase, setPhase] = useState<PlayerPhase>('server-select');

  // Hook customizado para progresso e estado inicial
  const {
    initialLoadDone,
    initialResumeTime,
    initialPhase,
    handlePlayerMessage,
    initPlayback,
    saveCurrentProgress,
    lastTimestamp,
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
    movieDetails: null,
  });

  // Posição de seek estática
  const [seekOnLoad, setSeekOnLoad] = useState<number>(0);

  // Sincronizar fase com o estado inicial do Firebase
  useEffect(() => {
    if (initialLoadDone) {
      setPhase(initialPhase);
      if (initialResumeTime && initialResumeTime > 0) {
        setSeekOnLoad(initialResumeTime);
      }
    }
  }, [initialLoadDone, initialPhase, initialResumeTime]);

  // Iniciar lógicas avançadas assim que chegar no player
  useEffect(() => {
    if (phase === 'playing') {
      initPlayback();
    }
  }, [phase, initPlayback]);

  // Sincronizar mensagens do iframe
  useEffect(() => {
    const messageHandler = (event: MessageEvent) => {
      if (
        typeof event.data === 'string' && event.data.includes('react-devtools') ||
        event.data?.source?.includes('react-devtools')
      ) {
        return;
      }
      handlePlayerMessage(event.data);
    };

    window.addEventListener('message', messageHandler);
    return () => window.removeEventListener('message', messageHandler);
  }, [handlePlayerMessage]);

  // === HANDLERS ===

  const handleClose = useCallback(() => {
    if (phase === 'playing') saveCurrentProgress(true);
    onClose();
  }, [phase, saveCurrentProgress, onClose]);

  const handleServerSelect = useCallback(async (selectedServer: ServerType) => {
    setServer(selectedServer);

    if (user) {
      try {
        await saveStartWatching(user.uid, {
          id: item.id,
          mediaType: item.tmdbMediaType,
          title: item.title || item.name || '',
          posterUrl: item.posterUrl || undefined,
          backdropUrl: item.backdropUrl || undefined,
          lastServer: selectedServer,
          season: item.tmdbMediaType === 'tv' ? selectedSeason : undefined,
          episode: item.tmdbMediaType === 'tv' ? selectedEpisode : undefined,
          timestamp: 0,
        });
      } catch (error) {
        console.error('[VideoPlayerModal] Save error:', error);
      }
    }

    setPhase('playing');
  }, [user, item, selectedSeason, selectedEpisode]);

  const handleEpisodeSelect = useCallback((season: number, ep: number) => {
    setSelectedSeason(season);
    setSelectedEpisode(ep);
    setShowEpisodeSelector(false);
    setPhase('server-select');
  }, []);

  const handleServerChange = useCallback(async (newServer: ServerType) => {
    const SERVERS_WITH_SEEK: ServerType[] = ['videasy', 'vidking'];
    if (SERVERS_WITH_SEEK.includes(newServer) && lastTimestamp > 0) {
      setSeekOnLoad(lastTimestamp);
    } else {
      setSeekOnLoad(0);
    }

    setServer(newServer);

    if (user) {
      try {
        await saveStartWatching(user.uid, {
          id: item.id,
          mediaType: item.tmdbMediaType,
          title: item.title || item.name || '',
          posterUrl: item.posterUrl || undefined,
          backdropUrl: item.backdropUrl || undefined,
          lastServer: newServer,
          season: item.tmdbMediaType === 'tv' ? selectedSeason : undefined,
          episode: item.tmdbMediaType === 'tv' ? selectedEpisode : undefined,
        });
      } catch (error) {
        console.error('[VideoPlayerModal] Server change save error:', error);
      }
    }
  }, [user, item, selectedSeason, selectedEpisode, lastTimestamp]);

  // Gerar URL do Player
  const playerUrl = useMemo(() => {
    const SERVERS_WITH_SEEK: ServerType[] = ['videasy', 'vidking'];
    const seekTime = SERVERS_WITH_SEEK.includes(server) && item.tmdbMediaType === 'movie'
      ? seekOnLoad
      : undefined;

    return getPlayerUrl(item, server, selectedSeason, selectedEpisode, seekTime);
  }, [item, server, selectedSeason, selectedEpisode, seekOnLoad]);

  if (!isOpen) return null;

  const isTV = item.tmdbMediaType === 'tv';

  return (
    /* Overlay — clique fora fecha */
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={handleClose}
    >
      {/* Container do modal — clique interno não fecha */}
      <div
        className="relative w-full mx-4 md:mx-8"
        style={{ maxWidth: '960px', maxHeight: '95dvh' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Barra superior: título + botão fechar */}
        <div className="flex items-center justify-between mb-2 px-1">
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-white font-semibold text-base md:text-lg truncate">
              {item.title || item.name}
            </span>
            {isTV && phase === 'playing' && (
              <span className="text-xs text-gray-400 shrink-0">
                S{selectedSeason}E{selectedEpisode}
              </span>
            )}
          </div>

          <button
            onClick={handleClose}
            aria-label="Fechar player"
            className="shrink-0 ml-3 w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 border border-white/10 flex items-center justify-center transition-all hover:rotate-90 duration-200"
          >
            <X className="w-4 h-4 text-white" />
          </button>
        </div>

        {/* Corpo do modal */}
        <div className="bg-zinc-950 rounded-2xl border border-white/10 overflow-hidden shadow-2xl">

          {/* FASE 1: Seleção de Episódio */}
          {phase === 'episode-select' && isTV && (
            <div className="p-4 md:p-6" style={{ maxHeight: '80dvh', overflowY: 'auto' }}>
              <div className="flex items-center gap-2 mb-4">
                <Layout className="w-4 h-4 text-purple-400" />
                <h3 className="text-base font-bold text-white">Selecione o Episódio</h3>
              </div>
              <EpisodeSelector
                showId={item.id}
                onSelect={handleEpisodeSelect}
                onClose={onClose}
              />
            </div>
          )}

          {/* FASE 2: Seleção de Servidor */}
          {phase === 'server-select' && (
            <div className="p-4 md:p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 rounded-xl bg-purple-500/20 flex items-center justify-center shrink-0">
                  <Server className="w-4 h-4 text-purple-400" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Escolha o Servidor</h3>
                  {isTV && (
                    <p className="text-xs text-gray-400">
                      S{selectedSeason}E{selectedEpisode}
                    </p>
                  )}
                </div>
              </div>

              <ServerSelector
                activeServer={null}
                onSelect={handleServerSelect}
              />
            </div>
          )}

          {/* FASE 3: Player reproduzindo */}
          {phase === 'playing' && (
            <div className="relative">
              <PlayerFrame playerUrl={playerUrl}>
                <ServerToggle
                  server={server}
                  onSelect={handleServerChange}
                />

                {isTV && (
                  <Button
                    variant="outline-purple"
                    onClick={() => setPhase('episode-select')}
                    className="absolute top-3 right-3 text-xs py-1 px-3 bg-black/50 hover:bg-black/70 backdrop-blur-md"
                  >
                    Episódios
                  </Button>
                )}
              </PlayerFrame>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default VideoPlayerModal;
