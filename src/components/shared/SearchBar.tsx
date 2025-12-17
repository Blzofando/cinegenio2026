import React, { useState, useEffect } from 'react';
import { Search, X } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';

interface SearchResult {
    id: number;
    title: string;
    name?: string;
    media_type: 'movie' | 'tv';
    poster_path: string | null;
    release_date?: string;
    first_air_date?: string;
    genre_ids: number[];
    vote_average: number;
}

const SearchBar: React.FC = () => {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<SearchResult[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [showResults, setShowResults] = useState(false);

    // Debounced search
    useEffect(() => {
        if (!query.trim()) {
            setResults([]);
            setShowResults(false);
            return;
        }

        setIsLoading(true);
        const timer = setTimeout(async () => {
            try {
                const response = await fetch(
                    `https://api.themoviedb.org/3/search/multi?api_key=${process.env.NEXT_PUBLIC_TMDB_API_KEY}&language=pt-BR&query=${encodeURIComponent(query)}&page=1&include_adult=false`
                );
                const data = await response.json();
                const filteredResults = data.results
                    .filter((result: any) => result.media_type === 'movie' || result.media_type === 'tv')
                    .slice(0, 8);
                setResults(filteredResults);
                setShowResults(true);
            } catch (error) {
                console.error('Search error:', error);
            } finally {
                setIsLoading(false);
            }
        }, 300);

        return () => clearTimeout(timer);
    }, [query]);

    const getGenreNames = (genreIds: number[]): string => {
        const genreMap: Record<number, string> = {
            28: 'Ação', 12: 'Aventura', 16: 'Animação', 35: 'Comédia', 80: 'Crime',
            99: 'Documentário', 18: 'Drama', 10751: 'Família', 14: 'Fantasia', 36: 'História',
            27: 'Terror', 10402: 'Música', 9648: 'Mistério', 10749: 'Romance', 878: 'Ficção',
            10770: 'TV', 53: 'Thriller', 10752: 'Guerra', 37: 'Faroeste'
        };
        return genreIds.slice(0, 2).map(id => genreMap[id]).filter(Boolean).join(', ') || 'N/A';
    };

    const getYear = (result: SearchResult): string => {
        const date = result.release_date || result.first_air_date;
        return date ? new Date(date).getFullYear().toString() : 'N/A';
    };

    return (
        <div className="relative">
            {/* Search Input */}
            <div className="relative group">
                <input
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onFocus={() => query && setShowResults(true)}
                    placeholder="Buscar filmes e séries..."
                    className="w-full sm:w-48 md:w-56 lg:w-64 xl:w-80 px-4 py-2.5 pl-10 
                               bg-white/5 backdrop-blur-md border border-white/10
                               rounded-full text-white text-sm placeholder-gray-400
                               focus:bg-white/10 focus:border-purple-500/50 focus:outline-none focus:ring-2 focus:ring-purple-500/20
                               transition-all duration-300 hover:bg-white/8"
                />
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-purple-400 transition-colors pointer-events-none" />
                {query && (
                    <button
                        onClick={() => {
                            setQuery('');
                            setResults([]);
                            setShowResults(false);
                        }}
                        className="absolute right-3 top-1/2 -translate-y-1/2 hover:scale-110 transition-transform"
                    >
                        <X className="w-4 h-4 text-gray-400 hover:text-white transition-colors" />
                    </button>
                )}
            </div>

            {/* Results Dropdown */}
            {showResults && results.length > 0 && (
                <>
                    <div
                        className="fixed inset-0 z-40"
                        onClick={() => setShowResults(false)}
                    />
                    <div className="absolute top-full mt-2 left-0 right-0 sm:right-0 sm:left-auto sm:w-[400px] md:w-[500px] max-h-[70vh] sm:max-h-[600px] overflow-y-auto bg-zinc-900 border border-white/10 rounded-lg shadow-2xl z-50">
                        {results.map((result) => (
                            <Link
                                key={`${result.media_type}-${result.id}`}
                                href={`/${result.media_type}/${result.id}`}
                                onClick={() => {
                                    setQuery('');
                                    setShowResults(false);
                                }}
                                className="flex gap-2 sm:gap-3 p-2 sm:p-3 hover:bg-white/10 transition-colors border-b border-white/5 last:border-0"
                            >
                                {/* Poster */}
                                <div className="relative w-12 h-18 sm:w-16 sm:h-24 flex-shrink-0 bg-zinc-800 rounded overflow-hidden">
                                    {result.poster_path ? (
                                        <Image
                                            src={`https://image.tmdb.org/t/p/w92${result.poster_path}`}
                                            alt={result.title || result.name || ''}
                                            fill
                                            className="object-cover"
                                        />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-white/30 text-xs">
                                            Sem capa
                                        </div>
                                    )}
                                </div>

                                {/* Info */}
                                <div className="flex-1 min-w-0">
                                    <h3 className="font-semibold text-white truncate text-sm sm:text-base">
                                        {result.title || result.name}
                                    </h3>

                                    <div className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm text-white/60 mt-1 flex-wrap">
                                        <span className="px-2 py-0.5 bg-purple-600/30 text-purple-300 rounded text-xs font-medium">
                                            {result.media_type === 'movie' ? 'Filme' : 'Série'}
                                        </span>
                                        <span>{getYear(result)}</span>
                                        {result.vote_average > 0 && (
                                            <>
                                                <span>•</span>
                                                <span className="flex items-center gap-1">
                                                    <span className="text-yellow-400">★</span>
                                                    {result.vote_average.toFixed(1)}
                                                </span>
                                            </>
                                        )}
                                    </div>

                                    <p className="text-xs text-white/50 mt-1 truncate">
                                        {getGenreNames(result.genre_ids)}
                                    </p>
                                </div>
                            </Link>
                        ))}
                    </div>
                </>
            )}

            {/* Loading State */}
            {isLoading && showResults && (
                <div className="absolute top-full mt-2 left-0 right-0 sm:right-0 sm:left-auto sm:w-[400px] md:w-[500px] p-4 bg-zinc-900 border border-white/10 rounded-lg shadow-2xl z-50">
                    <div className="text-center text-white/50">
                        Buscando...
                    </div>
                </div>
            )}
        </div>
    );
};

export default SearchBar;
