import { useState } from 'react';
import { useTMDBMatchedSearch, SearchResult } from './useTMDBMatchedSearch';

export const useSearchBar = (initialQuery: string = '') => {
    const [query, setQuery] = useState(initialQuery);
    const { results, isLoading, showResults, setShowResults, setResults } = useTMDBMatchedSearch(query);

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

    const clearSearch = () => {
        setQuery('');
        setResults([]);
        setShowResults(false);
    };

    return {
        query,
        setQuery,
        results,
        isLoading,
        showResults,
        setShowResults,
        getGenreNames,
        getYear,
        clearSearch
    };
};
