import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { db } from '@/lib/firebase/client';
import { collection, getDocs, doc, getDoc, onSnapshot } from 'firebase/firestore';

import { checkWatchedStatus } from '@/lib/watchedService';

export type WatchStatus = 'new' | 'resume' | 'rewatch' | 'dropped' | 'watched';

export function useWatchStatus(itemId: number, mediaType: 'movie' | 'tv'): WatchStatus {
    const { user } = useAuth();
    const [watchStatus, setWatchStatus] = useState<WatchStatus>('new');

    useEffect(() => {
        setWatchStatus('new'); // Reset status immediately on ID change

        if (!user) {
            return;
        }

        let isMounted = true;
        let isDropped = false;
        let nowWatchingData: any = null;
        let watchedRating: string | null = null; // Track if item is in any rating doc

        const droppedDocId = `${mediaType}_${itemId}`;
        const nowWatchingDocId = mediaType === 'movie' ? `movie_${itemId}` : `tv_${itemId}`;
        const baseKey = `${mediaType}_${itemId}`;

        const droppedRef = doc(db, 'users', user.uid, 'dropped', droppedDocId);
        const nowWatchingRef = doc(db, 'users', user.uid, 'nowWatching', nowWatchingDocId);

        const updateStatus = () => {
            if (!isMounted) return;

            // Priority: dropped > watched > resume/rewatch > new
            if (isDropped) {
                setWatchStatus('dropped');
                return;
            }

            if (watchedRating) {
                setWatchStatus('watched');
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

        // ✅ REAL-TIME LISTENERS for RATINGS (all 4 docs)
        const ratingTypes = ['amei', 'gostei', 'meh', 'nao_gostei'];
        const ratingsRefs = ratingTypes.map(rating =>
            doc(db, 'users', user.uid, 'ratings', rating)
        );

        const unsubRatings = ratingsRefs.map(ref =>
            onSnapshot(ref, (snap) => {
                if (snap.exists()) {
                    const data = snap.data();
                    // Check if this item is in this rating doc (as baseKey or baseKey_S*)
                    const hasItem = Object.keys(data).some(key =>
                        key === baseKey || key.startsWith(`${baseKey}_S`)
                    );

                    if (hasItem) {
                        watchedRating = snap.id;
                        updateStatus();
                        return;
                    }
                }

                // If this was the doc that had the item before, clear it
                if (watchedRating === snap.id) {
                    watchedRating = null;
                    updateStatus();
                }
            })
        );

        return () => {
            isMounted = false;
            unsubDropped();
            unsubNowWatching();
            unsubRatings.forEach(unsub => unsub());
        };
    }, [user, itemId, mediaType]);

    return watchStatus;
}
