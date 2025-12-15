'use client';

interface CarouselSkeletonProps {
    title?: string;
}

export default function CarouselSkeleton({ title = "Carregando..." }: CarouselSkeletonProps) {
    return (
        <div className="mb-8">
            {/* Title skeleton */}
            {title && (
                <h2 className="text-2xl font-bold text-white mb-4 px-4">
                    {title}
                </h2>
            )}

            {/* Carousel items skeleton */}
            <div className="flex gap-4 overflow-hidden px-4">
                {[...Array(8)].map((_, i) => (
                    <div
                        key={i}
                        className="flex-shrink-0 w-[150px] md:w-[185px] animate-pulse"
                    >
                        {/* Poster placeholder */}
                        <div className="aspect-[2/3] bg-gray-800/50 rounded-lg mb-2 relative overflow-hidden">
                            {/* Shimmer effect */}
                            <div className="absolute inset-0 -translate-x-full animate-shimmer bg-gradient-to-r from-transparent via-white/10 to-transparent" />
                        </div>

                        {/* Title placeholder */}
                        <div className="h-4 bg-gray-700/50 rounded w-3/4 mb-1" />
                        <div className="h-3 bg-gray-700/50 rounded w-1/2" />
                    </div>
                ))}
            </div>
        </div>
    );
}
