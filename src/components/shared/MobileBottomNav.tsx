"use client";

import React, { useState } from 'react';
import { Home, Film, Tv, Search, User } from 'lucide-react';
import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import SearchBar from './SearchBar';
import UserMenu from '../ui/UserMenu';

const MobileBottomNav: React.FC = () => {
    const pathname = usePathname();
    const router = useRouter();
    const [showSearchModal, setShowSearchModal] = useState(false);
    const [showProfileMenu, setShowProfileMenu] = useState(false);

    const isActive = (path: string) => {
        if (path === '/dashboard') return pathname === path;
        if (path === '/movies') return pathname.startsWith('/movie');
        if (path === '/tv') return pathname.startsWith('/tv');
        return false;
    };

    const navItems = [
        { icon: Home, label: 'Início', path: '/dashboard' },
        { icon: Film, label: 'Filmes', path: '/movies' },
        { icon: Tv, label: 'Séries', path: '/tv' },
    ];

    return (
        <>
            {/* Mobile Bottom Navigation - Only visible on mobile */}
            <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-black/95 backdrop-blur-xl border-t border-white/10 safe-area-bottom">
                <div className="flex justify-around items-center h-16 px-2">
                    {/* Navigation Links */}
                    {navItems.map((item) => {
                        const Icon = item.icon;
                        const active = isActive(item.path);

                        return (
                            <Link
                                key={item.path}
                                href={item.path}
                                className={`flex flex-col items-center justify-center gap-1 px-3 py-2 rounded-lg transition-all ${active
                                    ? 'text-purple-500'
                                    : 'text-gray-400 hover:text-white'
                                    }`}
                            >
                                <Icon className={`w-6 h-6 ${active ? 'stroke-[2.5]' : 'stroke-2'}`} />
                                <span className="text-[10px] font-medium">{item.label}</span>
                            </Link>
                        );
                    })}

                    {/* Search Button */}
                    <button
                        onClick={() => setShowSearchModal(true)}
                        className="flex flex-col items-center justify-center gap-1 px-3 py-2 rounded-lg transition-all text-gray-400 hover:text-white"
                    >
                        <Search className="w-6 h-6 stroke-2" />
                        <span className="text-[10px] font-medium">Buscar</span>
                    </button>

                    {/* Profile Button */}
                    <button
                        onClick={() => setShowProfileMenu(!showProfileMenu)}
                        className="flex flex-col items-center justify-center gap-1 px-3 py-2 rounded-lg transition-all text-gray-400 hover:text-white relative"
                    >
                        <User className="w-6 h-6 stroke-2" />
                        <span className="text-[10px] font-medium">Perfil</span>
                    </button>
                </div>
            </nav>

            {/* Search Modal Overlay */}
            {showSearchModal && (
                <div className="md:hidden fixed inset-0 z-[60] bg-black/80 backdrop-blur-sm">
                    <div className="absolute top-0 left-0 right-0 p-4 bg-black/95 backdrop-blur-xl border-b border-white/10">
                        <div className="flex items-center gap-3">
                            <button
                                onClick={() => setShowSearchModal(false)}
                                className="text-gray-400 hover:text-white"
                            >
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                            <div className="flex-1">
                                <SearchBar />
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Profile Dropdown */}
            {showProfileMenu && (
                <>
                    <div
                        className="md:hidden fixed inset-0 z-[55]"
                        onClick={() => setShowProfileMenu(false)}
                    />
                    <div className="md:hidden fixed bottom-16 right-2 z-[60]">
                        <UserMenu />
                    </div>
                </>
            )}
        </>
    );
};

export default MobileBottomNav;
