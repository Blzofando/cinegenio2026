// src/components/shared/AddModal.tsx

"use client";

import React, { useState, useContext } from 'react';
import { WatchedDataContext } from '@/contexts/WatchedDataContext';
import { Rating, TMDbSearchResult } from '@/types';
import Modal from './modal';
import TitleSelector from './TitleSelector';
import { Button } from '@/components/ui/Button';

const ratingOptions: { rating: Rating; emoji: string; label: string }[] = [
    { rating: 'amei', emoji: '😍', label: 'Amei' },
    { rating: 'gostei', emoji: '👍', label: 'Gostei' },
    { rating: 'meh', emoji: '😐', label: 'Meh' },
    { rating: 'naoGostei', emoji: '👎', label: 'Não Gostei' },
];

interface AddModalProps {
    mode: 'watchlist' | 'collection';
    onClose: () => void;
    onSubmit: (item: TMDbSearchResult, rating?: Rating) => Promise<void>;
}

const AddModal: React.FC<AddModalProps> = ({ mode, onClose, onSubmit }) => {
    const [rating, setRating] = useState<Rating>('gostei');
    const [selectedSuggestion, setSelectedSuggestion] = useState<TMDbSearchResult | null>(null);
    const { loading: isAdding } = useContext(WatchedDataContext);
    const [error, setError] = useState('');

    const handleTitleSelect = (selection: TMDbSearchResult | null) => {
        setSelectedSuggestion(selection);
        if (error) setError('');
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!selectedSuggestion) {
            setError('Por favor, selecione um título válido da lista de sugestões.');
            return;
        }

        setError('');
        try {
            await onSubmit(selectedSuggestion, mode === 'collection' ? rating : undefined);
            onClose();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Falha ao adicionar título.');
        }
    };

    const titleText = mode === 'collection' ? 'Adicionar Novo Título' : 'Adicionar à Watchlist';

    return (
        <Modal onClose={onClose}>
            <form onSubmit={handleSubmit} className="p-6">
                <h2 className="text-2xl font-bold text-white mb-6 text-center">{titleText}</h2>
                
                <div className="mb-6">
                    <TitleSelector
                        label="Comece a digitar um título..."
                        onTitleSelect={handleTitleSelect}
                    />
                </div>

                {mode === 'collection' && (
                    <div className="my-6">
                        <label className="block text-sm font-medium text-gray-300 mb-3 text-center">Minha Avaliação</label>
                        <div className="flex justify-center gap-2 sm:gap-4">
                            {ratingOptions.map(opt => (
                                <Button 
                                    key={opt.rating} 
                                    type="button" 
                                    variant="ghost"
                                    onClick={() => setRating(opt.rating)} 
                                    className={`h-auto px-4 py-2 text-lg rounded-lg transition-all duration-200 flex flex-col items-center gap-1 w-20 ${rating === opt.rating ? 'bg-indigo-600 text-white scale-110 shadow-lg hover:bg-indigo-700' : 'bg-gray-700 hover:bg-gray-600 text-gray-300'}`}
                                >
                                    <span className="text-2xl">{opt.emoji}</span>
                                    <span className="text-xs font-bold">{opt.label}</span>
                                </Button>
                            ))}
                        </div>
                    </div>
                )}

                {error && <p className="text-red-400 text-sm mb-4 text-center">{error}</p>}
                
                <div className="flex justify-end gap-3 border-t border-gray-700 pt-4 mt-4">
                    <Button 
                        type="button" 
                        variant="secondary"
                        onClick={onClose} 
                    >
                        Cancelar
                    </Button>
                    <Button 
                        type="submit" 
                        disabled={isAdding || !selectedSuggestion}
                    >
                        {isAdding ? 'Adicionando...' : 'Adicionar'}
                    </Button>
                </div>
            </form>
        </Modal>
    );
};

export default AddModal;