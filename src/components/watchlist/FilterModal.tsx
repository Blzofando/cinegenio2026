// src/components/watchlist/FilterModal.tsx

"use client";

import React from 'react';
import { ModalWrapper, ModalHeader, ModalBody } from '../ui/Modal';
import { Button } from '../ui/Button';

type SortType = 'addedAt-desc' | 'addedAt-asc' | 'title-asc' | 'title-desc';

interface FilterModalProps { 
    isOpen: boolean; 
    onClose: () => void; 
    tempSortType: SortType; 
    setTempSortType: (sort: SortType) => void; 
    onApply: () => void; 
}

const FilterModal: React.FC<FilterModalProps> = ({ isOpen, onClose, tempSortType, setTempSortType, onApply }) => {
    const sortOptions: {id: SortType, label: string}[] = [
        {id: 'addedAt-desc', label: 'Mais Recentes'},
        {id: 'addedAt-asc', label: 'Mais Antigos'},
        {id: 'title-asc', label: 'Título (A-Z)'},
        {id: 'title-desc', label: 'Título (Z-A)'}
    ];

    return (
        <ModalWrapper isOpen={isOpen} onClose={onClose} size="sm">
            <ModalHeader title="Filtros e Ordenação" onClose={onClose} />
            <ModalBody>
                <div className="space-y-6">
                    <div>
                        <h3 className="text-sm font-medium text-gray-400 uppercase tracking-wider mb-4">Ordenar por</h3>
                        <div className="grid grid-cols-2 gap-2">
                            {sortOptions.map(opt => (
                                <Button 
                                    key={opt.id} 
                                    variant={tempSortType === opt.id ? "primary" : "outline"}
                                    size="sm"
                                    onClick={() => setTempSortType(opt.id)}
                                    className="justify-center"
                                >
                                    {opt.label}
                                </Button>
                            ))}
                        </div>
                    </div>
                </div>
                <div className="mt-8 flex justify-end gap-3">
                    <Button variant="ghost" onClick={onClose}>Cancelar</Button>
                    <Button variant="primary" onClick={onApply} className="px-8">Aplicar</Button>
                </div>
            </ModalBody>
        </ModalWrapper>
    );
};

export default FilterModal;