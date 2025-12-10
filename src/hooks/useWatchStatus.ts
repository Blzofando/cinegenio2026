import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { db } from '@/lib/firebase/client';
import { collection, getDocs } from 'firebase/firestore';

export type WatchStatus = 'new' | 'resume' | 'rewatch';

export function useWatchStatus(itemId: number, mediaType: 'movie' | 'tv'): WatchStatus {
    const { user } = useAuth();
    const [watchStatus, setWatchStatus] = useState<WatchStatus>('new');

    useEffect(() => {
        const checkWatchStatus = async () => {
            if (!user) {
                setWatchStatus('new');
                return;
            }

            try {
                const nowWatchingRef = collection(db, 'users', user.uid, 'nowWatching');
                const snapshot = await getDocs(nowWatchingRef);

                const docId = mediaType === 'movie'
                    ? `movie_${itemId}`
                    : `tv_${itemId}`;

                const matchingDoc = snapshot.docs.find(doc => doc.id === docId);

                if (matchingDoc) {
                    const data = matchingDoc.data();

                    if (mediaType === 'movie' && data.timestamp && data.duration) {
                        const progress = (data.timestamp / data.duration) * 100;

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
                    }
                } else {
                    setWatchStatus('new');
                }
            } catch (error) {
                console.error('[useWatchStatus] Error:', error);
                setWatchStatus('new');
            }
        };

        checkWatchStatus();
    }, [user, itemId, mediaType]);

    return watchStatus;
}
