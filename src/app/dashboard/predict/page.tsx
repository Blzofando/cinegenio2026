// src/app/predict/page.tsx

"use client";

import React, { useState, useContext } from 'react';
import { Recommendation, TMDbSearchResult } from '@/types';
import { getPredictionAsRecommendation } from '@/lib/recommendations';
import { WatchedDataContext } from '@/contexts/WatchedDataContext';
import RecommendationCard from '@/components/RecommendationCard';
import TitleSelector from '@/components/shared/TitleSelector';
import { Button } from '@/components/ui/Button';
import { RecommendationSkeleton } from '@/components/shared/skeletons/RecommendationSkeleton';


export default function PredictPage() {
    const { data: watchedData } = useContext(WatchedDataContext);
    const [selectedSuggestion, setSelectedSuggestion] = useState<TMDbSearchResult | null>(null);
    const [result, setResult] = useState<Recommendation | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleTitleSelect = (selection: TMDbSearchResult | null) => {
        setSelectedSuggestion(selection);
        if (result) setResult(null);
        if (error) setError(null);
    };

    const handleAnalyze = async () => {
        if (!selectedSuggestion) {
            setError('Por favor, selecione um título da lista para analisar.');
            return;
        }
        setIsLoading(true);
        setError(null);
        setResult(null);
        try {
            const predictionResult = await getPredictionAsRecommendation({ 
                id: selectedSuggestion.id, 
                mediaType: selectedSuggestion.media_type as 'movie' | 'tv' 
            }, watchedData);
            setResult(predictionResult);
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Ocorreu um erro desconhecido.';
            console.error(err);
            setError(`Desculpe, não foi possível fazer a análise. ${errorMessage}`);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex flex-col items-center p-4 text-center">
            <h1 className="text-4xl font-bold text-white mb-2">Será que vou gostar?</h1>
            <p className="text-lg text-gray-400 mb-8 max-w-2xl">
                Selecione um filme ou série e o CineGênio analisará se tem a ver com seu perfil.
            </p>

            <div className="w-full max-w-lg mb-8">
                <TitleSelector 
                    label="Comece a digitar um título..." 
                    onTitleSelect={handleTitleSelect}
                />
                
                <Button
                    onClick={handleAnalyze}
                    disabled={isLoading || !selectedSuggestion}
                    className="mt-4 w-full py-4 text-lg transform hover:scale-105 shadow-lg"
                >
                    {isLoading ? 'Analisando...' : 'Analisar'}
                </Button>
            </div>

            {isLoading && (
                <div className="w-full max-w-lg mt-8">
                    <RecommendationSkeleton />
                </div>
            )}
            {error && <p className="mt-4 text-red-400 bg-red-900/50 p-4 rounded-lg w-full max-w-lg">{error}</p>}

            {result && !isLoading && (
                <RecommendationCard recommendation={result} />
            )}
        </div>
    );
};