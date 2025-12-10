"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
    const { user, loading } = useAuth();
    const router = useRouter();
    const [isChecking, setIsChecking] = useState(true);

    useEffect(() => {
        if (!loading) {
            if (!user) {
                router.push('/login');
            } else {
                setIsChecking(false);
            }
        }
    }, [user, loading, router]);

    // Mostrar loading enquanto verifica autenticação
    if (loading || isChecking) {
        return (
            <div className="min-h-screen w-full flex items-center justify-center bg-gradient-to-br from-purple-900 via-black to-pink-900">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-purple-400 mx-auto mb-4"></div>
                    <p className="text-gray-300">Carregando...</p>
                </div>
            </div>
        );
    }

    // Se não está autenticado, não renderiza nada (já está redirecionando)
    if (!user) {
        return null;
    }

    // Se autenticado, renderiza o conteúdo
    return <>{children}</>;
}
