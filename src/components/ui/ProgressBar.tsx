"use client";

import React from 'react';
import { cn } from '@/lib/utils';

interface ProgressBarProps {
    progress: number;
    color?: string;
    height?: string;
    className?: string;
}

const ProgressBar: React.FC<ProgressBarProps> = ({ 
    progress, 
    color = "bg-purple-600", 
    height = "h-1.5",
    className 
}) => {
    return (
        <div className={cn("absolute bottom-0 left-0 right-0 bg-gray-700 z-10", height, className)}>
            <div
                className={cn("h-full transition-all duration-500", color)}
                style={{ width: `${Math.min(progress, 100)}%` }}
            ></div>
        </div>
    );
};

export default ProgressBar;
