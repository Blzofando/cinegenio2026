// src/contexts/WatchedDataContext.tsx

"use client";

import React, { createContext, useState, useEffect, useCallback, useContext } from 'react';
import { collection, onSnapshot } from "firebase/firestore";
import { db } from '@/lib/firebase/client';
import { AllManagedWatchedData, Rating, ManagedWatchedItem, TMDbSearchResult, MediaType } from '@/types';
import { addWatchedItem, removeWatchedItem, updateWatchedItem } from '@/lib/firestore';
import { WatchlistContext } from './WatchlistContext';
import { getTMDbDetails, getProviders } from '@/lib/tmdb';
import { useAuth } from './AuthContext';

const initialData: AllManagedWatchedData = {
    amei: [], gostei: [], meh: [], naoGostei: []
};

interface IWatchedDataContext {
    data: AllManagedWatchedData;
    loading: boolean;
    addItem: (item: TMDbSearchResult | null, rating: Rating) => Promise<void>;
    removeItem: (id: number) => Promise<void>;
    updateItem: (item: ManagedWatchedItem) => Promise<void>;
}

export const WatchedDataContext = createContext<IWatchedDataContext>({
    data: initialData,
    loading: false,
    addItem: async () => { },
    removeItem: async () => { },
    updateItem: async () => { },
});

export const WatchedDataProvider = ({ children }: { children: React.ReactNode }) => {
    const [data, setData] = useState<AllManagedWatchedData>(initialData);
    const [loading, setLoading] = useState(true);
    const { removeFromWatchlist } = useContext(WatchlistContext);
    const { user } = useAuth();

    useEffect(() => {
        if (!user) {
            setData(initialData);
            setLoading(false);
            return;
        }

        setLoading(true);
        const collectionRef = collection(db, 'users', user.uid, 'watchedItems');
        const unsubscribe = onSnapshot(collectionRef, (querySnapshot) => {
            const items: ManagedWatchedItem[] = [];
            querySnapshot.forEach((doc) => {
                items.push(doc.data() as ManagedWatchedItem);
            });
            const groupedData = items.reduce((acc, item) => {
                const rating = item.rating || 'meh';
                acc[rating].push(item);
                return acc;
            }, { amei: [], gostei: [], meh: [], naoGostei: [] } as AllManagedWatchedData);

            Object.keys(groupedData).forEach(key => {
                const ratingKey = key as Rating;
                groupedData[ratingKey].sort((a, b) => b.createdAt - a.createdAt);
            });

            setData(groupedData);
            setLoading(false);

        }, (err) => {
            console.error("Erro ao buscar dados do Firestore: ", err);
            setLoading(false);
        });
        return () => unsubscribe();
    }, [user]);

    const addItem = useCallback(async (item: TMDbSearchResult | null, rating: Rating) => {
        if (!user) {
            throw new Error("Usuário não está autenticado");
        }

        setLoading(true);
        try {
            if (!item || !item.id) {
                throw new Error("Nenhum item válido foi selecionado para adicionar.");
            }

            const details = await getTMDbDetails(item.id, item.media_type as 'movie' | 'tv');

            let mediaType: MediaType = 'Filme';
            let titleWithYear = '';

            if (item.media_type === 'tv') {
                const isAnime = details.original_language === 'ja' && details.genres.some((g: { id: number; name: string }) => g.id === 16);
                mediaType = isAnime ? 'Anime' : 'Série';
                titleWithYear = `${details.name} (${details.first_air_date ? new Date(details.first_air_date).getFullYear() : 'N/A'})`;
            } else {
                mediaType = 'Filme';
                titleWithYear = `${details.title} (${details.release_date ? new Date(details.release_date).getFullYear() : 'N/A'})`;
            }

            const providers = getProviders(details);

            const newItem: ManagedWatchedItem = {
                id: details.id,
                tmdbMediaType: item.media_type as 'movie' | 'tv',
                title: titleWithYear,
                type: mediaType,
                genre: details.genres[0]?.name || 'Desconhecido',
                synopsis: details.overview || 'Sinopse não disponível.',
                posterUrl: details.poster_path ? `https://image.tmdb.org/t/p/w500${details.poster_path}` : undefined,
                voteAverage: details.vote_average ? parseFloat(details.vote_average.toFixed(1)) : 0,
                watchProviders: {
                    link: providers?.link || '',
                    flatrate: providers?.flatrate || [],
                },
                rating,
                createdAt: Date.now(),
            };

            await addWatchedItem(user.uid, newItem);
            removeFromWatchlist(newItem.id);

        } catch (e) {
            console.error("Erro ao adicionar item:", e);
            throw new Error(e instanceof Error ? e.message : "Falha ao buscar informações do título.");
        } finally {
            setLoading(false);
        }
    }, [removeFromWatchlist, user]);

    const removeItem = useCallback(async (id: number) => {
        if (!user) return;
        try {
            await removeWatchedItem(user.uid, id);
        } catch (error) {
            console.error("Falha ao remover item:", error);
        }
    }, [user]);

    const updateItem = useCallback(async (updatedItem: ManagedWatchedItem) => {
        if (!user) return;
        try {
            const { id, ...dataToUpdate } = updatedItem;
            await updateWatchedItem(user.uid, id, dataToUpdate);
        } catch (error) {
            console.error("Falha ao atualizar item:", error);
        }
    }, [user]);

    return (
        <WatchedDataContext.Provider value={{ data, loading, addItem, removeItem, updateItem }}>
            {children}
        </WatchedDataContext.Provider>
    );
};
