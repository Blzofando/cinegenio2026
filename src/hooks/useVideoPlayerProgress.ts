import { useState, useEffect, useRef, useCallback } from 'react';
import { collection, getDocs, serverTimestamp, doc as firestoreDoc, setDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase/client';
import { handlePlayerEvent } from '@/lib/videoProgressService';
import { saveStartWatching, saveStopWatching } from '@/lib/nowWatchingService';
import { swapToNextEpisode } from '@/lib/dualEpisodeService';
import { getDocument, setDocument } from '@/lib/firebase/core';
import { DisplayableItem, PlayerEvent } from '@/types';

interface UseVideoPlayerProgressProps {
    user: any;
    item: DisplayableItem;
    server: 'videasy' | 'vidking';
    setServer: (server: 'videasy' | 'vidking') => void;
    selectedSeason: number;
    setSelectedSeason: (s: number) => void;
    selectedEpisode: number;
    setSelectedEpisode: (e: number) => void;
    setShowEpisodeSelector: (show: boolean) => void;
    movieDetails: any;
}

export const useVideoPlayerProgress = ({
    user,
    item,
    server,
    setServer,
    selectedSeason,
    setSelectedSeason,
    selectedEpisode,
    setSelectedEpisode,
    setShowEpisodeSelector,
    movieDetails,
}: UseVideoPlayerProgressProps) => {
    const [initialLoadDone, setInitialLoadDone] = useState(false);
    const [initialResumeTime, setInitialResumeTime] = useState<number | null>(null);
    const [lastTimestamp, setLastTimestamp] = useState<number>(0);
    const [lastDuration, setLastDuration] = useState<number>(0);
    const lastTimestampRef = useRef<number>(0);
    const lastDurationRef = useRef<number>(0);

    // Initial load from Firebase
    useEffect(() => {
        const loadInitialState = async () => {
            if (!user) {
                setInitialLoadDone(true);
                return;
            }

            try {
                const docId = item.tmdbMediaType === 'movie' ? `movie_${item.id}` : `tv_${item.id}`;
                const data = await getDocument<any>(`users/${user.uid}/nowWatching/${docId}`);

                if (data) {
                    if (data.lastServer) setServer(data.lastServer);
                    
                    if (item.tmdbMediaType === 'movie') {
                        setInitialResumeTime(data.timestamp || 0);
                        setLastTimestamp(data.timestamp || 0);
                    } else if (item.tmdbMediaType === 'tv' && data.season && data.episode) {
                        setSelectedSeason(data.season);
                        setSelectedEpisode(data.episode);
                        setShowEpisodeSelector(false);
                    }
                } else if (item.tmdbMediaType === 'movie') {
                    setInitialResumeTime(0);
                }
            } catch (error) {
                console.error('[useVideoPlayerProgress] Load error:', error);
            } finally {
                setInitialLoadDone(true);
            }
        };

        loadInitialState();
    }, [user, item.id, item.tmdbMediaType]);

    const saveCurrentProgress = useCallback(async () => {
        if (!user || lastTimestampRef.current <= 0) return;

        try {
            const path = item.tmdbMediaType === 'tv' 
                ? `users/${user.uid}/nowWatching/tv_${item.id}/episodes/s${selectedSeason}e${selectedEpisode}`
                : `users/${user.uid}/nowWatching/movie_${item.id}`;

            await setDocument(path, {
                timestamp: lastTimestampRef.current,
                duration: lastDurationRef.current,
                lastWatchedAt: serverTimestamp(),
            }, { merge: true } as any);
        } catch (error) {
            console.error('[useVideoPlayerProgress] Save error:', error);
        }
    }, [user, item.id, item.tmdbMediaType, selectedSeason, selectedEpisode]);

    // Handle player messages
    const handlePlayerMessage = async (data: any) => {
        if (data?.type === 'PLAYER_EVENT' && user) {
            const eventData = { ...data.data, lastServer: server };
            await handlePlayerEvent(user.uid, { type: 'PLAYER_EVENT', data: eventData } as PlayerEvent);

            if (data.data.currentTime !== undefined && data.data.duration) {
                const ts = Math.floor(data.data.currentTime);
                const dur = Math.floor(data.data.duration);
                const progress = (ts / dur) * 100;

                setLastTimestamp(ts);
                setLastDuration(dur);
                lastTimestampRef.current = ts;
                lastDurationRef.current = dur;

                if (item.tmdbMediaType === 'tv' && progress >= 90) {
                    await swapToNextEpisode(user.uid, item.id);
                }

                await saveCurrentProgress();
            }
        }
    };

    return {
        initialLoadDone,
        initialResumeTime,
        lastTimestamp,
        handlePlayerMessage,
        saveCurrentProgress,
    };
};
