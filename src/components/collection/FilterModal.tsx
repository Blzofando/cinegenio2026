// src/components/collection/FilterModal.tsx

"use client";

import React, { useState } from 'react';
import Modal from '../shared/modal';
import { Button } from '@/components/ui/Button';

type SortType = 'createdAt-desc' | 'createdAt-asc' | 'title-asc' | 'title-desc';

interface GenreSelectorProps {
    availableGenres: string[];
    selectedGenres: Set<string>;
    onToggle: (genre: string) => void;
}
const GenreSelector: React.FC<GenreSelectorProps> = ({ availableGenres, selectedGenres, onToggle }) => {
    const [query, setQuery] = useState('');
    const filteredGenres = query ? availableGenres.filter(g => g.toLowerCase().includes(query.toLowerCase())) : availableGenres;

    return (
        <div>
            <h3 className="font-semibold text-gray-300 mb-3">Gênero</h3>
            <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Buscar gênero..."
                className="w-full bg-gray-900 text-white p-2 mb-2 rounded-lg border border-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <div className="max-h-40 overflow-y-auto space-y-1 p-1">
                {filteredGenres.map(genre => (
                    <Button
                        key={genre}
                        variant="ghost"
                        onClick={() => onToggle(genre)}
                        className={`w-full text-left px-3 py-1.5 text-sm rounded-lg transition-colors h-auto ${selectedGenres.has(genre) ? 'bg-indigo-600 text-white hover:bg-indigo-700' : 'bg-gray-700 hover:bg-gray-600'}`}
                    >
                        {genre}
                    </Button>
                ))}
            </div>
        </div>
    );
};

interface FilterModalProps {
    isOpen: boolean;
    onClose: () => void;
    availableCategories: string[];
    availableGenres: string[];
    
    tempSortType: SortType;
    setTempSortType: (sort: SortType) => void;
    tempSelectedCategories: Set<string>;
    setTempSelectedCategories: (cats: Set<string>) => void;
    tempSelectedGenres: Set<string>;
    setTempSelectedGenres: (genres: Set<string>) => void;

    onApply: () => void;
}

const FilterModal: React.FC<FilterModalProps> = ({ 
    isOpen, onClose, availableCategories, availableGenres,
    tempSortType, setTempSortType,
    tempSelectedCategories, setTempSelectedCategories,
    tempSelectedGenres, setTempSelectedGenres,
    onApply 
}) => {
    if (!isOpen) return null;

    const handleCategoryToggle = (cat: string) => {
        const newSet = new Set(tempSelectedCategories);
        if (newSet.has(cat)) newSet.delete(cat);
        else newSet.add(cat);
        setTempSelectedCategories(newSet);
    };

    const handleGenreToggle = (genre: string) => {
        const newSet = new Set(tempSelectedGenres);
        if (newSet.has(genre)) newSet.delete(genre);
        else newSet.add(genre);
        setTempSelectedGenres(newSet);
    };

    const sortOptions: {id: SortType, label: string}[] = [
        {id: 'createdAt-desc', label: 'Mais Recentes'},
        {id: 'createdAt-asc', label: 'Mais Antigos'},
        {id: 'title-asc', label: 'Título (A-Z)'},
        {id: 'title-desc', label: 'Título (Z-A)'}
    ];

    return (
        <Modal onClose={onClose}>
            <div className="p-6">
                <h2 className="text-2xl font-bold text-white mb-6">Filtros e Ordenação</h2>
                <div className="space-y-6">
                    <div>
                        <h3 className="font-semibold text-gray-300 mb-3">Ordenar por</h3>
                        <div className="flex flex-wrap gap-2">
                            {sortOptions.map(opt => (
                                <Button 
                                    key={opt.id} 
                                    variant="ghost"
                                    onClick={() => setTempSortType(opt.id)} 
                                    className={`px-3 py-2 text-sm rounded-lg transition-colors h-auto ${tempSortType === opt.id ? 'bg-indigo-600 text-white hover:bg-indigo-700' : 'bg-gray-700 hover:bg-gray-600'}`}
                                >
                                    {opt.label}
                                </Button>
                            ))}
                        </div>
                    </div>
                    <div>
                        <h3 className="font-semibold text-gray-300 mb-3">Categoria</h3>
                        <div className="flex flex-wrap gap-2">
                            {availableCategories.map((cat: string) => (
                                <Button 
                                    key={cat} 
                                    variant="ghost"
                                    onClick={() => handleCategoryToggle(cat)} 
                                    className={`px-3 py-2 text-sm rounded-lg transition-colors h-auto ${tempSelectedCategories.has(cat) ? 'bg-indigo-600 text-white hover:bg-indigo-700' : 'bg-gray-700 hover:bg-gray-600'}`}
                                >
                                    {cat}
                                </Button>
                            ))}
                        </div>
                    </div>
                    <GenreSelector availableGenres={availableGenres} selectedGenres={tempSelectedGenres} onToggle={handleGenreToggle} />
                </div>
                <div className="mt-8 pt-4 border-t border-gray-700 flex justify-end">
                    <Button onClick={onApply} size="lg" className="px-8">Aplicar</Button>
                </div>
            </div>
        </Modal>
    );
};

export default FilterModal;