"use client";

import React, { useState, useEffect } from 'react';
import { X, RefreshCw } from 'lucide-react';
import { DisplayableItem } from '@/types';
import { useAuth } from '@/contexts/AuthContext';
import { getProgress, handlePlayerEvent } from '@/lib/videoProgressService';
import { saveStartWatching, saveStopWatching } from '@/lib/nowWatchingService';
import { saveDualEpisodes, swapToNextEpisode } from '@/lib/dualEpisodeService';
import { PlayerEvent } from '@/types';
import EpisodeSelector from './EpisodeSelector';
import { collection, getDocs, doc as firestoreDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase/client';

interface VideoPlayerModalProps {
    item: DisplayableItem;
    onClose: () => void;
}

type Server = 'videasy' | 'vidking';

const VideoPlayerModal: React.FC<VideoPlayerModalProps> = ({ item, onClose }) => {
    const { user } = useAuth();
    const [server, setServer] = useState<Server>('videasy');

    // Check if season/episode are provided (from Continue Watching)
    const hasEpisodeInfo = item.tmdbMediaType === 'tv' && 'season' in item && 'episode' in item;
    const [showEpisodeSelector, setShowEpisodeSelector] = useState(item.tmdbMediaType === 'tv' && !hasEpisodeInfo);
    const [selectedSeason, setSelectedSeason] = useState<number>(hasEpisodeInfo && 'season' in item ? (item as any).season : 1);
    const [selectedEpisode, setSelectedEpisode] = useState<number>(hasEpisodeInfo && 'episode' in item ? (item as any).episode : 1);

    const [playerUrl, setPlayerUrl] = useState<string>('');
    const [showServerButton, setShowServerButton] = useState(false);
    const [tvDetails, setTvDetails] = useState<any>(null);
    const [movieDetails, setMovieDetails] = useState<any>(null);
    const [initialLoadDone, setInitialLoadDone] = useState(false);
    const [lastTimestamp, setLastTimestamp] = useState<number>(0);
    const [lastDuration, setLastDuration] = useState<number>(0);
    const lastTimestampRef = React.useRef<number>(0); // Ref for immediate access in handlers
    const lastDurationRef = React.useRef<number>(0);
    const [initialResumeTime, setInitialResumeTime] = useState<number | null>(null);

    console.log('[VideoPlayer] Initial state:', { hasEpisodeInfo, selectedSeason, selectedEpisode, item });

    // Load lastServer from nowWatching FIRST
    useEffect(() => {
        const loadServer = async () => {
            if (!user) {
                setInitialLoadDone(true);
                return;
            }

            try {
                const nowWatchingRef = collection(db, 'users', user.uid, 'nowWatching');
                const snapshot = await getDocs(nowWatchingRef);

                const docId = item.tmdbMediaType === 'movie'
                    ? `movie_${item.id}`
                    : `tv_${item.id}`;

                const matchingDoc = snapshot.docs.find(doc => doc.id.startsWith(docId));

                if (matchingDoc) {
                    const data = matchingDoc.data();
                    console.log('[VideoPlayer] ✅ LOADED from Firebase:', data);

                    if (data.lastServer) {
                        setServer(data.lastServer as Server);
                        console.log('[VideoPlayer] 🎯 Server set to:', data.lastServer);
                    }

                    // ✅ Resume timestamp from nowWatching (for movies)
                    if (item.tmdbMediaType === 'movie' && data.timestamp && data.timestamp > 0) {
                        setLastTimestamp(data.timestamp); // Store for saving later
                        setInitialResumeTime(data.timestamp); // Store for URL generation
                        console.log('[VideoPlayer] 🕒 Loaded timestamp from nowWatching:', data.timestamp);
                    }

                    if (item.tmdbMediaType === 'tv' && data.season && data.episode) {
                        setSelectedSeason(data.season);
                        setSelectedEpisode(data.episode);
                        setShowEpisodeSelector(false);
                    }
                }
            } catch (error) {
                console.error('[VideoPlayer] Error loading:', error);
            } finally {
                setInitialLoadDone(true);
            }
        };

        loadServer();
    }, [user, item.id, item.tmdbMediaType]);

    // SAVE MOVIES immediately after loading
    useEffect(() => {
        if (!user || !initialLoadDone) return;
        if (item.tmdbMediaType !== 'movie') return; // Only movies
        if (!movieDetails) return; // Wait for movie details (runtime)

        const saveMovie = async () => {
            const durationSecons = movieDetails.runtime ? movieDetails.runtime * 60 : 0;

            await saveStartWatching(user.uid, {
                id: item.id,
                mediaType: item.tmdbMediaType,
                title: item.title || item.name || 'Unknown',
                posterUrl: item.posterUrl || undefined,
                backdropUrl: item.backdropUrl || undefined,
                lastServer: server,
                timestamp: 0,
                duration: durationSecons,
            });
            console.log('[VideoPlayer] 💾 Saved movie start to nowWatching with duration:', durationSecons);
        };

        saveMovie();
    }, [user, initialLoadDone, server, item, movieDetails]);

    // SAVE dual episodes for TV SERIES AFTER loading (current + next)
    useEffect(() => {
        if (!user || !initialLoadDone || !tvDetails) return;
        if (item.tmdbMediaType !== 'tv') return; // Only TV series

        const saveBothEpisodes = async () => {
            // Find next episode
            const currentSeasonData = tvDetails.seasons?.find(
                (s: any) => s.season_number === selectedSeason
            );

            let nextSeason = selectedSeason;
            let nextEpisode = selectedEpisode + 1;
            let hasNext = false;

            if (currentSeasonData && nextEpisode > currentSeasonData.episode_count) {
                const nextSeasonData = tvDetails.seasons?.find(
                    (s: any) => s.season_number === selectedSeason + 1 && s.season_number > 0
                );
                if (nextSeasonData) {
                    nextSeason = selectedSeason + 1;
                    nextEpisode = 1;
                    hasNext = true;
                }
            } else if (currentSeasonData) {
                hasNext = true;
            }

            // Save current (viewed:true) + next (viewed:false) with full data
            await saveDualEpisodes(
                user.uid,
                item.id,
                item.title || item.name || 'Unknown',
                item.posterUrl || undefined,
                item.backdropUrl || undefined, // ✅ Pass backdrop 16:9
                { season: selectedSeason, episode: selectedEpisode },
                hasNext ? { season: nextSeason, episode: nextEpisode } : null,
                server,
                0, // timestamp (will be updated by player)
                0  // currentDuration (will be fetched from TMDB)
            );

            console.log('[VideoPlayer] 💾 Saved dual episodes (current + next) with full TMDB data');
        };

        // ❌ NÃO SALVAR se seletor estiver aberto (usuário ainda não escolheu)
        if (showEpisodeSelector) {
            console.log('[VideoPlayer] ⏸️ Seletor aberto - aguardando escolha do usuário');
            return;
        }

        saveBothEpisodes();
    }, [user, initialLoadDone, tvDetails, server, selectedSeason, selectedEpisode, item, showEpisodeSelector]);

    // Fetch TV details
    useEffect(() => {
        if (item.tmdbMediaType !== 'tv') return;

        const fetchTVDetails = async () => {
            try {
                const response = await fetch(
                    `https://api.themoviedb.org/3/tv/${item.id}?api_key=${process.env.NEXT_PUBLIC_TMDB_API_KEY}&language=pt-BR`
                );
                const data = await response.json();
                setTvDetails(data);
            } catch (error) {
                console.error('Error fetching TV details:', error);
            }
        };

        fetchTVDetails();
        fetchTVDetails();
    }, [item.id, item.tmdbMediaType]);

    // Fetch MOVIE details (for runtime)
    useEffect(() => {
        if (item.tmdbMediaType !== 'movie') return;

        const fetchMovieDetails = async () => {
            try {
                const response = await fetch(
                    `https://api.themoviedb.org/3/movie/${item.id}?api_key=${process.env.NEXT_PUBLIC_TMDB_API_KEY}&language=pt-BR`
                );
                const data = await response.json();
                setMovieDetails(data);
            } catch (error) {
                console.error('Error fetching movie details:', error);
            }
        };

        fetchMovieDetails();
    }, [item.id, item.tmdbMediaType]);

    // Save server changes IMMEDIATELY to Firebase
    useEffect(() => {
        if (!user || !initialLoadDone) return;

        const saveServerChange = async () => {
            try {
                const docId = item.tmdbMediaType === 'movie'
                    ? `movie_${item.id}`
                    : `tv_${item.id}`;

                const docRef = firestoreDoc(db, 'users', user.uid, 'nowWatching', docId);

                await setDoc(docRef, {
                    lastServer: server,
                    lastWatchedAt: serverTimestamp(),
                }, { merge: true });

                console.log(`[VideoPlayer] 💾 Server changed to: ${server}`);
            } catch (error) {
                console.error('[VideoPlayer] Error saving server:', error);
            }
        };

        saveServerChange();
    }, [server, user, initialLoadDone, item.id, item.tmdbMediaType]);

    // Build player URL
    useEffect(() => {
        const buildUrl = async () => {
            if (showEpisodeSelector) return;

            const baseUrl = server === 'videasy'
                ? 'https://player.videasy.net'
                : 'https://www.vidking.net/embed';

            let url = '';
            let progressParam = '';

            if (user) {
                // First check getting granular progress
                const progress = await getProgress(
                    user.uid,
                    item.id,
                    item.tmdbMediaType,
                    item.tmdbMediaType === 'tv' ? selectedSeason : undefined,
                    item.tmdbMediaType === 'tv' ? selectedEpisode : undefined
                );

                if (progress && progress.timestamp > 0 && progress.progress < 90) {
                    progressParam = `&progress=${Math.floor(progress.timestamp)}`;
                }
                // Fallback / Priority: if we loaded a timestamp from nowWatching (movies) and it's missing from granular
                else if (item.tmdbMediaType === 'movie' && initialResumeTime && initialResumeTime > 0) {
                    progressParam = `&progress=${Math.floor(initialResumeTime)}`;
                }
            }

            if (item.tmdbMediaType === 'movie') {
                url = `${baseUrl}/movie/${item.id}?color=8B5CF6${progressParam}`;
            } else if (item.tmdbMediaType === 'tv') {
                const nextEpisodeParam = '&nextEpisode=true';
                url = `${baseUrl}/tv/${item.id}/${selectedSeason}/${selectedEpisode}?color=8B5CF6${nextEpisodeParam}${progressParam}`;
            }

            setPlayerUrl(url);
        };

        buildUrl();
    }, [server, item, selectedSeason, selectedEpisode, showEpisodeSelector, user, initialResumeTime]);

    // Listen to postMessage
    useEffect(() => {
        const handleMessage = async (event: MessageEvent) => {
            try {
                const data = typeof event.data === 'string' ? JSON.parse(event.data) : event.data;

                if (data?.type === 'PLAYER_EVENT' && user) {
                    const eventData = {
                        ...data.data,
                        lastServer: server,
                    };

                    await handlePlayerEvent(user.uid, { type: 'PLAYER_EVENT', data: eventData } as PlayerEvent);

                    // Update current episode progress
                    if (data.data.currentTime !== undefined && data.data.duration) {
                        const currentProgress = (data.data.currentTime / data.data.duration) * 100;

                        // Rastrear último timestamp
                        setLastTimestamp(Math.floor(data.data.currentTime));
                        setLastDuration(Math.floor(data.data.duration));
                        lastTimestampRef.current = Math.floor(data.data.currentTime);
                        lastDurationRef.current = Math.floor(data.data.duration);

                        // At 90%, swap display (current->viewed:false, next->viewed:true)
                        if (item.tmdbMediaType === 'tv' && currentProgress >= 90 && user) {
                            await swapToNextEpisode(user.uid, item.id);
                            console.log('[VideoPlayer] 🔄 Swapped display at 90% (player unchanged)');
                        }

                        // Continue updating timestamp and duration during playback
                        if (item.tmdbMediaType === 'tv') {
                            // TV: Update episode in subcollection
                            const seriesDocRef = firestoreDoc(db, 'users', user.uid, 'nowWatching', `tv_${item.id}`);
                            const episodesRef = collection(seriesDocRef, 'episodes');
                            const currentEpId = `s${selectedSeason}e${selectedEpisode}`;
                            const currentEpRef = firestoreDoc(episodesRef, currentEpId);

                            await setDoc(currentEpRef, {
                                timestamp: Math.floor(data.data.currentTime),
                                duration: Math.floor(data.data.duration),
                                lastWatchedAt: serverTimestamp(),
                            }, { merge: true });
                        } else if (item.tmdbMediaType === 'movie') {
                            // MOVIE: Update directly in nowWatching collection
                            const movieDocRef = firestoreDoc(db, 'users', user.uid, 'nowWatching', `movie_${item.id}`);

                            await setDoc(movieDocRef, {
                                timestamp: Math.floor(data.data.currentTime),
                                duration: Math.floor(data.data.duration),
                                lastWatchedAt: serverTimestamp(),
                            }, { merge: true });
                        }
                    }

                    // Auto-advance to next episode
                    if (data.data.event === 'ended' && item.tmdbMediaType === 'tv' && tvDetails) {
                        const currentSeasonData = tvDetails.seasons?.find(
                            (s: any) => s.season_number === selectedSeason
                        );

                        if (currentSeasonData) {
                            if (selectedEpisode < currentSeasonData.episode_count) {
                                setSelectedEpisode(prev => prev + 1);
                            } else {
                                const nextSeason = tvDetails.seasons?.find(
                                    (s: any) => s.season_number === selectedSeason + 1 && s.season_number > 0
                                );
                                if (nextSeason) {
                                    setSelectedSeason(prev => prev + 1);
                                    setSelectedEpisode(1);
                                }
                            }
                        }
                    }
                }
            } catch (error) {
                console.log('[VideoPlayer] Error:', error);
            }
        };

        window.addEventListener('message', handleMessage);
        return () => window.removeEventListener('message', handleMessage);
    }, [user, server, item, tvDetails, selectedSeason, selectedEpisode]);

    const handleEpisodeSelect = (season: number, episode: number) => {
        setSelectedSeason(season);
        setSelectedEpisode(episode);
        setShowEpisodeSelector(false);
    };

    const handleServerToggle = () => {
        setServer(prev => prev === 'videasy' ? 'vidking' : 'videasy');
    };

    const saveCurrentProgress = async () => {
        if (!user || lastTimestampRef.current <= 0) return;

        try {
            if (item.tmdbMediaType === 'tv') {
                const seriesDocRef = firestoreDoc(db, 'users', user.uid, 'nowWatching', `tv_${item.id}`);
                const episodesRef = collection(seriesDocRef, 'episodes');
                const currentEpId = `s${selectedSeason}e${selectedEpisode}`;
                const currentEpRef = firestoreDoc(episodesRef, currentEpId);
                await setDoc(currentEpRef, {
                    timestamp: lastTimestampRef.current,
                    duration: lastDurationRef.current,
                    lastWatchedAt: serverTimestamp(),
                }, { merge: true });
            } else if (item.tmdbMediaType === 'movie') {
                const movieDocRef = firestoreDoc(db, 'users', user.uid, 'nowWatching', `movie_${item.id}`);
                await setDoc(movieDocRef, {
                    timestamp: lastTimestampRef.current,
                    duration: lastDurationRef.current,
                    lastWatchedAt: serverTimestamp(),
                }, { merge: true });
            }
            console.log(`[VideoPlayer] 💾 Final timestamp saved: ${lastTimestampRef.current}s`);
        } catch (error) {
            console.error('[VideoPlayer] Error saving progress:', error);
        }
    };

    const handleClose = async () => {
        // Salvar último timestamp ANTES de fechar
        await saveCurrentProgress();

        if (user) {
            await saveStopWatching(
                user.uid,
                item.id,
                item.tmdbMediaType,
                item.tmdbMediaType === 'tv' ? selectedSeason : undefined,
                item.tmdbMediaType === 'tv' ? selectedEpisode : undefined
            );
        }
        onClose();
    };

    const handleBackdropClick = async (e: React.MouseEvent) => {
        if (e.target === e.currentTarget) {
            if (user) {
                // Check if we need to advance to next episode
                if (item.tmdbMediaType === 'tv' && tvDetails) {
                    // Get current progress from nowWatching
                    const nowWatchingRef = collection(db, 'users', user.uid, 'nowWatching');
                    const snapshot = await getDocs(nowWatchingRef);
                    const docId = `tv_${item.id}`; // Single doc per series!
                    const matchingDoc = snapshot.docs.find(doc => doc.id === docId);

                    if (matchingDoc) {
                        const data = matchingDoc.data();
                        const progress = data.timestamp && data.duration
                            ? (data.timestamp / data.duration) * 100
                            : 0;

                        console.log('[VideoPlayer] Episode progress:', progress);

                        // If >90% watched, save NEXT episode with zero progress
                        if (progress >= 90) {
                            const currentSeasonData = tvDetails.seasons?.find(
                                (s: any) => s.season_number === selectedSeason
                            );

                            let nextSeason = selectedSeason;
                            let nextEpisode = selectedEpisode + 1;

                            // Check if there's a next episode
                            if (currentSeasonData && nextEpisode > currentSeasonData.episode_count) {
                                // Move to next season
                                const nextSeasonData = tvDetails.seasons?.find(
                                    (s: any) => s.season_number === selectedSeason + 1 && s.season_number > 0
                                );
                                if (nextSeasonData) {
                                    nextSeason = selectedSeason + 1;
                                    nextEpisode = 1;
                                } else {
                                    // No more episodes, just update last watched
                                    await saveStopWatching(user.uid, item.id, item.tmdbMediaType, selectedSeason, selectedEpisode);
                                    onClose();
                                    return;
                                }
                            }

                            // Save NEXT episode with zero progress
                            await saveStartWatching(user.uid, {
                                id: item.id,
                                mediaType: item.tmdbMediaType,
                                title: item.title || item.name || 'Unknown',
                                posterUrl: item.posterUrl || undefined,
                                season: nextSeason,
                                episode: nextEpisode,
                                lastServer: server,
                                timestamp: 0,
                                duration: 0,
                            });

                            console.log(`[VideoPlayer] ✅ Advanced to next: S${nextSeason}E${nextEpisode}`);
                            onClose();
                            return;
                        }
                    }
                }

                // Normal close - just update lastWatchedAt
                await saveCurrentProgress(); // ✅ NOW SAVES PROGRESS TOO!
                await saveStopWatching(
                    user.uid,
                    item.id,
                    item.tmdbMediaType,
                    item.tmdbMediaType === 'tv' ? selectedSeason : undefined,
                    item.tmdbMediaType === 'tv' ? selectedEpisode : undefined
                );
            }
            onClose();
        }
    };

    return (
        <div
            className="fixed inset-0 z-50 flex items-start justify-center p-4 bg-black/90 backdrop-blur-sm animate-in fade-in duration-200 overflow-y-auto"
            onClick={handleBackdropClick}
        >
            <div className="relative w-full max-w-6xl my-4 bg-black rounded-2xl shadow-2xl animate-in zoom-in-95 duration-300">
                <button
                    onClick={handleClose}
                    className="absolute top-4 right-4 z-20 p-2 bg-black/50 hover:bg-black/70 rounded-full transition-colors"
                >
                    <X className="w-6 h-6 text-white" />
                </button>

                {showEpisodeSelector ? (
                    <div className="p-6 md:p-8">
                        <EpisodeSelector
                            showId={item.id}
                            onSelect={handleEpisodeSelect}
                            onClose={onClose}
                        />
                    </div>
                ) : (
                    <div
                        className="relative"
                        onMouseEnter={() => setShowServerButton(true)}
                        onMouseLeave={() => setShowServerButton(false)}
                    >
                        <div className="relative w-full rounded-2xl overflow-hidden" style={{ aspectRatio: '16/9' }}>
                            <iframe
                                src={playerUrl}
                                className="w-full h-full"
                                allowFullScreen
                                allow="autoplay; fullscreen; picture-in-picture"
                            />
                        </div>

                        {showServerButton && (
                            <button
                                onClick={handleServerToggle}
                                className="absolute top-4 left-4 px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg font-semibold transition-all flex items-center gap-2 shadow-lg z-10"
                            >
                                <RefreshCw className="w-4 h-4" />
                                {server === 'videasy' ? 'Trocar p/ Vidking' : 'Trocar p/ Videasy'}
                            </button>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default VideoPlayerModal;
