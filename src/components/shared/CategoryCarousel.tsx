"use client";

import React, { useState, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { RadarItem, DisplayableItem } from '@/types';
import EnhancedDetailsModal from './EnhancedDetailsModal';
import { ChevronLeft, ChevronRight, ArrowRight } from 'lucide-react';

interface CategoryCarouselProps {
    title: string;
    items: RadarItem[];
    categoryUrl: string;
    isLoading?: boolean;
}

const CategoryCarousel: React.FC<CategoryCarouselProps> = ({ title, items, categoryUrl, isLoading = false }) => {
    const [selectedItem, setSelectedItem] = useState<DisplayableItem | null>(null);
    const [showArrows, setShowArrows] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);
    const router = useRouter();

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
            <div className="mb-10">
                <div className="flex justify-between items-center mb-4 pl-20 pr-4">
                    <div className="h-8 w-64 bg-gray-800 animate-pulse rounded"></div>
                    <div className="h-10 w-32 bg-gray-800 animate-pulse rounded"></div>
                </div>
                <div className="flex gap-7 overflow-hidden pl-20">
                    {Array.from({ length: 6 }).map((_, i) => (
                        <div key={i} className="flex-shrink-0" style={{ width: 'clamp(224px, 16vw, 256px)' }}>
                            <div className="h-72 bg-gray-800 animate-pulse rounded-lg"></div>
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    return (
        <>
            <div className="mb-10">
                {/* Title & Show More */}
                <div className="flex justify-between items-center mb-4 pl-20 pr-4">
                    <h2 className="text-2xl font-bold">{title}</h2>
                    <Link
                        href={categoryUrl}
                        className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg font-semibold transition-colors text-sm"
                    >
                        Exibir Mais
                        <ArrowRight className="w-4 h-4" />
                    </Link>
                </div>

                <div
                    className="relative group"
                    onMouseEnter={() => setShowArrows(true)}
                    onMouseLeave={() => setShowArrows(false)}
                >
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
                                <div
                                    className="relative overflow-hidden rounded-lg shadow-lg"
                                    style={{ aspectRatio: '2/3' }}
                                >
                                    {/* Poster - Full */}
                                    <Image
                                        src={item.posterUrl || 'https://placehold.co/300x450/1f2937/9ca3af?text=?'}
                                        alt={item.title}
                                        width={300}
                                        height={450}
                                        className="w-full h-full object-cover transition-transform duration-300 group-hover/item:scale-110"
                                    />

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
                                            {item.releaseDate && (
                                                <p className="text-gray-300 text-xs">
                                                    {new Date(item.releaseDate).getFullYear()}
                                                </p>
                                            )}
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

export default CategoryCarousel;
