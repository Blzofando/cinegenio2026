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

export default function MoviesPage() {
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
            const items = await getHighlights('movies');
            setHighlights(items);
        };
        loadHighlights();

        return () => unsubTMDb();
    }, []);

    // No longer needed - using FlixPatrol API directly in component

    // Categorias (apenas filmes)
    const topRatedMovies = useMemo(() =>
        tmdbCache.filter(r => r.listType === 'top_rated' && r.tmdbMediaType === 'movie').slice(0, 20),
        [tmdbCache]
    );

    const popularMovies = useMemo(() =>
        tmdbCache.filter(r => r.listType === 'popular' && r.tmdbMediaType === 'movie').slice(0, 20),
        [tmdbCache]
    );

    const upcomingMovies = useMemo(() =>
        tmdbCache.filter(r => r.listType === 'upcoming' && r.tmdbMediaType === 'movie').slice(0, 20),
        [tmdbCache]
    );

    const nowPlayingMovies = useMemo(() =>
        tmdbCache.filter(r => r.listType === 'now_playing' && r.tmdbMediaType === 'movie').slice(0, 20),
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
                {/* Continue Watching - Movies Only */}
                <ContinueWatchingCarousel mediaType="movie" />

                {/* Top 10 Global Movies */}
                <section className="mb-16">


                    <TopTenCarousel
                        globalType="movies"
                        title="TOP 10 FILMES"
                        subtitle="TRENDING NOW"
                        color="gold"
                    />
                </section>

                {/* Categorias */}
                <section>
                    <div className="px-4 md:px-8 mb-8">
                        <h2 className="text-4xl font-black text-white">EXPLORAR CATEGORIAS</h2>
                        <p className="text-gray-400 mt-2">Descubra filmes por categoria</p>
                    </div>

                    {topRatedMovies.length > 0 && (
                        <CategoryCarousel
                            title="Mais Bem Avaliados"
                            items={topRatedMovies}
                            categoryUrl="/movies/category/top-rated"
                            isLoading={isLoading}
                        />
                    )}

                    {popularMovies.length > 0 && (
                        <CategoryCarousel
                            title="Populares"
                            items={popularMovies}
                            categoryUrl="/movies/category/popular"
                            isLoading={isLoading}
                        />
                    )}

                    {nowPlayingMovies.length > 0 && (
                        <CategoryCarousel
                            title="Nos Cinemas"
                            items={nowPlayingMovies}
                            categoryUrl="/movies/category/now-playing"
                            isLoading={isLoading}
                        />
                    )}

                    {upcomingMovies.length > 0 && (
                        <CategoryCarousel
                            title="Em Breve"
                            items={upcomingMovies}
                            categoryUrl="/movies/category/upcoming"
                            isLoading={isLoading}
                        />
                    )}
                </section>
            </div>
        </div>
    );
}
