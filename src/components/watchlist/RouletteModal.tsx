// src/components/watchlist/RouletteModal.tsx

"use client";

import React from 'react';
import { WatchlistItem } from '@/types';
import { ModalWrapper, ModalBody } from '../ui/Modal';
import { Button } from '../ui/Button';
import Image from 'next/image';

interface RouletteModalProps { 
    item: WatchlistItem | null; 
    onClose: () => void; 
    onSpinAgain: () => void; 
    onMarkAsWatched: (item: WatchlistItem) => void; 
}

const RouletteModal: React.FC<RouletteModalProps> = ({ item, onClose, onSpinAgain, onMarkAsWatched }) => {
    if(!item) return null;
    
    return (
        <ModalWrapper isOpen={!!item} onClose={onClose} size="md">
             <ModalBody>
                <div className="text-center py-4">
                    <div className="relative w-48 h-72 mx-auto mb-6 shadow-2xl rounded-xl overflow-hidden group">
                        <Image 
                            src={item.posterUrl || 'https://placehold.co/400x600/374151/9ca3af?text=?'} 
                            alt={`Pôster de ${item.title}`} 
                            fill
                            className="object-cover transition-transform duration-500 group-hover:scale-110"
                        />
                    </div>
                    <h3 className="text-xl font-medium text-gray-400 mb-1">O Gênio escolheu:</h3>
                    <p className="text-3xl font-bold bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent mb-8">
                        {item.title}
                    </p>
                    
                    <div className="flex flex-col gap-3">
                        <Button 
                            variant="primary" 
                            size="lg" 
                            className="w-full" 
                            onClick={() => onMarkAsWatched(item)}
                        >
                            Já Assisti
                        </Button>
                        <Button 
                            variant="outline" 
                            size="lg" 
                            className="w-full" 
                            onClick={onSpinAgain}
                        >
                            Rodar a roleta novamente
                        </Button>
                    </div>
                </div>
            </ModalBody>
        </ModalWrapper>
    )
};

export default RouletteModal;