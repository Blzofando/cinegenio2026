import React from 'react';
import { Skeleton } from '@/components/ui/Skeleton';

interface MediaGridSkeletonProps {
    itemCount?: number;
    className?: string;
}

export const MediaGridSkeleton: React.FC<MediaGridSkeletonProps> = ({ 
    itemCount = 12,
    className = ""
}) => {
    return (
        <div className={`grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 ${className}`}>
            {Array.from({ length: itemCount }).map((_, i) => (
                <div key={i} className="space-y-3">
                    <Skeleton className="aspect-[2/3] rounded-lg w-full" />
                    <Skeleton className="h-4 w-3/4 rounded" />
                    <Skeleton className="h-3 w-1/2 rounded opacity-50" />
                </div>
            ))}
        </div>
    );
};
