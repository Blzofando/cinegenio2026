"use client";

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import UserMenu from '@/components/ui/UserMenu';
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
                    {/* Interface Antiga Button (Desktop only) */}
                    <Link
                        href="/dashboard/classic"
                        className="hidden xl:block px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-full text-xs font-semibold transition-all duration-200 hover:scale-105"
                    >
                        Interface Antiga
                    </Link>

                    {/* Search Bar */}
                    <SearchBar />

                    {/* User Menu */}
                    <UserMenu />
                </div>
            </div>
        </div>
    );
}
