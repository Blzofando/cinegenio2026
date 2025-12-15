"use client";

import React, { useState, useEffect } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase/client';
import { RadarItem } from '@/types';
import TopTenCarousel from '@/components/shared/TopTenCarousel';
import CategoryCarousel from '@/components/shared/CategoryCarousel';
import ContinueWatchingCarousel from '@/components/shared/ContinueWatchingCarousel';
import DashboardHeader from '@/components/shared/DashboardHeader';
import HeroCarousel from '@/components/shared/HeroCarousel';
import { getHighlights, HighlightItem } from '@/lib/services/highlightService';
import HeroSkeleton from '@/components/shared/skeletons/HeroSkeleton';

export default function TVPage() {
    const [onTheAirTV, setOnTheAirTV] = useState<RadarItem[]>([]);
    const [topRatedTV, setTopRatedTV] = useState<RadarItem[]>([]);
    const [popularTV, setPopularTV] = useState<RadarItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [highlights, setHighlights] = useState<HighlightItem[]>([]);
    const [hasTriggeredPopulate, setHasTriggeredPopulate] = useState(false);

    useEffect(() => {
        // Listen to public/on-the-air
        const unsubOnTheAir = onSnapshot(doc(db, 'public', 'on-the-air'), (docSnap) => {
            if (docSnap.exists()) {
                const data = docSnap.data();
                const allItems = data.items || [];
                setOnTheAirTV(allItems.filter((r: RadarItem) => r.tmdbMediaType === 'tv').slice(0, 20));
            } else {
                console.warn('[TV Page] Document public/on-the-air does not exist');
                setOnTheAirTV([]);
                if (!hasTriggeredPopulate) {
                    console.log('[TV Page] Triggering populate-radar...');
                    setHasTriggeredPopulate(true);
                    fetch('/api/populate-radar', { method: 'POST' })
                        .then(res => res.json())
                        .then(data => console.log('[TV Page] Populate result:', data))
                        .catch(err => console.error('[TV Page] Populate error:', err));
                }
            }
            setIsLoading(false);
        });

        // Listen to public/popular-tv
        const unsubPopular = onSnapshot(doc(db, 'public', 'popular-tv'), (docSnap) => {
            if (docSnap.exists()) {
                const data = docSnap.data();
                const allItems = data.items || [];
                setPopularTV(allItems.filter((r: RadarItem) => r.tmdbMediaType === 'tv').slice(0, 20));
            } else {
                console.warn('[TV Page] Document public/popular-tv does not exist');
                setPopularTV([]);
            }
        });

        // Load highlights
        const loadHighlights = async () => {
            const items = await getHighlights('tv');
            setHighlights(items);
        };
        loadHighlights();

        return () => {
            unsubOnTheAir();
            unsubPopular();
        };
    }, [hasTriggeredPopulate]);

    return (
        <div className="min-h-screen bg-gradient-to-b from-black via-gray-900 to-black text-white">
            <DashboardHeader />

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
                    <div className="px-4 md:px-8 mb-8">
                        <h2 className="text-4xl font-black text-white">EXPLORAR CATEGORIAS</h2>
                        <p className="text-gray-400 mt-2">Descubra séries por categoria</p>
                    </div>

                    {topRatedTV.length > 0 && (
                        <CategoryCarousel
                            title="Mais Bem Avaliadas"
                            items={topRatedTV}
                            categoryUrl="/tv/category/top-rated"
                            isLoading={isLoading}
                        />
                    )}

                    {popularTV.length > 0 && (
                        <CategoryCarousel
                            title="Populares"
                            items={popularTV}
                            categoryUrl="/tv/category/popular"
                            isLoading={isLoading}
                        />
                    )}

                    {onTheAirTV.length > 0 && (
                        <CategoryCarousel
                            title="No Ar"
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
