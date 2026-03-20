"use client";

import React, { useState, useEffect } from 'react';
import { Info, ChevronLeft, ChevronRight } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { HighlightItem } from '@/lib/services/highlightService';
import VideoPlayerModal from './VideoPlayerModal';
import CombinedPlayButton from './CombinedPlayButton';
import { useWatchStatus } from '@/hooks/useWatchStatus';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/utils';

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
                className="relative w-full h-[85vh] md:h-[90vh] bg-black group"
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
                                    className="object-cover object-top"
                                    priority={index === 0}
                                />
                            )}
                        </div>
                    ))}
                </div>

                {/* Gradient Overlays */}
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 via-20% to-transparent pointer-events-none" />
                <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/20 via-40% to-transparent pointer-events-none" />

                {/* Content */}
                <div className="absolute inset-0 flex flex-col justify-end px-4 pb-8 md:px-6 lg:px-8 xl:px-12 md:pb-16">
                    <div className="max-w-2xl space-y-4 mb-8">
                        {/* Title Logo or Text */}
                        {currentItem.logoUrl ? (
                            <div className="relative h-12 md:h-16 lg:h-24 w-auto">
                                <Image
                                    src={currentItem.logoUrl}
                                    alt={currentItem.title}
                                    width={400}
                                    height={120}
                                    className="max-h-[40px] md:max-h-[60px] lg:max-h-[100px] w-auto object-contain drop-shadow-[0_4px_8px_rgba(0,0,0,0.8)]"
                                />
                            </div>
                        ) : (
                            <h1 className="text-3xl md:text-5xl lg:text-6xl font-bold text-white drop-shadow-2xl">
                                {currentItem.title}
                            </h1>
                        )}

                        {/* Metadata */}
                        <div className="flex items-center gap-3 text-xs md:text-sm">
                            {currentItem.voteAverage > 0 && (
                                <div className="flex items-center gap-1.5 bg-black/40 backdrop-blur-md px-2 py-0.5 rounded-md border border-white/10">
                                    <span className="text-yellow-400 text-xs">★</span>
                                    <span className="font-bold text-white">{currentItem.voteAverage.toFixed(1)}</span>
                                </div>
                            )}
                            {currentItem.releaseDate && (
                                <span className="text-white/90 font-bold">
                                    {new Date(currentItem.releaseDate).getFullYear()}
                                </span>
                            )}
                            {currentItem.genres.length > 0 && (
                                <>
                                    <span className="text-white/30">•</span>
                                    <span className="text-white/60 font-medium tracking-wide">
                                        {currentItem.genres.slice(0, 3).join(' • ')}
                                    </span>
                                </>
                            )}
                        </div>

                        {/* Overview */}
                        {currentItem.overview && (
                            <p className="text-sm md:text-base text-white/70 line-clamp-3 max-w-xl leading-relaxed font-medium">
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
                                <Button
                                    variant="glass"
                                    className="flex items-center gap-2"
                                >
                                    <Info className="w-4 h-4 md:w-5 md:h-5" />
                                    Ver Mais
                                </Button>
                            </Link>
                        </div>
                    </div>

                    <div className="flex gap-1.5 items-center justify-center md:justify-start mb-4">
                        {items.map((_, index) => (
                                <button
                                    key={index}
                                    onClick={() => goToSlide(index)}
                                    className={cn(
                                        "h-1 p-0 transition-all rounded-full cursor-pointer",
                                        index === currentIndex ? "bg-white w-6" : "bg-white/20 w-1 hover:bg-white/40"
                                    )}
                                    aria-label={`Go to slide ${index + 1}`}
                                />
                        ))}
                    </div>
                </div>

                {/* Navigation Arrows */}
                 <Button
                    variant="glass"
                    size="icon"
                    onClick={goToPrevious}
                    className="absolute left-4 top-1/2 -translate-y-1/2 rounded-full opacity-0 group-hover:opacity-100 md:opacity-100 h-10 w-10 md:h-12 md:w-12"
                    aria-label="Previous slide"
                >
                    <ChevronLeft className="w-6 h-6" />
                </Button>
                <Button
                    variant="glass"
                    size="icon"
                    onClick={goToNext}
                    className="absolute right-4 top-1/2 -translate-y-1/2 rounded-full opacity-0 group-hover:opacity-100 md:opacity-100 h-10 w-10 md:h-12 md:w-12"
                    aria-label="Next slide"
                >
                    <ChevronRight className="w-6 h-6" />
                </Button>
            </div >

            {/* Video Player Modal */}
            {
                showPlayer && displayableItem && (
                    <VideoPlayerModal
                        item={displayableItem}
                        isOpen={showPlayer}
                        onClose={() => setShowPlayer(false)}
                    />
                )
            }
        </>
    );
};

export default HeroCarousel;
