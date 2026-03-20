"use client";

import React from 'react';
import { X } from 'lucide-react';
import { ModalHeaderProps } from './types';
import { Button } from '../Button';

export const ModalHeader: React.FC<ModalHeaderProps> = ({ title, onClose, children }) => {
  return (
    <div className="flex items-center justify-between p-4 md:p-6 border-b border-gray-700/50 bg-gray-900/50 backdrop-blur-md">
      {title && <h3 className="text-xl font-bold text-white">{title}</h3>}
      {children}
      <Button 
        variant="ghost" 
        size="icon" 
        onClick={onClose}
        className="text-gray-400 hover:text-white transition-colors"
      >
        <X className="w-6 h-6" />
      </Button>
    </div>
  );
};
