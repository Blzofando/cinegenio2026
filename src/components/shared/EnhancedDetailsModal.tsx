"use client";

import React, { useState, useEffect, useContext } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { X, Plus, Check, Play, RotateCcw, ChevronRight, Clock, Calendar, Tv, Film } from 'lucide-react';
import { DisplayableItem, WatchlistItem } from '@/types';
import { WatchlistContext } from '@/contexts/WatchlistContext';
import { WatchedDataContext } from '@/contexts/WatchedDataContext';
import VideoPlayerModal from './VideoPlayerModal';
import { useAuth } from '@/contexts/AuthContext';
import { db } from '@/lib/firebase/client';
import { collection, getDocs } from 'firebase/firestore';
import StatusButton from './StatusButton';
import CombinedPlayButton from './CombinedPlayButton';
import { filterStartedSeasons } from '@/lib/services/seriesMetadataCache';

interface EnhancedDetailsModalProps {
    item: DisplayableItem;
    onClose: () => void;
}

interface TMDbDetails {
    backdrop_path: string | null;
    genres: { id: number; name: string }[];
    runtime?: number;
    number_of_seasons?: number;
    number_of_episodes?: number;
    first_air_date?: string;
    release_date?: string;
    overview: string;
}

const EnhancedDetailsModal: React.FC<EnhancedDetailsModalProps> = ({ item, onClose }) => {
    const { user } = useAuth();
    const { watchlist, addToWatchlist, removeFromWatchlist } = useContext(WatchlistContext);
    const { data: watchedData } = useContext(WatchedDataContext);
    const [isInWatchlist, setIsInWatchlist] = useState(false);
    const [isWatched, setIsWatched] = useState(false);
    const [watchStatus, setWatchStatus] = useState<'new' | 'resume' | 'rewatch'>('new');
    const [details, setDetails] = useState<TMDbDetails | null>(null);
    const [loading, setLoading] = useState(true);
    const [showPlayer, setShowPlayer] = useState(false);
    const [resumeData, setResumeData] = useState<{ season?: number; episode?: number } | null>(null);

    useEffect(() => {
        const inList = watchlist.some((w: WatchlistItem) => w.id === item.id && w.tmdbMediaType === item.tmdbMediaType);
        setIsInWatchlist(inList);

        const allWatched = [...watchedData.amei, ...watchedData.gostei, ...watchedData.meh, ...watchedData.naoGostei];
        const watched = allWatched.some((w) => w.id === item.id && w.tmdbMediaType === item.tmdbMediaType);
        setIsWatched(watched);
    }, [item, watchlist, watchedData]);

    // Fetch TMDb details when modal opens
    useEffect(() => {
        const fetchDetails = async () => {
            try {
                const type = item.tmdbMediaType === 'movie' ? 'movie' : 'tv';
                const response = await fetch(`https://api.themoviedb.org/3/${type}/${item.id}?api_key=${process.env.NEXT_PUBLIC_TMDB_API_KEY}&language=pt-BR`);
                const data = await response.json();

                // Para séries: filtrar apenas temporadas iniciadas
                if (type === 'tv' && data.seasons) {
                    const startedSeasons = await filterStartedSeasons(item.id, data.seasons);
                    data.number_of_seasons = startedSeasons.length;
                    data.number_of_episodes = startedSeasons.reduce((sum: number, s: any) => sum + (s.episode_count || 0), 0);
                }

                setDetails(data);
            } catch (error) {
                console.error('Error fetching TMDb details:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchDetails();
    }, [item.id, item.tmdbMediaType]);

    // Check watch progress from nowWatching
    useEffect(() => {
        const checkWatchStatus = async () => {
            if (!user) {
                setWatchStatus(isWatched ? 'rewatch' : 'new');
                return;
            }

            try {
                const nowWatchingRef = collection(db, 'users', user.uid, 'nowWatching');
                const snapshot = await getDocs(nowWatchingRef);

                const docId = item.tmdbMediaType === 'movie'
                    ? `movie_${item.id}`
                    : `tv_${item.id}`;

                const matchingDoc = snapshot.docs.find(doc => doc.id === docId);

                if (matchingDoc) {
                    const data = matchingDoc.data();
                    let progress = 0;

                    if (item.tmdbMediaType === 'movie' && data.timestamp && data.duration) {
                        progress = (data.timestamp / data.duration) * 100;

                        if (progress >= 95) {
                            setWatchStatus('rewatch');
                        } else if (progress > 0) {
                            setWatchStatus('resume');
                        } else {
                            setWatchStatus('new');
                        }
                    } else if (item.tmdbMediaType === 'tv') {
                        // For series, if it exists in nowWatching, user has started watching
                        // Show "Resume" regardless of episode progress
                        setWatchStatus('resume');
                    }
                } else {
                    setWatchStatus(isWatched ? 'rewatch' : 'new');
                }
            } catch (error) {
                console.error('[Modal] Error checking watch status:', error);
                setWatchStatus(isWatched ? 'rewatch' : 'new');
            }
        };

        checkWatchStatus();
    }, [user, item, isWatched]);

    const handleWatchlistToggle = async () => {
        if (isInWatchlist) {
            await removeFromWatchlist(item.id);
        } else {
            await addToWatchlist({
                id: item.id,
                tmdbMediaType: item.tmdbMediaType,
                title: item.title || '',
                posterUrl: item.posterUrl || undefined,
                addedAt: Date.now(),
            });
        }
    };

    const handlePlay = async () => {
        // Para séries em resume: buscar temporada/episódio do nowWatching
        if (user && item.tmdbMediaType === 'tv' && watchStatus === 'resume') {
            try {
                const nowWatchingRef = collection(db, 'users', user.uid, 'nowWatching');
                const snapshot = await getDocs(nowWatchingRef);
                const docId = `tv_${item.id}`;
                const matchingDoc = snapshot.docs.find(doc => doc.id === docId);

                if (matchingDoc) {
                    // Buscar episódio com viewed:true da subcoleção
                    const episodesRef = collection(matchingDoc.ref, 'episodes');
                    const episodesSnap = await getDocs(episodesRef);

                    for (const epDoc of episodesSnap.docs) {
                        const epData = epDoc.data();
                        if (epData.viewed === true) {
                            setResumeData({ season: epData.season, episode: epData.episode });
                            break;
                        }
                    }
                }
            } catch (error) {
                console.error('[Modal] Error fetching resume data:', error);
            }
        }

        setShowPlayer(true);
    };

    const handleBackdropClick = (e: React.MouseEvent) => {
        if (e.target === e.currentTarget) {
            onClose();
        }
    };

    const detailUrl = `/${item.tmdbMediaType}/${item.id}`;

    // Clean title - remove year
    const cleanTitle = (item.title || item.name || '').replace(/\s*\(\d{4}\)\s*$/, '');

    // Get backdrop URL (16:9)
    const backdropUrl = details?.backdrop_path
        ? `https://image.tmdb.org/t/p/original${details.backdrop_path}`
        : null;

    // Get year
    const year = details?.release_date
        ? new Date(details.release_date).getFullYear()
        : details?.first_air_date
            ? new Date(details.first_air_date).getFullYear()
            : null;

    // Get genres
    const genres = details?.genres?.slice(0, 3).map(g => g.name).join(', ') || '';

    // Get runtime or seasons info
    const runtimeInfo = item.tmdbMediaType === 'movie' && details?.runtime
        ? `${Math.floor(details.runtime / 60)}h ${details.runtime % 60}min`
        : item.tmdbMediaType === 'tv' && details?.number_of_seasons
            ? `${details.number_of_seasons} ${details.number_of_seasons === 1 ? 'Temporada' : 'Temporadas'} • ${details.number_of_episodes} Episódios`
            : null;

    const mediaType = item.tmdbMediaType === 'movie' ? 'Filme' : 'Série';
    const posterUrl = item.posterUrl;

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200"
            onClick={handleBackdropClick}
        >
            <div className="relative w-full max-w-3xl max-h-[90vh] overflow-y-auto scrollbar-hide bg-black rounded-2xl shadow-2xl animate-in zoom-in-95 duration-300">
                {/* Close Button */}
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 z-20 p-2 bg-black/50 hover:bg-black/70 rounded-full transition-colors"
                >
                    <X className="w-6 h-6 text-white" />
                </button>

                {loading ? (
                    <div className="w-full h-96 flex items-center justify-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-red-600"></div>
                    </div>
                ) : (
                    <>
                        {/* Backdrop Image - 16:9 */}
                        <div className="relative w-full" style={{ aspectRatio: '16/9' }}>
                            {backdropUrl && (
                                <>
                                    <Image
                                        src={backdropUrl}
                                        alt={cleanTitle}
                                        fill
                                        className="object-cover"
                                        priority
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent" />
                                    <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/40 to-transparent" />
                                </>
                            )}

                            {/* Title & Metadata Overlay */}
                            <div className="absolute bottom-0 left-0 right-0 p-6 md:p-8">
                                <h2 className="text-4xl md:text-6xl font-black text-white drop-shadow-2xl mb-3">
                                    {cleanTitle}
                                </h2>

                                {/* Metadata Row */}
                                <div className="flex flex-wrap items-center gap-3 text-gray-200 text-sm md:text-base">
                                    {year && (
                                        <div className="flex items-center gap-1">
                                            <Calendar className="w-4 h-4" />
                                            <span className="font-semibold">{year}</span>
                                        </div>
                                    )}

                                    {genres && (
                                        <div className="flex items-center gap-1">
                                            <span className="px-2 py-1 bg-white/20 rounded-md text-xs font-medium">
                                                {genres}
                                            </span>
                                        </div>
                                    )}

                                    <div className="flex items-center gap-1">
                                        {item.tmdbMediaType === 'movie' ? (
                                            <Film className="w-4 h-4" />
                                        ) : (
                                            <Tv className="w-4 h-4" />
                                        )}
                                        <span className="font-semibold">{mediaType}</span>
                                    </div>

                                    {runtimeInfo && (
                                        <div className="flex items-center gap-1">
                                            <Clock className="w-4 h-4" />
                                            <span>{runtimeInfo}</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Gradient Transition */}
                        <div className="h-6 bg-gradient-to-b from-black/60 to-black" />

                        {/* Content Section */}
                        <div className="px-6 md:px-8 pb-6 space-y-5 bg-black">
                            {/* Action Buttons */}
                            <div className="flex flex-wrap gap-3">
                                <CombinedPlayButton
                                    item={{
                                        id: item.id,
                                        mediaType: item.tmdbMediaType,
                                        title: cleanTitle,
                                        posterUrl: posterUrl || '',
                                    }}
                                    watchStatus={watchStatus}
                                    onPlay={handlePlay}
                                    onWatchlistToggle={handleWatchlistToggle}
                                    isInWatchlist={isInWatchlist}
                                    onStatusChange={() => {
                                        console.log('Status changed in modal');
                                    }}
                                />

                                <Link
                                    href={detailUrl}
                                    className="flex items-center gap-2 px-6 py-3 bg-gray-800 hover:bg-gray-700 rounded-lg font-bold text-white transition-all transform hover:scale-105"
                                >
                                    Ver Mais
                                    <ChevronRight className="w-5 h-5" />
                                </Link>
                            </div>

                            {/* Synopsis */}
                            {details?.overview && (
                                <div className="pt-2">
                                    <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wide mb-2">Sinopse</h3>
                                    <p className="text-gray-300 leading-relaxed text-base">
                                        {details.overview}
                                    </p>
                                </div>
                            )}
                        </div>
                    </>
                )}
            </div>

            {/* Video Player Modal */}
            {showPlayer && (
                <VideoPlayerModal
                    item={{
                        ...item,
                        ...resumeData // Adiciona season/episode se disponível
                    }}
                    onClose={() => setShowPlayer(false)}
                />
            )}
        </div>
    );
};

export default EnhancedDetailsModal;
