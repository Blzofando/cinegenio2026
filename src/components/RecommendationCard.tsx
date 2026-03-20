"use client";

import React, { useContext, useState, useMemo, useEffect } from 'react'; // Adicionado useEffect
import { Recommendation, WatchlistItem, ManagedWatchedItem } from '@/types';
import { WatchedDataContext } from '@/contexts/WatchedDataContext';
import { WatchlistContext } from '@/contexts/WatchlistContext';
import Image from 'next/image';
import { Button } from '@/components/ui/Button';

type RecommendationCardProps = {
    recommendation: Recommendation;
    onAddToWatchlist?: (item: WatchlistItem) => void;
    isInWatchlist?: (id: number) => boolean;
};

const RecommendationCard = ({ recommendation, onAddToWatchlist: onAddToWatchlistProp, isInWatchlist: isInWatchlistProp }: RecommendationCardProps) => {
    const { title, type, genre, synopsis, analysis, probabilities, posterUrl, id, tmdbMediaType } = recommendation;
    
    const { addToWatchlist: addToWatchlistContext, isInWatchlist: isInWatchlistContext } = useContext(WatchlistContext);
    const { data: watchedData } = useContext(WatchedDataContext);
    const [isSaved, setIsSaved] = useState(false);
    
    // CORREÇÃO: Estado para controlar se o componente já está montado no cliente
    const [isClient, setIsClient] = useState(false);

    // CORREÇÃO: Este useEffect só roda no cliente, após a primeira renderização.
    useEffect(() => {
        setIsClient(true);
    }, []);


    const onAddToWatchlist = onAddToWatchlistProp || addToWatchlistContext;
    const isInWatchlist = isInWatchlistProp || isInWatchlistContext;

    const isInCollection = useMemo(() => {
        return Object.values(watchedData).flat().some((item: ManagedWatchedItem) => item.id === id);
    }, [watchedData, id]);

    const handleSaveToWatchlist = () => {
        const itemToAdd: WatchlistItem = {
            id,
            tmdbMediaType,
            title,
            posterUrl,
            addedAt: Date.now(),
        };
        onAddToWatchlist(itemToAdd);
        setIsSaved(true);
    };

    const probabilityColors: Record<string, string> = {
        amei: 'bg-green-500',
        gostei: 'bg-indigo-500',
        meh: 'bg-yellow-500',
        naoGostei: 'bg-red-500',
    };

    // CORREÇÃO: A lógica para mostrar o botão agora também depende do isClient
    const showSaveButton = isClient && !isInCollection && !isInWatchlist(id) && !isSaved;

    return (
        <div className="mt-8 w-full max-w-4xl mx-auto animate-fade-in">
            <div className="relative bg-gray-900 rounded-xl shadow-2xl overflow-hidden border border-gray-700 aspect-[16/9] md:aspect-auto">
                {posterUrl && (
                    <div className="absolute inset-0 transition-all duration-500">
                        <Image 
                            src={posterUrl} 
                            alt="" 
                            fill 
                            className="object-cover opacity-30"
                            sizes="100vw"
                        />
                    </div>
                )}
                <div className="absolute inset-0 bg-black/40 backdrop-blur-md" />

                <div className="relative p-6 sm:p-8 grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
                    <div className="md:col-span-1 flex justify-center items-start">
                        {posterUrl ? (
                            <Image src={posterUrl} alt={`Pôster de ${title}`} width={500} height={750} className="w-48 md:w-full max-w-xs h-auto rounded-lg shadow-2xl"/>
                        ) : (
                            <div className="w-48 md:w-full max-w-xs aspect-[2/3] bg-gray-700 rounded-lg flex items-center justify-center">
                                <span className="text-gray-500">Sem Pôster</span>
                            </div>
                        )}
                    </div>

                    <div className="md:col-span-2 text-white">
                        <h2 className="text-3xl lg:text-4xl font-bold text-white drop-shadow-lg">{title}</h2>
                        <div className="flex items-center gap-4 my-3 text-sm text-gray-300 font-medium">
                            {type && <span>{type}</span>}
                            {type && genre && <span className="text-indigo-400">&bull;</span>}
                            {genre && <span>{genre}</span>}
                        </div>

                        <div className="mt-4 space-y-4">
                            {synopsis && <div>
                                <h3 className="text-lg font-semibold text-indigo-300 mb-1">Sinopse</h3>
                                <p className="text-gray-200 text-sm leading-relaxed">{synopsis}</p>
                            </div>}
                            {analysis && <div>
                                <h3 className="text-lg font-semibold text-indigo-300 mb-1">Análise do Gênio</h3>
                                <p className="text-gray-200 text-sm leading-relaxed">{analysis}</p>
                            </div>}
                        </div>

                        {probabilities && (
                            <div className="mt-6">
                                <h3 className="text-lg font-semibold text-indigo-300 mb-2">Probabilidades de Gosto</h3>
                                <div className="space-y-2">
                                    {['amei', 'gostei', 'meh', 'naoGostei'].map(key => {
                                        const value = probabilities[key as keyof typeof probabilities];
                                        return (
                                            <div key={key} className="flex items-center">
                                                <span className="w-24 text-sm text-gray-300 capitalize">{key === 'naoGostei' ? 'Não Gostei' : key}</span>
                                                <div className="flex-1 bg-white/10 rounded-full h-5 overflow-hidden">
                                                    <div 
                                                        className={`${probabilityColors[key]} h-full flex items-center justify-end text-xs font-bold pr-2 text-white transition-all duration-500`} 
                                                        style={{ width: `${value}%` }}
                                                    >
                                                        {value > 10 ? `${value}%` : ''}
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}
                        
                        {showSaveButton && (
                             <div className="mt-8">
                                <Button 
                                    variant="primary"
                                    size="xl"
                                    onClick={handleSaveToWatchlist} 
                                    className="w-full transition-all duration-300 transform hover:scale-[1.02] shadow-lg"
                                >
                                    + Salvar na Lista para Ver
                                </Button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default RecommendationCard;

