"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase/client';
import { RadarItem } from '@/types';
import TopTenCarousel from '@/components/shared/TopTenCarousel';
import CategoryCarousel from '@/components/shared/CategoryCarousel';
import ContinueWatchingCarousel from '@/components/shared/ContinueWatchingCarousel';
import DashboardHeader from '@/components/shared/DashboardHeader';
import HeroCarousel from '@/components/shared/HeroCarousel';
import { getHighlights, HighlightItem } from '@/lib/services/highlightService';

export default function TVPage() {
    const [tmdbCache, setTmdbCache] = useState<RadarItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [highlights, setHighlights] = useState<HighlightItem[]>([]);

    useEffect(() => {
        // Trigger populate check
        fetch('/api/populate-radar', { method: 'POST' }).catch(console.error);

        const unsubTMDb = onSnapshot(
            collection(db, 'radarCache'),
            (snapshot) => {
                const items: RadarItem[] = [];
                snapshot.forEach(doc => items.push(doc.data() as RadarItem));
                setTmdbCache(items);
                setIsLoading(false);
            },
            (err) => {
                console.error("Erro ao carregar radar:", err);
                setIsLoading(false);
            }
        );

        // Load highlights
        const loadHighlights = async () => {
            const items = await getHighlights('tv');
            setHighlights(items);
        };
        loadHighlights();

        return () => unsubTMDb();
    }, []);

    // No longer needed - using FlixPatrol API directly in component

    // Categorias (apenas séries)
    const topRatedTV = useMemo(() =>
        tmdbCache.filter(r => r.listType === 'top_rated' && r.tmdbMediaType === 'tv').slice(0, 20),
        [tmdbCache]
    );

    const popularTV = useMemo(() =>
        tmdbCache.filter(r => r.listType === 'popular' && r.tmdbMediaType === 'tv').slice(0, 20),
        [tmdbCache]
    );

    const onTheAirTV = useMemo(() =>
        tmdbCache.filter(r => r.listType === 'on_the_air' && r.tmdbMediaType === 'tv').slice(0, 20),
        [tmdbCache]
    );

    return (
        <div className="min-h-screen bg-gradient-to-b from-black via-gray-900 to-black text-white">
            <DashboardHeader />

            {/* Hero Carousel */}
            {highlights.length > 0 && (
                <HeroCarousel items={highlights} />
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
