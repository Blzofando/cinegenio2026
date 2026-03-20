import React from 'react';
import { Skeleton } from '@/components/ui/Skeleton';

interface CarouselSkeletonProps {
    title?: string;
    itemCount?: number;
    className?: string;
    itemClassName?: string;
    aspectRatio?: string;
}

export default function CarouselSkeleton({ 
    title, 
    itemCount = 8, 
    className = "mb-8",
    itemClassName = "w-[150px] md:w-[185px]",
    aspectRatio = "aspect-[2/3]"
}: CarouselSkeletonProps) {
    return (
        <div className={className}>
            {/* Title skeleton */}
            {title && (
                <div className="mb-4 px-4 md:px-6 lg:px-8 xl:px-12">
                    <Skeleton className="h-8 w-64" />
                </div>
            )}

            {/* Carousel items skeleton */}
            <div className="flex gap-4 overflow-hidden px-4 md:px-6 lg:px-8 xl:px-12">
                {[...Array(itemCount)].map((_, i) => (
                    <div
                        key={i}
                        className={`flex-shrink-0 ${itemClassName}`}
                    >
                        {/* Poster placeholder */}
                        <Skeleton className={`${aspectRatio} rounded-lg mb-2`} />

                        {/* Title placeholder */}
                        <Skeleton className="h-4 w-3/4 mb-1" />
                        <Skeleton className="h-3 w-1/2" />
                    </div>
                ))}
            </div>
        </div>
    );
}
