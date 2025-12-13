'use client';

import { notFound } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import React, { useState, useEffect } from 'react';
import { Play, Plus, Star, Calendar, Clock, RotateCcw } from 'lucide-react';
import { getTMDbDetails, getProviders } from '@/lib/tmdb';
import DashboardHeader from '@/components/shared/DashboardHeader';
import VideoPlayerModal from '@/components/shared/VideoPlayerModal';
import { useWatchStatus } from '@/hooks/useWatchStatus';
import StatusButton from '@/components/shared/StatusButton';
import CombinedPlayButton from '@/components/shared/CombinedPlayButton';
import { WatchlistContext } from '@/contexts/WatchlistContext';
import { useContext } from 'react';

interface MoviePageProps {
    params: Promise<{ id: string }>;
}

export default function MoviePage({ params }: MoviePageProps) {
    const [movieData, setMovieData] = useState<any>(null);
    const [showPlayer, setShowPlayer] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const { isInWatchlist, addToWatchlist, removeFromWatchlist } = useContext(WatchlistContext);

    useEffect(() => {
        const fetchData = async () => {
            const resolvedParams = await params;
            const id = parseInt(resolvedParams.id);

            if (isNaN(id)) {
                notFound();
                return;
            }

            const data = await getTMDbDetails(id, 'movie');

            if (!data) {
                notFound();
                return;
            }

            setMovieData(data);
            setIsLoading(false);
        };

        fetchData();
    }, [params]);

    const [resolvedId, setResolvedId] = React.useState<number | null>(null);

    useEffect(() => {
        const resolveId = async () => {
            const resolvedParams = await params;
            setResolvedId(parseInt(resolvedParams.id));
        };
        resolveId();
    }, [params]);

    const watchStatus = useWatchStatus(resolvedId || 0, 'movie');

    if (isLoading || !movieData) {
        return (
            <div className="min-h-screen bg-black flex items-center justify-center">
                <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-purple-600"></div>
            </div>
        );
    }

    const title = movieData.title || movieData.name || 'Título Desconhecido';
    const releaseDate = movieData.release_date || movieData.first_air_date;
    const year = releaseDate ? new Date(releaseDate).getFullYear() : '';
    const runtime = movieData.runtime ? `${Math.floor(movieData.runtime / 60)}h ${movieData.runtime % 60}m` : '';
    const backdropUrl = movieData.backdrop_path ? `https://image.tmdb.org/t/p/original${movieData.backdrop_path}` : null;
    const posterUrl = movieData.poster_path ? `https://image.tmdb.org/t/p/w500${movieData.poster_path}` : null;
    const genres = movieData.genres?.map((g: { name: string }) => g.name).join(', ') || '';
    const voteAverage = movieData.vote_average ? movieData.vote_average.toFixed(1) : 'N/A';
    const overview = movieData.overview || 'Sinopse não disponível.';
    const providers = getProviders(movieData);
    const cast = movieData.credits?.cast?.slice(0, 10) || [];
    const similar = movieData.similar?.results?.slice(0, 12) || [];

    const displayableItem = {
        id: movieData.id,
        tmdbMediaType: 'movie' as const,
        title: title,
        name: title,
        posterUrl: posterUrl,
    };

    return (
        <div className="min-h-screen bg-black text-white">
            <DashboardHeader />

            {/* Hero Section with Backdrop */}
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

                {/*Content Overlay */}
                <div className="absolute bottom-0 left-0 right-0 p-6 md:p-12 flex flex-col md:flex-row gap-8 items-end">
                    {posterUrl && (
                        <div className="flex-shrink-0 w-48 md:w-64 rounded-xl overflow-hidden shadow-2xl transform hover:scale-105 transition-transform duration-300">
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
                        <h1 className="text-4xl md:text-6xl font-black drop-shadow-2xl">
                            {title}
                        </h1>

                        {/* Metadata */}
                        <div className="flex flex-wrap items-center gap-4 text-gray-300">
                            {year && (
                                <div className="flex items-center gap-2">
                                    <Calendar className="w-5 h-5" />
                                    <span className="font-semibold">{year}</span>
                                </div>
                            )}
                            {runtime && (
                                <div className="flex items-center gap-2">
                                    <Clock className="w-5 h-5" />
                                    <span>{runtime}</span>
                                </div>
                            )}
                            <div className="flex items-center gap-2">
                                <Star className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                                <span className="font-semibold">{voteAverage}</span>
                            </div>
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
                                    id: movieData.id,
                                    mediaType: 'movie',
                                    title: title,
                                    posterUrl: posterUrl || '',
                                }}
                                watchStatus={watchStatus}
                                onPlay={() => setShowPlayer(true)}
                                onWatchlistToggle={async () => {
                                    if (isInWatchlist(movieData.id)) {
                                        await removeFromWatchlist(movieData.id);
                                    } else {
                                        await addToWatchlist({
                                            id: movieData.id,
                                            tmdbMediaType: 'movie',
                                            title: title,
                                            posterUrl: posterUrl,
                                            addedAt: Date.now(),
                                        });
                                    }
                                }}
                                isInWatchlist={isInWatchlist(movieData.id)}
                                onStatusChange={() => {
                                    console.log('Status changed');
                                }}
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="max-w-7xl mx-auto px-6 md:px-12 py-12 space-y-12">
                {/* Overview Section */}
                <section>
                    <h2 className="text-3xl font-bold mb-4">Sinopse</h2>
                    <p className="text-gray-300 text-lg leading-relaxed max-w-4xl">
                        {overview}
                    </p>
                </section>

                {/* Where to Watch */}
                {providers?.flatrate && providers.flatrate.length > 0 && (
                    <section>
                        <h2 className="text-3xl font-bold mb-6">Onde Assistir</h2>
                        <div className="flex flex-wrap gap-4">
                            {providers.flatrate.map((provider: any) => (
                                <div
                                    key={provider.provider_id}
                                    className="flex flex-col items-center gap-2 p-4 bg-gray-900 rounded-lg hover:bg-gray-800 transition-colors"
                                >
                                    <Image
                                        src={`https://image.tmdb.org/t/p/w92${provider.logo_path}`}
                                        alt={provider.provider_name}
                                        width={64}
                                        height={64}
                                        className="rounded-lg"
                                    />
                                    <span className="text-sm text-gray-300">{provider.provider_name}</span>
                                </div>
                            ))}
                        </div>
                    </section>
                )}

                {/* Cast */}
                {cast.length > 0 && (
                    <section>
                        <h2 className="text-3xl font-bold mb-6">Elenco</h2>
                        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
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
                                                <span className="text-4xl">👤</span>
                                            </div>
                                        )}
                                    </div>
                                    <h3 className="font-semibold text-sm text-white">{person.name}</h3>
                                    <p className="text-xs text-gray-400">{person.character}</p>
                                </div>
                            ))}
                        </div>
                    </section>
                )}

                {/* Similar Movies */}
                {similar.length > 0 && (
                    <section>
                        <h2 className="text-3xl font-bold mb-6">Títulos Similares</h2>
                        <div className="grid grid-cols-3 md:grid-cols-6 gap-4">
                            {similar.map((movie: { id: number; title?: string; name?: string; poster_path: string | null }) => (
                                <Link
                                    key={movie.id}
                                    href={`/movie/${movie.id}`}
                                    className="group cursor-pointer"
                                >
                                    <div className="relative aspect-[2/3] rounded-lg overflow-hidden bg-gray-800 shadow-lg">
                                        {movie.poster_path ? (
                                            <Image
                                                src={`https://image.tmdb.org/t/p/w342${movie.poster_path}`}
                                                alt={movie.title || movie.name || ''}
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
                                        {movie.title || movie.name}
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
