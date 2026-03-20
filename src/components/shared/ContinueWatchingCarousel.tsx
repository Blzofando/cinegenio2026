"use client";

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Info, Play, Clock, X, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/contexts/AuthContext';
import VideoPlayerModal from './VideoPlayerModal';
import EnhancedDetailsModal from './EnhancedDetailsModal';
import ProgressBar from '@/components/ui/ProgressBar';
import ConfirmModal from '@/components/ui/ConfirmModal';
import { getContinueWatchingItems, ResumeData } from '@/lib/resumeService';
import { db } from '@/lib/firebase/client';
import { doc, deleteDoc } from 'firebase/firestore';

interface ContinueWatchingCarouselProps {
    mediaType?: 'movie' | 'tv'; // Optional filter
}

import ContinueWatchingSkeleton from './skeletons/ContinueWatchingSkeleton';

const ContinueWatchingCarousel: React.FC<ContinueWatchingCarouselProps> = ({ mediaType }) => {
    const { user } = useAuth();
    const router = useRouter();
    const [items, setItems] = useState<ResumeData[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedPlayerItem, setSelectedPlayerItem] = useState<any>(null);
    const [selectedModalItem, setSelectedModalItem] = useState<any>(null);
    const [itemToRemove, setItemToRemove] = useState<ResumeData | null>(null);

    useEffect(() => {
        if (!user) {
            setLoading(false);
            return;
        }

        let isMounted = true;

        const loadItems = async () => {
            try {
                const data = await getContinueWatchingItems(user.uid);
                if (isMounted) {
                    // Filter by mediaType if provided
                    const filteredData = mediaType
                        ? data.filter(item => item.mediaType === mediaType)
                        : data;
                    setItems(filteredData);
                    setLoading(false);
                }
            } catch (error) {
                console.error('[ContinueWatching] Error:', error);
                if (isMounted) setLoading(false);
            }
        };

        // Initial load
        loadItems();

        // Realtime listener for updates
        import('firebase/firestore').then(({ collection, onSnapshot }) => {
            if (!user) return; // Guard clause
            const nowWatchingRef = collection(db, 'users', user.uid, 'nowWatching');
            const unsubscribe = onSnapshot(nowWatchingRef, (snapshot) => {
                // When any document changes, reload the smart list
                console.log('[ContinueWatching] Update detected, reloading...');
                loadItems();
            });

            return () => unsubscribe();
        });

        return () => {
            isMounted = false;
        };
    }, [user, mediaType]);

    const handleCardClick = (item: ResumeData) => {
        // Clicking CARD opens PLAYER
        console.log('[ContinueWatching] Opening player for:', item);
        setSelectedPlayerItem({
            id: item.id,
            tmdbMediaType: item.mediaType,
            title: item.title,
            posterUrl: item.posterUrl,
            backdropUrl: item.backdropUrl, // Pass backdrop
            // Pass season/episode if TV show
            ...(item.mediaType === 'tv' && {
                season: item.season,
                episode: item.episode,
            }),
        });
    };

    const handleTitleClick = (e: React.MouseEvent, item: ResumeData) => {
        // Clicking TITLE opens INFO MODAL
        e.stopPropagation();
        setSelectedModalItem({
            id: item.id,
            tmdbMediaType: item.mediaType,
            title: item.title,
            posterUrl: item.posterUrl,
        });
    };

    const handleInfoClick = (e: React.MouseEvent, item: ResumeData) => {
        // Clicking INFO icon goes to DETAIL PAGE
        e.stopPropagation();
        router.push(`/${item.mediaType}/${item.id}`);
    };

    const handleRemoveClick = (e: React.MouseEvent, item: ResumeData) => {
        e.stopPropagation();
        setItemToRemove(item);
    };

    const confirmRemove = async () => {
        if (!user || !itemToRemove) return;

        try {
            const docId = itemToRemove.mediaType === 'movie'
                ? `movie_${itemToRemove.id}`
                : `tv_${itemToRemove.id}`;

            await deleteDoc(doc(db, 'users', user.uid, 'nowWatching', docId));

            // Reload items
            const data = await getContinueWatchingItems(user.uid);
            setItems(data);

            console.log('[ContinueWatching] Removed:', itemToRemove.title);
        } catch (error) {
            console.error('[ContinueWatching] Error removing:', error);
        } finally {
            setItemToRemove(null);
        }
    };

    const formatTime = (seconds: number) => {
        const hrs = Math.floor(seconds / 3600);
        const mins = Math.floor((seconds % 3600) / 60);
        const secs = Math.floor(seconds % 60);

        if (hrs > 0) {
            return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
        }
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    if (loading) {
        return <ContinueWatchingSkeleton />;
    }

    if (items.length === 0) {
        return null;
    }

    return (
        <>
            <div className="mb-6 md:mb-8">
                <div className="mb-3 md:mb-4 px-4 md:px-6 lg:px-8 xl:px-12">
                    <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-white">Continuar Assistindo</h2>
                </div>
                <div className="flex gap-2 sm:gap-3 md:gap-4 lg:gap-6 overflow-x-auto pb-4 scrollbar-hide snap-x snap-mandatory px-0">
                    {/* Left Spacer */}
                    <div className="flex-shrink-0 w-2 md:w-1 lg:w-2 xl:w-6 snap-start" />
                    {items.map((item, index) => (
                        <div
                            key={`${item.mediaType}_${item.id}_${index}`}
                            className="flex-shrink-0 w-56 sm:w-64 md:w-72 group snap-start"
                        >
                            {/* Card - CLICKABLE to open MODAL */}
                            <div
                                onClick={(e) => handleTitleClick(e, item)}
                                className="relative overflow-hidden rounded-lg shadow-lg mb-2 cursor-pointer aspect-video"
                            >
                                <Image
                                    src={item.backdropUrl || item.posterUrl || 'https://placehold.co/1280x720/374151/9ca3af?text=?'}
                                    alt={item.title}
                                    width={1280}
                                    height={720}
                                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                                />

                                {/* Progress bar - Thicker for mobile visibility */}
                                {item.progress !== undefined && item.progress > 0 && (
                                    <div className="absolute bottom-0 left-0 right-0 z-10">
                                        <ProgressBar 
                                            progress={item.progress} 
                                            height="h-1.5"
                                            className="rounded-none"
                                        />
                                    </div>
                                )}

                                {/* Play button + Time - CENTER - CLICKABLE */}
                                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col items-center justify-center z-10">
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={(e: React.MouseEvent) => {
                                            e.stopPropagation();
                                            handleCardClick(item);
                                        }}
                                        className="hover:scale-110 transition-transform duration-200"
                                    >
                                        <Play className="w-12 h-12 md:w-16 md:h-16 text-white fill-current transition-colors" />
                                    </Button>
                                    {item.timestamp !== undefined && item.duration && item.duration > 0 && (
                                        <div className="flex items-center gap-1 text-white text-xs md:text-sm font-semibold pointer-events-none">
                                            <Clock className="w-3 h-3 md:w-4 md:h-4" />
                                            <span>{formatTime(item.timestamp)} / {formatTime(item.duration)}</span>
                                        </div>
                                    )}
                                </div>

                                {/* Info icon - TOP LEFT - on hover only */}
                                <Button
                                    variant="glass"
                                    size="icon"
                                    onClick={(e: React.MouseEvent) => handleInfoClick(e, item)}
                                    className="absolute top-2 left-2 opacity-0 group-hover:opacity-100 z-20 hover:bg-purple-600 rounded-full"
                                    title="Ver página do título"
                                >
                                    <Info className="w-4 h-4 text-white" />
                                </Button>

                                {/* Remove icon - TOP RIGHT - on hover only */}
                                <Button
                                    variant="glass"
                                    size="icon"
                                    onClick={(e: React.MouseEvent) => handleRemoveClick(e, item)}
                                    className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 z-20 hover:bg-red-600 rounded-full"
                                    title="Remover do histórico"
                                >
                                    <Trash2 className="w-4 h-4 text-white" />
                                </Button>
                            </div>

                            {/* Title */}
                            <Button
                                variant="ghost"
                                onClick={(e: React.MouseEvent) => handleTitleClick(e, item)}
                                className="w-full text-left p-0 mt-2 block h-auto hover:bg-transparent"
                            >
                                <h3 className="text-white font-bold text-sm md:text-base truncate hover:text-purple-400 transition-colors">
                                    {item.title}
                                </h3>
                                {item.season && item.episode ? (
                                    <p className="text-purple-400 text-xs md:text-sm">
                                        {item.progress && item.progress >= 90
                                            ? `T${item.season} E${item.episode}`
                                            : `T${item.season} E${item.episode}`
                                        }
                                    </p>
                                ) : (
                                    <p className="text-purple-400 text-xs md:text-sm">Filme</p>
                                )}
                            </Button>
                        </div>
                    ))}
                    {/* Right Spacer */}
                    <div className="flex-shrink-0 w-4 md:w-6 lg:w-8 xl:w-12" />
                </div>
            </div>

            {/* Video Player Modal */}
            {selectedPlayerItem && (
                <VideoPlayerModal
                    item={selectedPlayerItem}
                    isOpen={!!selectedPlayerItem}
                    onClose={() => setSelectedPlayerItem(null)}
                />
            )}

            {/* Info Modal */}
            {selectedModalItem && (
                <EnhancedDetailsModal
                    item={selectedModalItem}
                    onClose={() => setSelectedModalItem(null)}
                />
            )}

            {/* Remove Confirmation Modal */}
            <ConfirmModal
                isOpen={!!itemToRemove}
                onClose={() => setItemToRemove(null)}
                onConfirm={confirmRemove}
                title="Remover do Histórico"
                message={`Tem certeza que deseja remover "${itemToRemove?.title}" do seu histórico de exibição?`}
            />
        </>
    );
};

export default ContinueWatchingCarousel;
