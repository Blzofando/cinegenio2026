"use client";

import React, { useState, useEffect } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase/client';
import { RadarItem } from '@/types';
import TopTenCarousel from '@/components/shared/TopTenCarousel';
import MovieCarousel from '@/components/shared/MovieCarousel';
import DashboardHeader from '@/components/shared/DashboardHeader';
import MobileBottomNav from '@/components/shared/MobileBottomNav';
import ContinueWatchingCarousel from '@/components/shared/ContinueWatchingCarousel';
import ComingSoonCarousel from '@/components/shared/ComingSoonCarousel';
import HeroCarousel from '@/components/shared/HeroCarousel';
import { getHighlights, HighlightItem } from '@/lib/services/highlightService';
import HeroSkeleton from '@/components/shared/skeletons/HeroSkeleton';

export default function DashboardHome() {
    const [trending, setTrending] = useState<RadarItem[]>([]);
    const [nowPlaying, setNowPlaying] = useState<RadarItem[]>([]);
    const [highlights, setHighlights] = useState<HighlightItem[]>([]);
    const [hasTriggeredPopulate, setHasTriggeredPopulate] = useState(false);

    useEffect(() => {
        // Listen to public/trending
        const unsubTrending = onSnapshot(doc(db, 'public', 'trending'), (docSnap) => {
            if (docSnap.exists()) {
                const data = docSnap.data();
                setTrending((data.items || []).slice(0, 20));
            } else {
                console.warn('[Dashboard] Document public/trending does not exist');
                setTrending([]);
                // Trigger populate if not already triggered
                if (!hasTriggeredPopulate) {
                    console.log('[Dashboard] Triggering populate-radar...');
                    setHasTriggeredPopulate(true);
                    fetch('/api/populate-radar', { method: 'POST' })
                        .then(res => res.json())
                        .then(data => console.log('[Dashboard] Populate result:', data))
                        .catch(err => console.error('[Dashboard] Populate error:', err));
                }
            }
        });

        // Listen to public/now-playing
        const unsubNowPlaying = onSnapshot(doc(db, 'public', 'now-playing'), (docSnap) => {
            if (docSnap.exists()) {
                const data = docSnap.data();
                setNowPlaying((data.items || []).slice(0, 20));
            } else {
                console.warn('[Dashboard] Document public/now-playing does not exist');
                setNowPlaying([]);
            }
        });

        return () => {
            unsubTrending();
            unsubNowPlaying();
        };
    }, [hasTriggeredPopulate]);

    // Load highlights for hero carousel
    useEffect(() => {
        const loadHighlights = async () => {
            const items = await getHighlights();
            setHighlights(items);
        };
        loadHighlights();
    }, []);

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

                {/* SEÇÃO: EM BREVE (Calendar) */}
                <ComingSoonCarousel type="all" />

                {/* SEÇÃO: TENDÊNCIAS & LANÇAMENTOS */}
                {(trending.length > 0 || nowPlaying.length > 0) && (
                    <section>

                        {trending.length > 0 && (
                            <MovieCarousel
                                title="TENDÊNCIAS"
                                items={trending}
                            />
                        )}

                        {nowPlaying.length > 0 && (
                            <MovieCarousel
                                title="NOS CINEMAS"
                                items={nowPlaying}
                            />
                        )}
                    </section>
                )}

            </div>
        </div>
    );
}
