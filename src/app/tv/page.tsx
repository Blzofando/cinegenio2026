"use client";

import React, { useState, useEffect } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase/client';
import { RadarItem } from '@/types';
import TopTenCarousel from '@/components/shared/TopTenCarousel';
import CategoryCarousel from '@/components/shared/CategoryCarousel';
import ContinueWatchingCarousel from '@/components/shared/ContinueWatchingCarousel';
import DashboardHeader from '@/components/shared/DashboardHeader';
import MobileBottomNav from '@/components/shared/MobileBottomNav';
import HeroCarousel from '@/components/shared/HeroCarousel';
import { getHighlights, HighlightItem } from '@/lib/services/highlightService';
import HeroSkeleton from '@/components/shared/skeletons/HeroSkeleton';

export default function TVPage() {
    const [onTheAirTV, setOnTheAirTV] = useState<RadarItem[]>([]);
    const [topRatedTV, setTopRatedTV] = useState<RadarItem[]>([]);
    const [popularTV, setPopularTV] = useState<RadarItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [highlights, setHighlights] = useState<HighlightItem[]>([]);

    useEffect(() => {
        // Fetch public data once (updates on F5 only)
        const loadPublicData = async () => {
            try {
                // Fetch on-the-air
                const onTheAirSnap = await getDoc(doc(db, 'public', 'on-the-air'));
                if (onTheAirSnap.exists()) {
                    const data = onTheAirSnap.data();
                    const allItems = data.items || [];
                    setOnTheAirTV(allItems.filter((r: RadarItem) => r.tmdbMediaType === 'tv').slice(0, 20));
                } else {
                    console.warn('[TV Page] Document public/on-the-air does not exist');
                    setOnTheAirTV([]);
                }

                // Fetch popular
                const popularSnap = await getDoc(doc(db, 'public', 'popular-tv'));
                if (popularSnap.exists()) {
                    const data = popularSnap.data();
                    const allItems = data.items || [];
                    setPopularTV(allItems.filter((r: RadarItem) => r.tmdbMediaType === 'tv').slice(0, 20));
                } else {
                    console.warn('[TV Page] Document public/popular-tv does not exist');
                    setPopularTV([]);
                }

                setIsLoading(false);
            } catch (error) {
                console.error('[TV Page] Error loading public data:', error);
                setIsLoading(false);
            }
        };

        loadPublicData();

        // Load highlights
        const loadHighlights = async () => {
            const items = await getHighlights('tv');
            setHighlights(items);
        };
        loadHighlights();
    }, []); // Only run on mount (F5 updates)

    return (
        <div className="min-h-screen bg-gradient-to-b from-black via-gray-900 to-black text-white pb-16 md:pb-0">
            <DashboardHeader />
            <MobileBottomNav />

            {/* Hero Carousel */}
            {highlights.length > 0 ? (
                <HeroCarousel items={highlights} />
            ) : (
                <HeroSkeleton />
            )}

            {/* Main Content */}
            <div className="pt-8 pb-10">
                {/* Continue Watching - TV Series Only */}
                <ContinueWatchingCarousel mediaType="tv" />

                {/* Top 10 Global Series */}
                <section className="mb-16">


                    <TopTenCarousel
                        globalType="series"
                        title="TOP 10 SÉRIES"
                        subtitle="TRENDING NOW"
                        color="gold"
                    />
                </section>

                {/* Categorias */}
                <section>

                    {topRatedTV.length > 0 && (
                        <CategoryCarousel
                            title="MAIS BEM AVALIADAS"
                            items={topRatedTV}
                            categoryUrl="/tv/category/top-rated"
                            isLoading={isLoading}
                        />
                    )}

                    {popularTV.length > 0 && (
                        <CategoryCarousel
                            title="POPULARES"
                            items={popularTV}
                            categoryUrl="/tv/category/popular"
                            isLoading={isLoading}
                        />
                    )}

                    {onTheAirTV.length > 0 && (
                        <CategoryCarousel
                            title="NO AR"
                            items={onTheAirTV}
                            categoryUrl="/tv/category/on-the-air"
                            isLoading={isLoading}
                        />
                    )}
                </section>
            </div>
        </div>
    );
}
