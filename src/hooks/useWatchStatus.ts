import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { db } from '@/lib/firebase/client';
import { collection, getDocs, doc, getDoc, onSnapshot } from 'firebase/firestore';

export type WatchStatus = 'new' | 'resume' | 'rewatch' | 'dropped';

export function useWatchStatus(itemId: number, mediaType: 'movie' | 'tv'): WatchStatus {
    const { user } = useAuth();
    const [watchStatus, setWatchStatus] = useState<WatchStatus>('new');

    useEffect(() => {
        if (!user) {
            setWatchStatus('new');
            return;
        }

        let isMounted = true;
        let isDropped = false;
        let nowWatchingData: any = null;

        const droppedDocId = `${mediaType}_${itemId}`;
        const nowWatchingDocId = mediaType === 'movie' ? `movie_${itemId}` : `tv_${itemId}`;

        const droppedRef = doc(db, 'users', user.uid, 'dropped', droppedDocId);
        const nowWatchingRef = doc(db, 'users', user.uid, 'nowWatching', nowWatchingDocId);

        const updateStatus = () => {
            if (!isMounted) return;

            if (isDropped) {
                setWatchStatus('dropped');
                return;
            }

            if (nowWatchingData) {
                if (mediaType === 'movie' && nowWatchingData.timestamp && nowWatchingData.duration) {
                    const progress = (nowWatchingData.timestamp / nowWatchingData.duration) * 100;

                    if (progress >= 95) {
                        setWatchStatus('rewatch');
                    } else if (progress > 0) {
                        setWatchStatus('resume');
                    } else {
                        setWatchStatus('new');
                    }
                } else if (mediaType === 'tv') {
                    // For series, if it exists in nowWatching, user has started watching
                    setWatchStatus('resume');
                } else {
                    setWatchStatus('new');
                }
            } else {
                setWatchStatus('new');
            }
        };

        // Listener for DROPPED collection
        const unsubDropped = onSnapshot(droppedRef, (snap) => {
            isDropped = snap.exists();
            updateStatus();
        });

        // Listener for NOW WATCHING collection
        const unsubNowWatching = onSnapshot(nowWatchingRef, (snap) => {
            nowWatchingData = snap.exists() ? snap.data() : null;
            updateStatus();
        });

        return () => {
            isMounted = false;
            unsubDropped();
            unsubNowWatching();
        };
    }, [user, itemId, mediaType]);

    return watchStatus;
}
