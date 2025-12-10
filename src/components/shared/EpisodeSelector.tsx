"use client";

import React, { useState, useEffect } from 'react';
import { Play } from 'lucide-react';
import Image from 'next/image';

interface Season {
    season_number: number;
    name: string;
    episode_count: number;
}

interface Episode {
    episode_number: number;
    name: string;
    still_path: string | null;
    overview: string;
}

interface EpisodeSelectorProps {
    showId: number;
    onSelect: (season: number, episode: number) => void;
    onClose: () => void;
}

const EpisodeSelector: React.FC<EpisodeSelectorProps> = ({ showId, onSelect, onClose }) => {
    const [step, setStep] = useState<1 | 2>(1);
    const [seasons, setSeasons] = useState<Season[]>([]);
    const [selectedSeason, setSelectedSeason] = useState<number | null>(null);
    const [episodes, setEpisodes] = useState<Episode[]>([]);
    const [selectedEpisode, setSelectedEpisode] = useState<number | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchSeasons = async () => {
            try {
                const response = await fetch(
                    `https://api.themoviedb.org/3/tv/${showId}?api_key=${process.env.NEXT_PUBLIC_TMDB_API_KEY}&language=pt-BR`
                );
                const data = await response.json();
                const validSeasons = data.seasons.filter((s: Season) => s.season_number > 0);
                setSeasons(validSeasons);
            } catch (error) {
                console.error('Error fetching seasons:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchSeasons();
    }, [showId]);

    useEffect(() => {
        if (!selectedSeason) return;

        const fetchEpisodes = async () => {
            try {
                const response = await fetch(
                    `https://api.themoviedb.org/3/tv/${showId}/season/${selectedSeason}?api_key=${process.env.NEXT_PUBLIC_TMDB_API_KEY}&language=pt-BR`
                );
                const data = await response.json();
                setEpisodes(data.episodes || []);
            } catch (error) {
                console.error('Error fetching episodes:', error);
            }
        };

        fetchEpisodes();
    }, [showId, selectedSeason]);

    const handleSeasonSelect = (seasonNumber: number) => {
        setSelectedSeason(seasonNumber);
        setStep(2);
    };

    const handleWatch = () => {
        if (selectedSeason && selectedEpisode) {
            onSelect(selectedSeason, selectedEpisode);
        }
    };

    const currentEpisode = episodes.find(ep => ep.episode_number === selectedEpisode);

    const columnsCount = 5;
    const selectedIndex = episodes.findIndex(e => e.episode_number === selectedEpisode);
    const selectedRow = selectedIndex !== -1 ? Math.floor(selectedIndex / columnsCount) : -1;

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-600"></div>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-[85vh]">
            <div className="p-6 border-b border-gray-800">
                <h2 className="text-3xl font-black text-white">
                    {step === 1 ? 'Escolha a Temporada' : 'Escolha o Episódio'}
                </h2>
                {selectedSeason && step === 2 && (
                    <p className="mt-2 text-sm text-gray-400">
                        Temporada {selectedSeason} • {episodes.length} episódios
                    </p>
                )}
            </div>

            <div className="flex-1 overflow-y-auto p-6 scrollbar-hide">
                {step === 1 && (
                    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-4">
                        {seasons.map((season) => (
                            <button
                                key={season.season_number}
                                onClick={() => handleSeasonSelect(season.season_number)}
                                className="aspect-square bg-gray-800/50 hover:bg-gray-700 border-2 border-gray-700 hover:border-purple-500 rounded-xl transition-all transform hover:scale-105 flex flex-col items-center justify-center gap-2"
                            >
                                <span className="text-4xl font-black text-white">{season.season_number}</span>
                                <span className="text-xs text-gray-400">{season.episode_count} eps</span>
                            </button>
                        ))}
                    </div>
                )}

                {step === 2 && (
                    <div className="space-y-4">
                        {/* Info for first row - appears at top */}
                        {selectedRow === 0 && currentEpisode && (
                            <div className="p-4 bg-gradient-to-r from-purple-900/40 to-blue-900/40 border border-purple-700/50 rounded-xl animate-in fade-in duration-300">
                                <div className="flex gap-4">
                                    {currentEpisode.still_path && (
                                        <div className="relative w-48 h-28 flex-shrink-0 rounded-lg overflow-hidden">
                                            <Image
                                                src={`https://image.tmdb.org/t/p/w300${currentEpisode.still_path}`}
                                                alt={currentEpisode.name}
                                                fill
                                                className="object-cover"
                                            />
                                        </div>
                                    )}
                                    <div className="flex-1 min-w-0">
                                        <h3 className="text-xl font-bold text-white mb-1">
                                            EP {currentEpisode.episode_number}: {currentEpisode.name}
                                        </h3>
                                        <p className="text-sm text-gray-300 line-clamp-2">
                                            {currentEpisode.overview || 'Sinopse não disponível.'}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Episode Grid */}
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                            {episodes.map((episode, index) => {
                                const isSelected = selectedEpisode === episode.episode_number;
                                const currentRow = Math.floor(index / columnsCount);

                                const isLastCardBeforeSelectedRow =
                                    selectedRow > 0 &&
                                    currentRow === selectedRow - 1 &&
                                    (index % columnsCount === columnsCount - 1 || index === episodes.length - 1 || index === selectedRow * columnsCount - 1);

                                return (
                                    <React.Fragment key={episode.episode_number}>
                                        <button
                                            onClick={() => setSelectedEpisode(episode.episode_number)}
                                            className={`group relative aspect-video rounded-xl overflow-hidden transition-all transform hover:scale-105 ${isSelected
                                                    ? 'ring-4 ring-purple-500 shadow-xl shadow-purple-500/50'
                                                    : 'hover:ring-2 hover:ring-gray-600'
                                                }`}
                                        >
                                            {episode.still_path ? (
                                                <>
                                                    <Image
                                                        src={`https://image.tmdb.org/t/p/w300${episode.still_path}`}
                                                        alt={episode.name}
                                                        fill
                                                        className={`object-cover ${isSelected ? 'opacity-100' : 'opacity-70 group-hover:opacity-100'
                                                            }`}
                                                    />
                                                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                                                </>
                                            ) : (
                                                <div className="absolute inset-0 bg-gray-800 flex items-center justify-center">
                                                    <div className="w-16 h-16 rounded-lg bg-gray-700 animate-pulse" />
                                                </div>
                                            )}

                                            <div className="absolute top-2 left-2 px-3 py-1 bg-black/80 rounded-lg">
                                                <span className="text-sm font-bold text-white">EP {episode.episode_number}</span>
                                            </div>

                                            <div className="absolute bottom-0 left-0 right-0 p-3">
                                                <p className="text-sm font-bold text-white truncate">{episode.name}</p>
                                            </div>

                                            {isSelected && (
                                                <div className="absolute top-2 right-2 w-7 h-7 bg-purple-600 rounded-full flex items-center justify-center">
                                                    <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                                    </svg>
                                                </div>
                                            )}
                                        </button>

                                        {/* Info for other rows - appears after previous row */}
                                        {isLastCardBeforeSelectedRow && currentEpisode && (
                                            <div className="col-span-full p-4 bg-gradient-to-r from-purple-900/40 to-blue-900/40 border border-purple-700/50 rounded-xl animate-in fade-in duration-300">
                                                <div className="flex gap-4">
                                                    {currentEpisode.still_path && (
                                                        <div className="relative w-48 h-28 flex-shrink-0 rounded-lg overflow-hidden">
                                                            <Image
                                                                src={`https://image.tmdb.org/t/p/w300${currentEpisode.still_path}`}
                                                                alt={currentEpisode.name}
                                                                fill
                                                                className="object-cover"
                                                            />
                                                        </div>
                                                    )}
                                                    <div className="flex-1 min-w-0">
                                                        <h3 className="text-xl font-bold text-white mb-1">
                                                            EP {currentEpisode.episode_number}: {currentEpisode.name}
                                                        </h3>
                                                        <p className="text-sm text-gray-300 line-clamp-2">
                                                            {currentEpisode.overview || 'Sinopse não disponível.'}
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </React.Fragment>
                                );
                            })}
                        </div>
                    </div>
                )}
            </div>

            <div className="p-6 border-t border-gray-800 bg-black/50 backdrop-blur-lg">
                <div className="flex gap-3">
                    {step === 2 && (
                        <>
                            <button
                                onClick={() => setStep(1)}
                                className="px-6 py-3 bg-gray-800 hover:bg-gray-700 rounded-xl font-bold text-white transition-all"
                            >
                                ← Voltar
                            </button>
                            <button
                                onClick={handleWatch}
                                disabled={!selectedEpisode}
                                className="flex-1 flex items-center justify-center gap-3 px-8 py-4 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 disabled:from-gray-700 disabled:to-gray-700 disabled:cursor-not-allowed rounded-xl font-bold text-white text-lg transition-all transform hover:scale-105 shadow-lg shadow-green-600/50"
                            >
                                <Play className="w-6 h-6 fill-current" />
                                Assistir Agora
                            </button>
                        </>
                    )}
                    <button
                        onClick={onClose}
                        className="px-6 py-3 bg-gray-800 hover:bg-gray-700 rounded-xl font-bold text-white transition-colors"
                    >
                        Cancelar
                    </button>
                </div>
            </div>

            <style jsx global>{`
                .scrollbar-hide {
                    -ms-overflow-style: none;
                    scrollbar-width: none;
                }
                .scrollbar-hide::-webkit-scrollbar {
                    display: none;
                }
            `}</style>
        </div>
    );
};

export default EpisodeSelector;
