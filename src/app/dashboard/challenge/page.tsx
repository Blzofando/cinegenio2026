// src/app/challenge/page.tsx

"use client";

import React, { useState, useContext, useEffect } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase/client';
import { WatchedDataContext } from '@/contexts/WatchedDataContext';
import { WatchlistContext } from '@/contexts/WatchlistContext';
import { Challenge, ChallengeStep, WatchlistItem } from '@/types';
import { generateNewWeeklyChallenge, updateChallenge } from '@/lib/challenge';
import DetailsModal from '@/components/shared/DetailsModal';
import Image from 'next/image';

// --- Componentes Internos ---
const LoadingSpinner = () => (
    <div className="flex flex-col items-center justify-center space-y-2 mt-8">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-400"></div>
        <span className="text-lg text-gray-400">O Gênio está a preparar o seu desafio...</span>
    </div>
);

interface StepCardProps {
    step: ChallengeStep;
    onClick: () => void;
}
const StepCard: React.FC<StepCardProps> = ({ step, onClick }) => {
    return (
        <div className="relative bg-gray-800 rounded-lg group overflow-hidden shadow-lg cursor-pointer" onClick={onClick}>
            <Image src={step.posterUrl || '/placeholder.png'} alt={`Pôster de ${step.title}`} width={500} height={750} className="w-full h-full object-cover aspect-[2/3] transition-transform duration-300 group-hover:scale-105"/>
            {step.completed && (
                <div className="absolute inset-0 bg-green-900/70 backdrop-blur-sm flex flex-col items-center justify-center">
                    <span className="text-5xl">✅</span>
                    <span className="text-xl font-bold text-white mt-2">CONCLUÍDO</span>
                </div>
            )}
            <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-black/80 to-transparent"></div>
            <p className="absolute bottom-2 left-2 right-2 text-white font-bold text-center text-sm">{step.title}</p>
        </div>
    );
};

