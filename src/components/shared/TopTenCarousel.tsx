"use client";

import React, { useState, useRef } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { RadarItem, DisplayableItem } from '@/types';
import EnhancedDetailsModal from './EnhancedDetailsModal';
import { Button } from '@/components/ui/Button';
import { CarouselArrows } from './CarouselArrows';
import { useTopTenData } from '@/hooks/useTopTenData';

interface TopTenCarouselProps {
    title: string;
    subtitle: string;
    items?: RadarItem[];  // Optional - can load from API
    isLoading?: boolean;
    color?: 'red' | 'blue' | 'lightblue' | 'purple' | 'gray' | 'gold';
    streamingService?: 'netflix' | 'prime' | 'disney' | 'hbo' | 'apple';  // For service-specific
    globalType?: 'movies' | 'series';  // For global Top 10
}

// COLOR_MAP removed - moved to constants/colors.ts and handled by hook

import TopTenSkeleton from './skeletons/TopTenSkeleton';

const TopTenCarousel: React.FC<TopTenCarouselProps> = ({
    title,
    subtitle,
    items: itemsProp,
    isLoading: isLoadingProp = false,
    color = 'red',
    streamingService,
    globalType
}) => {
    const [selectedItem, setSelectedItem] = useState<DisplayableItem | null>(null);
    const [showArrows, setShowArrows] = useState(false);
    const { items, isLoading, themeColor } = useTopTenData(streamingService, globalType, itemsProp);
    const scrollRef = useRef<HTMLDivElement>(null);
    const router = useRouter();

    const scroll = (direction: 'left' | 'right') => {
        if (scrollRef.current) {
            const scrollAmount = direction === 'left' ? -500 : 500;
            scrollRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
        }
    };

    // Reset scroll to left on mount
    React.useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollLeft = 0;
        }
    }, []);

    const handleCardClick = (item: RadarItem) => {
        router.push(`/${item.tmdbMediaType}/${item.id}`);
    };

    const handleInfoClick = (e: React.MouseEvent, item: RadarItem) => {
        e.stopPropagation();
        setSelectedItem(item);
    };

    if (isLoading) {
        return <TopTenSkeleton />;
    }

    return (
        <>
            <div className="mb-8 md:mb-12">
                {/* Title Section - Giant and Bold */}
                <div className="mb-4 md:mb-6 flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-4 px-4 md:px-6 lg:px-8 xl:px-12">
                    <h2
                         className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-black tracking-tight leading-none top-ten-title py-1"
                        style={{
                            '--stroke-color': themeColor,
                            '--glow-color': `${themeColor}40`,
                        } as React.CSSProperties}
                    >
                        {title}
                    </h2>
                    <div className="text-white flex sm:flex-col gap-2 sm:gap-0 pb-1">
                        <div className="text-[10px] sm:text-xs font-bold tracking-widest uppercase opacity-70">{subtitle.split(' ')[0]}</div>
                        <div className="text-[10px] sm:text-xs font-bold tracking-widest uppercase opacity-70">{subtitle.split(' ')[1] || ''}</div>
                    </div>
                </div>

                {/* Carousel */}
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
                        {/* Left Spacer - Calibrado para compensar o GAP e alinhar o NÚMERO com o título */}
                        <div className="flex-shrink-0 w-6 sm:w-7 md:w-7 lg:w-8 xl:w-12 snap-start" />

                        {items.map((item, index) => (
                            <div
                                key={`${item.id}-${index}`}
                                className="flex-shrink-0 group/item snap-start w-28 sm:w-32 md:w-40 lg:w-48"
                            >
                                <div className="relative">
                                    {/* Número Estilizado */}
                                    <div
                                         className="absolute -left-4 md:-left-6 top-0 z-20 transition-all duration-300 group-hover/item:scale-110 pointer-events-none top-ten-number"
                                        style={{
                                            '--stroke-color': themeColor,
                                            '--glow-color': `${themeColor}80`,
                                        } as React.CSSProperties}
                                    >
                                        {index + 1}
                                    </div>

                                    {/* Card Container */}
                                    <div
                                        className="relative overflow-hidden rounded-lg shadow-2xl aspect-[2/3]"
                                    >
                                        {/* Poster Image - Full, no cropping */}
                                        <Image
                                            src={item.posterUrl || 'https://placehold.co/300x450/1f2937/9ca3af?text=?'}
                                            alt={item.title}
                                            width={300}
                                            height={450}
                                            className="w-full h-full object-cover transition-transform duration-300 group-hover/item:scale-110"
                                        />

                                        {/* Upper Clickable Area (70%) - MODAL */}
                                        <div
                                            onClick={(e) => handleInfoClick(e, item)}
                                            className="absolute top-0 left-0 right-0 h-[70%] z-10 cursor-pointer"
                                        />

                                        {/* Lower Clickable Area (30%) - PAGE */}
                                        <div
                                            onClick={() => handleCardClick(item)}
                                            className="absolute bottom-0 left-0 right-0 h-[30%] z-10 cursor-pointer"
                                        />

                                        {/* Info overlay - Shows on hover */}
                                        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent opacity-0 group-hover/item:opacity-100 transition-opacity duration-300 pointer-events-none">
                                            <div className="absolute bottom-0 left-0 right-0 p-4">
                                                <h3 className="text-white font-bold text-sm line-clamp-2 mb-1">{item.title}</h3>
                                                {item.releaseDate && (
                                                    <p className="text-gray-300 text-xs">
                                                        {new Date(item.releaseDate).getFullYear()}
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}

                        {/* Right Spacer for consistent padding at the end */}
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

export default TopTenCarousel;
