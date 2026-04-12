/**
 * useProfileData
 * Agrega dados de perfil do Firebase:
 *  - watchlist : users/{uid}/watchlist  (tempo real via onSnapshot)
 *  - watched   : users/{uid}/ratings/amei|gostei|meh|nao_gostei (one-shot)
 */

'use client';

import { useState, useEffect } from 'react';
import { collection, onSnapshot, getDoc, doc } from 'firebase/firestore';
import { db } from '@/lib/firebase/client';
import { WatchlistItem } from '@/types';
import type { RatingType } from '@/lib/watchedService';

export interface WatchedProfileItem {
  id: number;
  title: string;
  posterUrl: string;
  tmdbMediaType: 'movie' | 'tv';
  rating: RatingType;
  watchedAt: string;
}

interface ProfileData {
  watchlist: WatchlistItem[];
  watched: WatchedProfileItem[];
  loadingWatchlist: boolean;
  loadingWatched: boolean;
}

const ALL_RATINGS: RatingType[] = ['amei', 'gostei', 'meh', 'nao_gostei'];

export function useProfileData(userId: string | null | undefined): ProfileData {
  const [watchlist, setWatchlist]           = useState<WatchlistItem[]>([]);
  const [watched, setWatched]               = useState<WatchedProfileItem[]>([]);
  const [loadingWatchlist, setLoadingWatchlist] = useState(true);
  const [loadingWatched, setLoadingWatched]     = useState(true);

  // ---------- Watchlist: tempo real ----------
  useEffect(() => {
    if (!userId) {
      setWatchlist([]);
      setLoadingWatchlist(false);
      return;
    }
    const ref = collection(db, 'users', userId, 'watchlist');
    const unsub = onSnapshot(ref, (snap) => {
      const items: WatchlistItem[] = [];
      snap.forEach((d) => items.push(d.data() as WatchlistItem));
      setWatchlist(items.sort((a, b) => b.addedAt - a.addedAt));
      setLoadingWatchlist(false);
    });
    return () => unsub();
  }, [userId]);

  // ---------- Assistidos: one-shot ----------
  useEffect(() => {
    if (!userId) {
      setWatched([]);
      setLoadingWatched(false);
      return;
    }

    const fetchWatched = async () => {
      try {
        // Busca os 4 docs de rating em paralelo
        const snaps = await Promise.all(
          ALL_RATINGS.map((r) => getDoc(doc(db, 'users', userId, 'ratings', r)))
        );

        const result: WatchedProfileItem[] = [];
        const seen = new Set<string>();

        snaps.forEach((snap, i) => {
          if (!snap.exists()) return;
          const rating = ALL_RATINGS[i];
          const data = snap.data() as Record<string, any>;

          Object.entries(data).forEach(([key, entry]) => {
            // Ignora chaves de temporada específica (ex: tv_123_S2) para não duplicar
            if (key.match(/_S\d+$/)) return;

            const uid = `${entry.tmdbMediaType}_${entry.id}`;
            if (seen.has(uid)) return;
            seen.add(uid);

            result.push({
              id: entry.id,
              title: entry.title,
              posterUrl: entry.posterUrl || '',
              tmdbMediaType: entry.tmdbMediaType,
              rating,
              watchedAt: entry.watchedAt || '',
            });
          });
        });

        // Mais recente primeiro
        result.sort(
          (a, b) =>
            new Date(b.watchedAt).getTime() - new Date(a.watchedAt).getTime()
        );

        setWatched(result);
      } catch (err) {
        console.error('[useProfileData] Erro ao buscar assistidos:', err);
      } finally {
        setLoadingWatched(false);
      }
    };

    fetchWatched();
  }, [userId]);

  return { watchlist, watched, loadingWatchlist, loadingWatched };
}
