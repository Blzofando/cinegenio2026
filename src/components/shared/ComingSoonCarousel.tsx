"use client";

import React, { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase/client';
import { RadarItem, DisplayableItem } from '@/types';
import EnhancedDetailsModal from './EnhancedDetailsModal';
import { Button } from '@/components/ui/Button';
import { CarouselArrows } from './CarouselArrows';
import { ComingSoonSkeleton } from './skeletons/ComingSoonSkeleton';

interface ComingSoonCarouselProps {
    type?: 'all' | 'movie' | 'tv';
    categoryUrl?: string;
}

const ComingSoonCarousel: React.FC<ComingSoonCarouselProps> = ({ type = 'all', categoryUrl }) => {
    const [items, setItems] = useState<RadarItem[]>([]);
    const [selectedItem, setSelectedItem] = useState<DisplayableItem | null>(null);
    const [showArrows, setShowArrows] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const scrollRef = useRef<HTMLDivElement>(null);
    const router = useRouter();

    useEffect(() => {
        // Determine which calendar cache to listen to
        const cacheDoc = type === 'movie' ? 'calendar-movies' :
            type === 'tv' ? 'calendar-tv' :
                'calendar-overall';

        // Listen to Firebase cache
        const unsubscribe = onSnapshot(doc(db, 'public', cacheDoc), (docSnap) => {
            if (docSnap.exists()) {
                const data = docSnap.data();
                const calendarItems = (data.items || []) as RadarItem[];
                setItems(calendarItems.slice(0, 20)); // Show first 20 items
                setIsLoading(false);
            } else {
                console.warn(`[ComingSoonCarousel] Document public/${cacheDoc} does not exist`);
                setItems([]);
                setIsLoading(false);
            }
        });

        return () => unsubscribe();
    }, [type]);

    const scroll = (direction: 'left' | 'right') => {
        if (scrollRef.current) {
            const scrollAmount = direction === 'left' ? -500 : 500;
            scrollRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
        }
    };

    const handleCardClick = (item: RadarItem) => {
        router.push(`/${item.tmdbMediaType}/${item.id}`);
    };

    const handleInfoClick = (e: React.MouseEvent, item: RadarItem) => {
        e.stopPropagation();
        setSelectedItem(item);
    };

    // Format release date for display
    const formatReleaseDate = (dateString: string) => {
        if (!dateString) return '';
        // Parse as local date to avoid timezone issues
        const [year, month, day] = dateString.split('-').map(Number);
        const date = new Date(year, month - 1, day);
        return date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
    };

    if (isLoading) {
        return <ComingSoonSkeleton variant="carousel" />;
    }

    if (items.length === 0) {
        return null;
    }

    return (
        <>
            <div className="mb-8 md:mb-10">
                {/* Title */}
                <div className="flex justify-between items-center mb-3 md:mb-4 px-4 md:px-6 lg:px-8 xl:px-12">
                    <div className="flex items-center gap-3">
                        <h2 className="text-lg sm:text-xl md:text-2xl font-bold uppercase tracking-tight">Em Breve</h2>
                    </div>
                    {categoryUrl && (
                        <a
                            href={categoryUrl}
                            className="flex items-center gap-1.5 px-3 py-1.5 text-gray-400 hover:text-white border border-white/10 hover:border-white/30 rounded-lg font-medium transition-all text-xs md:text-sm"
                        >
                            Exibir Mais
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-3 h-3 md:w-4 md:h-4">
                                <path d="M5 12h14"></path>
                                <path d="m12 5 7 7-7 7"></path>
                            </svg>
                        </a>
                    )}
                </div>

                <div
                    className="relative group"
                    onMouseEnter={() => setShowArrows(true)}
                    onMouseLeave={() => setShowArrows(false)}
                >
                    <CarouselArrows 
                        onPrev={() => scroll('left')} 
                        onNext={() => scroll('right')} 
                        show={showArrows} 
                    />

                    <div
                        ref={scrollRef}
                        className="flex gap-2 sm:gap-3 md:gap-5 lg:gap-6 overflow-x-auto pb-4 scrollbar-hide scroll-smooth snap-x snap-mandatory px-0"
                    >
                        {/* Left Spacer */}
                        <div className="flex-shrink-0 w-2 md:w-1 lg:w-2 xl:w-6 snap-start" />

                        {items.map((item, index) => (
                            <div
                                key={`${item.id}-${index}`}
                                className="flex-shrink-0 group/item snap-start w-28 sm:w-32 md:w-40 lg:w-48"
                            >
                                <div
                                    className="relative overflow-hidden rounded-lg shadow-lg aspect-[2/3]"
                                >
                                    {/* Poster */}
                                    <Image
                                        src={item.posterUrl || '/placeholder-poster.svg'}
                                        alt={item.title}
                                        width={300}
                                        height={450}
                                        className="w-full h-full object-cover transition-transform duration-300 group-hover/item:scale-110"
                                        onError={(e) => {
                                            const target = e.target as HTMLImageElement;
                                            target.src = '/placeholder-poster.svg';
                                        }}
                                    />

                                    {/* Release Date Badge - Top Left */}
                                    <div className="absolute top-2 left-2 z-30 bg-black/80 backdrop-blur-sm rounded-full px-3 py-1">
                                        <p className="text-white text-xs font-bold">
                                            {formatReleaseDate(item.releaseDate)}
                                        </p>
                                    </div>

                                    {/* Upper Area - MODAL */}
                                    <div
                                        onClick={(e) => handleInfoClick(e, item)}
                                        className="absolute top-0 left-0 right-0 h-[70%] z-10 cursor-pointer"
                                    />

                                    {/* Lower Area - PAGE */}
                                    <div
                                        onClick={() => handleCardClick(item)}
                                        className="absolute bottom-0 left-0 right-0 h-[30%] z-10 cursor-pointer"
                                    />

                                    {/* Info on hover */}
                                    <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent opacity-0 group-hover/item:opacity-100 transition-opacity duration-300 pointer-events-none">
                                        <div className="absolute bottom-0 left-0 right-0 p-4">
                                            <h3 className="text-white font-bold text-sm line-clamp-2 mb-1">{item.title}</h3>
                                            {item.season_info && (
                                                <p className="text-cyan-400 text-xs font-medium">
                                                    {item.season_info}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                        
                         {/* Right Spacer */}
                         <div className="flex-shrink-0 w-4 md:w-6 lg:w-8 xl:w-12" />
                    </div>
                </div>
            </div>

            {selectedItem && (
                <EnhancedDetailsModal
                    item={selectedItem}
                    onClose={() => setSelectedItem(null)}
                />
            )}
        </>
    );
};

export default ComingSoonCarousel;
