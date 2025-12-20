"use client";

import { useAuth } from '@/contexts/AuthContext';
import SettingsHub from './SettingsHub';

interface ProfileHeaderProps {
    variant?: 'desktop' | 'mobile';
}

export default function ProfileHeader({ variant = 'desktop' }: ProfileHeaderProps) {
    const { user } = useAuth();

    if (!user) return null;

    const displayName = user.displayName || user.email?.split('@')[0] || 'Usuário';
    const initials = displayName.slice(0, 2).toUpperCase();

    return (
        <div className={`
            relative rounded-2xl bg-gradient-to-br from-purple-500/10 via-pink-500/10 to-purple-600/10 
            border border-white/10 backdrop-blur-sm overflow-hidden
            ${variant === 'mobile' ? 'p-6' : 'p-8'}
        `}>
            {/* Background decoration */}
            <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-pink-500/5" />

            {/* Settings Button - positioned differently for desktop/mobile */}
            <div className={`
                absolute z-10
                ${variant === 'mobile' ? 'top-4 right-4' : 'top-6 right-6'}
            `}>
                <SettingsHub variant={variant} />
            </div>

            <div className="relative z-10 flex items-center gap-6">
                {/* Avatar */}
                <div className={`
                    rounded-full bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center 
                    text-white font-bold shadow-lg
                    ${variant === 'mobile' ? 'w-20 h-20 text-2xl' : 'w-24 h-24 text-3xl'}
                `}>
                    {initials}
                </div>

                {/* User Info */}
                <div className="flex-1">
                    <h1 className={`
                        font-bold text-white
                        ${variant === 'mobile' ? 'text-2xl' : 'text-3xl'}
                    `}>
                        {displayName}
                    </h1>
                    <p className={`
                        text-gray-400
                        ${variant === 'mobile' ? 'text-sm mt-1' : 'text-base mt-2'}
                    `}>
                        {user.email}
                    </p>
                </div>
            </div>
        </div>
    );
}
