"use client";

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import SearchBar from './SearchBar';
import { Button } from '@/components/ui/Button';
import UserAvatar from '@/components/ui/UserAvatar';
import { useAuth } from '@/contexts/AuthContext';
import CineGenioIcon from '@/components/ui/CineGenioIcon';

export default function DashboardHeader() {
    const pathname = usePathname();
    const { user } = useAuth();

    const isActive = (path: string) => pathname === path;

    return (
        <div className="hidden md:block fixed top-0 left-0 right-0 z-50">
            {/* Fundo preto 75% sólido do topo até a linha vermelha (~20%), depois fade até a amarela (100%) */}
            <div className="absolute inset-0 bg-[linear-gradient(to_bottom,rgba(0,0,0,0.75)_0%,rgba(0,0,0,0.75)_20%,transparent_100%)] pointer-events-none" />
            
            {/* Desfoque sólido do topo até a linha roxa (~40%), depois fade de desfoque até a amarela (100%) */}
            <div className="absolute inset-0 backdrop-blur-md [mask-image:linear-gradient(to_bottom,black_0%,black_40%,transparent_100%)] pointer-events-none" />

            <div className="relative px-4 md:px-6 lg:px-8 xl:px-12 pt-4 pb-16 flex items-center justify-between gap-4">
                {/* Logo + Navigation */}
                <div className="flex items-center gap-8 lg:gap-12">
                    <Link
                        href="/dashboard"
                        className="flex items-center gap-2 group transition-all"
                    >
                        <CineGenioIcon size={32} className="group-hover:scale-110 transition-transform duration-300" />
                        <span className="text-2xl md:text-3xl font-black bg-gradient-to-r from-white via-white to-gray-400 bg-clip-text text-transparent tracking-tighter">
                            CINEGÊNIO
                        </span>
                    </Link>

                    {/* Desktop Navigation */}
                    <nav className="flex gap-8">
                        <Link
                            href="/dashboard"
                            className={`text-xs font-bold tracking-widest transition-all duration-200 ${isActive('/dashboard')
                                ? 'text-white'
                                : 'text-gray-400 hover:text-white'
                                }`}
                        >
                            PÁGINA INICIAL
                        </Link>
                        <Link
                            href="/movies"
                            className={`text-xs font-bold tracking-widest transition-all duration-200 ${isActive('/movies')
                                ? 'text-white'
                                : 'text-gray-400 hover:text-white'
                                }`}
                        >
                            FILMES
                        </Link>
                        <Link
                            href="/tv"
                            className={`text-xs font-bold tracking-widest transition-all duration-200 ${isActive('/tv')
                                ? 'text-white'
                                : 'text-gray-400 hover:text-white'
                                }`}
                        >
                            SÉRIES
                        </Link>
                        <Link
                            href="/ai"
                            className={`text-xs font-bold tracking-widest transition-all duration-200 ${isActive('/ai')
                                ? 'text-purple-400 font-extrabold'
                                : 'text-purple-400/70 hover:text-purple-300'
                                }`}
                        >
                            AGENTE IA
                        </Link>
                    </nav>
                </div>

                {/* Right Side - Search + User */}
                <div className="flex items-center gap-4">
                    {/* Search Bar */}
                    <SearchBar />

                    {/* Profile Link */}
                    <Link href="/dashboard/profile" className="hidden md:block">
                        <Button
                            variant="ghost"
                            className="bg-white/10 hover:bg-white/20 border border-white/10 rounded-full h-10 gap-3 py-0 pl-1 pr-4 transition-all duration-300 hover:scale-105"
                        >
                            <UserAvatar 
                                displayName={user?.displayName} 
                                photoURL={user?.photoURL} 
                                size="sm" 
                            />
                            <span className="text-white text-sm font-bold tracking-tight">
                                {user?.displayName?.split(' ')[0] || 'Minha Conta'}
                            </span>
                        </Button>
                    </Link>
                </div>
            </div>
        </div>
    );
}
