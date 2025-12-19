"use client";

import React from 'react';
import { useRouter } from 'next/navigation';
import { ChevronLeft } from 'lucide-react';
import DashboardHeader from '@/components/shared/DashboardHeader';
import MobileBottomNav from '@/components/shared/MobileBottomNav';
import ComingSoonSection from '@/components/shared/ComingSoonSection';

export default function ComingSoonMoviesPage() {
    const router = useRouter();

    return (
        <div className="min-h-screen bg-gradient-to-b from-black via-gray-900 to-black text-white pb-16 md:pb-0">
            <DashboardHeader />
            <MobileBottomNav />

            <div className="container mx-auto px-4 py-8">
                {/* Back button */}
                <button
                    onClick={() => router.back()}
                    className="flex items-center gap-2 text-gray-400 hover:text-white mb-4 transition-colors"
                >
                    <ChevronLeft className="w-5 h-5" />
                    Voltar
                </button>

                {/* Title */}
                <h1 className="text-4xl font-black text-white mb-8">
                    Filmes Em Breve
                </h1>

                <ComingSoonSection type="movie" />
            </div>
        </div>
    );
}
