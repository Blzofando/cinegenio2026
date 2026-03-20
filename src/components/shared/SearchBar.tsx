import React from 'react';
import { Search, X } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { useSearchBar } from '@/hooks/useSearchBar';

const SearchBar: React.FC = () => {
    const { 
        query, 
        setQuery, 
        results, 
        isLoading, 
        showResults, 
        setShowResults, 
        getGenreNames, 
        getYear, 
        clearSearch 
    } = useSearchBar();

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
                    className="w-full sm:w-48 md:w-56 lg:w-64 xl:w-80 px-4 py-2 pl-10 
                               bg-white/20 backdrop-blur-md border border-white/25
                               rounded-full text-white text-sm placeholder-gray-400
                               focus:bg-white/30 focus:border-purple-500/50 focus:outline-none focus:ring-2 focus:ring-purple-500/20
                               transition-all duration-300 hover:bg-white/25"
                />
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-purple-400 transition-colors pointer-events-none" />
                {query && (
                     <Button
                        variant="ghost"
                        size="icon"
                        onClick={clearSearch}
                        className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full"
                    >
                        <X className="w-4 h-4 text-gray-400" />
                    </Button>
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
                                    clearSearch();
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
                                        <span className="px-2 py-0.5 bg-purple-600/20 text-purple-300 border border-purple-500/30 rounded text-xs font-medium">
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
