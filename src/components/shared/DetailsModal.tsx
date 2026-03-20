/* src/components/shared/DetailsModal.tsx corrigido novamente */

"use client";

import React, { useState, useEffect } from 'react';
import { DisplayableItem, WatchProvider } from '@/types';
import { getTMDbDetails, getProviders } from '@/lib/tmdb';
import { openProviderLinkFromTmdbName } from '@/config/providerLinks';
import Image from 'next/image';
import { ModalWrapper, ModalHeader, ModalBody } from '../ui/Modal';
import { Button } from '../ui/Button';
import MediaDetailsSkeleton from './skeletons/MediaDetailsSkeleton';

const WatchProvidersDisplay: React.FC<{ providers: WatchProvider[] }> = ({ providers }) => (
    <div className="flex flex-wrap gap-3">
        {providers.map(p => (
            <Button
                key={p.provider_id}
                variant="ghost"
                size="icon"
                onClick={() => openProviderLinkFromTmdbName(p.provider_name)}
                title={`Assistir em ${p.provider_name}`}
                className="w-12 h-12 p-0 focus:ring-2 focus:ring-red-500 rounded-lg overflow-hidden"
            >
                <Image
                    src={`https://image.tmdb.org/t/p/w92${p.logo_path}`}
                    alt={p.provider_name}
                    width={48}
                    height={48}
                    className="w-full h-full object-cover bg-gray-700 transition-transform hover:scale-110"
                />
            </Button>
        ))}
    </div>
);

interface DetailsModalProps {
    item: DisplayableItem;
    onClose: () => void;
    actions: React.ReactNode;
    customContent?: React.ReactNode;
}

// Ajustando o tipo para ser compatível com TMDbProviderData
interface TMDbProviderInfo {
    link: string; // agora obrigatório, como o tipo esperado
    flatrate?: WatchProvider[];
    rent?: WatchProvider[];
    buy?: WatchProvider[];
}

interface TMDbDetailsData {
  media_type: 'movie' | 'tv';
  genres: { name: string }[];
  vote_average: number;
  overview: string;
  poster_path: string | null;
  title?: string;
  name?: string;
  'watch/providers'?: { results?: { BR?: TMDbProviderInfo } };
}

const DetailsModal: React.FC<DetailsModalProps> = ({ item, onClose, actions, customContent }) => {
    const [details, setDetails] = useState<TMDbDetailsData | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (!item) return;
        setIsLoading(true);
        
        getTMDbDetails(item.id, item.tmdbMediaType)
            .then((data: TMDbDetailsData) => setDetails(data))
            .catch(err => console.error(`Falha ao buscar detalhes para o item ${item.id}:`, err))
            .finally(() => setIsLoading(false));

    }, [item]);
    
    const providers = details ? getProviders(details) : undefined;

    return (
        <ModalWrapper isOpen={true} onClose={onClose} size="lg">
            <ModalHeader title={item.title} onClose={onClose} />
            <ModalBody>
                {isLoading || !details ? (
                    <MediaDetailsSkeleton variant="modal" />
                ) : (
                    <div className="flex flex-col sm:flex-row gap-6">
                        <div className="relative w-40 h-60 flex-shrink-0 mx-auto sm:mx-0">
                            <Image 
                                src={item.posterUrl || '/placeholder-poster.png'} 
                                alt={`Pôster de ${item.title}`} 
                                fill
                                className="object-cover rounded-lg shadow-md"
                            />
                        </div>
                        <div className="flex-grow">
                            <div className="hidden sm:block">
                                <h2 className="text-3xl font-bold text-white mb-2">{item.title}</h2>
                            </div>
                            <div className="flex items-center flex-wrap gap-x-4 gap-y-2 mb-4 text-sm text-gray-400">
                                <span className="px-2 py-0.5 bg-white/10 rounded text-white/90">
                                    {details.media_type === 'movie' ? 'Filme' : 'Série'}
                                </span>
                                <span>&bull;</span>
                                <span>{details.genres?.[0]?.name || 'N/A'}</span>
                                {details.vote_average > 0 && (
                                     <>
                                        <span>&bull;</span>
                                        <span className="flex items-center gap-1 text-yellow-400 font-bold">
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                            </svg>
                                            {details.vote_average.toFixed(1)}
                                        </span>
                                     </>
                                )}
                            </div>
                            <h3 className="text-lg font-semibold text-gray-300 mt-4 mb-1">Sinopse</h3>
                            <p className="text-gray-300 text-sm leading-relaxed mb-4">{details.overview || "Sinopse não disponível."}</p>
                        </div>
                    </div>
                )}
                {customContent}
                {details && providers?.flatrate && providers.flatrate.length > 0 && (
                     <div className="mt-8 pt-6 border-t border-gray-800">
                         <h3 className="text-xl font-semibold text-white mb-4">Onde Assistir</h3>
                         <WatchProvidersDisplay providers={providers.flatrate} />
                     </div>
                )}
                <div className="mt-8 pt-6 border-t border-gray-800 flex flex-wrap gap-3">
                    {actions}
                    <Button variant="outline" onClick={onClose} className="sm:hidden w-full">
                        Fechar
                    </Button>
                </div>
            </ModalBody>
        </ModalWrapper>
    );
};

export default DetailsModal;
