// src/lib/firestore.ts

import { db } from '@/lib/firebase/client';
import { collection, doc, writeBatch } from "firebase/firestore";
import { ManagedWatchedItem, WatchlistItem, Challenge, RelevantRadarItem, TMDbRadarItem } from '@/types';
import { getDocument, setDocument, updateDocument, deleteDocument, getDocuments } from './firebase/core';

// --- COLEÇÃO PRINCIPAL (ASSISTIDOS) ---

export const getWatchedItems = async (userId: string): Promise<ManagedWatchedItem[]> => {
    return await getDocuments<ManagedWatchedItem>(`users/${userId}/watchedItems`);
};

export const addWatchedItem = async (userId: string, itemData: ManagedWatchedItem): Promise<void> => {
    await setDocument(`users/${userId}/watchedItems/${itemData.id}`, itemData);
};

export const removeWatchedItem = async (userId: string, id: number): Promise<void> => {
    await deleteDocument(`users/${userId}/watchedItems/${id}`);
};

export const updateWatchedItem = async (userId: string, id: number, updatedData: Partial<ManagedWatchedItem>): Promise<void> => {
    await updateDocument(`users/${userId}/watchedItems/${id}`, updatedData);
};


// --- COLEÇÃO DA WATCHLIST ---

export const getWatchlistItems = async (userId: string): Promise<WatchlistItem[]> => {
    return await getDocuments<WatchlistItem>(`users/${userId}/watchlist`);
};

export const addToWatchlist = async (userId: string, itemData: WatchlistItem): Promise<void> => {
    await setDocument(`users/${userId}/watchlist/${itemData.id}`, itemData);
};

export const removeFromWatchlist = async (userId: string, id: number): Promise<void> => {
    await deleteDocument(`users/${userId}/watchlist/${id}`);
};

export const updateWatchlistItem = async (userId: string, id: number, dataToUpdate: Partial<WatchlistItem>): Promise<void> => {
    await updateDocument(`users/${userId}/watchlist/${id}`, dataToUpdate);
};


// --- COLEÇÕES DO RADAR DE LANÇAMENTOS (PÚBLICAS) ---

export const getTMDbRadarCache = async (): Promise<TMDbRadarItem[]> => {
    return await getDocuments<TMDbRadarItem>('radarCache');
};

export const setTMDbRadarCache = async (releases: TMDbRadarItem[]): Promise<void> => {
    const cacheCollection = collection(db, 'radarCache');
    const batch = writeBatch(db);
    
    // Buscar itens atuais para deletar manualmente (batch deletes não suportam collections inteiras)
    const currentItems = await getDocuments<TMDbRadarItem>('radarCache');
    currentItems.forEach(item => {
        const uniqueId = (item as any).id_unique || `${item.listType}_${item.providerId || ''}_${item.id}`;
        batch.delete(doc(cacheCollection, uniqueId));
    });

    releases.forEach(release => {
        const uniqueId = `${release.listType}_${release.providerId || ''}_${release.id}`;
        const newDocRef = doc(cacheCollection, uniqueId);
        batch.set(newDocRef, release);
    });
    await batch.commit();
};

export const getPublicCachedItems = async (cacheType: 'trending' | 'now-playing' | 'upcoming' | 'on-the-air'): Promise<TMDbRadarItem[]> => {
    const data = await getDocument<{ items: TMDbRadarItem[] }>(`public/${cacheType}`);
    return data?.items || [];
};

// Funções para a lista relevante (PÚBLICA)
export const getRelevantReleases = async (): Promise<RelevantRadarItem[]> => {
    return await getDocuments<RelevantRadarItem>('relevantReleases');
};

export const setRelevantReleases = async (releases: RelevantRadarItem[]): Promise<void> => {
    const releasesCollection = collection(db, 'relevantReleases');
    const batch = writeBatch(db);
    
    const currentItems = await getDocuments<RelevantRadarItem>('relevantReleases');
    currentItems.forEach(item => {
        batch.delete(doc(releasesCollection, item.id.toString()));
    });

    releases.forEach(release => {
        const newDocRef = doc(releasesCollection, release.id.toString());
        batch.set(newDocRef, release);
    });
    await batch.commit();
};

// --- COLEÇÃO DOS DESAFIOS ---

export const getChallengesHistory = async (userId: string): Promise<Challenge[]> => {
    return await getDocuments<Challenge>(`users/${userId}/challenges`);
};

// --- COLEÇÃO DOS RELEVANTES DA SEMANA ---
export const getWeeklyRelevants = async (userId: string) => {
    return await getDocuments(`users/${userId}/weeklyRelevants`);
};

export const setWeeklyRelevants = async (userId: string, items: any[]): Promise<void> => {
    const weeklyCollection = collection(db, 'users', userId, 'weeklyRelevants');
    const batch = writeBatch(db);
    
    const currentItems = await getDocuments(`users/${userId}/weeklyRelevants`);
    currentItems.forEach((_, index) => {
        batch.delete(doc(weeklyCollection, index.toString()));
    });

    items.forEach((item, index) => {
        const newDocRef = doc(weeklyCollection, index.toString());
        batch.set(newDocRef, item);
    });
    await batch.commit();
};

// --- VIDEO PROGRESS TRACKING ---

export const getVideoProgress = async (userId: string, progressKey: string): Promise<any | null> => {
    return await getDocument(`users/${userId}/videoProgress/${progressKey}`);
};

export const saveVideoProgress = async (userId: string, progressKey: string, data: any): Promise<void> => {
    await setDocument(`users/${userId}/videoProgress/${progressKey}`, data);
};

export const clearVideoProgress = async (userId: string, progressKey: string): Promise<void> => {
    await deleteDocument(`users/${userId}/videoProgress/${progressKey}`);
};

export const getUserVideoProgress = async (userId: string): Promise<any[]> => {
    return await getDocuments(`users/${userId}/videoProgress`);
};
