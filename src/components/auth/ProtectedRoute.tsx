"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/Button';
import { LogOut, Clock, ShieldAlert } from 'lucide-react';

export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
    const { user, userProfile, loading, signOut } = useAuth();
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
                    <p className="text-gray-300 font-medium">Autenticando...</p>
                </div>
            </div>
        );
    }

    // Se não está autenticado, não renderiza nada (já está redirecionando)
    if (!user) {
        return null;
    }

    // Trava de aprovação manual (Regra Global)
    if (userProfile && !userProfile.isApproved) {
        return (
            <div className="min-h-screen w-full flex items-center justify-center bg-gray-950 p-6">
                <div className="max-w-md w-full bg-gray-900 border border-gray-800 rounded-2xl p-8 shadow-2xl text-center relative overflow-hidden">
                    {/* Background Glow */}
                    <div className="absolute -top-24 -left-24 w-48 h-48 bg-purple-600/20 blur-[80px]"></div>
                    <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-pink-600/20 blur-[80px]"></div>

                    <div className="relative z-10">
                        <div className="w-20 h-20 bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-6 border border-gray-700 shadow-inner">
                            <Clock className="w-10 h-10 text-purple-400 animate-pulse" />
                        </div>
                        
                        <h1 className="text-2xl font-bold text-white mb-2">Acesso Pendente</h1>
                        <p className="text-gray-400 mb-8 leading-relaxed">
                            Olá, <span className="text-purple-400 font-semibold">{userProfile.name}</span>! Sua conta foi criada com sucesso, mas por questões de segurança, um administrador precisa aprová-la manualmente.
                        </p>

                        <div className="flex flex-col gap-3">
                            <div className="p-4 bg-gray-800/50 rounded-xl border border-gray-700/50 text-sm text-gray-400 mb-4 flex items-center gap-3 text-left">
                                <ShieldAlert className="w-5 h-5 text-yellow-500 shrink-0" />
                                <span>Você será notificado assim que seu acesso for liberado.</span>
                            </div>

                            <Button 
                                variant="secondary" 
                                className="w-full"
                                onClick={() => window.location.reload()}
                            >
                                Verificar novamente
                            </Button>
                            
                            <Button 
                                variant="ghost" 
                                className="w-full text-red-400 hover:text-red-300 hover:bg-red-400/10"
                                onClick={() => signOut()}
                            >
                                <LogOut className="w-4 h-4 mr-2" />
                                Sair da conta
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // Se autenticado e aprovado, renderiza o conteúdo
    return <>{children}</>;
}
