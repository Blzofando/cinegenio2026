// src/app/collection/page.tsx

"use client"; // ESSENCIAL: Diz ao Next.js para rodar este componente no navegador.

import React, { useState, useContext, useMemo } from 'react';
import { ManagedWatchedItem, Rating, TMDbSearchResult } from '@/types';
import { WatchedDataContext } from '@/contexts/WatchedDataContext';
import DetailsModal from '@/components/shared/DetailsModal';
import AddModal from '@/components/shared/AddModal';
import FilterModal from '@/components/collection/FilterModal';
import Image from 'next/image';

// --- Estilos e Configurações ---
const ratingStyles: Record<Rating, { bg: string, text: string, border: string }> = {
    amei: { bg: 'bg-green-500/20', text: 'text-green-300', border: 'border-green-500' },
    gostei: { bg: 'bg-indigo-500/20', text: 'text-indigo-300', border: 'border-indigo-500' },
    meh: { bg: 'bg-yellow-500/20', text: 'text-yellow-300', border: 'border-yellow-500' },
    naoGostei: { bg: 'bg-red-500/20', text: 'text-red-300', border: 'border-red-500' }
};

const ratingOptions: { rating: Rating; emoji: string; label: string }[] = [
    { rating: 'amei', emoji: '😍', label: 'Amei' },
    { rating: 'gostei', emoji: '👍', label: 'Gostei' },
    { rating: 'meh', emoji: '😐', label: 'Meh' },
    { rating: 'naoGostei', emoji: '👎', label: 'Não Gostei' },
];

type SortType = 'createdAt-desc' | 'createdAt-asc' | 'title-asc' | 'title-desc';

