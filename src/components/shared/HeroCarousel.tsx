"use client";

import React, { useState, useEffect } from 'react';
import { Info, ChevronLeft, ChevronRight } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { HighlightItem } from '@/lib/services/highlightService';
import VideoPlayerModal from './VideoPlayerModal';
import CombinedPlayButton from './CombinedPlayButton';
import { useWatchStatus } from '@/hooks/useWatchStatus';

interface HeroCarouselProps {
    items: HighlightItem[];
}

const HeroCarousel: React.FC<HeroCarouselProps> = ({ items }) => {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isPlaying, setIsPlaying] = useState(true);
    const [showPlayer, setShowPlayer] = useState(false);
    const [playingItem, setPlayingItem] = useState<HighlightItem | null>(null);
    const [isHovered, setIsHovered] = useState(false);

    const currentItem = items[currentIndex];

    // Get watch status for current item
    const watchStatus = useWatchStatus(currentItem?.id || 0, currentItem?.tmdbMediaType || 'movie');

    // Auto-play logic
    useEffect(() => {
        if (!isPlaying || items.length <= 1 || showPlayer || isHovered) return;

        const interval = setInterval(() => {
            setCurrentIndex((prev) => (prev + 1) % items.length);
        }, 6000); // 6 seconds

        return () => clearInterval(interval);
    }, [isPlaying, items.length, currentIndex, showPlayer, isHovered]);

    const goToPrevious = () => {
        setCurrentIndex((prev) => (prev - 1 + items.length) % items.length);
    };

    const goToNext = () => {
        setCurrentIndex((prev) => (prev + 1) % items.length);
    };

    const goToSlide = (index: number) => {
        setCurrentIndex(index);
    };

    const handlePlay = () => {
        setPlayingItem(currentItem);
        setShowPlayer(true);
    };

    if (!items || items.length === 0) {
        return null;
    }

    const displayableItem = playingItem ? {
        id: playingItem.id,
        tmdbMediaType: playingItem.tmdbMediaType,
        title: playingItem.title,
        posterUrl: '',
        backdropUrl: playingItem.backdropUrl,
    } : null;

    return (
        <>
            <div
                className="relative w-full h-[70vh] md:h-[80vh] bg-black group"
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
            >
                {/* Backdrop Image with Fade Transition */}
                <div className="absolute inset-0 overflow-hidden">
                    {items.map((item, index) => (
                        <div
                            key={item.id}
                            className={`absolute inset-0 transition-opacity duration-1000 ${index === currentIndex ? 'opacity-100' : 'opacity-0'
                                }`}
                        >
                            {item.backdropUrl && (
                                <Image
                                    src={item.backdropUrl}
                                    alt={item.title}
                                    fill
                                    className="object-cover"
                                    priority={index === 0}
                                />
                            )}
                        </div>
                    ))}
                </div>

                {/* Gradient Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent" />
                <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-transparent to-transparent" />

                {/* Content */}
                <div className="absolute inset-0 flex flex-col justify-end p-6 md:p-12 max-w-7xl mx-auto">
                    <div className="max-w-2xl space-y-4 mb-8">
                        {/* Title Logo or Text */}
                        {currentItem.logoUrl ? (
                            <div className="relative h-12 md:h-16 lg:h-24 w-auto">
                                <Image
                                    src={currentItem.logoUrl}
                                    alt={currentItem.title}
                                    width={400}
                                    height={120}
                                    className="max-h-[40px] md:max-h-[60px] lg:max-h-[100px] w-auto object-contain"
                                    style={{ filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.8))' }}
                                />
                            </div>
                        ) : (
                            <h1 className="text-3xl md:text-5xl lg:text-6xl font-bold text-white drop-shadow-2xl">
                                {currentItem.title}
                            </h1>
                        )}

                        {/* Metadata */}
                        <div className="flex items-center gap-3 text-sm md:text-base text-white/90">
                            {currentItem.voteAverage > 0 && (
                                <div className="flex items-center gap-1">
                                    <span className="text-yellow-400">★</span>
                                    <span className="font-semibold">{currentItem.voteAverage.toFixed(1)}</span>
                                </div>
                            )}
                            {currentItem.releaseDate && (
                                <>
                                    {currentItem.voteAverage > 0 && <span>•</span>}
                                    <span>{new Date(currentItem.releaseDate).getFullYear()}</span>
                                </>
                            )}
                            {currentItem.genres.length > 0 && (
                                <>
                                    <span>•</span>
                                    <span>{currentItem.genres.slice(0, 3).join(', ')}</span>
                                </>
                            )}
                        </div>

                        {/* Overview */}
                        {currentItem.overview && (
                            <p className="text-sm md:text-lg text-white/80 line-clamp-3 max-w-xl">
                                {currentItem.overview}
                            </p>
                        )}

                        {/* Buttons */}
                        <div className="flex gap-3 pt-2">
                            {/* Use CombinedPlayButton */}
                            <CombinedPlayButton
                                item={{
                                    id: currentItem.id,
                                    mediaType: currentItem.tmdbMediaType,
                                    title: currentItem.title,
                                    posterUrl: currentItem.backdropUrl || '',
                                }}
                                watchStatus={watchStatus}
                                onPlay={handlePlay}
                            />

                            {/* More Info Button - Navigate to page */}
                            <Link href={`/${currentItem.tmdbMediaType}/${currentItem.id}`}>
                                <button className="flex items-center gap-2 px-4 md:px-6 py-2 md:py-3 bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white font-semibold rounded-lg transition-all text-sm md:text-base">
                                    <Info className="w-4 h-4 md:w-5 md:h-5" />
                                    Ver Mais
                                </button>
                            </Link>
                        </div>
                    </div>

                    {/* Indicators (Dots) */}
                    <div className="flex gap-2 items-center justify-center md:justify-start mb-4">
                        {items.map((_, index) => (
                            <button
                                key={index}
                                onClick={() => goToSlide(index)}
                                className={`h-1.5 rounded-full transition-all ${index === currentIndex
                                    ? 'bg-white w-8'
                                    : 'bg-white/40 w-1.5 hover:bg-white/60'
                                    }`}
                                aria-label={`Go to slide ${index + 1}`}
                            />
                        ))}
                    </div>
                </div>

                {/* Navigation Arrows */}
                <button
                    onClick={goToPrevious}
                    className="absolute left-4 top-1/2 -translate-y-1/2 p-2 bg-black/50 hover:bg-black/70 text-white rounded-full transition-all opacity-0 group-hover:opacity-100 md:opacity-100"
                    aria-label="Previous slide"
                >
                    <ChevronLeft className="w-6 h-6" />
                </button>
                <button
                    onClick={goToNext}
                    className="absolute right-4 top-1/2 -translate-y-1/2 p-2 bg-black/50 hover:bg-black/70 text-white rounded-full transition-all opacity-0 group-hover:opacity-100 md:opacity-100"
                    aria-label="Next slide"
                >
                    <ChevronRight className="w-6 h-6" />
                </button>
            </div >

            {/* Video Player Modal */}
            {
                showPlayer && displayableItem && (
                    <VideoPlayerModal
                        item={displayableItem}
                        onClose={() => setShowPlayer(false)}
                    />
                )
            }
        </>
    );
};

export default HeroCarousel;
