"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase/client';
import { RadarItem } from '@/types';
import TopTenCarousel from '@/components/shared/TopTenCarousel';
import MovieCarousel from '@/components/shared/MovieCarousel';
import DashboardHeader from '@/components/shared/DashboardHeader';
import ContinueWatchingCarousel from '@/components/shared/ContinueWatchingCarousel';

export default function DashboardHome() {
    const [tmdbCache, setTmdbCache] = useState<RadarItem[]>([]);
    const [hasTriggeredPopulate, setHasTriggeredPopulate] = useState(false);

    useEffect(() => {
        // Trigger populate if needed (idempotent on server)
        fetch('/api/populate-radar', { method: 'POST' }).catch(console.error);

        const unsubscribe = onSnapshot(collection(db, 'radarCache'), (snapshot) => {
            const items: RadarItem[] = [];
            snapshot.forEach((doc) => {
                items.push(doc.data() as RadarItem);
            });
            setTmdbCache(items);

            if (items.length === 0 && !hasTriggeredPopulate) {
                console.log("Cache vazio. Disparando população...");
                setHasTriggeredPopulate(true);
                fetch('/api/populate-radar', { method: 'POST' })
                    .then(res => res.json())
                    .then(data => console.log('Populate result:', data))
                    .catch(err => console.error('Populate error:', err));
            }
        });

        return () => unsubscribe();
    }, [hasTriggeredPopulate]);

    // Carousels baseados em radarCache (trending e now playing)
    const trending = useMemo(() =>
        tmdbCache.filter(r => r.listType === 'trending').slice(0, 20),
        [tmdbCache]
    );

    const nowPlaying = useMemo(() =>
        tmdbCache.filter(r => r.listType === 'now_playing').slice(0, 20),
        [tmdbCache]
    );

    return (
        <div className="min-h-screen bg-gradient-to-b from-black via-gray-900 to-black text-white">
            <DashboardHeader />

            {/* Main Content */}
            <div className="pt-8 pb-10">
                {/* Continue Watching Carousel */}
                <ContinueWatchingCarousel />

                {/* SEÇÃO: TOP 10 STREAMINGS (FlixPatrol API) */}
                <section className="mb-16">

                    <TopTenCarousel
                        streamingService="netflix"
                        title="TOP 10 NETFLIX"
                        subtitle="TRENDING NOW"
                        color="red"
                    />

                    <TopTenCarousel
                        streamingService="prime"
                        title="TOP 10 PRIME VIDEO"
                        subtitle="TRENDING NOW"
                        color="blue"
                    />

                    <TopTenCarousel
                        streamingService="disney"
                        title="TOP 10 DISNEY+"
                        subtitle="TRENDING NOW"
                        color="lightblue"
                    />

                    <TopTenCarousel
                        streamingService="hbo"
                        title="TOP 10 MAX"
                        subtitle="TRENDING NOW"
                        color="purple"
                    />

                    <TopTenCarousel
                        streamingService="apple"
                        title="TOP 10 APPLE TV+"
                        subtitle="TRENDING NOW"
                        color="gray"
                    />
                </section>

                {/* SEÇÃO: TENDÊNCIAS & LANÇAMENTOS */}
                {(trending.length > 0 || nowPlaying.length > 0) && (
                    <section>
                        <div className="px-4 md:px-8 mb-8">
                            <h2 className="text-4xl font-black text-white">TENDÊNCIAS & LANÇAMENTOS</h2>
                            <p className="text-gray-400 mt-2">O que está bombando agora</p>
                        </div>

                        {trending.length > 0 && (
                            <MovieCarousel
                                title="Tendências da Semana"
                                items={trending}
                            />
                        )}

                        {nowPlaying.length > 0 && (
                            <MovieCarousel
                                title="Nos Cinemas"
                                items={nowPlaying}
                            />
                        )}
                    </section>
                )}

                {/* Loading State when empty */}
                {tmdbCache.length === 0 && (
                    <div className="flex flex-col items-center justify-center h-96">
                        <div className="w-16 h-16 border-t-4 border-purple-500 border-solid rounded-full animate-spin mb-4"></div>
                        <p className="text-gray-400">Populando radar...</p>
                    </div>
                )}
            </div>
        </div>
    );
}
