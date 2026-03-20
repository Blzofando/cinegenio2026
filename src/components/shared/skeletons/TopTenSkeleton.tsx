import React from 'react';
import { Skeleton } from '@/components/ui/Skeleton';

export default function TopTenSkeleton() {
    return (
        <div className="mb-8 md:mb-12">
            <div className="mb-4 md:mb-6 px-4 md:px-6 lg:px-8 xl:px-12">
                <Skeleton className="h-12 md:h-16 w-64 md:w-80" />
            </div>
            <div className="flex gap-2 sm:gap-3 md:gap-5 lg:gap-6 overflow-hidden px-4 md:px-6 lg:px-8 xl:px-12">
                {[...Array(5)].map((_, i) => (
                    <div key={i} className="flex-shrink-0 w-28 sm:w-32 md:w-40 lg:w-48 relative">
                        {/* Number placeholder */}
                        <div className="absolute -left-4 md:-left-6 top-0 z-20 opacity-20">
                            <Skeleton className="w-16 h-24 rounded-none !bg-transparent border-4 border-gray-700/50" />
                        </div>
                        <Skeleton className="aspect-[2/3] rounded-lg" />
                    </div>
                ))}
            </div>
        </div>
    );
}
