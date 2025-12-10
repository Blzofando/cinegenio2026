// src/app/duel/page.tsx

"use client";

import React, { useState, useContext, useEffect } from 'react';
import { WatchedDataContext } from '@/contexts/WatchedDataContext';
import { DuelResult, TMDbSearchResult } from '@/types';
import { getDuelAnalysis } from '@/lib/recommendations';
import TitleSelector from '@/components/shared/TitleSelector';
import Image from 'next/image';

// --- Componente de Animação da Batalha ---
interface BattleAnimationProps {
    poster1?: string;
    poster2?: string;
}
const BattleAnimation: React.FC<BattleAnimationProps> = ({ poster1, poster2 }) => {
    const [showImpact, setShowImpact] = useState(false);

    useEffect(() => {
        const timer = setTimeout(() => {
            setShowImpact(true);
        }, 800);
        return () => clearTimeout(timer);
    }, []);

    return (
        <div className="mt-10 w-full max-w-xl flex flex-col items-center justify-center animate-fade-in">
            <div className="relative w-full h-48 flex justify-center items-center">
                <Image 
                    src={poster1 || 'https://placehold.co/150x225/374151/9ca3af?text=?'} 
                    alt="Pôster 1" 
                    width={150} height={225}
                    className="w-28 h-42 object-cover rounded-md shadow-lg absolute left-0 animate-duel-left"
                />
                
                <div className={`text-5xl font-black text-indigo-400 transition-opacity duration-300 ${showImpact ? 'opacity-0' : 'opacity-100 animate-pulse-vs'}`}>
                    VS
                </div>

                <Image 
                    src={poster2 || 'https://placehold.co/150x225/374151/9ca3af?text=?'} 
                    alt="Pôster 2" 
                    width={150} height={225}
                    className="w-28 h-42 object-cover rounded-md shadow-lg absolute right-0 animate-duel-right"
                />

                {showImpact && (
                    <div className="absolute text-7xl opacity-0 animate-comic-burst">
                        💥
                    </div>
                )}
            </div>
            <h2 className="text-xl font-bold text-gray-400 mt-4 animate-pulse">Duelo em análise...</h2>
        </div>
    );
};

// --- Componente de Exibição do Vencedor ---
interface WinnerDisplayProps {
    result: DuelResult;
    onReset: () => void;
}
const WinnerDisplay: React.FC<WinnerDisplayProps> = ({ result, onReset }) => {
    const winner = result.title1.probability >= result.title2.probability ? result.title1 : result.title2;
    return (
        <div className="mt-10 w-full max-w-2xl flex flex-col items-center animate-fade-in">
            <div className="relative">
                <div className="absolute -top-8 left-1/2 -translate-x-1/2 text-5xl animate-trophy-up">🏆</div>
                <Image src={winner.posterUrl || 'https://placehold.co/200x300/374151/9ca3af?text=?'} alt={`Pôster de ${winner.title}`} width={200} height={300} className="w-48 h-72 object-cover rounded-md shadow-2xl mb-4 border-4 border-yellow-400"/>
            </div>
            <h2 className="text-3xl font-bold text-white mt-4 text-center">{winner.title}</h2>
            <div className="mt-4 bg-gray-800 rounded-lg p-4 border border-green-500/50">
                <h3 className="text-xl font-bold text-green-400 mb-2">Veredito do Gênio</h3>
                <p className="text-gray-300 italic text-center">{result.verdict}</p>
            </div>
            <button onClick={onReset} className="mt-8 bg-gray-600 hover:bg-gray-500 text-white font-bold py-3 px-8 rounded-lg text-lg transition-colors">
                Novo Duelo
            </button>
        </div>
    );
};


// --- Componente Principal da Página ---
export default function DuelPage() {
    const { data: watchedData } = useContext(WatchedDataContext);
    const [title1, setTitle1] = useState<TMDbSearchResult | null>(null);
    const [title2, setTitle2] = useState<TMDbSearchResult | null>(null);
    const [result, setResult] = useState<DuelResult | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleDuel = async () => {
        if (!title1 || !title2) {
            setError('Por favor, selecione os dois títulos para o duelo.');
            return;
        }
        setIsLoading(true);
        setError(null);
        setResult(null);
        try {
            const duelResult = await getDuelAnalysis(
                { id: title1.id, mediaType: title1.media_type as 'movie' | 'tv' }, 
                { id: title2.id, mediaType: title2.media_type as 'movie' | 'tv' }, 
                watchedData
            );
            setTimeout(() => {
                setResult(duelResult);
                setIsLoading(false);
            }, 1500);
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Ocorreu um erro desconhecido.';
            setError(`Desculpe, não foi possível fazer a análise. ${errorMessage}`);
            setIsLoading(false);
        }
    };

    const handleReset = () => {
        setTitle1(null);
        setTitle2(null);
        setResult(null);
        setError(null);
        setIsLoading(false);
    };
    
    return (
        <div className="flex flex-col items-center p-4 text-center min-h-[calc(100vh-100px)] justify-center">
            {isLoading ? (
                <BattleAnimation 
                    poster1={title1?.poster_path ? `https://image.tmdb.org/t/p/w185${title1.poster_path}` : undefined} 
                    poster2={title2?.poster_path ? `https://image.tmdb.org/t/p/w185${title2.poster_path}` : undefined} 
                />
            ) : result ? (
                <WinnerDisplay result={result} onReset={handleReset} />
            ) : (
                <>
                    <h1 className="text-4xl font-bold text-white mb-2">Duelo de Títulos</h1>
                    <p className="text-lg text-gray-400 mb-8 max-w-2xl">
                        Em dúvida entre dois? Deixe o Gênio decidir qual tem mais a ver com você.
                    </p>
                    <div className="w-full max-w-2xl mb-8 grid grid-cols-1 sm:grid-cols-2 gap-4 items-stretch">
                        <TitleSelector label="Desafiante 1" onTitleSelect={setTitle1} />
                        <TitleSelector label="Desafiante 2" onTitleSelect={setTitle2} />
                    </div>
                    <button onClick={handleDuel} disabled={!title1 || !title2} className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-12 rounded-lg text-xl transition-all duration-300 transform hover:scale-105 shadow-lg disabled:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed">
                        Iniciar Duelo
                    </button>
                    {error && <p className="mt-8 text-red-400 bg-red-900/50 p-4 rounded-lg w-full max-w-2xl">{error}</p>}
                </>
            )}
        </div>
    );
};