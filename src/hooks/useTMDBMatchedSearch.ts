"use client";

import { useState, useEffect } from 'react';

export interface SearchResult {
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

export const useTMDBMatchedSearch = (query: string) => {
    const [results, setResults] = useState<SearchResult[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [showResults, setShowResults] = useState(false);

    useEffect(() => {
        if (!query.trim()) {
            setResults([]);
            setShowResults(false);
            return;
        }

        setIsLoading(true);
        const timer = setTimeout(async () => {
            try {
                // Import TMDB key if needed or use from env
                const apiKey = process.env.NEXT_PUBLIC_TMDB_API_KEY;
                if (!apiKey) {
                    console.error('TMDB API Key missing');
                    setIsLoading(false);
                    return;
                }

                const response = await fetch(
                    `https://api.themoviedb.org/3/search/multi?api_key=${apiKey}&language=pt-BR&query=${encodeURIComponent(query)}&page=1&include_adult=false`
                );
                const data = await response.json();
                
                if (data.results) {
                    const filteredResults = data.results
                        .filter((result: any) => result.media_type === 'movie' || result.media_type === 'tv')
                        .slice(0, 8);
                    setResults(filteredResults);
                    setShowResults(true);
                } else {
                    setResults([]);
                }
            } catch (error) {
                console.error('Search error:', error);
                setResults([]);
            } finally {
                setIsLoading(false);
            }
        }, 300);

        return () => clearTimeout(timer);
    }, [query]);

    return {
        results,
        isLoading,
        showResults,
        setShowResults,
        setResults
    };
};
