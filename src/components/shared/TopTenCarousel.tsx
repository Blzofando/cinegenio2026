"use client";

import React, { useState, useRef } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { RadarItem, DisplayableItem } from '@/types';
import EnhancedDetailsModal from './EnhancedDetailsModal';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface TopTenCarouselProps {
    title: string;
    subtitle: string;
    items?: RadarItem[];  // Optional - can load from API
    isLoading?: boolean;
    color?: 'red' | 'blue' | 'lightblue' | 'purple' | 'gray' | 'gold';
    streamingService?: 'netflix' | 'prime' | 'disney' | 'hbo' | 'apple';  // For service-specific
    globalType?: 'movies' | 'series';  // For global Top 10
}

const COLOR_MAP = {
    red: '#dc2626',      // Netflix
    blue: '#1e3a8a',     // Prime Video
    lightblue: '#3b82f6', // Disney+
    purple: '#9333ea',   // Max
    gray: '#6b7280',     // Apple TV+
    gold: '#f59e0b',     // Global
};

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
    const [items, setItems] = useState<RadarItem[]>(itemsProp || []);
    const [isLoading, setIsLoading] = useState(isLoadingProp);
    const scrollRef = useRef<HTMLDivElement>(null);
    const router = useRouter();

    const themeColor = COLOR_MAP[color];

    // Load data from FlixPatrol API
    React.useEffect(() => {
        if (streamingService) {
            setIsLoading(true);
            import('@/lib/services/flixpatrolService')
                .then(({ getTop10 }) => getTop10(streamingService))
                .then(data => {
                    setItems(data);
                    setIsLoading(false);
                })
                .catch(error => {
                    console.error(`Error loading Top 10 for ${streamingService}:`, error);
                    setIsLoading(false);
                });
        } else if (globalType) {
            setIsLoading(true);
            import('@/lib/services/flixpatrolService')
                .then(({ getGlobalTop10 }) => getGlobalTop10(globalType))
                .then(data => {
                    setItems(data);
                    setIsLoading(false);
                })
                .catch(error => {
                    console.error(`Error loading global Top 10 ${globalType}:`, error);
                    setIsLoading(false);
                });
        } else if (itemsProp) {
            setItems(itemsProp);
        }
    }, [streamingService, globalType, itemsProp]);

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
        return (
            <div className="mb-8 md:mb-12">
                <div className="mb-4 md:mb-6 px-4 md:px-6 lg:px-8 xl:px-12">
                    <div className="h-12 md:h-16 w-64 md:w-80 bg-gray-800 animate-pulse rounded"></div>
                </div>
                <div className="flex gap-2 sm:gap-3 md:gap-5 lg:gap-6 overflow-hidden px-4 md:px-6 lg:px-8 xl:px-12">
                    {Array.from({ length: 5 }).map((_, i) => (
                        <div key={i} className="flex-shrink-0 w-28 sm:w-32 md:w-40 lg:w-48">
                            <div className="aspect-[2/3] bg-gray-800 animate-pulse rounded-lg"></div>
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    return (
        <>
            <div className="mb-8 md:mb-12">
                {/* Title Section - Giant and Bold */}
                <div className="mb-4 md:mb-6 flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-4 px-4 md:px-6 lg:px-8 xl:px-12">
                    <h2
                        className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-black tracking-tight leading-none"
                        style={{
                            WebkitTextStroke: `clamp(1.5px, 0.15vw, 2.5px) ${themeColor}`,
                            WebkitTextFillColor: 'transparent',
                            textShadow: `0 0 15px ${themeColor}40`,
                        }}
                    >
                        {title}
                    </h2>
                    <div className="text-white flex sm:flex-col gap-2 sm:gap-0">
                        <div className="text-[10px] sm:text-xs font-bold tracking-widest uppercase">{subtitle.split(' ')[0]}</div>
                        <div className="text-[10px] sm:text-xs font-bold tracking-widest uppercase">{subtitle.split(' ')[1] || ''}</div>
                    </div>
                </div>

                {/* Carousel */}
                <div
                    className="relative group"
                    onMouseEnter={() => setShowArrows(true)}
                    onMouseLeave={() => setShowArrows(false)}
                >
                    {/* Navigation Arrows */}
                    {showArrows && (
                        <>
                            <button
                                onClick={() => scroll('left')}
                                className="absolute left-0 top-0 bottom-4 z-20 w-16 flex items-center justify-center bg-gradient-to-r from-black/80 to-transparent hover:from-black/90 transition-all"
                            >
                                <ChevronLeft className="w-8 h-8 text-white drop-shadow-lg" />
                            </button>
                            <button
                                onClick={() => scroll('right')}
                                className="absolute right-0 top-0 bottom-4 z-20 w-16 flex items-center justify-center bg-gradient-to-l from-black/80 to-transparent hover:from-black/90 transition-all"
                            >
                                <ChevronRight className="w-8 h-8 text-white drop-shadow-lg" />
                            </button>
                        </>
                    )}

                    <div
                        ref={scrollRef}
                        className="flex gap-2 sm:gap-3 md:gap-5 lg:gap-6 overflow-x-auto pb-4 scrollbar-hide scroll-smooth snap-x snap-mandatory px-4 md:px-6 lg:px-8 xl:px-12"
                    >
                        {items.map((item, index) => (
                            <div
                                key={`${item.id}-${index}`}
                                className="flex-shrink-0 group/item snap-start w-28 sm:w-32 md:w-40 lg:w-48"
                            >
                                <div className="relative">
                                    {/* Número Estilizado */}
                                    <div
                                        className="absolute -left-4 md:-left-6 top-0 z-20 transition-all duration-300 group-hover/item:scale-110 pointer-events-none"
                                        style={{
                                            fontSize: 'clamp(90px, 15vw, 140px)',
                                            lineHeight: '1',
                                            fontWeight: '900',
                                            WebkitTextStroke: `2.5px ${themeColor}`,
                                            WebkitTextFillColor: 'transparent',
                                            textShadow: `0 0 20px ${themeColor}80, 0 4px 12px ${themeColor}60`,
                                        }}
                                    >
                                        {index + 1}
                                    </div>

                                    {/* Card Container */}
                                    <div
                                        className="relative overflow-hidden rounded-lg shadow-2xl"
                                        style={{ aspectRatio: '2/3' }}
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
