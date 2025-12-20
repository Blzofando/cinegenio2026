"use client";

import ProfileHeader from '@/components/profile/ProfileHeader';
import DashboardHeader from '@/components/shared/DashboardHeader';
import MobileBottomNav from '@/components/shared/MobileBottomNav';
import { Film, Tv, Clock, Star, TrendingUp, Award } from 'lucide-react';

export default function ProfilePage() {
    return (
        <div className="min-h-screen bg-black pb-20 md:pb-8">
            <DashboardHeader />
            <MobileBottomNav />
            <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8 py-6 md:py-8">
                {/* Profile Header - Responsive */}
                <div className="mb-8">
                    <div className="hidden md:block">
                        <ProfileHeader variant="desktop" />
                    </div>
                    <div className="md:hidden">
                        <ProfileHeader variant="mobile" />
                    </div>
                </div>

                {/* Placeholder Content */}
                <div className="space-y-6">
                    {/* Stats Cards - Placeholder */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <StatsCard
                            icon={Film}
                            label="Filmes Assistidos"
                            value="Em breve"
                            gradient="from-blue-500/10 to-cyan-500/10"
                        />
                        <StatsCard
                            icon={Tv}
                            label="Séries Assistidas"
                            value="Em breve"
                            gradient="from-purple-500/10 to-pink-500/10"
                        />
                        <StatsCard
                            icon={Clock}
                            label="Tempo Total"
                            value="Em breve"
                            gradient="from-orange-500/10 to-red-500/10"
                        />
                        <StatsCard
                            icon={Star}
                            label="Avaliações"
                            value="Em breve"
                            gradient="from-yellow-500/10 to-amber-500/10"
                        />
                    </div>

                    {/* Activity Section - Placeholder */}
                    <div className="rounded-2xl bg-white/5 border border-white/10 p-6 md:p-8">
                        <div className="flex items-center gap-3 mb-6">
                            <TrendingUp className="w-6 h-6 text-purple-400" />
                            <h2 className="text-xl md:text-2xl font-bold text-white">
                                Atividade Recente
                            </h2>
                        </div>
                        <div className="text-center py-12">
                            <Award className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                            <p className="text-gray-400">
                                Suas atividades aparecerão aqui em breve
                            </p>
                        </div>
                    </div>

                    {/* Favorites Section - Placeholder */}
                    <div className="rounded-2xl bg-white/5 border border-white/10 p-6 md:p-8">
                        <div className="flex items-center gap-3 mb-6">
                            <Star className="w-6 h-6 text-yellow-400" />
                            <h2 className="text-xl md:text-2xl font-bold text-white">
                                Meus Favoritos
                            </h2>
                        </div>
                        <div className="text-center py-12">
                            <Star className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                            <p className="text-gray-400">
                                Seus conteúdos favoritos aparecerão aqui
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

interface StatsCardProps {
    icon: React.ElementType;
    label: string;
    value: string;
    gradient: string;
}

function StatsCard({ icon: Icon, label, value, gradient }: StatsCardProps) {
    return (
        <div className={`rounded-xl bg-gradient-to-br ${gradient} border border-white/10 p-4 md:p-6`}>
            <Icon className="w-8 h-8 md:w-10 md:h-10 text-white/80 mb-3" />
            <p className="text-xs md:text-sm text-gray-400 mb-1">{label}</p>
            <p className="text-lg md:text-2xl font-bold text-white">{value}</p>
        </div>
    );
}
