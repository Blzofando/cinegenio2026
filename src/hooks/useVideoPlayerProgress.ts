import { useState, useEffect, useRef, useCallback } from 'react';
import { serverTimestamp } from 'firebase/firestore';
import { handlePlayerEvent } from '@/lib/videoProgressService';
import { swapToNextEpisode, saveDualEpisodes } from '@/lib/dualEpisodeService';
import { getDocument, setDocument } from '@/lib/firebase/core';
import { DisplayableItem, PlayerEvent, PlayerPhase } from '@/types';
import { ServerType, DEFAULT_SERVER } from '@/lib/videoPlayerUtils';
import { getSeasonEpisodes } from '@/lib/services/seriesMetadataCache';

interface UseVideoPlayerProgressProps {
    user: any;
    item: DisplayableItem;
    server: ServerType;
    setServer: (server: ServerType) => void;
    selectedSeason: number;
    setSelectedSeason: (s: number) => void;
    selectedEpisode: number;
    setSelectedEpisode: (e: number) => void;
    setShowEpisodeSelector: (show: boolean) => void;
    movieDetails: any;
}

export const useVideoPlayerProgress = ({
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
}: UseVideoPlayerProgressProps) => {
    const [initialLoadDone, setInitialLoadDone] = useState(false);
    const [initialResumeTime, setInitialResumeTime] = useState<number | null>(null);
    const [lastTimestamp, setLastTimestamp] = useState<number>(0);
    const [lastDuration, setLastDuration] = useState<number>(0);
    const [initialPhase, setInitialPhase] = useState<PlayerPhase>('server-select');
    const lastTimestampRef = useRef<number>(0);
    const lastDurationRef = useRef<number>(0);
    const hasSwappedRef = useRef<boolean>(false);
    const lastSaveTimeRef = useRef<number>(0);

    // Reset swapped flag when episode changes
    useEffect(() => {
        hasSwappedRef.current = false;
    }, [selectedSeason, selectedEpisode]);
    useEffect(() => {
        const loadInitialState = async () => {
            if (!user) {
                setInitialLoadDone(true);
                return;
            }

            try {
                const docId = item.tmdbMediaType === 'movie' ? `movie_${item.id}` : `tv_${item.id}`;
                const data = await getDocument<any>(`users/${user.uid}/nowWatching/${docId}`);

                if (data) {
                    // Já existe dados salvos — restaurar servidor
                    if (data.lastServer) setServer(data.lastServer);
                    
                    if (item.tmdbMediaType === 'movie') {
                        setInitialResumeTime(data.timestamp || 0);
                        setLastTimestamp(data.timestamp || 0);
                        // Filme com dados salvos → ir direto pro player
                        setInitialPhase('playing');
                    } else if (item.tmdbMediaType === 'tv') {
                        if (data.season && data.episode) {
                            setSelectedSeason(data.season);
                            setSelectedEpisode(data.episode);
                            setShowEpisodeSelector(false);
                            // Série com dados salvos → ir direto pro player
                            setInitialPhase('playing');
                        } else {
                            // Série sem dados de episódio → forçar seleção
                            setInitialPhase('episode-select');
                        }
                    }
                } else {
                    // Primeira vez — mostrar seletor
                    if (item.tmdbMediaType === 'movie') {
                        setInitialResumeTime(0);
                        setInitialPhase('server-select');
                    } else {
                        setInitialPhase('episode-select');
                    }
                }
            } catch (error) {
                console.error('[useVideoPlayerProgress] Load error:', error);
                // Fallback: servidor select
                if (item.tmdbMediaType === 'movie') {
                    setInitialPhase('server-select');
                } else {
                    setInitialPhase('episode-select');
                }
            } finally {
                setInitialLoadDone(true);
            }
        };

        loadInitialState();
    }, [user, item.id, item.tmdbMediaType]);

    const saveCurrentProgress = useCallback(async (force = false) => {
        if (!user) return;

        const now = Date.now();
        // Constant throttle de 30 segundos, ignorado se forçar (fechamento ou primeiro save)
        if (!force && lastSaveTimeRef.current > 0 && now - lastSaveTimeRef.current < 30000) {
            return;
        }

        try {
            // ⭐ SEMPRE salvar no documento principal do item (o que o useWatchStatus lê) ⭐
            const docId = item.tmdbMediaType === 'movie' ? `movie_${item.id}` : `tv_${item.id}`;
            const path = `users/${user.uid}/nowWatching/${docId}`;
            
            const data: any = {
                timestamp: lastTimestampRef.current,
                duration: lastDurationRef.current,
                lastWatchedAt: serverTimestamp(),
            };

            if (item.tmdbMediaType === 'tv') {
                data.season = selectedSeason;
                data.episode = selectedEpisode;
            }

            await setDocument(path, data, { merge: true } as any);
            lastSaveTimeRef.current = now;

            // Se for série, também salva na subcoleção de episódios para histórico detalhado
            if (item.tmdbMediaType === 'tv') {
                const epPath = `${path}/episodes/s${selectedSeason}e${selectedEpisode}`;
                await setDocument(epPath, {
                    timestamp: lastTimestampRef.current,
                    duration: lastDurationRef.current,
                    lastWatchedAt: serverTimestamp(),
                    viewed: true
                }, { merge: true } as any);
            }
        } catch (error) {
            console.error('[useVideoPlayerProgress] Save error:', error);
        }
    }, [user, item.id, item.tmdbMediaType, selectedSeason, selectedEpisode]);

    // Initializer to establish dual-episode structure and save start
    const initPlayback = useCallback(async () => {
        if (!user) return;

        // ─── FALLBACK DE DURAÇÃO VIA TMDB (Filmes) ───
        // Se o player ainda não enviou a duração via postMessage, usamos o runtime
        // do TMDB convertido para segundos como valor inicial. Evita duration=0 no Firebase.
        if (item.tmdbMediaType === 'movie' && movieDetails?.runtime && lastDurationRef.current === 0) {
            const tmdbDurationSec = Math.round(movieDetails.runtime * 60);
            lastDurationRef.current = tmdbDurationSec;
            setLastDuration(tmdbDurationSec);
            console.log('[initPlayback] Usando duração TMDB como fallback:', tmdbDurationSec, 's');
        }

        await saveCurrentProgress(true); // Força um save assim que o play começa

        if (item.tmdbMediaType !== 'tv') return;

        try {
            // Find next episode
            const episodes = await getSeasonEpisodes(item.id, selectedSeason);
            const nextEpInSeason = episodes.find(e => e.episode_number === selectedEpisode + 1);
            
            let nextEpisode = null;
            if (nextEpInSeason && nextEpInSeason.isAvailable) {
                nextEpisode = { season: selectedSeason, episode: selectedEpisode + 1 };
            } else {
                // Try first episode of next season
                const nextSeasonEpisodes = await getSeasonEpisodes(item.id, selectedSeason + 1);
                if (nextSeasonEpisodes.length > 0 && nextSeasonEpisodes[0].isAvailable) {
                    nextEpisode = { season: selectedSeason + 1, episode: 1 };
                }
            }

            await saveDualEpisodes(
                user.uid,
                item.id,
                item.title || item.name || '',
                item.posterUrl || undefined,
                item.backdropUrl || undefined,
                { season: selectedSeason, episode: selectedEpisode },
                nextEpisode,
                server,
                lastTimestampRef.current,
                lastDurationRef.current
            );
        } catch (e) {
            console.error('[initPlayback] Error saving dual episodes:', e);
        }
    }, [user, item, selectedSeason, selectedEpisode, server, saveCurrentProgress]);

    // Handle player messages (Universal Translator for different players)
    const handlePlayerMessage = async (rawMessage: any) => {
        let data = rawMessage?.data || rawMessage;
        
        // Se for string, tenta decodificar (players podem usar JSON.stringify)
        if (typeof data === 'string') {
            try {
                data = JSON.parse(data);
            } catch (e) {
                // Ignorar se não for JSON válido
            }
        }
        
        if (user) {
            // ─── CAPTURA DO TIMESTAMP (tempo atual) ───
            // Prioridade: 'timestamp' (Videasy/Vidking Global) → 'currentTime' → demais formatos
            let rawTime: any =
                data?.timestamp        ?? data?.data?.timestamp        ?? // 🌍 Videasy & Vidking (Global)
                data?.currentTime      ?? data?.data?.currentTime      ?? // padrão HTML5
                data?.time             ?? data?.data?.time             ??
                data?.seconds          ?? data?.data?.seconds          ??
                data?.position         ?? data?.data?.position         ??
                data?.pos              ?? data?.data?.pos;

            // 🛡️ GUARD Timestamp — Vidking envia Unix timestamp em ms (ex: 1774817707966).
            // Posições de vídeo válidas são sempre < 86400s (24h). Descarta e tenta alternativas.
            if (rawTime !== undefined && rawTime !== null && Number(rawTime) > 86400) {
                rawTime =
                    data?.currentTime ?? data?.data?.currentTime ??
                    data?.ct          ?? data?.data?.ct          ??
                    undefined;
            }

            const incomingTime = rawTime;

            // ─── CAPTURA DA DURAÇÃO ───
            let rawDuration: any =
                data?.duration ?? data?.data?.duration ??
                data?.length   ?? data?.data?.length   ??
                data?.total    ?? data?.data?.total;

            // 🛡️ GUARD Duração — pode vir em ms (ex: 7200000 para 2h em vez de 7200s).
            // Tenta converter ms→s. Se ainda > 86400 após conversão, descarta como inválido.
            if (rawDuration !== undefined && rawDuration !== null) {
                const rawDur = Number(rawDuration);
                if (!isNaN(rawDur) && rawDur > 86400) {
                    const converted = Math.floor(rawDur / 1000);
                    rawDuration = (converted > 0 && converted <= 86400) ? converted : undefined;
                }
            }

            const incomingDuration = rawDuration;

            // ─── FALLBACK: calcular posição via progress% × duration ───
            // Usado quando o timestamp foi descartado (Vidking Unix ms) mas
            // `progress` (%) e `duration` chegam corretos — permite seek Vidking→Videasy.
            let calculatedTime: number | undefined;
            if (incomingTime === undefined) {
                const rawProgress = data?.progress ?? data?.data?.progress;
                const durForCalc = incomingDuration !== undefined
                    ? Number(incomingDuration)
                    : lastDurationRef.current;

                if (rawProgress !== undefined && !isNaN(Number(rawProgress)) && durForCalc > 0) {
                    const pct = Number(rawProgress);
                    if (pct >= 0 && pct <= 100) {
                        calculatedTime = Math.floor((pct / 100) * durForCalc);
                    }
                }
            }

            const resolvedTime = incomingTime ?? calculatedTime;

            if (process.env.NODE_ENV === 'development') {
                if (resolvedTime !== undefined || incomingDuration !== undefined) {
                    console.log('[Player MSG]', {
                        raw: data,
                        resolvedTime,
                        incomingDuration,
                        fromProgress: incomingTime === undefined && calculatedTime !== undefined,
                    });
                }
            }

            let shouldSave = false;

            // ─── PROCESSAR TIMESTAMP ───
            if (resolvedTime !== undefined && resolvedTime !== null && !isNaN(Number(resolvedTime))) {
                const ts = Math.floor(Number(resolvedTime));
                // Impede que um "0" solto sobreponha o tempo real (mensagem errática)
                if (ts > 0 || lastTimestampRef.current === 0) {
                    setLastTimestamp(ts);
                    lastTimestampRef.current = ts;
                    shouldSave = true;
                }
            }

            // ─── PROCESSAR DURAÇÃO ───
            // Capturada INDEPENDENTEMENTE do timestamp — registrada desde o primeiro frame.
            if (incomingDuration !== undefined && incomingDuration !== null && !isNaN(Number(incomingDuration))) {
                const dur = Math.floor(Number(incomingDuration));
                // Salva apenas se: válido (>0) E diferente do atual (sem writes desnecessários)
                if (dur > 0 && dur !== lastDurationRef.current) {
                    setLastDuration(dur);
                    lastDurationRef.current = dur;
                    shouldSave = true;
                }
            }

            if (shouldSave) {
                const progress = lastDurationRef.current > 0
                    ? (lastTimestampRef.current / lastDurationRef.current) * 100
                    : 0;

                // Trocar para próximo episódio (Séries)
                if (item.tmdbMediaType === 'tv' && progress >= 90 && !hasSwappedRef.current) {
                    hasSwappedRef.current = true;
                    await swapToNextEpisode(user.uid, item.id, selectedSeason, selectedEpisode);
                }

                // Salva o progresso (forçado na primeira mensagem para fixar o doc no Firebase)
                await saveCurrentProgress(lastSaveTimeRef.current === 0);
            }
        }
    };

    return {
        initialLoadDone,
        initialResumeTime,
        initialPhase,
        lastTimestamp,
        handlePlayerMessage,
        saveCurrentProgress,
        initPlayback,
    };
};
