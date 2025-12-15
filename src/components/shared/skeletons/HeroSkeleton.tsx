'use client';

export default function HeroSkeleton() {
    return (
        <div className="relative w-full h-[60vh] md:h-[70vh] bg-gradient-to-b from-gray-800 via-gray-900 to-black overflow-hidden">
            {/* Shimmer animation */}
            <div className="absolute inset-0 -translate-x-full animate-shimmer bg-gradient-to-r from-transparent via-white/10 to-transparent" />

            {/* Hero content placeholder */}
            <div className="absolute bottom-0 left-0 right-0 p-8 md:p-12 space-y-4">
                {/* Logo/Title placeholder */}
                <div className="w-64 h-12 bg-gray-700/50 rounded animate-pulse" />

                {/* Description placeholder */}
                <div className="space-y-2 max-w-2xl">
                    <div className="h-4 bg-gray-700/50 rounded w-full animate-pulse" />
                    <div className="h-4 bg-gray-700/50 rounded w-5/6 animate-pulse" />
                    <div className="h-4 bg-gray-700/50 rounded w-4/6 animate-pulse" />
                </div>

                {/* Buttons placeholder */}
                <div className="flex gap-4 mt-6">
                    <div className="w-32 h-12 bg-gray-700/50 rounded animate-pulse" />
                    <div className="w-32 h-12 bg-gray-700/50 rounded animate-pulse" />
                </div>
            </div>
        </div>
    );
}
