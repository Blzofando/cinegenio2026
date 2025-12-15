// src/lib/videoProgressService.ts

import { getVideoProgress, saveVideoProgress, clearVideoProgress, getUserVideoProgress } from './firestore';
import { VideoProgress, PlayerEvent } from '@/types';

/**
 * Generates a unique key for video progress storage
 * Format: movie_123 or tv_456_s1e5
 */
export const generateProgressKey = (
    id: number,
    mediaType: 'movie' | 'tv',
    season?: number,
    episode?: number
): string => {
    if (mediaType === 'movie') {
        return `movie_${id}`;
    }
    return `tv_${id}_s${season}e${episode}`;
};

/**
 * Retrieves video progress from Firebase
 */
export const getProgress = async (
    userId: string,
    id: number,
    mediaType: 'movie' | 'tv',
    season?: number,
    episode?: number
): Promise<VideoProgress | null> => {
    const key = generateProgressKey(id, mediaType, season, episode);
    return await getVideoProgress(userId, key);
};

/**
 * Saves video progress to Firebase
 */
export const saveProgress = async (
    userId: string,
    data: VideoProgress
): Promise<void> => {
    const key = generateProgressKey(data.id, data.mediaType, data.season, data.episode);
    await saveVideoProgress(userId, key, {
        ...data,
        lastUpdated: Date.now(),
    });
};

/**
 * Handles player events from postMessage and saves progress
 */
export const handlePlayerEvent = async (
    userId: string,
    event: PlayerEvent
): Promise<void> => {
    const { data } = event;

    // Only save progress on meaningful events
    if (data.event === 'timeupdate' || data.event === 'pause' || data.event === 'ended') {
        // ✅ Calculate progress if not provided
        const calculatedProgress = data.progress !== undefined
            ? data.progress
            : (data.currentTime && data.duration)
                ? (data.currentTime / data.duration) * 100
                : 0;

        const progressData: VideoProgress = {
            id: parseInt(data.id),
            mediaType: data.mediaType,
            timestamp: data.currentTime,
            duration: data.duration,
            progress: calculatedProgress, // ✅ Always defined now
            lastUpdated: Date.now(),
            season: data.season,
            episode: data.episode,
            lastServer: (data as any).lastServer || 'videasy', // Track which server was used
        };

        // ✅ Filter out undefined fields before saving
        const cleanedData = Object.fromEntries(
            Object.entries(progressData).filter(([_, v]) => v !== undefined)
        ) as VideoProgress;

        await saveProgress(userId, cleanedData);
    }
};

/**
 * Clears video progress from Firebase
 */
export const clearProgress = async (
    userId: string,
    id: number,
    mediaType: 'movie' | 'tv',
    season?: number,
    episode?: number
): Promise<void> => {
    const key = generateProgressKey(id, mediaType, season, episode);
    await clearVideoProgress(userId, key);
};

/**
 * Gets all video progress for a user
 */
export const getAllProgress = async (userId: string): Promise<VideoProgress[]> => {
    return await getUserVideoProgress(userId);
};
