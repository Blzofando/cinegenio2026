"use client";

import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { Settings, LogOut, User, Lock } from 'lucide-react';
import { Button } from '@/components/ui/Button';

interface SettingsHubProps {
    variant?: 'desktop' | 'mobile';
}

export default function SettingsHub({ variant = 'desktop' }: SettingsHubProps) {
    const { signOut } = useAuth();
    const [isOpen, setIsOpen] = useState(false);
    const router = useRouter();

    const handleSignOut = async () => {
        try {
            await signOut();
            router.push('/login');
        } catch (error) {
            console.error('Erro ao fazer logout:', error);
        }
    };

    return (
        <div className="relative">
            <Button
                variant="ghost"
                onClick={() => setIsOpen(!isOpen)}
                className={`
                    flex items-center justify-center gap-2 transition-all p-0 h-auto
                    ${variant === 'mobile'
                        ? 'p-3 rounded-full bg-white/5 hover:bg-white/10 border border-white/10'
                        : 'px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 border border-white/10'
                    }
                `}
                aria-label="Configurações"
            >
                <Settings className={variant === 'mobile' ? 'w-5 h-5' : 'w-4 h-4'} />
                {variant === 'desktop' && (
                    <span className="text-sm font-medium">Configurações</span>
                )}
            </Button>

            {isOpen && (
                <>
                    <div
                        className="fixed inset-0 z-40"
                        onClick={() => setIsOpen(false)}
                    />
                    <div className={`
                        absolute z-50 rounded-lg bg-gray-800/95 backdrop-blur-sm border border-white/10 shadow-xl
                        ${variant === 'mobile' ? 'right-0 top-full mt-2 w-64' : 'right-0 top-full mt-2 w-72'}
                    `}>
                        <div className="p-2 space-y-1">
                            {/* Account Settings - Placeholder */}
                            <Button
                                variant="ghost"
                                onClick={() => {
                                    setIsOpen(false);
                                    // TODO: Navigate to account settings
                                }}
                                className="w-full justify-start px-4 py-3 text-white hover:bg-white/5 transition-colors flex items-center gap-3 rounded-lg h-auto"
                            >
                                <User className="w-5 h-5 text-gray-400" />
                                <div className="text-left">
                                    <p className="text-sm font-medium">Configurações da Conta</p>
                                    <p className="text-xs text-gray-400">Em breve</p>
                                </div>
                            </Button>

                            {/* Privacy Settings - Placeholder */}
                            <Button
                                variant="ghost"
                                onClick={() => {
                                    setIsOpen(false);
                                    // TODO: Navigate to privacy settings
                                }}
                                className="w-full justify-start px-4 py-3 text-white hover:bg-white/5 transition-colors flex items-center gap-3 rounded-lg h-auto"
                            >
                                <Lock className="w-5 h-5 text-gray-400" />
                                <div className="text-left">
                                    <p className="text-sm font-medium">Privacidade e Segurança</p>
                                    <p className="text-xs text-gray-400">Em breve</p>
                                </div>
                            </Button>

                            <div className="h-px bg-white/10 my-2" />

                            {/* Logout */}
                            <Button
                                variant="ghost"
                                onClick={handleSignOut}
                                className="w-full justify-start px-4 py-3 text-red-400 hover:bg-red-500/10 transition-colors flex items-center gap-3 rounded-lg h-auto"
                            >
                                <LogOut className="w-5 h-5" />
                                <span className="text-sm font-medium">Sair</span>
                            </Button>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}
