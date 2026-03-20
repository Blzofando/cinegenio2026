import React from 'react';
import { cn } from '@/lib/utils';

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
    shimmer?: boolean;
}

/**
 * Primitive Skeleton component for loading states.
 * Standardizes the pulse and shimmer effects across the application.
 */
export const Skeleton: React.FC<SkeletonProps> = ({ 
    className, 
    shimmer = true,
    ...props 
}) => {
    return (
        <div
            className={cn(
                "relative overflow-hidden bg-gray-800/50 rounded animate-pulse",
                className
            )}
            {...props}
        >
            {shimmer && (
                <div 
                    className="absolute inset-0 -translate-x-full animate-shimmer bg-gradient-to-r from-transparent via-white/10 to-transparent" 
                />
            )}
        </div>
    );
};
