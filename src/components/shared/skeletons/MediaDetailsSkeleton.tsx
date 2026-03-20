import React from 'react';
import { Skeleton } from '@/components/ui/Skeleton';

interface MediaDetailsSkeletonProps {
    variant?: 'page' | 'modal';
}

export default function MediaDetailsSkeleton({ variant = 'page' }: MediaDetailsSkeletonProps) {
    const isModal = variant === 'modal';

    return (
        <div className={`${isModal ? 'w-full' : 'min-h-screen'} bg-black text-white pb-16 md:pb-0 animate-in fade-in duration-500`}>
            {/* Hero Section Skeleton */}
            <div className={`relative w-full ${isModal ? 'aspect-video' : 'h-[70vh] md:h-[80vh]'} bg-gray-900/20`}>
                <Skeleton className="absolute inset-0 rounded-none bg-gray-900/40" />
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/70 to-transparent" />
                
                <div className={`absolute bottom-0 left-0 right-0 p-6 ${isModal ? 'md:p-8' : 'md:p-12'} flex flex-col md:flex-row gap-8 items-end`}>
                    {/* Poster placeholder - hide in modal for smaller look or keep it consistent? 
                        In EnhancedDetailsModal, the poster isn't shown in the top part, just backdrop.
                    */}
                    {!isModal && (
                        <div className="hidden md:block flex-shrink-0 w-48 md:w-64 aspect-[2/3]">
                            <Skeleton className="w-full h-full rounded-xl shadow-2xl" />
                        </div>
                    )}

                    <div className="flex-1 space-y-4 md:space-y-6 w-full">
                        {/* Logo/Title placeholder */}
                        <Skeleton className="h-10 md:h-16 lg:h-20 w-3/4 max-w-md" />

                        {/* Metadata row */}
                        <div className="flex flex-wrap gap-4">
                            <Skeleton className="h-4 w-16" />
                            <Skeleton className="h-4 w-24" />
                            <Skeleton className="h-4 w-12" />
                        </div>

                        {/* Genres */}
                        <div className="flex flex-wrap gap-2">
                            <Skeleton className="h-6 w-20 rounded-full" />
                            <Skeleton className="h-6 w-24 rounded-full" />
                            <Skeleton className="h-6 w-16 rounded-full" />
                        </div>

                        {/* Buttons placeholder */}
                        <div className="flex flex-wrap gap-4 pt-2">
                            <Skeleton className="w-40 h-11 md:h-12 rounded-lg" />
                            <Skeleton className="w-32 h-11 md:h-12 rounded-lg" />
                        </div>
                    </div>
                </div>
            </div>

            {/* Content Section Skeleton */}
            <div className={`max-w-7xl mx-auto ${isModal ? 'px-6 md:px-8' : 'px-6 md:px-12'} py-8 md:py-12 space-y-12`}>
                {/* Synopsis placeholder */}
                <div className="space-y-4">
                    <Skeleton className="h-8 w-40" />
                    <div className="space-y-2">
                        <Skeleton className="h-4 w-full" />
                        <Skeleton className="h-4 w-full" />
                        <Skeleton className="h-4 w-3/4" />
                    </div>
                </div>

                {/* Grid placeholder (Cast/Similar) - only if it's a page */}
                {!isModal && (
                    <div className="space-y-6">
                        <Skeleton className="h-8 w-48" />
                        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-4">
                            {[...Array(6)].map((_, i) => (
                                <div key={i} className="space-y-2">
                                    <Skeleton className="aspect-[2/3] rounded-lg" />
                                    <Skeleton className="h-3 w-3/4" />
                                    <Skeleton className="h-2 w-1/2" />
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
