"use client";

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Sparkles } from 'lucide-react';
import SearchBar from './SearchBar';

export default function DashboardHeader() {
    const pathname = usePathname();

    const isActive = (path: string) => pathname === path;

    return (
        <div className="hidden md:block sticky top-0 z-50 bg-black/90 backdrop-blur-xl" style={{ boxShadow: '0 20px 60px rgba(0, 0, 0, 0.8)' }}>
            <div className="max-w-[1920px] mx-auto px-4 md:px-6 lg:px-8 py-4 flex items-center justify-between gap-4">
                {/* Logo */}
                <div className="flex items-center gap-6 md:gap-8">
                    <Link
                        href="/dashboard"
                        className="text-2xl md:text-3xl font-black bg-gradient-to-r from-purple-500 via-pink-500 to-purple-600 bg-clip-text text-transparent hover:scale-105 transition-transform"
                    >
                        CINEGÊNIO
                    </Link>

                    {/* Desktop Navigation - Hidden on mobile */}
                    <nav className="hidden lg:flex gap-6">
                        <Link
                            href="/dashboard"
                            className={`text-sm font-bold transition-all duration-200 ${isActive('/dashboard')
                                ? 'text-white'
                                : 'text-gray-400 hover:text-white'
                                }`}
                        >
                            PÁGINA INICIAL
                        </Link>
                        <Link
                            href="/movies"
                            className={`text-sm font-bold transition-all duration-200 ${isActive('/movies')
                                ? 'text-white'
                                : 'text-gray-400 hover:text-white'
                                }`}
                        >
                            FILMES
                        </Link>
                        <Link
                            href="/tv"
                            className={`text-sm font-bold transition-all duration-200 ${isActive('/tv')
                                ? 'text-white'
                                : 'text-gray-400 hover:text-white'
                                }`}
                        >
                            SÉRIES
                        </Link>
                    </nav>
                </div>

                {/* Right Side - Search + User (User hidden on mobile) */}
                <div className="flex items-center gap-3 md:gap-4">
                    {/* Agente IA Button (Desktop only) */}
                    <Link
                        href="/ai"
                        className="hidden xl:flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-500/10 to-blue-500/10 hover:from-purple-500/20 hover:to-blue-500/20 border border-purple-500/30 rounded-full text-xs font-semibold text-purple-300 transition-all duration-200 hover:scale-105"
                    >
                        <Sparkles className="w-4 h-4" />
                        Agente IA
                    </Link>

                    {/* Search Bar */}
                    <SearchBar />

                    {/* Profile Link - Desktop */}
                    <Link
                        href="/dashboard/profile"
                        className="hidden md:flex items-center gap-2 px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 transition-all border border-white/10"
                    >
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center">
                            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                            </svg>
                        </div>
                        <span className="text-white text-sm font-medium">Meu Perfil</span>
                    </Link>
                </div>
            </div>
        </div>
    );
}