// --- Componente Principal da Página ---
export default function ChallengePage() {
    const { data: watchedData } = useContext(WatchedDataContext);
    const { addToWatchlist, isInWatchlist } = useContext(WatchlistContext);
    
    const [challenge, setChallenge] = useState<Challenge | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [selectedItem, setSelectedItem] = useState<{ step: ChallengeStep, index: number } | null>(null);

    useEffect(() => {
        if (Object.values(watchedData).flat().length === 0) {
            setError("Você precisa ter itens na sua coleção para gerar um desafio.");
            setIsLoading(false);
            return;
        }

        const now = new Date();
        const startOfYear = new Date(now.getFullYear(), 0, 1);
        const day = startOfYear.getDay() > 0 ? startOfYear.getDay() : 7;
        const weekNumber = Math.ceil((((now.getTime() - startOfYear.getTime()) / 86400000) + day) / 7);
        const weekId = `${now.getFullYear()}-${weekNumber}`;

        const challengeRef = doc(db, 'challenges', weekId);

        const unsubscribe = onSnapshot(challengeRef, (docSnap) => {
            if (docSnap.exists()) {
                setChallenge(docSnap.data() as Challenge);
                setIsLoading(false);
            } else {
                console.log("Desafio não encontrado para a semana. Gerando um novo...");
                generateNewWeeklyChallenge(watchedData)
                    .catch(err => {
                        setError("Não foi possível gerar o desafio. Tente novamente.");
                        console.error(err);
                        setIsLoading(false);
                    });
            }
        }, (err) => {
            console.error("Erro no listener do Firestore:", err);
            setError("Erro ao conectar com a base de dados do desafio.");
            setIsLoading(false);
        });

        return () => unsubscribe();

    }, [watchedData]);

    const handleToggleStep = async (stepIndex: number) => {
        if (!challenge || !challenge.steps) return;
        const newSteps = [...challenge.steps];
        newSteps[stepIndex].completed = !newSteps[stepIndex].completed;
        const allStepsCompleted = newSteps.every(step => step.completed);
        const updatedChallenge: Challenge = { ...challenge, steps: newSteps, status: allStepsCompleted ? 'completed' : 'active' };
        setChallenge(updatedChallenge);
        await updateChallenge(updatedChallenge);
        setSelectedItem(null);
    };
    
    const handleAddToWatchlist = (item: ChallengeStep) => {
        const watchlistItem: WatchlistItem = {
            id: item.tmdbId,
            tmdbMediaType: item.tmdbMediaType,
            title: item.title,
            posterUrl: item.posterUrl,
            addedAt: Date.now(),
        };
        addToWatchlist(watchlistItem);
        setSelectedItem(null);
    };

    const renderDetailsModalActions = () => {
        if (!selectedItem) return null;

        const { step, index } = selectedItem;
        const isItemInWatchlist = isInWatchlist(step.tmdbId);

        return (
            <>
                <button 
                    onClick={() => handleToggleStep(index)} 
                    className={`w-full sm:w-auto flex-1 font-bold py-2 px-4 rounded-lg text-white ${step.completed ? 'bg-yellow-600 hover:bg-yellow-700' : 'bg-green-600 hover:bg-green-700'}`}
                >
                    {step.completed ? 'Desmarcar Conclusão' : 'Marcar como Concluído'}
                </button>
                <button 
                    onClick={() => handleAddToWatchlist(step)} 
                    disabled={isItemInWatchlist} 
                    className="w-full sm:w-auto flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg disabled:bg-gray-600 disabled:cursor-not-allowed"
                >
                    {isItemInWatchlist ? 'Já na Watchlist' : 'Adicionar à Watchlist'}
                </button>
                <button 
                    onClick={() => setSelectedItem(null)} 
                    className="w-full sm:w-auto bg-gray-600 hover:bg-gray-500 text-white font-bold py-2 px-4 rounded-lg"
                >
                    Fechar
                </button>
            </>
        );
    };

    return (
        <div className="flex flex-col items-center p-4 text-center">
            <h1 className="text-4xl font-bold text-white mb-2">Desafio do Gênio</h1>
            <p className="text-lg text-gray-400 mb-8 max-w-2xl">
                Expanda os seus horizontes com uma nova sugestão a cada semana!
            </p>

            {isLoading && <LoadingSpinner />}
            {error && <p className="mt-8 text-red-400 bg-red-900/50 p-4 rounded-lg">{error}</p>}
            
            {selectedItem && (
                <DetailsModal
                    item={{ 
                        id: selectedItem.step.tmdbId, 
                        tmdbMediaType: selectedItem.step.tmdbMediaType, 
                        title: selectedItem.step.title, 
                        posterUrl: selectedItem.step.posterUrl 
                    }}
                    onClose={() => setSelectedItem(null)}
                    actions={renderDetailsModalActions()}
                />
            )}

            {!isLoading && challenge && (
                <div className="w-full max-w-4xl bg-gray-800 border border-indigo-500/30 rounded-xl shadow-2xl p-6 animate-fade-in">
                    <span className="inline-block bg-indigo-500/20 text-indigo-300 font-bold py-1 px-3 rounded-full text-sm border border-indigo-500 mb-4">
                        {challenge.challengeType}
                    </span>
                    <div>
                        <p className="text-gray-300 mt-2 mb-6 max-w-2xl mx-auto">{challenge.reason}</p>
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                            {challenge.steps.map((step, index) => (
                                <StepCard 
                                    key={step.tmdbId} 
                                    step={step} 
                                    onClick={() => setSelectedItem({ step, index })}
                                />
                            ))}
                        </div>
                    </div>

                    {challenge.status === 'completed' && (
                        <div className="mt-6 bg-green-500/20 text-green-300 font-bold py-3 px-4 rounded-lg border border-green-500">
                            Desafio Concluído! Bom trabalho!
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};