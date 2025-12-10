"use client";

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import UserMenu from '@/components/ui/UserMenu';

export default function DashboardHeader() {
    const pathname = usePathname();

    const isActive = (path: string) => pathname === path;

    return (
        <div className="sticky top-0 z-50 bg-black/80 backdrop-blur-md border-b border-white/10">
            <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
                <div className="flex items-center gap-8">
                    <Link href="/dashboard" className="text-2xl font-black bg-gradient-to-r from-purple-500 to-pink-500 bg-clip-text text-transparent">
                        CINEGÊNIO
                    </Link>

                    <nav className="hidden md:flex gap-6">
                        <Link
                            href="/dashboard"
                            className={`text-sm font-bold transition-colors ${isActive('/dashboard') ? 'text-white' : 'text-gray-400 hover:text-white'}`}
                        >
                            PÁGINA INICIAL
                        </Link>
                        <Link
                            href="/movies"
                            className={`text-sm font-bold transition-colors ${isActive('/movies') ? 'text-white' : 'text-gray-400 hover:text-white'}`}
                        >
                            FILMES
                        </Link>
                        <Link
                            href="/tv"
                            className={`text-sm font-bold transition-colors ${isActive('/tv') ? 'text-white' : 'text-gray-400 hover:text-white'}`}
                        >
                            SÉRIES
                        </Link>
                    </nav>
                </div>

                <div className="flex items-center gap-4">
                    <Link
                        href="/dashboard/classic"
                        className="hidden md:block px-4 py-1.5 bg-white/10 hover:bg-white/20 border border-white/10 rounded-full text-xs font-medium transition-all"
                    >
                        Interface Antiga
                    </Link>
                    <UserMenu />
                </div>
            </div>
        </div>
    );
}
