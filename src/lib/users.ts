// src/lib/users.ts

import { UserProfile } from '@/types';
import { getDocument, setDocument, updateDocument } from './firebase/core';

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
        isApproved: false, // Regra de segurança: Aprovação manual necessária
        preferences: {
            notifications: true,
        },
    };

    await setDocument(`users/${uid}`, userProfile);
};

/**
 * Busca o perfil de um usuário
 */
export const getUserProfile = async (uid: string): Promise<UserProfile | null> => {
    return await getDocument<UserProfile>(`users/${uid}`);
};

/**
 * Atualiza o perfil de um usuário
 */
export const updateUserProfile = async (
    uid: string,
    data: Partial<UserProfile>
): Promise<void> => {
    await updateDocument(`users/${uid}`, data);
};
