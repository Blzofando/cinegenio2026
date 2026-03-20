"use client";

import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import UserAvatar from './UserAvatar';

export default function UserMenu() {
    const { user, signOut } = useAuth();
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

    if (!user) return null;

    const displayName = user.displayName || user.email?.split('@')[0] || 'Usuário';

    return (
        <div className="relative">
            <Button
                variant="glass"
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center gap-2 px-3 py-2 border border-white/10"
            >
                <UserAvatar displayName={displayName} photoURL={user.photoURL} size="md" />
                <span className="text-white text-sm hidden md:block">{displayName}</span>
                <svg
                    className={`w-4 h-4 text-white transition-transform ${isOpen ? 'rotate-180' : 'rotate-0'}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
            </Button>

            {isOpen && (
                <>
                    <div
                        className="fixed inset-0 z-10"
                        onClick={() => setIsOpen(false)}
                    />
                    <div className="absolute right-0 mt-2 w-56 rounded-lg bg-gray-800/95 backdrop-blur-sm border border-white/10 shadow-xl z-20">
                        <div className="p-4 border-b border-white/10">
                            <p className="text-white font-medium">{displayName}</p>
                            <p className="text-gray-400 text-sm">{user.email}</p>
                        </div>
                         <Button
                            variant="ghost"
                            justify="start"
                            onClick={handleSignOut}
                            className="w-full text-red-400 hover:bg-white/5 transition-colors flex items-center gap-2 rounded-none px-4 py-3"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                            </svg>
                            Sair
                        </Button>
                    </div>
                </>
            )}
        </div>
    );
}
