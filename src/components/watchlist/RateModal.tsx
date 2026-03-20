// src/components/watchlist/RateModal.tsx

"use client";

import React from 'react';
import { WatchlistItem, Rating } from '@/types';
import { ModalWrapper, ModalBody } from '../ui/Modal';
import { Button } from '@/components/ui/Button';

const ratingOptions: { rating: Rating; emoji: string; label: string }[] = [
    { rating: 'amei', emoji: '😍', label: 'Amei' },
    { rating: 'gostei', emoji: '👍', label: 'Gostei' },
    { rating: 'meh', emoji: '😐', label: 'Meh' },
    { rating: 'naoGostei', emoji: '👎', label: 'Não Gostei' },
];

interface RateModalProps {
    item: WatchlistItem;
    onRate: (rating: Rating) => void;
    onCancel: () => void;
}

const RateModal: React.FC<RateModalProps> = ({ item, onRate, onCancel }) => {
    return (
        <ModalWrapper isOpen={true} onClose={onCancel} size="sm">
            <ModalBody>
                <div className="text-center py-4">
                    <h2 className="text-2xl font-bold text-white mb-2">Você assistiu a &quot;{item.title}&quot;!</h2>
                    <p className="text-gray-400 mb-8 font-medium">O que você achou desta obra?</p>
                    
                    <div className="grid grid-cols-2 gap-4 mb-8">
                        {ratingOptions.map(opt => (
                            <Button 
                                key={opt.rating} 
                                variant="ghost"
                                onClick={() => onRate(opt.rating)} 
                                className="group h-auto p-4 rounded-2xl bg-gray-800/50 border border-gray-700 hover:border-indigo-500 hover:bg-indigo-500/10 transition-all duration-300 flex flex-col items-center gap-2"
                            >
                                <span className="text-3xl group-hover:scale-125 transition-transform duration-300">{opt.emoji}</span>
                                <span className="text-sm font-bold text-gray-300 group-hover:text-white">{opt.label}</span>
                            </Button>
                        ))}
                    </div>
                    
                    <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={onCancel}
                        className="text-gray-500 hover:text-white"
                    >
                        Cancelar e manter na lista
                    </Button>
                </div>
            </ModalBody>
        </ModalWrapper>
    );
};

export default RateModal;