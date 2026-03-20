// src/components/shared/TitleSelector.tsx

"use client";

import React, { useState, useMemo, useCallback } from 'react';
import { TMDbSearchResult } from '@/types';
import { searchTMDb } from '@/lib/tmdb';
import Image from 'next/image';
import { Button } from '@/components/ui/Button';

interface TitleSelectorProps {
    onTitleSelect: (selection: TMDbSearchResult | null) => void;
    label: string;
}

const TitleSelector: React.FC<TitleSelectorProps> = ({ onTitleSelect, label }) => {
    const [query, setQuery] = useState('');
    const [suggestions, setSuggestions] = useState<TMDbSearchResult[]>([]);
    const [selectedTitle, setSelectedTitle] = useState<TMDbSearchResult | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    const debounceSearch = useCallback((searchFn: (q: string) => void, delay: number) => {
        let timeoutId: NodeJS.Timeout;
        return (q: string) => { clearTimeout(timeoutId); timeoutId = setTimeout(() => searchFn(q), delay); };
    }, []);

    const fetchSuggestions = async (q: string) => {
        if (q.length < 3) { setSuggestions([]); return; }
        setIsLoading(true);
        try {
            const results = await searchTMDb(q);
            setSuggestions(results.slice(0, 5));
        } catch (err) { console.error(err); } 
        finally { setIsLoading(false); }
    };

    const debouncedFetch = useMemo(() => debounceSearch(fetchSuggestions, 300), [debounceSearch]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newQuery = e.target.value;
        setQuery(newQuery);
        debouncedFetch(newQuery);
    };

    const handleSelect = (suggestion: TMDbSearchResult) => {
        setSelectedTitle(suggestion);
        onTitleSelect(suggestion);
        setQuery('');
        setSuggestions([]);
    };

    const handleReset = () => {
        setSelectedTitle(null);
        onTitleSelect(null);
        setQuery('');
    };

    if (selectedTitle) {
        return (
            <div className="bg-gray-700/50 p-4 rounded-lg">
                <div className="flex items-start gap-4">
                    <Image src={selectedTitle.poster_path ? `https://image.tmdb.org/t/p/w92${selectedTitle.poster_path}` : '/placeholder.png'} alt="poster" width={80} height={120} className="w-20 h-[120px] object-cover rounded-md bg-gray-800"/>
                    <div className="flex-grow text-left">
                        <p className="font-bold text-white text-lg">{selectedTitle.title || selectedTitle.name}</p>
                        <p className="text-sm text-gray-400">{selectedTitle.media_type === 'movie' ? 'Filme' : 'Série'} ({new Date(selectedTitle.release_date || selectedTitle.first_air_date || '').getFullYear()})</p>
                         <Button 
                            variant="ghost" 
                            onClick={handleReset} 
                            className="text-xs text-indigo-400 hover:underline mt-2 p-0 h-auto min-w-0"
                        >
                            Trocar
                        </Button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="relative">
            <input
                type="text"
                value={query}
                onChange={handleInputChange}
                placeholder={label}
                className="w-full bg-gray-800 text-white p-4 rounded-lg border-2 border-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-lg"
            />
            {isLoading && <div className="absolute right-3 top-4"><div className="animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-400"></div></div>}
            {suggestions.length > 0 && (
                <ul className="absolute z-10 w-full bg-gray-700 border border-gray-600 rounded-lg mt-1 max-h-80 overflow-y-auto shadow-lg">
                    {suggestions.map(s => (
                        <li key={s.id} onClick={() => handleSelect(s)} className="p-3 hover:bg-indigo-600 cursor-pointer flex items-start gap-4 text-left">
                            <Image src={s.poster_path ? `https://image.tmdb.org/t/p/w92${s.poster_path}` : '/placeholder.png'} alt="poster" width={50} height={75} className="w-12 h-[72px] object-cover rounded-md bg-gray-800 flex-shrink-0"/>
                            <div className="flex-grow">
                                <p className="font-bold text-white leading-tight">{s.title || s.name}</p>
                                {/* A CORREÇÃO ESTÁ AQUI: */}
                                <p className="text-sm text-gray-400">{s.media_type === 'movie' ? 'Filme' : 'Série'} ({new Date(s.release_date || s.first_air_date || '').getFullYear()})</p>
                            </div>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
};

export default TitleSelector;