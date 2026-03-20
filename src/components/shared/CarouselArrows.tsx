"use client";

import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/Button';

interface CarouselArrowsProps {
    onPrev: () => void;
    onNext: () => void;
    show: boolean;
    containerClassName?: string;
}

export const CarouselArrows: React.FC<CarouselArrowsProps> = ({ 
    onPrev, 
    onNext, 
    show,
    containerClassName = "bottom-4" 
}) => {
    if (!show) return null;

    return (
        <>
            <Button
                variant="ghost"
                size="icon"
                onClick={onPrev}
                className={`absolute left-0 top-0 ${containerClassName} z-20 w-16 bg-gradient-to-r from-black/80 to-transparent hover:from-black/90 transition-all rounded-none`}
            >
                <ChevronLeft className="w-8 h-8 text-white drop-shadow-lg" />
            </Button>
            <Button
                variant="ghost"
                size="icon"
                onClick={onNext}
                className={`absolute right-0 top-0 ${containerClassName} z-20 w-16 bg-gradient-to-l from-black/80 to-transparent hover:from-black/90 transition-all rounded-none`}
            >
                <ChevronRight className="w-8 h-8 text-white drop-shadow-lg" />
            </Button>
        </>
    );
};
