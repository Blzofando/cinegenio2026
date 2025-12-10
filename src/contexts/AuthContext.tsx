// src/contexts/AuthContext.tsx

"use client";

import React, { createContext, useContext, useState, useEffect } from 'react';
import {
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signOut as firebaseSignOut,
    onAuthStateChanged,
    User,
    sendEmailVerification,
    updateProfile
} from 'firebase/auth';
import { auth } from '@/lib/firebase/client';
import { createUserProfile } from '@/lib/users';

interface AuthContextType {
    user: User | null;
    loading: boolean;
    error: string | null;
    signUp: (email: string, password: string, name: string, username: string) => Promise<void>;
    signIn: (email: string, password: string) => Promise<void>;
    signOut: () => Promise<void>;
    clearError: () => void;
}

const AuthContext = createContext<AuthContextType>({
    user: null,
    loading: true,
    error: null,
    signUp: async () => { },
    signIn: async () => { },
    signOut: async () => { },
    clearError: () => { },
});

export const useAuth = () => useContext(AuthContext);

// Validação de senha forte
export const validatePassword = (password: string): { valid: boolean; errors: string[] } => {
    const errors: string[] = [];

    if (password.length < 8) {
        errors.push('Mínimo 8 caracteres');
    }
    if (!/[A-Z]/.test(password)) {
        errors.push('Pelo menos 1 letra maiúscula');
    }
    if (!/[a-z]/.test(password)) {
        errors.push('Pelo menos 1 letra minúscula');
    }
    if (!/[0-9]/.test(password)) {
        errors.push('Pelo menos 1 número');
    }
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
        errors.push('Pelo menos 1 caractere especial');
    }

    return {
        valid: errors.length === 0,
        errors
    };
};

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            setUser(user);
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    const signUp = async (email: string, password: string, name: string, username: string) => {
        try {
            setError(null);
            setLoading(true);

            // Validar senha
            const passwordValidation = validatePassword(password);
            if (!passwordValidation.valid) {
                throw new Error(passwordValidation.errors.join(', '));
            }

            // Criar usuário no Firebase Auth
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);

            // Atualizar perfil com nome
            await updateProfile(userCredential.user, {
                displayName: name,
            });

            // Criar perfil no Firestore
            await createUserProfile(userCredential.user.uid, name, username, email);

            // Enviar email de verificação
            await sendEmailVerification(userCredential.user);

            setUser(userCredential.user);
        } catch (err: any) {
            console.error('Erro no cadastro:', err);

            // Traduzir erros do Firebase para português
            let errorMessage = 'Erro ao criar conta. Tente novamente.';
            if (err.code === 'auth/email-already-in-use') {
                errorMessage = 'Este email já está em uso.';
            } else if (err.code === 'auth/invalid-email') {
                errorMessage = 'Email inválido.';
            } else if (err.code === 'auth/weak-password') {
                errorMessage = 'Senha muito fraca.';
            } else if (err.message) {
                errorMessage = err.message;
            }

            setError(errorMessage);
            throw new Error(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    const signIn = async (email: string, password: string) => {
        try {
            setError(null);
            setLoading(true);

            const userCredential = await signInWithEmailAndPassword(auth, email, password);
            setUser(userCredential.user);
        } catch (err: any) {
            console.error('Erro no login:', err);

            let errorMessage = 'Erro ao fazer login. Tente novamente.';
            if (err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password') {
                errorMessage = 'Email ou senha incorretos.';
            } else if (err.code === 'auth/invalid-email') {
                errorMessage = 'Email inválido.';
            } else if (err.code === 'auth/user-disabled') {
                errorMessage = 'Esta conta foi desabilitada.';
            } else if (err.code === 'auth/invalid-credential') {
                errorMessage = 'Credenciais inválidas. Verifique seu email e senha.';
            }

            setError(errorMessage);
            throw new Error(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    const signOut = async () => {
        try {
            setError(null);
            await firebaseSignOut(auth);
            setUser(null);
        } catch (err: any) {
            console.error('Erro ao fazer logout:', err);
            setError('Erro ao fazer logout.');
            throw err;
        }
    };

    const clearError = () => setError(null);

    const value = {
        user,
        loading,
        error,
        signUp,
        signIn,
        signOut,
        clearError,
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
