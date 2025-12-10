// src/lib/users.ts

import { doc, setDoc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase/client';

export interface UserProfile {
    uid: string;
    name: string;
    username: string;
    email: string;
    createdAt: number;
    photoURL?: string;
    preferences?: {
        favoriteGenres?: string[];
        notifications?: boolean;
    };
}

/**
 * Cria um perfil de usuário no Firestore
 */
export const createUserProfile = async (
    uid: string,
    name: string,
    username: string,
    email: string
): Promise<void> => {
    const userProfile: UserProfile = {
        uid,
        name,
        username,
        email,
        createdAt: Date.now(),
        preferences: {
            notifications: true,
        },
    };

    const userDocRef = doc(db, 'users', uid);
    await setDoc(userDocRef, userProfile);
};

/**
 * Busca o perfil de um usuário
 */
export const getUserProfile = async (uid: string): Promise<UserProfile | null> => {
    const userDocRef = doc(db, 'users', uid);
    const userDoc = await getDoc(userDocRef);

    if (userDoc.exists()) {
        return userDoc.data() as UserProfile;
    }

    return null;
};

/**
 * Atualiza o perfil de um usuário
 */
export const updateUserProfile = async (
    uid: string,
    data: Partial<UserProfile>
): Promise<void> => {
    const userDocRef = doc(db, 'users', uid);
    await updateDoc(userDocRef, data);
};
