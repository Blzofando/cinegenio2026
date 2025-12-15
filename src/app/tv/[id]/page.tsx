'use client';

import { notFound } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import React, { useState, useEffect, useContext } from 'react';
import { Play, Plus, Star, Calendar, TvMinimal, RotateCcw } from 'lucide-react';
import { getTMDbDetails, getProviders } from '@/lib/tmdb';
import DashboardHeader from '@/components/shared/DashboardHeader';
import MobileBottomNav from '@/components/shared/MobileBottomNav';
import VideoPlayerModal from '@/components/shared/VideoPlayerModal';
import { useWatchStatus } from '@/hooks/useWatchStatus';
import CombinedPlayButton from '@/components/shared/CombinedPlayButton';
import { WatchlistContext } from '@/contexts/WatchlistContext';
import { filterStartedSeasons } from '@/lib/services/seriesMetadataCache';
import { useAuth } from '@/contexts/AuthContext';
import { db } from '@/lib/firebase/client';
import { collection, getDocs } from 'firebase/firestore';
import { checkWatchedStatus, RatingHistory, RatingType } from '@/lib/watchedService';

interface TVPageProps {
    params: Promise<{ id: string }>;
}

const RATING_EMOJIS: Record<RatingType, string> = {
    amei: '❤️',
    gostei: '👍',
    meh: '😐',
    nao_gostei: '👎'
};

