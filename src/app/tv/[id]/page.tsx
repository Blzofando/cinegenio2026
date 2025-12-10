'use client';

import { notFound } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import React, { useState, useEffect } from 'react';
import { Play, Plus, Star, Calendar, TvMinimal, RotateCcw } from 'lucide-react';
import { getTMDbDetails, getProviders } from '@/lib/tmdb';
import DashboardHeader from '@/components/shared/DashboardHeader';
import VideoPlayerModal from '@/components/shared/VideoPlayerModal';
import { useWatchStatus } from '@/hooks/useWatchStatus';

interface TVPageProps {
    params: Promise<{ id: string }>;
}

export default function TVPage({ params }: TVPageProps) {
    const [tvData, setTvData] = useState<any>(null);
    const [showPlayer, setShowPlayer] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

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

            setTvData(data);
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

    const watchStatus = useWatchStatus(resolvedId || 0, 'tv');

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
    const genres = tvData.genres?.map((g: { name: string }) => g.name).join(', ') || '';
    const voteAverage = tvData.vote_average ? tvData.vote_average.toFixed(1) : 'N/A';
    const overview = tvData.overview || 'Sinopse não disponível.';
    const providers = getProviders(tvData);
    const cast = tvData.credits?.cast?.slice(0, 10) || [];
    const similar = tvData.similar?.results?.slice(0, 12) || [];

    const displayableItem = {
        id: tvData.id,
        tmdbMediaType: 'tv' as const,
        title: title,
        name: title,
        posterUrl: posterUrl,
    };

    return (
        <div className="min-h-screen bg-black text-white">
            <DashboardHeader />

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
                            <button
                                onClick={() => setShowPlayer(true)}
                                className={`flex items-center gap-2 px-8 py-3 rounded-lg font-bold transition-all transform hover:scale-105 shadow-lg ${watchStatus === 'rewatch'
                                    ? 'bg-purple-600 hover:bg-purple-700'
                                    : watchStatus === 'resume'
                                        ? 'bg-green-600 hover:bg-green-700'
                                        : 'bg-red-600 hover:bg-red-700'
                                    }`}
                            >
                                {watchStatus === 'rewatch' ? (
                                    <>
                                        <RotateCcw className="w-5 h-5" />
                                        Rewatch
                                    </>
                                ) : watchStatus === 'resume' ? (
                                    <>
                                        <Play className="w-5 h-5 fill-current" />
                                        Resume
                                    </>
                                ) : (
                                    <>
                                        <Play className="w-5 h-5 fill-current" />
                                        Assistir
                                    </>
                                )}
                            </button>
                            <button className="flex items-center gap-2 px-6 py-3 bg-gray-700 hover:bg-gray-600 rounded-lg font-bold transition-all transform hover:scale-105">
                                <Plus className="w-5 h-5" />
                                Minha Lista
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="max-w-7xl mx-auto px-6 md:px-12 py-12 space-y-12">
                {/* Overview */}
                <section>
                    <h2 className="text-3xl font-bold mb-4">Sinopse</h2>
                    <p className="text-gray-300 text-lg leading-relaxed max-w-4xl">
                        {overview}
                    </p>
                    <div className="mt-4 text-gray-400">
                        <p>{numberOfEpisodes} episódios no total</p>
                    </div>
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
