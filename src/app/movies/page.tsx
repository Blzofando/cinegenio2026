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

export default function MoviesPage() {
    const [upcomingMovies, setUpcomingMovies] = useState<RadarItem[]>([]);
    const [nowPlayingMovies, setNowPlayingMovies] = useState<RadarItem[]>([]);
    const [topRatedMovies, setTopRatedMovies] = useState<RadarItem[]>([]);
    const [popularMovies, setPopularMovies] = useState<RadarItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [highlights, setHighlights] = useState<HighlightItem[]>([]);
    const [hasTriggeredPopulate, setHasTriggeredPopulate] = useState(false);

    useEffect(() => {
        // Listen to public/upcoming
        const unsubUpcoming = onSnapshot(doc(db, 'public', 'upcoming'), (docSnap) => {
            if (docSnap.exists()) {
                const data = docSnap.data();
                const allItems = data.items || [];
                setUpcomingMovies(allItems.filter((r: RadarItem) => r.tmdbMediaType === 'movie').slice(0, 20));
            } else {
                console.warn('[Movies Page] Document public/upcoming does not exist');
                setUpcomingMovies([]);
                if (!hasTriggeredPopulate) {
                    console.log('[Movies Page] Triggering populate-radar...');
                    setHasTriggeredPopulate(true);
                    fetch('/api/populate-radar', { method: 'POST' })
                        .then(res => res.json())
                        .then(data => console.log('[Movies Page] Populate result:', data))
                        .catch(err => console.error('[Movies Page] Populate error:', err));
                }
            }
        });

        // Listen to public/now-playing
        const unsubNowPlaying = onSnapshot(doc(db, 'public', 'now-playing'), (docSnap) => {
            if (docSnap.exists()) {
                const data = docSnap.data();
                const allItems = data.items || [];
                setNowPlayingMovies(allItems.filter((r: RadarItem) => r.tmdbMediaType === 'movie').slice(0, 20));
            } else {
                console.warn('[Movies Page] Document public/now-playing does not exist');
                setNowPlayingMovies([]);
            }
            setIsLoading(false);
        });

        // Listen to public/popular-movies
        const unsubPopular = onSnapshot(doc(db, 'public', 'popular-movies'), (docSnap) => {
            if (docSnap.exists()) {
                const data = docSnap.data();
                const allItems = data.items || [];
                setPopularMovies(allItems.filter((r: RadarItem) => r.tmdbMediaType === 'movie').slice(0, 20));
            } else {
                console.warn('[Movies Page] Document public/popular-movies does not exist');
                setPopularMovies([]);
            }
        });

        // Load highlights
        const loadHighlights = async () => {
            const items = await getHighlights('movies');
            setHighlights(items);
        };
        loadHighlights();

        return () => {
            unsubUpcoming();
            unsubNowPlaying();
            unsubPopular();
        };
    }, [hasTriggeredPopulate]);

    // No longer needed - using FlixPatrol API directly in component

    // Categorias (apenas filmes)
    // The topRatedMovies state is declared but not populated by the new useEffect logic.
    // If it needs to be populated, a new listener or data source should be added.

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

                    {topRatedMovies.length > 0 && (
                        <CategoryCarousel
                            title="MAIS BEM AVALIADOS"
                            items={topRatedMovies}
                            categoryUrl="/movies/category/top-rated"
                            isLoading={isLoading}
                        />
                    )}

                    {popularMovies.length > 0 && (
                        <CategoryCarousel
                            title="POPULARES"
                            items={popularMovies}
                            categoryUrl="/movies/category/popular"
                            isLoading={isLoading}
                        />
                    )}

                    {nowPlayingMovies.length > 0 && (
                        <CategoryCarousel
                            title="NOS CINEMAS"
                            items={nowPlayingMovies}
                            categoryUrl="/movies/category/now-playing"
                            isLoading={isLoading}
                        />
                    )}

                    {upcomingMovies.length > 0 && (
                        <CategoryCarousel
                            title="EM BREVE"
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