export default function TVPage({ params }: TVPageProps) {
    const { user } = useAuth();
    const [tvData, setTvData] = useState<any>(null);
    const [showPlayer, setShowPlayer] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [resumeData, setResumeData] = useState<{ season?: number; episode?: number } | null>(null);
    const { isInWatchlist, addToWatchlist, removeFromWatchlist } = useContext(WatchlistContext);
    const [resolvedId, setResolvedId] = useState<number | null>(null);
    const [ratingHistory, setRatingHistory] = useState<RatingHistory[]>([]);

    useEffect(() => {
        const resolveId = async () => {
            const resolvedParams = await params;
            setResolvedId(parseInt(resolvedParams.id));
        };
        resolveId();
    }, [params]);

    useEffect(() => {
        const fetchData = async () => {
            const resolvedParams = await params;
            const id = parseInt(resolvedParams.id);

            if (isNaN(id)) {
                notFound();
                return;
            }

            const data = await getTMDbDetails(id, 'tv');

            if (!data) {
                notFound();
                return;
            }

            // Filtrar apenas temporadas iniciadas
            if (data.seasons) {
                const startedSeasons = await filterStartedSeasons(id, data.seasons);
                data.number_of_seasons = startedSeasons.length;
                data.number_of_episodes = startedSeasons.reduce((sum: number, s: any) => sum + (s.episode_count || 0), 0);
            }

            setTvData(data);
            setIsLoading(false);
        };

        fetchData();
    }, [params]);

    const watchStatus = useWatchStatus(resolvedId || 0, 'tv');

    useEffect(() => {
        if (user && resolvedId) {
            checkWatchedStatus(user.uid, resolvedId, 'tv').then(data => {
                if (data?.history) {
                    setRatingHistory(data.history);
                }
            });
        }
    }, [user, resolvedId, watchStatus]);

    if (isLoading || !tvData) {
        return (
            <div className="min-h-screen bg-black flex items-center justify-center">
                <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-purple-600"></div>
            </div>
        );
    }

    const title = tvData.name || tvData.title || 'Título Desconhecido';
    const releaseDate = tvData.first_air_date || tvData.release_date;
    const year = releaseDate ? new Date(releaseDate).getFullYear() : '';
    const numberOfSeasons = tvData.number_of_seasons || 0;
    const numberOfEpisodes = tvData.number_of_episodes || 0;
    const status = tvData.status || '';
    const backdropUrl = tvData.backdrop_path ? `https://image.tmdb.org/t/p/original${tvData.backdrop_path}` : null;
    const posterUrl = tvData.poster_path ? `https://image.tmdb.org/t/p/w500${tvData.poster_path}` : null;
    const logoUrl = tvData.images?.logos?.find((logo: any) => logo.iso_639_1 === 'en')?.file_path ||
        tvData.images?.logos?.[0]?.file_path;
    const genres = tvData.genres?.map((g: { name: string }) => g.name).join(', ') || '';
    const voteAverage = tvData.vote_average ? tvData.vote_average.toFixed(1) : 'N/A';
    const overview = tvData.overview || 'Sinopse não disponível.';
    const providers = getProviders(tvData);
    const cast = tvData.credits?.cast?.slice(0, 10) || [];
    const similar = tvData.similar?.results?.slice(0, 12) || [];

    const handlePlay = async () => {
        // Para séries em resume: buscar temporada/episódio do nowWatching
        if (user && resolvedId && watchStatus === 'resume') {
            try {
                const nowWatchingRef = collection(db, 'users', user.uid, 'nowWatching');
                const snapshot = await getDocs(nowWatchingRef);
                const docId = `tv_${resolvedId}`;
                const matchingDoc = snapshot.docs.find(doc => doc.id === docId);

                if (matchingDoc) {
                    // Buscar episódio com viewed:true da subcoleção
                    const episodesRef = collection(matchingDoc.ref, 'episodes');
                    const episodesSnap = await getDocs(episodesRef);

                    for (const epDoc of episodesSnap.docs) {
                        const epData = epDoc.data();
                        if (epData.viewed === true) {
                            setResumeData({ season: epData.season, episode: epData.episode });
                            console.log(`[TV Page] Resume: S${epData.season}E${epData.episode}`);
                            break;
                        }
                    }
                }
            } catch (error) {
                console.error('[TV Page] Error fetching resume data:', error);
            }
        }

        setShowPlayer(true);
    };

    const displayableItem = {
        id: tvData.id,
        tmdbMediaType: 'tv' as const,
        title: title,
        name: title,
        posterUrl: posterUrl,
        ...resumeData // Adiciona season/episode se disponível
    };

    return (
        <div className="min-h-screen bg-black text-white pb-16 md:pb-0">
            <DashboardHeader />
            <MobileBottomNav />

            {/* Hero Section */}
            <div className="relative w-full h-[70vh] md:h-[80vh]">
                {backdropUrl && (
                    <>
                        <Image
                            src={backdropUrl}
                            alt={title}
                            fill
                            className="object-cover"
                            priority
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/70 to-transparent" />
                        <div className="absolute inset-0 bg-gradient-to-r from-black via-black/50 to-transparent" />
                    </>
                )}

                <div className="absolute bottom-0 left-0 right-0 p-6 md:p-12 flex flex-col md:flex-row gap-8 items-end">
                    {/* Poster - only show on desktop (md+) */}
                    {posterUrl && (
                        <div className="hidden md:block flex-shrink-0 w-48 md:w-64 rounded-xl overflow-hidden shadow-2xl transform hover:scale-105 transition-transform duration-300">
                            <Image
                                src={posterUrl}
                                alt={title}
                                width={400}
                                height={600}
                                className="w-full h-auto"
                            />
                        </div>
                    )}

                    <div className="flex-1 space-y-4">
                        {/* Logo on mobile, Title as fallback */}
                        {logoUrl ? (
                            <div className="h-16 md:h-20 lg:h-24 w-auto flex items-center">
                                <Image
                                    src={`https://image.tmdb.org/t/p/w500${logoUrl}`}
                                    alt={title}
                                    width={400}
                                    height={150}
                                    className="max-h-[60px] md:max-h-[80px] lg:max-h-[96px] w-auto object-contain"
                                    style={{ filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.8))' }}
                                />
                            </div>
                        ) : (
                            <h1 className="text-3xl md:text-5xl lg:text-6xl font-black drop-shadow-2xl">
                                {title}
                            </h1>
                        )}

                        {/* Metadata */}
                        <div className="flex flex-wrap items-center gap-4 text-gray-300">
                            {year && (
                                <div className="flex items-center gap-2">
                                    <Calendar className="w-5 h-5" />
                                    <span className="font-semibold">{year}</span>
                                </div>
                            )}
                            <div className="flex items-center gap-2">
                                <TvMinimal className="w-5 h-5" />
                                <span>{numberOfSeasons} {numberOfSeasons === 1 ? 'Temporada' : 'Temporadas'}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <Star className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                                <span className="font-semibold">{voteAverage}</span>
                            </div>
                            {status && (
                                <span className={`px-3 py-1 rounded-full text-xs font-bold ${status.toLowerCase().includes('return') || status.toLowerCase().includes('renewed')
                                    ? 'bg-green-600'
                                    : status.toLowerCase().includes('ended') || status.toLowerCase().includes('canceled')
                                        ? 'bg-red-600'
                                        : 'bg-gray-600'
                                    }`}>
                                    {status}
                                </span>
                            )}
                        </div>

                        {/* Genres */}
                        {genres && (
                            <div className="flex flex-wrap gap-2">
                                {genres.split(', ').map((genre: string) => (
                                    <span
                                        key={genre}
                                        className="px-3 py-1 bg-white/10 backdrop-blur-sm rounded-full text-sm font-medium"
                                    >
                                        {genre}
                                    </span>
                                ))}
                            </div>
                        )}

                        {/* Action Buttons */}
                        <div className="flex flex-wrap gap-3 pt-2">
                            <CombinedPlayButton
                                item={{
                                    id: tvData.id,
                                    mediaType: 'tv',
                                    title: title,
                                    posterUrl: posterUrl || '',
                                }}
                                watchStatus={watchStatus}
                                onPlay={handlePlay}
                                onWatchlistToggle={async () => {
                                    if (isInWatchlist(tvData.id)) {
                                        await removeFromWatchlist(tvData.id);
                                    } else {
                                        await addToWatchlist({
                                            id: tvData.id,
                                            tmdbMediaType: 'tv',
                                            title: title,
                                            posterUrl: posterUrl || undefined,
                                            addedAt: Date.now(),
                                        });
                                    }
                                }}
                                isInWatchlist={isInWatchlist(tvData.id)}
                                onStatusChange={() => {
                                    // Refresh logic if needed
                                }}
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="max-w-7xl mx-auto px-6 md:px-12 py-12 space-y-12">
                {/* Overview */}
                <section>
                    <h2 className="text-2xl md:text-3xl font-bold mb-3 md:mb-4">Sinopse</h2>
                    <p className="text-gray-300 text-base md:text-lg leading-relaxed max-w-4xl">
                        {overview}
                    </p>
                    <div className="mt-4 text-gray-400">
                        <p>{numberOfEpisodes} episódios no total</p>
                    </div>

                    {/* Rating History Bubbles - Stacked Design with Grouping */}
                    {ratingHistory.length > 0 && (
                        <div className="pt-6 border-t border-gray-800 mt-6">
                            <div className="flex items-center gap-3">
                                <div className="flex items-center pl-2">
                                    {(() => {
                                        // Grouping Logic
                                        const groups: { rating: RatingType; seasons: number[]; count: number; comment?: string; watchedAt: any }[] = [];

                                        // Sort by season (if available) or date
                                        const sortedHistory = [...ratingHistory].sort((a, b) =>
                                            (a.season || 0) - (b.season || 0) || new Date(b.watchedAt).getTime() - new Date(a.watchedAt).getTime()
                                        );

                                        sortedHistory.forEach((h) => {
                                            const lastGroup = groups[groups.length - 1];

                                            // Ensure we treat undefined season as a separate "series" scope or non-season entry
                                            // You might want to group by rating regardless of season if it's strictly "consecutive" in a list, 
                                            // but for "T1, T2, T3" they need to be same rating.

                                            if (lastGroup && lastGroup.rating === h.rating && h.season) {
                                                lastGroup.seasons.push(h.season);
                                                lastGroup.count++;
                                                // Keep the latest comment/date if needed, or list them. 
                                                // For bubble display, usually just "Amei (T1-T3)"
                                            } else {
                                                groups.push({
                                                    rating: h.rating,
                                                    seasons: h.season ? [h.season] : [],
                                                    count: 1,
                                                    comment: h.comment || undefined,
                                                    watchedAt: h.watchedAt
                                                });
                                            }
                                        });

                                        return groups.map((g, i) => (
                                            <div
                                                key={i}
                                                className={`relative flex items-center justify-center w-10 h-10 rounded-full border-2 border-black bg-gray-800 shadow-xl transition-transform hover:scale-110 hover:z-10 cursor-help ${i > 0 ? '-ml-4' : ''}`}
                                                title={`${g.seasons.length > 0 ? `Temporadas: ${g.seasons.join(', ')}` : new Date(g.watchedAt?.seconds * 1000).toLocaleDateString()} - ${g.comment || 'Sem comentário'}`}
                                            >
                                                <span className="text-lg">{RATING_EMOJIS[g.rating]}</span>

                                                {/* Season Badge for TV - Grouped */}
                                                {g.seasons.length > 0 && (
                                                    <span className="absolute -bottom-1 -right-1 flex h-4 min-w-[16px] px-1 items-center justify-center rounded-full bg-blue-600 text-[8px] font-bold text-white border border-black z-20">
                                                        {g.seasons.length > 1
                                                            ? `T${Math.min(...g.seasons)}-T${Math.max(...g.seasons)}`
                                                            : `T${g.seasons[0]}`
                                                        }
                                                    </span>
                                                )}
                                            </div>
                                        ));
                                    })()}

                                    {/* Comment Indicator Bubble */}
                                    {ratingHistory.some(h => h.comment) && (
                                        <div className="relative flex items-center justify-center w-10 h-10 rounded-full border-2 border-black bg-white/10 backdrop-blur-md shadow-xl -ml-4 z-20">
                                            <span className="text-sm">💬</span>
                                            <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[9px] font-bold text-white">
                                                {ratingHistory.filter(h => h.comment).length}
                                            </span>
                                        </div>
                                    )}
                                </div>

                                <div className="flex flex-col">
                                    <span className="text-sm font-bold text-white">
                                        {ratingHistory.length} {ratingHistory.length === 1 ? 'Avaliação' : 'Avaliações'}
                                    </span>
                                    <span className="text-xs text-gray-400">
                                        Seu histórico de watch
                                    </span>
                                </div>
                            </div>

                            {/* Recent Comment Preview */}
                            {ratingHistory[ratingHistory.length - 1]?.comment && (
                                <div className="mt-3 p-3 bg-gray-900/50 rounded-xl border border-gray-800 text-sm italic text-gray-400 max-w-lg">
                                    &quot;{ratingHistory[ratingHistory.length - 1].comment}&quot;
                                </div>
                            )}
                        </div>
                    )}
                </section>

                {/* Where to Watch */}
                {providers?.flatrate && providers.flatrate.length > 0 && (
                    <section>
                        <h2 className="text-2xl md:text-3xl font-bold mb-4 md:mb-6">Onde Assistir</h2>
                        <div className="flex flex-wrap gap-3 md:gap-4">
                            {providers.flatrate.map((provider: any) => (
                                <div
                                    key={provider.provider_id}
                                    className="flex flex-col items-center gap-2 p-3 md:p-4 bg-gray-900 rounded-lg hover:bg-gray-800 transition-colors"
                                >
                                    <Image
                                        src={`https://image.tmdb.org/t/p/w92${provider.logo_path}`}
                                        alt={provider.provider_name}
                                        width={48}
                                        height={48}
                                        className="rounded-lg"
                                    />
                                    <span className="text-xs md:text-sm text-gray-300">{provider.provider_name}</span>
                                </div>
                            ))}
                        </div>
                    </section>
                )}

                {/* Cast */}
                {cast.length > 0 && (
                    <section>
                        <h2 className="text-2xl md:text-3xl font-bold mb-4 md:mb-6">Elenco</h2>
                        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3 md:gap-4">
                            {cast.map((person: { id: number; name: string; character: string; profile_path: string | null }) => (
                                <div key={person.id} className="group cursor-pointer">
                                    <div className="relative aspect-[2/3] rounded-lg overflow-hidden mb-2 bg-gray-800">
                                        {person.profile_path ? (
                                            <Image
                                                src={`https://image.tmdb.org/t/p/w185${person.profile_path}`}
                                                alt={person.name}
                                                fill
                                                className="object-cover group-hover:scale-110 transition-transform duration-300"
                                            />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-gray-600">
                                                <span className="text-3xl md:text-4xl">👤</span>
                                            </div>
                                        )}
                                    </div>
                                    <h3 className="font-semibold text-xs md:text-sm text-white line-clamp-1">{person.name}</h3>
                                    <p className="text-[10px] md:text-xs text-gray-400 line-clamp-1">{person.character}</p>
                                </div>
                            ))}
                        </div>
                    </section>
                )}

                {/* Similar TV Shows */}
                {similar.length > 0 && (
                    <section>
                        <h2 className="text-3xl font-bold mb-6">Séries Similares</h2>
                        <div className="grid grid-cols-3 md:grid-cols-6 gap-4">
                            {similar.map((show: { id: number; title?: string; name?: string; poster_path: string | null }) => (
                                <Link
                                    key={show.id}
                                    href={`/tv/${show.id}`}
                                    className="group cursor-pointer"
                                >
                                    <div className="relative aspect-[2/3] rounded-lg overflow-hidden bg-gray-800 shadow-lg">
                                        {show.poster_path ? (
                                            <Image
                                                src={`https://image.tmdb.org/t/p/w342${show.poster_path}`}
                                                alt={show.name || show.title || ''}
                                                fill
                                                className="object-cover group-hover:scale-110 transition-transform duration-300"
                                            />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-gray-600">
                                                <span>?</span>
                                            </div>
                                        )}
                                    </div>
                                    <h3 className="mt-2 text-sm font-semibold line-clamp-2 group-hover:text-purple-400 transition-colors">
                                        {show.name || show.title}
                                    </h3>
                                </Link>
                            ))}
                        </div>
                    </section>
                )}
            </div>

            {/* Video Player Modal */}
            {showPlayer && (
                <VideoPlayerModal
                    item={displayableItem}
                    onClose={() => setShowPlayer(false)}
                />
            )}
        </div>
    );
}
