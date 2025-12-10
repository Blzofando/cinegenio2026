"use client";

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Info, Play, Clock, X } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import VideoPlayerModal from './VideoPlayerModal';
import EnhancedDetailsModal from './EnhancedDetailsModal';
import { getContinueWatchingItems, ResumeData } from '@/lib/resumeService';
import { db } from '@/lib/firebase/client';
import { doc, deleteDoc } from 'firebase/firestore';

const ContinueWatchingCarousel: React.FC = () => {
    const { user } = useAuth();
    const router = useRouter();
    const [items, setItems] = useState<ResumeData[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedPlayerItem, setSelectedPlayerItem] = useState<any>(null);
    const [selectedModalItem, setSelectedModalItem] = useState<any>(null);

    useEffect(() => {
        if (!user) {
            setLoading(false);
            return;
        }

        const loadItems = async () => {
            try {
                const data = await getContinueWatchingItems(user.uid);
                console.log('[ContinueWatching] Smart resume loaded:', data);
                setItems(data);
            } catch (error) {
                console.error('[ContinueWatching] Error:', error);
            } finally {
                setLoading(false);
            }
        };

        loadItems();
    }, [user]);

    const handleCardClick = (item: ResumeData) => {
        // Clicking CARD opens PLAYER
        console.log('[ContinueWatching] Opening player for:', item);
        setSelectedPlayerItem({
            id: item.id,
            tmdbMediaType: item.mediaType,
            title: item.title,
            posterUrl: item.posterUrl,
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

    const handleRemove = async (e: React.MouseEvent, item: ResumeData) => {
        // Remove from Continue Watching
        e.stopPropagation();

        if (!user) return;

        try {
            const docId = item.mediaType === 'movie'
                ? `movie_${item.id}`
                : `tv_${item.id}`;

            await deleteDoc(doc(db, 'users', user.uid, 'nowWatching', docId));

            // Reload items
            const data = await getContinueWatchingItems(user.uid);
            setItems(data);

            console.log('[ContinueWatching] Removed:', item.title);
        } catch (error) {
            console.error('[ContinueWatching] Error removing:', error);
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
        return (
            <div className="mb-8">
                <h2 className="text-2xl font-bold text-white mb-4 px-4">Continuar Assistindo</h2>
                <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide px-4">
                    {[1, 2, 3].map((i) => (
                        <div key={i} className="flex-shrink-0 w-48">
                            <div className="w-full h-72 bg-gray-800 rounded-lg animate-pulse"></div>
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    if (items.length === 0) {
        return null;
    }

    return (
        <>
            <div className="mb-8">
                <h2 className="text-2xl font-bold text-white mb-4 px-4">Continuar Assistindo</h2>
                <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide px-4">
                    {items.map((item, index) => (
                        <div
                            key={`${item.mediaType}_${item.id}_${index}`}
                            className="flex-shrink-0 w-48 group"
                        >
                            {/* Card - CLICKABLE to open player */}
                            <div
                                onClick={() => handleCardClick(item)}
                                className="relative overflow-hidden rounded-lg shadow-lg mb-2 cursor-pointer"
                            >
                                <Image
                                    src={item.posterUrl || 'https://placehold.co/400x600/374151/9ca3af?text=?'}
                                    alt={item.title}
                                    width={400}
                                    height={600}
                                    className="w-full h-72 object-cover transition-transform duration-300 group-hover:scale-110"
                                />

                                {/* Progress bar */}
                                {item.progress !== undefined && item.progress > 0 && (
                                    <div className="absolute bottom-0 left-0 right-0 h-1 bg-gray-700 z-10">
                                        <div
                                            className="h-full bg-purple-600"
                                            style={{ width: `${Math.min(item.progress, 100)}%` }}
                                        ></div>
                                    </div>
                                )}

                                {/* Play icon + Time overlay - CENTER - on hover */}
                                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col items-center justify-center pointer-events-none z-0">
                                    <Play className="w-16 h-16 text-white fill-current mb-2" />
                                    {item.timestamp !== undefined && item.duration && item.duration > 0 && (
                                        <div className="flex items-center gap-1 text-white text-sm font-semibold">
                                            <Clock className="w-4 h-4" />
                                            <span>{formatTime(item.timestamp)} / {formatTime(item.duration)}</span>
                                        </div>
                                    )}
                                </div>

                                {/* Info icon - TOP LEFT - on hover only */}
                                <button
                                    onClick={(e) => handleInfoClick(e, item)}
                                    className="absolute top-2 left-2 p-2 bg-black/70 hover:bg-purple-600 rounded-full transition-all opacity-0 group-hover:opacity-100 z-20"
                                    title="Ver página do título"
                                >
                                    <Info className="w-4 h-4 text-white" />
                                </button>

                                {/* Remove icon - TOP RIGHT - on hover only */}
                                <button
                                    onClick={(e) => handleRemove(e, item)}
                                    className="absolute top-2 right-2 p-2 bg-black/70 hover:bg-red-600 rounded-full transition-all opacity-0 group-hover:opacity-100 z-20"
                                    title="Remover do histórico"
                                >
                                    <X className="w-4 h-4 text-white" />
                                </button>
                            </div>

                            {/* Title - CLICKABLE to open INFO MODAL */}
                            <button
                                onClick={(e) => handleTitleClick(e, item)}
                                className="w-full text-left"
                            >
                                <h3 className="text-white font-bold truncate hover:text-purple-400 transition-colors">
                                    {item.title}
                                </h3>
                                {item.season && item.episode ? (
                                    <p className="text-purple-400 text-sm">
                                        {item.progress && item.progress >= 90
                                            ? `T${item.season} E${item.episode}`
                                            : `T${item.season} E${item.episode}`
                                        }
                                    </p>
                                ) : (
                                    <p className="text-purple-400 text-sm">Filme</p>
                                )}
                            </button>
                        </div>
                    ))}
                </div>
            </div>

            {/* Video Player Modal */}
            {selectedPlayerItem && (
                <VideoPlayerModal
                    item={selectedPlayerItem}
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
        </>
    );
};

export default ContinueWatchingCarousel;
