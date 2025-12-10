// src/app/watchlist/page.tsx

"use client";

import React, { useContext, useState, useMemo, useEffect } from 'react';
import { WatchlistContext } from '@/contexts/WatchlistContext';
import { WatchedDataContext } from '@/contexts/WatchedDataContext';
import { WatchlistItem, Rating, TMDbSearchResult } from '@/types';
import { getTMDbDetails, getProviders } from '@/lib/tmdb';
import { updateWatchlistItem } from '@/lib/firestore';
import { getLoveProbability } from '@/lib/recommendations';
import DetailsModal from '@/components/shared/DetailsModal';
import AddModal from '@/components/shared/AddModal';
import RateModal from '@/components/watchlist/RateModal';         // <-- Criaremos este
import RouletteModal from '@/components/watchlist/RouletteModal'; // <-- Criaremos este
import FilterModal from '@/components/watchlist/FilterModal';     // <-- Criaremos este
import Image from 'next/image';

type SortType = 'addedAt-desc' | 'addedAt-asc' | 'title-asc' | 'title-desc';

export default function WatchlistPage() {
    const { watchlist, removeFromWatchlist, addToWatchlist } = useContext(WatchlistContext);
    const { data: watchedData, addItem, loading: isAdding } = useContext(WatchedDataContext);
    const [modal, setModal] = useState<'add' | 'details' | 'roulette' | 'rate' | null>(null);
    const [selectedItem, setSelectedItem] = useState<WatchlistItem | null>(null);
    const [rouletteItem, setRouletteItem] = useState<WatchlistItem | null>(null);
    const [itemToRate, setItemToRate] = useState<WatchlistItem | null>(null);
    const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [appliedSortType, setAppliedSortType] = useState<SortType>('addedAt-desc');
    const [tempSortType, setTempSortType] = useState<SortType>(appliedSortType);
    
    const [probability, setProbability] = useState<number | undefined>(undefined);
    const [isCalculating, setIsCalculating] = useState(false);

    useEffect(() => {
        if (selectedItem) {
            setProbability(selectedItem.loveProbability);
        }
    }, [selectedItem]);

    const handleAddToWatchlist = async (item: TMDbSearchResult) => {
        const newItem: WatchlistItem = {
            id: item.id,
            tmdbMediaType: item.media_type,
            title: item.title || item.name || 'Título Desconhecido',
            posterUrl: item.poster_path ? `https://image.tmdb.org/t/p/w500${item.poster_path}` : undefined,
            addedAt: Date.now(),
        };
        await addToWatchlist(newItem);
        
        // Busca os detalhes em segundo plano
        getTMDbDetails(newItem.id, newItem.tmdbMediaType)
            .then(details => {
                const extraDetails: Partial<WatchlistItem> = {
                    synopsis: details.overview || "Sinopse não disponível.",
                    watchProviders: getProviders(details),
                    voteAverage: details.vote_average ? parseFloat(details.vote_average.toFixed(1)) : 0,
                    genre: details.genres?.[0]?.name || 'N/A',
                    type: details.media_type === 'movie' ? 'Filme' : 'Série',
                };
                updateWatchlistItem(newItem.id, extraDetails);
            });
    };
    
    const handleCalculateProbability = async () => {
        if (!selectedItem) return;
        setIsCalculating(true);
        try {
            const prob = await getLoveProbability(selectedItem.title, watchedData);
            await updateWatchlistItem(selectedItem.id, { loveProbability: prob });
            setProbability(prob);
        } catch (error) {
            console.error("Erro ao calcular probabilidade:", error);
        } finally {
            setIsCalculating(false);
        }
    };

    const filteredAndSortedItems = useMemo(() => {
        let items = watchlist;
        if (searchQuery) {
            items = items.filter(item => item.title.toLowerCase().includes(searchQuery.toLowerCase()));
        }
        return [...items].sort((a, b) => {
            switch (appliedSortType) {
                case 'title-asc': return a.title.localeCompare(b.title);
                case 'title-desc': return b.title.localeCompare(a.title);
                case 'addedAt-asc': return a.addedAt - b.addedAt;
                case 'addedAt-desc':
                default: return b.addedAt - a.addedAt;
            }
        });
    }, [watchlist, searchQuery, appliedSortType]);

    const handleMoveToCollection = async (rating: Rating) => {
        const itemToMove = itemToRate;
        if (!itemToMove) return;
        try {
            const details = await getTMDbDetails(itemToMove.id, itemToMove.tmdbMediaType);
            const searchResult: TMDbSearchResult = {
                id: details.id,
                title: details.title,
                name: details.name,
                overview: details.overview,
                popularity: details.popularity,
                media_type: itemToMove.tmdbMediaType,
                poster_path: details.poster_path,
                genre_ids: details.genres.map((g: { id: number }) => g.id),
                release_date: details.release_date,
                first_air_date: details.first_air_date,
            };
            await addItem(searchResult, rating);
        } catch (error) { console.error("Erro ao mover item para a coleção:", error); } 
        finally { 
            setItemToRate(null);
            setModal(null);
        }
    };

    const handleItemClick = (item: WatchlistItem) => {
        setSelectedItem(item);
        setModal('details');
    };

    const handleRouletteClick = () => {
        if (filteredAndSortedItems.length === 0) return;
        const randomIndex = Math.floor(Math.random() * filteredAndSortedItems.length);
        setRouletteItem(filteredAndSortedItems[randomIndex]);
        setModal('roulette');
    };

    const openFilterModal = () => {
        setTempSortType(appliedSortType);
        setIsFilterModalOpen(true);
    };

    const applyFilters = () => {
        setAppliedSortType(tempSortType);
        setIsFilterModalOpen(false);
    };

    const renderDetailsModalActions = () => {
        if (!selectedItem) return null;
        return (
            <>
                <button onClick={() => { setItemToRate(selectedItem); setModal('rate'); }} className="w-full sm:w-auto flex-1 bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-lg">Já Assisti</button>
                <button onClick={() => setModal(null)} className="w-full sm:w-auto flex-1 bg-gray-600 hover:bg-gray-500 text-white font-bold py-2 px-4 rounded-lg">Fechar</button>
            </>
        );
    };
    
    const renderCustomModalContent = () => (
        <div className="mt-6">
            <h3 className="text-xl font-semibold text-gray-300 mb-3">Potencial de Gosto</h3>
            {isCalculating ? <div className="h-10 bg-gray-700 rounded animate-pulse"></div> : (
                probability !== undefined ? (
                     <div className="bg-gray-700/50 p-3 rounded-lg flex items-center justify-between">
                         <div className="flex items-center gap-2">
                             <span className="text-2xl">😍</span>
                             <span className="font-bold text-white">Potencial de Amar: {probability}%</span>
                         </div>
                         <button onClick={handleCalculateProbability} title="Recalcular" className="p-2 rounded-full hover:bg-gray-600">🔄</button>
                     </div>
                ) : (
                    <button onClick={handleCalculateProbability} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded-lg">Calcular Probabilidade</button>
                )
            )}
        </div>
    );

    return (
        <div className="p-4">
            {modal === 'add' && (
                <AddModal 
                    onClose={() => setModal(null)}
                    mode="watchlist"
                    onSubmit={handleAddToWatchlist}
                />
            )}
            
            {modal === 'rate' && itemToRate && <RateModal item={itemToRate} onRate={handleMoveToCollection} onCancel={() => setModal(null)}/>}
            
            {modal === 'details' && selectedItem && (
                <DetailsModal 
                    item={selectedItem} 
                    onClose={() => setModal(null)}
                    actions={renderDetailsModalActions()}
                    customContent={renderCustomModalContent()}
                />
            )}

            {modal === 'roulette' && <RouletteModal item={rouletteItem} onClose={() => setModal(null)} onSpinAgain={handleRouletteClick} onMarkAsWatched={(item) => { setItemToRate(item); setModal('rate'); }} />}
            <FilterModal isOpen={isFilterModalOpen} onClose={() => setIsFilterModalOpen(false)} tempSortType={tempSortType} setTempSortType={setTempSortType} onApply={applyFilters} />

            <div className="flex flex-col sm:flex-row justify-between items-center mb-6">
                 <h1 className="text-4xl font-bold text-white mb-4 sm:mb-0">Watchlist</h1>
                 <button onClick={() => setModal('add')} className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded-lg flex items-center gap-2 shadow-lg transition-transform transform hover:scale-105">[+] Adicionar</button>
            </div>
            
            <div className="bg-gray-800 p-4 rounded-lg mb-8 space-y-4">
                <input type="text" placeholder="Buscar na watchlist..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full bg-gray-700 text-white p-3 rounded-lg border border-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                <div className="flex justify-end gap-2">
                    <button onClick={openFilterModal} className="bg-gray-700 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded-lg flex items-center gap-2">Filtros & Ordenação</button>
                    <button onClick={handleRouletteClick} className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded-lg flex items-center gap-2">🎲 Roleta</button>
                </div>
            </div>

            {filteredAndSortedItems.length === 0 ? (
                <div className="text-center py-16">
                    <p className="text-2xl text-gray-400">{searchQuery ? 'Nenhum resultado encontrado.' : 'Sua lista está vazia.'}</p>
                    <p className="text-gray-500 mt-2">{searchQuery ? 'Tente uma busca diferente.' : 'Salve recomendações do Gênio ou adicione manualmente.'}</p>
                </div>
            ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                    {filteredAndSortedItems.map(item => (
                        <div key={item.id} className="relative bg-gray-800 rounded-lg group overflow-hidden shadow-lg cursor-pointer" onClick={() => handleItemClick(item)}>
                            <Image src={item.posterUrl || 'https://placehold.co/500x750/374151/9ca3af?text=?'} alt={`Pôster de ${item.title}`} width={500} height={750} className="w-full h-full object-cover aspect-[2/3]"/>
                            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-3 text-center">
                                <h3 className="font-bold text-white text-base leading-tight mb-3">{item.title}</h3>
                                <button onClick={(e) => { e.stopPropagation(); setItemToRate(item); setModal('rate'); }} disabled={isAdding} className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-2 rounded-lg text-sm mb-2 transition-colors disabled:bg-gray-500">Já Assisti</button>
                                <button onClick={(e) => { e.stopPropagation(); removeFromWatchlist(item.id); }} className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-2 rounded-lg text-sm transition-colors">Remover</button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};