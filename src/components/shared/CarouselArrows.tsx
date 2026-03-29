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
                className={`absolute left-2 md:left-4 top-1/2 -translate-y-1/2 ${containerClassName} z-40 w-12 h-12 bg-black/40 hover:bg-black/80 backdrop-blur-md transition-all rounded-full border border-white/10`}
            >
                <ChevronLeft className="w-8 h-8 text-white" />
            </Button>
            <Button
                variant="ghost"
                size="icon"
                onClick={onNext}
                className={`absolute right-2 md:right-4 top-1/2 -translate-y-1/2 ${containerClassName} z-40 w-12 h-12 bg-black/40 hover:bg-black/80 backdrop-blur-md transition-all rounded-full border border-white/10`}
            >
                <ChevronRight className="w-8 h-8 text-white" />
            </Button>
        </>
    );
};
