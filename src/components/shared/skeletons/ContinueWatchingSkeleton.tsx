import React from 'react';
import { Skeleton } from '@/components/ui/Skeleton';

export default function ContinueWatchingSkeleton() {
    return (
        <div className="mb-6 md:mb-8">
            <div className="flex items-center gap-3 mb-3 md:mb-4 px-4 md:px-6 lg:px-8 xl:px-12">
                <div className="h-8 w-1 bg-purple-500/50 animate-pulse"></div>
                <Skeleton className="h-8 w-64" />
            </div>
            <div className="flex gap-2 sm:gap-3 md:gap-4 lg:gap-6 overflow-hidden px-4 md:px-6 lg:px-8 xl:px-12">
                {[...Array(4)].map((_, i) => (
                    <div key={i} className="flex-shrink-0 w-56 sm:w-64 md:w-72">
                        <Skeleton className="w-full aspect-video rounded-lg mb-2" />
                        <Skeleton className="h-4 w-3/4 mb-1" />
                        <Skeleton className="h-3 w-1/2" />
                    </div>
                ))}
            </div>
        </div>
    );
}
