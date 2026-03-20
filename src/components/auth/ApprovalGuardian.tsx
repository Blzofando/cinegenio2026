"use client";

import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/Button';
import { Clock, LogOut } from 'lucide-react';

interface ApprovalGuardianProps {
    children: React.ReactNode;
}

const ApprovalGuardian: React.FC<ApprovalGuardianProps> = ({ children }) => {
    const { user, userProfile, loading, signOut } = useAuth();

    // Se estiver carregando, mostra o loader global
    if (loading) {
        return (
            <div className="fixed inset-0 bg-gray-900 flex flex-col items-center justify-center z-[9999]">
                <div className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mb-4"></div>
                <p className="text-gray-400 animate-pulse">Autenticando...</p>
            </div>
        );
    }

    // Se não houver usuário logado, permite renderizar (as páginas de login/cadastro lidarão com o estado)
    if (!user) {
        return <>{children}</>;
    }

    // Se houver usuário mas o perfil não estiver aprovado
    if (userProfile && !userProfile.isApproved) {
        return (
            <div className="fixed inset-0 bg-gray-900 flex items-center justify-center p-4 z-[9999]">
                <div className="max-w-md w-full bg-gray-800 rounded-2xl p-8 border border-white/10 shadow-2xl text-center space-y-6">
                    <div className="w-20 h-20 bg-purple-500/20 rounded-full flex items-center justify-center mx-auto mb-2">
                        <Clock className="w-10 h-10 text-purple-500 animate-pulse" />
                    </div>
                    
                    <div className="space-y-2">
                        <h1 className="text-2xl font-bold text-white">Aguardando Aprovação</h1>
                        <p className="text-gray-400">
                            Olá, <span className="text-purple-400 font-medium">{userProfile.name}</span>! Sua conta foi criada com sucesso, mas o acesso ao conteúdo requer aprovação manual do administrador.
                        </p>
                    </div>

                    <div className="bg-black/30 rounded-xl p-4 text-sm text-gray-400 text-left">
                        <p className="flex items-start gap-2">
                            <span className="text-purple-500 font-bold">•</span>
                            Sua solicitação já foi enviada para análise.
                        </p>
                        <p className="flex items-start gap-2 mt-2">
                            <span className="text-purple-500 font-bold">•</span>
                            Você receberá um e-mail assim que seu acesso for liberado.
                        </p>
                    </div>

                    <Button 
                        variant="ghost" 
                        onClick={() => signOut()}
                        className="w-full flex items-center justify-center gap-2 text-gray-400 hover:text-white hover:bg-white/5 transition-all"
                    >
                        <LogOut className="w-4 h-4" />
                        Sair da conta
                    </Button>
                </div>
            </div>
        );
    }

    // Se estiver aprovado ou sem perfil (carregando perfil ainda), renderiza o conteúdo
    // Nota: Se userProfile for null mas loading for false, pode ser uma inconsistência ou carregamento inicial.
    // O ideal é manter o loader até ter o userProfile se houver user.
    if (user && !userProfile) {
        return (
            <div className="fixed inset-0 bg-gray-900 flex flex-col items-center justify-center z-[9999]">
                <div className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mb-4"></div>
                <p className="text-gray-400">Carregando perfil...</p>
            </div>
        );
    }

    return <>{children}</>;
};

export default ApprovalGuardian;
