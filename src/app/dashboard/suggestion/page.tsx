// src/app/suggestion/page.tsx

"use client";

import React, { useState, useMemo, useContext, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation'; // Hook do Next.js para ler a URL
import { Recommendation, ManagedWatchedItem, MediaType, SuggestionFilters } from '@/types';
import { getPersonalizedSuggestion } from '@/lib/recommendations';
import { WatchedDataContext } from '@/contexts/WatchedDataContext';
import RecommendationCard from '@/components/RecommendationCard';
import { Button } from '@/components/ui/Button';
import { RecommendationSkeleton } from '@/components/shared/skeletons/RecommendationSkeleton';
import { getTopGenres } from '@/lib/utils/genreUtils';


// Componente principal que usa os dados da URL
function SuggestionComponent() {
    const searchParams = useSearchParams();
    const { data: watchedData } = useContext(WatchedDataContext);
    
    const [filters, setFilters] = useState<SuggestionFilters>({
        category: null,
        genres: [],
        keywords: '',
    });

    const [recommendation, setRecommendation] = useState<Recommendation | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [sessionSuggestions, setSessionSuggestions] = useState<string[]>([]);

    // Efeito para ler os filtros da URL quando a página carrega
    useEffect(() => {
        const category = searchParams.get('category') as MediaType | null;
        const genres = searchParams.get('genres')?.split(',') || [];
        const keywords = searchParams.get('keywords') || '';

        if (category || genres.length > 0 || keywords) {
            setFilters({ category, genres, keywords });
        }
    }, [searchParams]);

    const topGenres = useMemo(() => getTopGenres(watchedData.amei, watchedData.gostei, 10), [watchedData]);

    const handleFilterChange = <K extends keyof SuggestionFilters>(key: K, value: SuggestionFilters[K]) => {
        setFilters(prev => ({ ...prev, [key]: value }));
    };

    const handleGenreToggle = (genreToToggle: string) => {
        const newGenres = filters.genres.includes(genreToToggle)
          ? filters.genres.filter(g => g !== genreToToggle)
          : [...filters.genres, genreToToggle];
        handleFilterChange('genres', newGenres);
    };

    const handleGetSuggestion = async () => {
        setIsLoading(true);
        setError(null);
        setRecommendation(null);
        try {
            const result = await getPersonalizedSuggestion(watchedData, filters, sessionSuggestions);
            setRecommendation(result);
            setSessionSuggestions(prev => [...prev, result.title]);
        } catch (err) {
            console.error(err);
            setError('Desculpe, não foi possível gerar uma sugestão. Tente novamente mais tarde.');
        } finally {
            setIsLoading(false);
        }
    };

    const renderFilterSection = (title: string, children: React.ReactNode) => (
        <div className="mb-6">
          <h2 className="text-xl font-semibold text-gray-300 mb-3">{title}</h2>
          <div className="flex flex-wrap gap-2">
            {children}
          </div>
        </div>
    );
    
    // O JSX restante é o mesmo do seu componente original
    return (
        <div className="flex flex-col items-center p-4 text-center">
            <h1 className="text-4xl font-bold text-white mb-2">Sugestão Personalizada</h1>
            <p className="text-lg text-gray-400 mb-8 max-w-2xl">Refine sua busca para encontrar a recomendação ideal.</p>

            <div className="w-full max-w-2xl bg-gray-800 p-6 rounded-lg shadow-xl mb-8 text-left">
                {renderFilterSection('1. Escolha a Categoria',
                    (['Filme', 'Série', 'Anime', 'Programa'] as const).map(cat => (
                        <Button 
                            key={cat} 
                            variant="ghost"
                            onClick={() => handleFilterChange('category', filters.category === cat ? null : cat)} 
                            className={`px-4 py-2 font-bold transition-all duration-300 h-auto ${filters.category === cat ? 'bg-indigo-600 text-white' : 'bg-gray-700 hover:bg-gray-600 text-gray-300'}`}
                        >
                            {cat}
                        </Button>
                    ))
                )}
                {renderFilterSection('2. Selecione Gêneros (Opcional)',
                    topGenres.map(genre => (
                        <Button 
                            key={genre} 
                            variant="ghost"
                            onClick={() => handleGenreToggle(genre)} 
                            className={`px-4 py-2 font-bold transition-all duration-300 h-auto ${filters.genres.includes(genre) ? 'bg-indigo-600 text-white' : 'bg-gray-700 hover:bg-gray-600 text-gray-300'}`}
                        >
                            {genre}
                        </Button>
                    ))
                )}
                <div className="mb-4">
                    <h2 className="text-xl font-semibold text-gray-300 mb-3">3. Adicione Palavras-Chave (Opcional)</h2>
                    <input type="text" value={filters.keywords} onChange={(e) => handleFilterChange('keywords', e.target.value)} placeholder="Ex: viagem no tempo, suspense psicológico..." className="w-full bg-gray-700 text-white p-3 rounded-lg border border-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                </div>
            </div>
            
            <Button 
                onClick={handleGetSuggestion} 
                disabled={isLoading} 
                className="py-4 px-8 text-xl transform hover:scale-105 shadow-lg hover:shadow-indigo-500/50"
            >
                {isLoading ? 'Gerando...' : 'Gerar Sugestão'}
            </Button>

            {isLoading && (
                <div className="w-full max-w-4xl mt-8">
                    <RecommendationSkeleton />
                </div>
            )}
            {error && <p className="mt-8 text-red-400 bg-red-900/50 p-4 rounded-lg">{error}</p>}
            {recommendation && <RecommendationCard recommendation={recommendation} />}
        </div>
    );
}

// Componente de página que envolve o componente principal com Suspense
export default function SuggestionPage() {
    return (
        <Suspense fallback={<div>Carregando...</div>}>
            <SuggestionComponent />
        </Suspense>
    );
}