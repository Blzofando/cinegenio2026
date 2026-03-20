import React from 'react';
import { Skeleton } from '@/components/ui/Skeleton';

export default function HeroSkeleton() {
    return (
        <div className="relative w-full h-[60vh] md:h-[70vh] bg-gradient-to-b from-gray-800 via-gray-900 to-black overflow-hidden">
            {/* Base Skeleton layer for shimmer */}
            <Skeleton className="absolute inset-0 bg-transparent rounded-none" />

            {/* Hero content placeholder */}
            <div className="absolute bottom-0 left-0 right-0 p-8 md:p-12 space-y-4">
                {/* Logo/Title placeholder */}
                <Skeleton className="w-64 h-12" />

                {/* Description placeholder */}
                <div className="space-y-2 max-w-2xl">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-5/6" />
                    <Skeleton className="h-4 w-4/6" />
                </div>

                {/* Buttons placeholder */}
                <div className="flex gap-4 mt-6">
                    <Skeleton className="w-32 h-12" />
                    <Skeleton className="w-32 h-12" />
                </div>
            </div>
        </div>
    );
}
