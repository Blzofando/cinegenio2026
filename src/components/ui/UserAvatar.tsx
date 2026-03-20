"use client";

import React from 'react';
import { cn } from '@/lib/utils';

interface UserAvatarProps {
    displayName?: string | null;
    photoURL?: string | null;
    size?: 'sm' | 'md' | 'lg';
    className?: string;
}

const UserAvatar: React.FC<UserAvatarProps> = ({ 
    displayName, 
    photoURL, 
    size = 'md',
    className 
}) => {
    const initials = displayName
        ? displayName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
        : 'U';

    const sizeClasses = {
        sm: 'w-6 h-6 text-[10px]',
        md: 'w-8 h-8 text-sm',
        lg: 'w-10 h-10 text-base',
    };

    return (
        <div className={cn(
            "rounded-full bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center text-white font-bold shrink-0 shadow-lg border border-white/10",
            sizeClasses[size],
            className
        )}>
            {photoURL ? (
                <img 
                    src={photoURL} 
                    alt={displayName || 'User'} 
                    className="w-full h-full rounded-full object-cover"
                />
            ) : (
                <span>{initials}</span>
            )}
        </div>
    );
};

export default UserAvatar;
