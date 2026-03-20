"use client";

import React from 'react';
import { ModalWrapper, ModalHeader, ModalBody } from './Modal';
import { Button } from '@/components/ui/Button';

interface ConfirmModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    variant?: 'danger' | 'primary';
}

const ConfirmModal: React.FC<ConfirmModalProps> = ({
    isOpen,
    onClose,
    onConfirm,
    title,
    message,
    confirmText = "Confirmar",
    cancelText = "Cancelar",
    variant = 'primary'
}) => {
    return (
        <ModalWrapper isOpen={isOpen} onClose={onClose} size="sm">
            <ModalHeader title={title} onClose={onClose} />
            <ModalBody>
                <div className="space-y-6">
                    <p className="text-gray-300 text-center">{message}</p>
                    <div className="flex gap-3 justify-center">
                        <Button 
                            variant="glass" 
                            onClick={onClose}
                            className="flex-1"
                        >
                            {cancelText}
                        </Button>
                        <Button 
                            variant={variant === 'danger' ? 'primary' : 'primary'} // Adjusted to project variants
                            onClick={() => {
                                onConfirm();
                                onClose();
                            }}
                            className={variant === 'danger' ? 'bg-red-600 hover:bg-red-700 flex-1' : 'flex-1'}
                        >
                            {confirmText}
                        </Button>
                    </div>
                </div>
            </ModalBody>
        </ModalWrapper>
    );
};

export default ConfirmModal;
