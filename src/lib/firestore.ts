// src/lib/firestore.ts

import { db } from '@/lib/firebase/client';
import { collection, doc, getDocs, getDoc, setDoc, deleteDoc, updateDoc, writeBatch } from "firebase/firestore";
import { ManagedWatchedItem, WatchlistItem, Challenge, RelevantRadarItem, TMDbRadarItem } from '@/types';

// --- COLEÇÃO PRINCIPAL (ASSISTIDOS) ---

export const getWatchedItems = async (userId: string): Promise<ManagedWatchedItem[]> => {
    const querySnapshot = await getDocs(collection(db, 'users', userId, 'watchedItems'));
    const items: ManagedWatchedItem[] = [];
    querySnapshot.forEach((doc) => {
        items.push(doc.data() as ManagedWatchedItem);
    });
    return items;
};

export const addWatchedItem = async (userId: string, itemData: ManagedWatchedItem): Promise<void> => {
    const itemDocRef = doc(db, 'users', userId, 'watchedItems', itemData.id.toString());
    await setDoc(itemDocRef, itemData);
};

export const removeWatchedItem = async (userId: string, id: number): Promise<void> => {
    const itemDocRef = doc(db, 'users', userId, 'watchedItems', id.toString());
    await deleteDoc(itemDocRef);
};

export const updateWatchedItem = async (userId: string, id: number, updatedData: Partial<ManagedWatchedItem>): Promise<void> => {
    const itemDocRef = doc(db, 'users', userId, 'watchedItems', id.toString());
    await updateDoc(itemDocRef, updatedData);
};


// --- COLEÇÃO DA WATCHLIST ---

export const getWatchlistItems = async (userId: string): Promise<WatchlistItem[]> => {
    const querySnapshot = await getDocs(collection(db, 'users', userId, 'watchlist'));
    const items: WatchlistItem[] = [];
    querySnapshot.forEach((doc) => {
        items.push(doc.data() as WatchlistItem);
    });
    return items;
};

export const addToWatchlist = async (userId: string, itemData: WatchlistItem): Promise<void> => {
    const itemDocRef = doc(db, 'users', userId, 'watchlist', itemData.id.toString());
    await setDoc(itemDocRef, itemData);
};

export const removeFromWatchlist = async (userId: string, id: number): Promise<void> => {
    const itemDocRef = doc(db, 'users', userId, 'watchlist', id.toString());
    await deleteDoc(itemDocRef);
};

export const updateWatchlistItem = async (userId: string, id: number, dataToUpdate: Partial<WatchlistItem>): Promise<void> => {
    const itemDocRef = doc(db, 'users', userId, 'watchlist', id.toString());
    await updateDoc(itemDocRef, dataToUpdate);
};


// --- COLEÇÕES DO RADAR DE LANÇAMENTOS (PÚBLICAS) ---

export const getTMDbRadarCache = async (): Promise<TMDbRadarItem[]> => {
    const querySnapshot = await getDocs(collection(db, 'radarCache'));
    return querySnapshot.docs.map(doc => doc.data() as TMDbRadarItem);
};

export const setTMDbRadarCache = async (releases: TMDbRadarItem[]): Promise<void> => {
    const cacheCollection = collection(db, 'radarCache');
    const batch = writeBatch(db);
    const oldDocsSnapshot = await getDocs(cacheCollection);
    oldDocsSnapshot.forEach(document => { batch.delete(document.ref); });
    releases.forEach(release => {
        const uniqueId = `${release.listType}_${release.providerId || ''}_${release.id}`;
        const newDocRef = doc(cacheCollection, uniqueId);
        batch.set(newDocRef, release);
    });
    await batch.commit();
};

// Função para ler da coleção public (cache com 1 hora de duração)
export const getPublicCachedItems = async (cacheType: 'trending' | 'now-playing' | 'upcoming' | 'on-the-air'): Promise<TMDbRadarItem[]> => {
    const docRef = doc(db, 'public', cacheType);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
        return [];
    }

    const data = docSnap.data();
    return data.items || [];
};

// Funções para a lista relevante (PÚBLICA)
export const getRelevantReleases = async (): Promise<RelevantRadarItem[]> => {
    const querySnapshot = await getDocs(collection(db, 'relevantReleases'));
    return querySnapshot.docs.map(doc => doc.data() as RelevantRadarItem);
};

export const setRelevantReleases = async (releases: RelevantRadarItem[]): Promise<void> => {
    const releasesCollection = collection(db, 'relevantReleases');
    const batch = writeBatch(db);
    const oldDocsSnapshot = await getDocs(releasesCollection);
    oldDocsSnapshot.forEach(document => { batch.delete(document.ref); });
    releases.forEach(release => {
        const newDocRef = doc(releasesCollection, release.id.toString());
        batch.set(newDocRef, release);
    });
    await batch.commit();
};

// --- COLEÇÃO DOS DESAFIOS ---

export const getChallengesHistory = async (userId: string): Promise<Challenge[]> => {
    const querySnapshot = await getDocs(collection(db, 'users', userId, 'challenges'));
    return querySnapshot.docs.map(doc => doc.data() as Challenge);
};

// --- COLEÇÃO DOS RELEVANTES DA SEMANA ---
export const getWeeklyRelevants = async (userId: string) => {
    const querySnapshot = await getDocs(collection(db, 'users', userId, 'weeklyRelevants'));
    return querySnapshot.docs.map(doc => doc.data());
};

export const setWeeklyRelevants = async (userId: string, items: any[]): Promise<void> => {
    const weeklyCollection = collection(db, 'users', userId, 'weeklyRelevants');
    const batch = writeBatch(db);
    const oldDocsSnapshot = await getDocs(weeklyCollection);
    oldDocsSnapshot.forEach(document => { batch.delete(document.ref); });
    items.forEach((item, index) => {
        const newDocRef = doc(weeklyCollection, index.toString());
        batch.set(newDocRef, item);
    });
    await batch.commit();
};

// --- VIDEO PROGRESS TRACKING ---

export const getVideoProgress = async (userId: string, progressKey: string): Promise<any | null> => {
    const progressDoc = doc(db, 'users', userId, 'videoProgress', progressKey);
    const docSnap = await getDocs(collection(db, 'users', userId, 'videoProgress'));
    const found = docSnap.docs.find(d => d.id === progressKey);
    return found ? found.data() : null;
};

export const saveVideoProgress = async (userId: string, progressKey: string, data: any): Promise<void> => {
    const progressDoc = doc(db, 'users', userId, 'videoProgress', progressKey);
    await setDoc(progressDoc, data);
};

export const getUserVideoProgress = async (userId: string): Promise<any[]> => {
    const querySnapshot = await getDocs(collection(db, 'users', userId, 'videoProgress'));
    return querySnapshot.docs.map(doc => doc.data());
};

export const clearVideoProgress = async (userId: string, progressKey: string): Promise<void> => {
    const progressDoc = doc(db, 'users', userId, 'videoProgress', progressKey);
    await deleteDoc(progressDoc);
};
