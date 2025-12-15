// src/app/radar/page.tsx

"use client";

import React, { useState, useContext, useEffect, useMemo } from 'react';
import { collection, doc, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase/client';
import { WatchedDataContext } from '@/contexts/WatchedDataContext';
import { WatchlistContext } from '@/contexts/WatchlistContext';
import { useAuth } from '@/contexts/AuthContext';
import { RadarItem, WatchlistItem, DisplayableItem } from '@/types';
import DetailsModal from '@/components/shared/DetailsModal';
import Image from 'next/image';

// --- Componente de Esqueleto para o Card ---
const CarouselCardSkeleton = () => (
    <div className="flex-shrink-0 w-40">
        <div className="w-full h-60 rounded-lg bg-gray-700 animate-pulse"></div>
        <div className="w-3/4 h-4 mt-2 rounded bg-gray-700 animate-pulse"></div>
        <div className="w-1/2 h-3 mt-2 rounded bg-gray-700 animate-pulse"></div>
    </div>
);

// --- Componente de Esqueleto para o Carrossel ---
const CarouselSkeleton = () => (
    <div className="flex gap-4">
        {Array.from({ length: 6 }).map((_, index) => (
            <CarouselCardSkeleton key={index} />
        ))}
    </div>
);

// --- Componentes Internos ---
interface CarouselCardProps {
    item: RadarItem;
    onClick: () => void;
    rank?: number;
}
const CarouselCard: React.FC<CarouselCardProps> = ({ item, onClick, rank }) => {
    const releaseInfo = item.nextEpisodeToAir
        ? `Próx. Ep: ${new Date(item.nextEpisodeToAir.air_date).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}`
        : new Date(item.releaseDate).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric', timeZone: 'UTC' });

    return (
        <div onClick={onClick} className="flex-shrink-0 w-40 cursor-pointer group">
            <div className="relative overflow-hidden rounded-lg shadow-lg">
                {rank && (<div className="absolute -left-1 -top-1 z-10"><svg width="60" height="60" viewBox="0 0 60 60" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M0 0 H 60 L 0 60 V 0 Z" fill="#111827" fillOpacity="0.7" /><text x="10" y="25" fontFamily="Arial, sans-serif" fontSize="20" fontWeight="bold" fill="white">{rank}</text></svg></div>)}
                <Image src={item.posterUrl || 'https://placehold.co/400x600/374151/9ca3af?text=?'} alt={`Pôster de ${item.title}`} width={400} height={600} className="w-full h-60 object-cover transition-transform duration-300 group-hover:scale-105" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent"></div>
            </div>
            <h3 className="text-white font-bold mt-2 truncate">{item.title}</h3>
            <p className="text-indigo-400 text-sm">{releaseInfo}</p>
        </div>
    );
};

interface CarouselProps {
    title: string;
    items: RadarItem[];
    onItemClick: (item: RadarItem) => void;
    isRanked?: boolean;
    isLoading?: boolean;
}
const Carousel: React.FC<CarouselProps> = ({ title, items, onItemClick, isRanked = false, isLoading = false }) => (
    <div className="mb-12">
        <h2 className="text-2xl font-bold text-white mb-4">{title}</h2>
        <div className="flex gap-4 overflow-x-auto pb-4 -mx-4 px-4">
            {isLoading ? <CarouselSkeleton /> : items.length > 0 ? items.map((item, index) => <CarouselCard key={`${item.id}-${item.listType}`} item={item} onClick={() => onItemClick(item)} rank={isRanked ? index + 1 : undefined} />) : <p className="text-gray-500">Nenhum item nesta categoria por enquanto.</p>}
        </div>
    </div>
);

// --- Componente Principal da Página ---
export default function RadarPage() {
    const { data } = useContext(WatchedDataContext);
    const { addToWatchlist, isInWatchlist } = useContext(WatchlistContext);
    const { user } = useAuth();
    const [isRelevantLoading, setIsRelevantLoading] = useState(true);
    const [isLoading, setIsLoading] = useState(true);
    const [tmdbCache, setTmdbCache] = useState<RadarItem[]>([]);
    const [trending, setTrending] = useState<RadarItem[]>([]);
    const [nowPlaying, setNowPlaying] = useState<RadarItem[]>([]);
    const [relevantReleases, setRelevantReleases] = useState<RadarItem[]>([]);
    const [selectedItem, setSelectedItem] = useState<DisplayableItem | null>(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!user) {
            setIsLoading(false);
            setIsRelevantLoading(false);
            setError("Você precisa estar logado para ver o radar.");
            return;
        }

        // Listen to public/trending
        const unsubTrending = onSnapshot(doc(db, 'public', 'trending'), (docSnap) => {
            if (docSnap.exists()) {
                const data = docSnap.data();
                setTrending(data.items || []);
            } else {
                setTrending([]);
            }
        });

        // Listen to public/now-playing
        const unsubNowPlaying = onSnapshot(doc(db, 'public', 'now-playing'), (docSnap) => {
            if (docSnap.exists()) {
                const data = docSnap.data();
                setNowPlaying((data.items || []).sort((a: RadarItem, b: RadarItem) =>
                    new Date(b.releaseDate).getTime() - new Date(a.releaseDate).getTime()
                ));
            } else {
                setNowPlaying([]);
            }
        });

        // Still load TMDb cache for provider-specific lists (Netflix, Prime, etc.)
        const unsubTMDb = onSnapshot(
            collection(db, 'users', user.uid, 'tmdbRadarCache'),
            (snapshot) => {
                const items: RadarItem[] = [];
                snapshot.forEach(doc => items.push(doc.data() as RadarItem));
                setTmdbCache(items);
                setIsLoading(false);
            },
            err => {
                console.error("Erro ao ouvir o cache do TMDb:", err);
                setError("Não foi possível carregar os dados do Radar.");
                setIsLoading(false);
            }
        );

        const unsubRelevant = onSnapshot(
            collection(db, 'users', user.uid, 'relevantReleases'),
            (snapshot) => {
                const items: RadarItem[] = [];
                snapshot.forEach(doc => items.push(doc.data() as RadarItem));
                setRelevantReleases(items);
                setIsRelevantLoading(false);
            },
            err => {
                console.error("Erro ao ouvir relevantes:", err);
                setIsRelevantLoading(false);
            }
        );

        return () => {
            unsubTrending();
            unsubNowPlaying();
            unsubTMDb();
            unsubRelevant();
        };
    }, [user]);

    const handleAddToWatchlist = (item: DisplayableItem) => {
        const watchlistItem: WatchlistItem = { id: item.id, tmdbMediaType: item.tmdbMediaType, title: item.title || '', posterUrl: item.posterUrl, addedAt: Date.now() };
        addToWatchlist(watchlistItem);
        setSelectedItem(null);
    };

    const renderDetailsModalActions = () => {
        if (!selectedItem) return null;
        const isItemInWatchlist = isInWatchlist(selectedItem.id);
        return (
            <>
                <button
                    onClick={() => handleAddToWatchlist(selectedItem)}
                    disabled={isItemInWatchlist}
                    className="w-full sm:w-auto flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded-lg disabled:bg-gray-600 disabled:cursor-not-allowed"
                >
                    {isItemInWatchlist ? 'Já está na Watchlist' : 'Adicionar à Watchlist'}
                </button>
                <button
                    onClick={() => setSelectedItem(null)}
                    className="w-full sm:w-auto flex-1 bg-gray-600 hover:bg-gray-500 text-white font-bold py-2 px-4 rounded-lg"
                >
                    Fechar
                </button>
            </>
        );
    };

    const topNetflix = useMemo(() => tmdbCache.filter(r => r.providerId === 8), [tmdbCache]);
    const topPrime = useMemo(() => tmdbCache.filter(r => r.providerId === 119), [tmdbCache]);
    const topMax = useMemo(() => tmdbCache.filter(r => r.providerId === 1899), [tmdbCache]);
    const topDisney = useMemo(() => tmdbCache.filter(r => r.providerId === 337), [tmdbCache]);
    const upcoming = useMemo(() => relevantReleases.sort((a, b) => new Date(a.releaseDate).getTime() - new Date(b.releaseDate).getTime()), [relevantReleases]);

    return (
        <div className="p-4">
            {selectedItem && (
                <DetailsModal
                    item={selectedItem}
                    onClose={() => setSelectedItem(null)}
                    actions={renderDetailsModalActions()}
                />
            )}
            <div className="text-center mb-10"><h1 className="text-4xl font-bold text-white">Radar de Lançamentos</h1></div>
            {error && <p className="text-center text-red-400 bg-red-900/50 p-4 rounded-lg">{error}</p>}
            {!error && (
                <div>
                    <Carousel title="Nos Cinemas" items={nowPlaying} onItemClick={setSelectedItem} isLoading={isLoading && nowPlaying.length === 0} />
                    <Carousel title="Tendências da Semana" items={trending} onItemClick={setSelectedItem} isLoading={isLoading && trending.length === 0} />
                    <Carousel title="Top 10 na Netflix" items={topNetflix} onItemClick={setSelectedItem} isRanked={true} isLoading={isLoading && topNetflix.length === 0} />
                    <Carousel title="Top 10 no Prime Video" items={topPrime} onItemClick={setSelectedItem} isRanked={true} isLoading={isLoading && topPrime.length === 0} />
                    <Carousel title="Top 10 na Max" items={topMax} onItemClick={setSelectedItem} isRanked={true} isLoading={isLoading && topMax.length === 0} />
                    <Carousel title="Top 10 no Disney+" items={topDisney} onItemClick={setSelectedItem} isRanked={true} isLoading={isLoading && topDisney.length === 0} />
                    <Carousel title="Relevante para Você (Em Breve)" items={upcoming} onItemClick={setSelectedItem} isLoading={isRelevantLoading} />
                </div>
            )}
        </div>
    );
};