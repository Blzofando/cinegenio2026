"use client";

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase/client';
import { RadarItem, DisplayableItem } from '@/types';
import EnhancedDetailsModal from './EnhancedDetailsModal';

interface ComingSoonSectionProps {
    type: 'movie' | 'tv';
}

const ComingSoonSection: React.FC<ComingSoonSectionProps> = ({ type }) => {
    const [allItems, setAllItems] = useState<RadarItem[]>([]);
    const [displayedItems, setDisplayedItems] = useState<RadarItem[]>([]);
    const [selectedItem, setSelectedItem] = useState<DisplayableItem | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [itemsToShow, setItemsToShow] = useState(20);
    const router = useRouter();

    useEffect(() => {
        // Determine which calendar cache to listen to
        const cacheDoc = type === 'movie' ? 'calendar-movies' : 'calendar-tv';

        // Listen to Firebase cache
        const unsubscribe = onSnapshot(doc(db, 'public', cacheDoc), (docSnap) => {
            if (docSnap.exists()) {
                const data = docSnap.data();
                const calendarItems = (data.items || []) as RadarItem[];

                // Filter out items with past release dates
                const today = new Date();
                today.setHours(0, 0, 0, 0); // Reset to midnight

                const futureItems = calendarItems.filter(item => {
                    if (!item.releaseDate) return true;
                    const releaseDate = new Date(item.releaseDate);
                    releaseDate.setHours(0, 0, 0, 0);
                    return releaseDate >= today;
                });

                setAllItems(futureItems);
                setDisplayedItems(futureItems.slice(0, itemsToShow));
                setIsLoading(false);
            } else {
                console.warn(`[ComingSoonSection] Document public/${cacheDoc} does not exist`);
                setAllItems([]);
                setDisplayedItems([]);
                setIsLoading(false);
            }
        });

        return () => unsubscribe();
    }, [type, itemsToShow]);

    const handleLoadMore = () => {
        setItemsToShow(prev => prev + 20);
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
        return (
            <div className="mb-8 md:mb-10">
                <div className="flex justify-between items-center mb-3 md:mb-4 px-4 md:px-6 lg:px-8 xl:px-12">
                    <div className="h-6 md:h-8 w-48 md:w-64 bg-gray-800 animate-pulse rounded"></div>
                </div>
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7 gap-2 sm:gap-3 md:gap-4 px-4 md:px-6 lg:px-8 xl:px-12">
                    {Array.from({ length: 20 }).map((_, i) => (
                        <div key={i} className="aspect-[2/3] bg-gray-800 animate-pulse rounded-lg"></div>
                    ))}
                </div>
            </div>
        );
    }

    if (allItems.length === 0) {
        return null;
    }

    return (
        <>
            <div className="mb-8 md:mb-10">
                {/* Title */}
                <h2 className="text-lg sm:text-xl md:text-2xl font-bold mb-4">EM BREVE</h2>

                {/* Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                    {displayedItems.map((item, index) => (
                        <div
                            key={`${item.id}-${index}`}
                            className="group/item"
                        >
                            <div
                                className="relative overflow-hidden rounded-lg shadow-lg cursor-pointer"
                                style={{ aspectRatio: '2/3' }}
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
                                <div className="absolute top-2 left-2 z-30 bg-black/80 backdrop-blur-sm rounded-full px-2 py-1">
                                    <p className="text-white text-xs font-bold">
                                        {formatReleaseDate(item.releaseDate)}
                                    </p>
                                </div>

                                {/* Upper Area - MODAL */}
                                <div
                                    onClick={(e) => handleInfoClick(e, item)}
                                    className="absolute top-0 left-0 right-0 h-[70%] z-10"
                                />

                                {/* Lower Area - PAGE */}
                                <div
                                    onClick={() => handleCardClick(item)}
                                    className="absolute bottom-0 left-0 right-0 h-[30%] z-10"
                                />

                                {/* Info on hover */}
                                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent opacity-0 group-hover/item:opacity-100 transition-opacity duration-300 pointer-events-none">
                                    <div className="absolute bottom-0 left-0 right-0 p-2 md:p-3">
                                        <h3 className="text-white font-bold text-xs md:text-sm line-clamp-2 mb-1">{item.title}</h3>
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
                </div>

                {/* Carregar Mais button */}
                {displayedItems.length < allItems.length && (
                    <div className="flex justify-center mt-6">
                        <button
                            onClick={handleLoadMore}
                            className="px-8 py-3 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-full transition-all duration-200 transform hover:scale-105"
                        >
                            Carregar Mais
                        </button>
                    </div>
                )}
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

export default ComingSoonSection;
