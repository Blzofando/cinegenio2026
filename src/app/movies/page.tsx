"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase/client';
import { RadarItem } from '@/types';
import TopTenCarousel from '@/components/shared/TopTenCarousel';
import CategoryCarousel from '@/components/shared/CategoryCarousel';
import DashboardHeader from '@/components/shared/DashboardHeader';

export default function MoviesPage() {
    const [tmdbCache, setTmdbCache] = useState<RadarItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);

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

        return () => unsubTMDb();
    }, []);

    // Top 10 Filmes da Semana (trending)
    const top10Movies = useMemo(() =>
        tmdbCache.filter(r => r.listType === 'trending' && r.tmdbMediaType === 'movie').slice(0, 10),
        [tmdbCache]
    );

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

            {/* Main Content */}
            <div className="pt-8 pb-10">
                {/* Top 10 da Semana */}
                {top10Movies.length > 0 && (
                    <section className="mb-16">
                        <div className="px-4 md:px-8 mb-8">
                            <h2 className="text-4xl font-black text-white">TOP 10 DA SEMANA</h2>
                            <p className="text-gray-400 mt-2">Os filmes mais populares agora</p>
                        </div>

                        <TopTenCarousel
                            title="TOP 10 FILMES"
                            subtitle="DA SEMANA"
                            items={top10Movies}
                            isLoading={isLoading}
                        />
                    </section>
                )}

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
