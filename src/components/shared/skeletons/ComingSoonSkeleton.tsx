import React from 'react';
import { Skeleton } from '@/components/ui/Skeleton';

interface ComingSoonSkeletonProps {
    variant?: 'grid' | 'carousel';
    itemCount?: number;
}

export const ComingSoonSkeleton: React.FC<ComingSoonSkeletonProps> = ({ 
    variant = 'carousel',
    itemCount = 6
}) => {
    // Shared title skeleton
    const TitleSkeleton = (
        <div className="flex justify-between items-center mb-3 md:mb-4 px-4 md:px-6 lg:px-8 xl:px-12">
            <Skeleton className="h-6 md:h-8 w-48 md:w-64" />
        </div>
    );

    if (variant === 'grid') {
        return (
            <div className="mb-8 md:mb-10">
                {TitleSkeleton}
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7 gap-2 sm:gap-3 md:gap-4 px-4 md:px-6 lg:px-8 xl:px-12">
                    {Array.from({ length: 20 }).map((_, i) => (
                        <Skeleton key={i} className="aspect-[2/3] rounded-lg" />
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className="mb-8 md:mb-10">
            {TitleSkeleton}
            <div className="flex gap-2 sm:gap-3 md:gap-5 lg:gap-6 overflow-hidden px-4 md:px-6 lg:px-8 xl:px-12">
                {Array.from({ length: itemCount }).map((_, i) => (
                    <div key={i} className="flex-shrink-0 w-28 sm:w-32 md:w-40 lg:w-48">
                        <Skeleton className="aspect-[2/3] rounded-lg" />
                    </div>
                ))}
            </div>
        </div>
    );
};
