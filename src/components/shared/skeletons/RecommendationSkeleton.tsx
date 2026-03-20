import React from 'react';
import { Skeleton } from '@/components/ui/Skeleton';

export const RecommendationSkeleton = () => {
    return (
        <div className="mt-8 w-full max-w-4xl mx-auto animate-pulse">
            <div className="relative bg-gray-900/50 rounded-xl overflow-hidden border border-gray-800 p-6 sm:p-8">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
                    {/* Poster Skeleton */}
                    <div className="md:col-span-1 flex justify-center items-start">
                        <Skeleton className="w-48 md:w-full aspect-[2/3] rounded-lg shadow-2xl" />
                    </div>

                    {/* Content Skeleton */}
                    <div className="md:col-span-2 space-y-6 text-left">
                        <div>
                            <Skeleton className="h-10 w-3/4 mb-3" />
                            <div className="flex gap-3">
                                <Skeleton className="h-4 w-16" />
                                <Skeleton className="h-4 w-24" />
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <Skeleton className="h-4 w-32 mb-2" />
                                <Skeleton className="h-4 w-full" />
                                <Skeleton className="h-4 w-5/6" />
                            </div>
                            <div>
                                <Skeleton className="h-4 w-40 mb-2" />
                                <Skeleton className="h-4 w-full" />
                                <Skeleton className="h-4 w-4/5" />
                            </div>
                        </div>

                        {/* Probabilities Skeleton */}
                        <div className="space-y-3 pt-4 border-t border-white/5">
                            <Skeleton className="h-4 w-48 mb-4" />
                            {[1, 2, 3, 4].map((i) => (
                                <div key={i} className="flex items-center gap-4">
                                    <Skeleton className="h-4 w-20" />
                                    <Skeleton className="h-4 flex-1 rounded-full" />
                                </div>
                            ))}
                        </div>
                        
                        <Skeleton className="h-12 w-full rounded-lg mt-6" />
                    </div>
                </div>
            </div>
        </div>
    );
};
