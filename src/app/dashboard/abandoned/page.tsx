"use client";

import React, { useState, useEffect } from 'react';
import { collection, getDocs, doc, deleteDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase/client';
import { useAuth } from '@/contexts/AuthContext';
import DashboardHeader from '@/components/shared/DashboardHeader';
import Image from 'next/image';
import { XCircle, RotateCcw, Trash2 } from 'lucide-react';
import { resumeDropped, removeDropped } from '@/lib/droppedService';

interface DroppedItem {
    id: number;
    mediaType: 'movie' | 'tv';
    title: string;
    posterUrl: string;
    droppedAt: any;
    droppedReason: 'manual' | 'auto';
}

export default function DroppedPage() {
    const { user } = useAuth();
    const [droppedItems, setDroppedItems] = useState<DroppedItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (!user) {
            setIsLoading(false);
            return;
        }

        loadDroppedItems();
    }, [user]);

    const loadDroppedItems = async () => {
        if (!user) return;

        try {
            const droppedRef = collection(db, 'users', user.uid, 'dropped');
            const snapshot = await getDocs(droppedRef);

            const items: DroppedItem[] = [];
            snapshot.forEach((doc) => {
                items.push(doc.data() as DroppedItem);
            });

            setDroppedItems(items);
        } catch (error) {
            console.error('[DroppedPage] Erro ao carregar:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleResume = async (item: DroppedItem) => {
        if (!user) return;

        try {
            await resumeDropped(user.uid, item);
            // Recarregar lista
            await loadDroppedItems();
        } catch (error) {
            console.error('Erro:', error);
            alert('Erro ao retomar título');
        }
    };

    const handleRemove = async (item: DroppedItem) => {
        if (!user) return;

        const confirm = window.confirm(`Remover "${item.title}" permanentemente da lista de abandonados?`);
        if (!confirm) return;

        try {
            await removeDropped(user.uid, item.id, item.mediaType);
            // Recarregar lista
            await loadDroppedItems();
        } catch (error) {
            console.error('Erro:', error);
            alert('Erro ao remover título');
        }
    };

    if (!user) {
        return (
            <div className="min-h-screen bg-gradient-to-b from-black via-gray-900 to-black text-white">
                <DashboardHeader />
                <div className="container mx-auto px-4 py-20 text-center">
                    <p className="text-xl text-gray-400">Faça login para ver seus títulos abandonados.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-b from-black via-gray-900 to-black text-white">
            <DashboardHeader />

            <div className="container mx-auto px-4 py-8">
                <div className="mb-8">
                    <h1 className="text-4xl font-black text-white mb-2 flex items-center gap-3">
                        <XCircle className="w-10 h-10 text-red-400" />
                        Abandonados
                    </h1>
                    <p className="text-gray-400">Títulos que você começou mas parou de assistir</p>
                </div>

                {isLoading ? (
                    <div className="flex justify-center py-20">
                        <div className="w-16 h-16 border-t-4 border-purple-500 border-solid rounded-full animate-spin"></div>
                    </div>
                ) : droppedItems.length === 0 ? (
                    <div className="text-center py-20">
                        <XCircle className="w-20 h-20 text-gray-600 mx-auto mb-4" />
                        <p className="text-xl text-gray-400">Nenhum título abandonado</p>
                        <p className="text-sm text-gray-500 mt-2">
                            Quando você abandonar um título, ele aparecerá aqui.
                        </p>
                    </div>
                ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
                        {droppedItems.map((item) => (
                            <div key={`${item.mediaType}_${item.id}`} className="group relative">
                                {/* Poster */}
                                <div className="relative aspect-[2/3] rounded-lg overflow-hidden bg-gray-800 mb-3">
                                    <Image
                                        src={item.posterUrl || '/poster-placeholder.png'}
                                        alt={item.title}
                                        fill
                                        className="object-cover"
                                        unoptimized
                                    />

                                    {/* Overlay com ações */}
                                    <div className="absolute inset-0 bg-black/80 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col items-center justify-center gap-3 p-4">
                                        {/* Retomar */}
                                        <button
                                            onClick={() => handleResume(item)}
                                            className="w-full bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded-lg font-semibold flex items-center justify-center gap-2 transition-colors"
                                        >
                                            <RotateCcw className="w-4 h-4" />
                                            Retomar
                                        </button>

                                        {/* Remover */}
                                        <button
                                            onClick={() => handleRemove(item)}
                                            className="w-full bg-red-600/20 hover:bg-red-600 text-red-400 hover:text-white py-2 px-4 rounded-lg font-semibold flex items-center justify-center gap-2 transition-colors"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                            Remover
                                        </button>
                                    </div>

                                    {/* Badge de motivo */}
                                    <div className="absolute top-2 right-2">
                                        {item.droppedReason === 'auto' ? (
                                            <span className="bg-orange-500/90 text-white text-xs px-2 py-1 rounded">
                                                Auto
                                            </span>
                                        ) : (
                                            <span className="bg-red-500/90 text-white text-xs px-2 py-1 rounded">
                                                Manual
                                            </span>
                                        )}
                                    </div>
                                </div>

                                {/* Título */}
                                <h3 className="text-sm font-semibold text-white line-clamp-2 mb-1">
                                    {item.title}
                                </h3>
                                <p className="text-xs text-gray-500">
                                    {item.mediaType === 'movie' ? 'Filme' : 'Série'}
                                </p>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