// --- Componente do Card de Item ---
interface ItemCardProps {
    item: ManagedWatchedItem;
    onClick: () => void;
}
const ItemCard: React.FC<ItemCardProps> = ({ item, onClick }) => {
    return (
        <div onClick={onClick} className="relative bg-gray-800 rounded-lg group cursor-pointer overflow-hidden shadow-lg border-2 border-transparent hover:border-indigo-500 transition-all duration-300 aspect-[2/3]">
            {item.posterUrl ? <Image src={item.posterUrl} alt={`Pôster de ${item.title}`} width={500} height={750} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" /> : <div className="w-full h-full bg-gray-700 flex items-center justify-center text-center p-2"><span className="text-gray-500 text-sm">Pôster não disponível</span></div>}
            <div className="absolute inset-x-0 bottom-0 h-2/5 bg-gradient-to-t from-black/80 to-transparent pointer-events-none"></div>
            <div className="absolute bottom-0 left-0 right-0 p-3">
                <h3 className="font-bold text-white text-base truncate leading-tight" title={item.title}>{item.title}</h3>
            </div>
            <div className={`absolute top-2 right-2 text-xs font-bold py-1 px-2 rounded-full border backdrop-blur-sm ${ratingStyles[item.rating].bg} ${ratingStyles[item.rating].text} ${ratingStyles[item.rating].border}`}>{item.rating.toUpperCase()}</div>
        </div>
    );
};

// --- Componente Principal da Página ---
export default function CollectionPage() {
    const { data, removeItem, addItem } = useContext(WatchedDataContext);
    const [modal, setModal] = useState<'add' | 'details' | null>(null);
    const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
    const [selectedItem, setSelectedItem] = useState<ManagedWatchedItem | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    
    const allItems: ManagedWatchedItem[] = useMemo(() => [...data.amei, ...data.gostei, ...data.meh, ...data.naoGostei], [data]);
    
    const availableGenres = useMemo(() => Array.from(new Set(allItems.map(item => item.genre))).sort(), [allItems]);
    const availableCategories = useMemo(() => Array.from(new Set(allItems.map(item => item.type))).sort(), [allItems]);

    const [activeRatingFilter, setActiveRatingFilter] = useState<Rating | null>(null);
    const [appliedSortType, setAppliedSortType] = useState<SortType>('createdAt-desc');
    const [appliedCategories, setAppliedCategories] = useState<Set<string>>(new Set());
    const [appliedGenres, setAppliedGenres] = useState<Set<string>>(new Set());

    const [tempSortType, setTempSortType] = useState<SortType>(appliedSortType);
    const [tempSelectedCategories, setTempSelectedCategories] = useState<Set<string>>(appliedCategories);
    const [tempSelectedGenres, setTempSelectedGenres] = useState<Set<string>>(appliedGenres);

    const sortedAndFilteredItems = useMemo(() => {
        let items = allItems;
        if (searchQuery) items = items.filter(item => item.title.toLowerCase().includes(searchQuery.toLowerCase()));
        if (activeRatingFilter) items = items.filter(item => item.rating === activeRatingFilter);
        if (appliedCategories.size > 0) items = items.filter(item => appliedCategories.has(item.type));
        if (appliedGenres.size > 0) items = items.filter(item => appliedGenres.has(item.genre));

        return items.sort((a, b) => {
            switch (appliedSortType) {
                case 'title-asc': return a.title.localeCompare(b.title);
                case 'title-desc': return b.title.localeCompare(a.title);
                case 'createdAt-asc': return a.createdAt - b.createdAt;
                case 'createdAt-desc':
                default: return b.createdAt - a.createdAt;
            }
        });
    }, [allItems, activeRatingFilter, appliedCategories, appliedGenres, searchQuery, appliedSortType]);

    const handleItemClick = (item: ManagedWatchedItem) => {
        setSelectedItem(item);
        setModal('details');
    };
    
    const openFilterModal = () => {
        setTempSortType(appliedSortType);
        setTempSelectedCategories(new Set(appliedCategories));
        setTempSelectedGenres(new Set(appliedGenres));
        setIsFilterModalOpen(true);
    };

    const applyFilters = () => {
        setAppliedSortType(tempSortType);
        setAppliedCategories(tempSelectedCategories);
        setAppliedGenres(tempSelectedGenres);
        setIsFilterModalOpen(false);
    };

    const handleRemoveItem = () => {
        if (selectedItem && window.confirm(`Tem certeza que deseja remover "${selectedItem.title}" da sua coleção?`)) {
            removeItem(selectedItem.id);
            setModal(null);
        }
    };
    
    const handleAddToCollection = async (item: TMDbSearchResult, rating?: Rating) => {
        if (rating) {
            await addItem(item, rating);
        }
    };

    const renderDetailsModalActions = () => (
        <>
            <button onClick={handleRemoveItem} className="w-full sm:w-auto flex-1 bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded-lg">Remover</button>
            <button onClick={() => setModal(null)} className="w-full sm:w-auto flex-1 bg-gray-600 hover:bg-gray-500 text-white font-bold py-2 px-4 rounded-lg">Fechar</button>
        </>
    );

    return (
        <div className="p-4">
            {modal === 'details' && selectedItem && (
                <DetailsModal 
                    item={selectedItem} 
                    onClose={() => setModal(null)}
                    actions={renderDetailsModalActions()}
                />
            )}
            
            {modal === 'add' && (
                <AddModal 
                    onClose={() => setModal(null)}
                    mode="collection"
                    onSubmit={handleAddToCollection}
                />
            )}
            
            <FilterModal
                isOpen={isFilterModalOpen}
                onClose={() => setIsFilterModalOpen(false)}
                availableCategories={availableCategories}
                availableGenres={availableGenres}
                tempSortType={tempSortType}
                setTempSortType={setTempSortType}
                tempSelectedCategories={tempSelectedCategories}
                setTempSelectedCategories={setTempSelectedCategories}
                tempSelectedGenres={tempSelectedGenres}
                setTempSelectedGenres={setTempSelectedGenres}
                onApply={applyFilters}
            />
            
            <div className="flex flex-col sm:flex-row justify-between items-center mb-6">
                <h1 className="text-4xl font-bold text-white mb-4 sm:mb-0">Minha Coleção</h1>
                <button onClick={() => setModal('add')} className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded-lg flex items-center gap-2 shadow-lg transition-transform transform hover:scale-105">[+] Adicionar</button>
            </div>

            <div className="bg-gray-800 p-4 rounded-lg mb-8 space-y-4">
                <input type="text" placeholder="Buscar na coleção..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full bg-gray-700 text-white p-3 rounded-lg border border-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                <div className="flex flex-col sm:flex-row gap-4 justify-between">
                    <div className="flex items-center gap-2 flex-wrap">
                        {ratingOptions.map(({ rating, emoji }) => (
                            <button key={rating} onClick={() => setActiveRatingFilter(prev => prev === rating ? null : rating)} title={rating} className={`px-3 py-2 text-xl rounded-lg transition-all duration-300 ${activeRatingFilter === rating ? 'bg-indigo-600 ring-2 ring-indigo-400 scale-110' : 'bg-gray-700 hover:bg-gray-600'}`}>{emoji}</button>
                        ))}
                    </div>
                    <button onClick={openFilterModal} className="bg-gray-700 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded-lg flex items-center justify-center sm:justify-start gap-2">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M3 3a1 1 0 011-1h12a1 1 0 011 1v3a1 1 0 01-.293.707L12 12.414V15a1 1 0 01-.293.707l-2 2A1 1 0 018 17v-4.586L3.293 6.707A1 1 0 013 6V3z" clipRule="evenodd" /></svg>
                          Filtros & Ordenação
                    </button>
                </div>
            </div>

            {sortedAndFilteredItems.length === 0 ? (
                <div className="text-center py-16"><p className="text-2xl text-gray-400">Nenhum resultado encontrado.</p><p className="text-gray-500 mt-2">Tente ajustar seus filtros.</p></div>
            ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                    {sortedAndFilteredItems.map(item => (
                       <ItemCard key={item.id} item={item} onClick={() => handleItemClick(item)} />
                    ))}
                </div>
            )}
        </div>
    );
};