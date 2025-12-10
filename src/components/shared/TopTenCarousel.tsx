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
    items: RadarItem[];
    isLoading?: boolean;
    color?: 'red' | 'blue' | 'lightblue' | 'purple';
}

const COLOR_MAP = {
    red: '#dc2626',      // Netflix
    blue: '#1e3a8a',     // Prime Video
    lightblue: '#3b82f6', // Disney+
    purple: '#9333ea',   // Max
};

const TopTenCarousel: React.FC<TopTenCarouselProps> = ({ title, subtitle, items, isLoading = false, color = 'red' }) => {
    const [selectedItem, setSelectedItem] = useState<DisplayableItem | null>(null);
    const [showArrows, setShowArrows] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);
    const router = useRouter();

    const themeColor = COLOR_MAP[color];

    const scroll = (direction: 'left' | 'right') => {
        if (scrollRef.current) {
            const scrollAmount = direction === 'left' ? -500 : 500;
            scrollRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
        }
    };

    React.useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollLeft = 0;
        }
    }, [items]);

    const handleCardClick = (item: RadarItem) => {
        router.push(`/${item.tmdbMediaType}/${item.id}`);
    };

    const handleInfoClick = (e: React.MouseEvent, item: RadarItem) => {
        e.stopPropagation();
        setSelectedItem(item);
    };

    if (isLoading) {
        return (
            <div className="mb-12">
                <div className="mb-6 pl-20">
                    <div className="h-16 w-80 bg-gray-800 animate-pulse rounded"></div>
                </div>
                <div className="flex gap-7 overflow-hidden pl-20">
                    {Array.from({ length: 5 }).map((_, i) => (
                        <div key={i} className="flex-shrink-0 w-56">
                            <div className="h-72 bg-gray-800 animate-pulse rounded-lg"></div>
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    return (
        <>
            <div className="mb-12">
                {/* Title Section */}
                <div className="mb-6 flex items-center gap-4 pl-20">
                    <h2
                        className="text-4xl md:text-6xl font-black tracking-tight"
                        style={{
                            WebkitTextStroke: `2px ${themeColor}`,
                            WebkitTextFillColor: 'transparent',
                            textShadow: `0 0 15px ${themeColor}40`,
                        }}
                    >
                        {title}
                    </h2>
                    <div className="text-white">
                        <div className="text-xs font-bold tracking-widest">{subtitle.split(' ')[0]}</div>
                        <div className="text-xs font-bold tracking-widest">{subtitle.split(' ')[1] || ''}</div>
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
                        className="flex gap-7 overflow-x-auto pb-4 scrollbar-hide scroll-smooth snap-x snap-mandatory pl-20"
                    >
                        {items.map((item, index) => (
                            <div
                                key={`${item.id}-${index}`}
                                className="flex-shrink-0 group/item snap-start w-48"
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
