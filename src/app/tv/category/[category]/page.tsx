"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase/client';
import { getOnTheAirTVPaginated, getPopularTV } from '@/lib/tmdb';
import InfiniteScroll from 'react-infinite-scroll-component';
import DashboardHeader from '@/components/shared/DashboardHeader';
import Image from 'next/image';
import { TMDbSearchResult } from '@/types';
import EnhancedDetailsModal from '@/components/shared/EnhancedDetailsModal';
import { ChevronLeft } from 'lucide-react';

export default function TVCategoryPage() {
    const params = useParams();
    const router = useRouter();
    const category = params.category as string;

    const [items, setItems] = useState<TMDbSearchResult[]>([]);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedItem, setSelectedItem] = useState<any>(null);

    const categoryTitles: Record<string, string> = {
        'on-the-air': 'No Ar',
        'popular': 'Séries Populares'
    };

    const getCategoryDocName = (cat: string): string => {
        if (cat === 'popular') return 'popular-tv';
        return cat; // on-the-air
    };

    const getAPIFunction = async (cat: string, pageNum: number) => {
        if (cat === 'on-the-air') {
            return await getOnTheAirTVPaginated(pageNum);
        } else if (cat === 'popular') {
            return await getPopularTV(pageNum);
        }
        return { results: [], total_pages: 0 };
    };

    // Carregar primeira página da API TMDB
    useEffect(() => {
        const loadInitial = async () => {
            try {
                console.log(`[TV Category] Loading page 1 from TMDB API...`);
                const result = await getAPIFunction(category, 1);
                const initialItems = result.results.map(item => ({ ...item, media_type: 'tv' as const }));

                console.log(`[TV Category] Loaded ${initialItems.length} items from TMDB`);
                setItems(initialItems);
                setPage(1);
                setIsLoading(false);
            } catch (error) {
                console.error('[TV Category] Error loading initial items:', error);
                setIsLoading(false);
            }
        };
        loadInitial();
    }, [category]);

    // Carregar mais páginas via TMDB API
    const fetchMore = useCallback(async () => {
        if (!hasMore) return;

        const nextPage = page + 1;
        console.log(`[TV Category] Fetching page ${nextPage}...`);

        try {
            const result = await getAPIFunction(category, nextPage);
            const newItems = result.results.map(item => ({ ...item, media_type: 'tv' as const }));

            console.log(`[TV Category] Loaded ${newItems.length} items from page ${nextPage}`);
            setItems(prev => [...prev, ...newItems]);
            setPage(nextPage);

            if (newItems.length === 0 || nextPage >= result.total_pages) {
                console.log(`[TV Category] Reached end. nextPage: ${nextPage}, total_pages: ${result.total_pages}`);
                setHasMore(false);
            }
        } catch (error) {
            console.error('Error fetching more items:', error);
            setHasMore(false);
        }
    }, [category, page, hasMore]);

    if (isLoading) {
        return (
            <div className="min-h-screen bg-gradient-to-b from-black via-gray-900 to-black text-white">
                <DashboardHeader />
                <div className="flex items-center justify-center h-96">
                    <div className="w-16 h-16 border-t-4 border-purple-500 border-solid rounded-full animate-spin"></div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-b from-black via-gray-900 to-black text-white">
            <DashboardHeader />

            <div className="container mx-auto px-4 py-8">
                {/* Header */}
                <div className="mb-8">
                    <button
                        onClick={() => router.back()}
                        className="flex items-center text-gray-400 hover:text-white transition-colors mb-4"
                    >
                        <ChevronLeft className="w-5 h-5 mr-1" />
                        Voltar
                    </button>
                    <h1 className="text-4xl font-black text-white mb-2">
                        {categoryTitles[category] || 'Séries'}
                    </h1>
                    {/* Removed count */}
                </div>

                {/* Infinite Scroll Grid */}
                <InfiniteScroll
                    dataLength={items.length}
                    next={fetchMore}
                    hasMore={hasMore}
                    scrollThreshold={0.8}
                    loader={null}
                    endMessage={
                        <p className="text-center text-gray-400 py-8">
                            Você viu todas as séries! 📺
                        </p>
                    }
                >
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                        {items.map((item) => (
                            <div
                                key={`${item.id}-${item.name}`}
                                className="group cursor-pointer"
                                onClick={() => setSelectedItem({ ...item, tmdbMediaType: 'tv' } as any)}
                            >
                                <div className="relative overflow-hidden rounded-lg shadow-lg transition-transform duration-300 group-hover:scale-105">
                                    <Image
                                        src={item.poster_path ? `https://image.tmdb.org/t/p/w500${item.poster_path}` : 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mM8/+F/PQAIsAOE7bE8dwAAAABJRU5ErkJggg=='}
                                        alt={item.name || 'TV show poster'}
                                        width={400}
                                        height={600}
                                        className="w-full h-auto object-cover bg-gray-800"
                                        unoptimized
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                        <div className="absolute bottom-0 left-0 right-0 p-4">
                                            <h3 className="text-white font-bold text-sm line-clamp-2">{item.name}</h3>
                                            {item.first_air_date && (
                                                <p className="text-gray-300 text-xs mt-1">
                                                    {new Date(item.first_air_date).getFullYear()}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </InfiniteScroll>

                {/* Manual Load More Button fallback */}
                {hasMore && items.length > 0 && (
                    <div className="flex justify-center py-8">
                        <button
                            onClick={fetchMore}
                            className="px-6 py-2 bg-purple-600 hover:bg-purple-700 rounded-full text-white font-semibold transition-colors shadow-lg"
                        >
                            Carregar Mais Séries
                        </button>
                    </div>
                )}
            </div>

            {/* Details Modal */}
            {selectedItem && (
                <EnhancedDetailsModal
                    item={selectedItem}
                    onClose={() => setSelectedItem(null)}
                />
            )}
        </div>
    );
}
