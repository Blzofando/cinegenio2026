"use client";

import React, { useState, useRef, useEffect } from 'react';
import { MoreVertical, Eye, Check, RotateCcw, List } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { markAsWatching, restartItem } from '@/lib/watchedService';
import RatingModal from './RatingModal';
import EpisodeSelector from './EpisodeSelector';

interface StatusButtonProps {
    item: {
        id: number;
        mediaType: 'movie' | 'tv';
        title: string;
        posterUrl: string;
    };
    onStatusChange?: () => void;
    className?: string;
}

const StatusButton: React.FC<StatusButtonProps> = ({ item, onStatusChange, className = '' }) => {
    const { user } = useAuth();
    const [isOpen, setIsOpen] = useState(false);
    const [showRatingModal, setShowRatingModal] = useState(false);
    const [showEpisodeSelector, setShowEpisodeSelector] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isOpen]);

    const handleWatching = async () => {
        if (!user) return;

        try {
            await markAsWatching(user.uid, item);
            console.log('✅ Marcado como assistindo');
            setIsOpen(false);
            onStatusChange?.();
        } catch (error) {
            console.error('Erro:', error);
            alert('Erro ao marcar como assistindo');
        }
    };

    const handleWatched = () => {
        setIsOpen(false);
        setShowRatingModal(true);
    };

    const handleRestart = async () => {
        if (!user) return;

        const confirm = window.confirm(`Recomeçar "${item.title}"?`);
        if (!confirm) return;

        try {
            await restartItem(user.uid, item.id, item.mediaType);
            console.log('✅ Item reiniciado');
            setIsOpen(false);
            onStatusChange?.();
        } catch (error) {
            console.error('Erro:', error);
            alert('Erro ao reiniciar');
        }
    };

    const handleSelectEpisode = () => {
        setIsOpen(false);
        setShowEpisodeSelector(true);
    };

    const handleEpisodeSelect = (season: number, episode: number) => {
        console.log(`Episódio selecionado: S${season}E${episode}`);
        setShowEpisodeSelector(false);
        // Aqui você pode adicionar lógica para abrir o player
    };

    return (
        <>
            <div ref={dropdownRef} className={`relative ${className}`}>
                {/* Button */}
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        setIsOpen(!isOpen);
                    }}
                    className="p-2 bg-black/40 hover:bg-black/60 backdrop-blur-sm border border-gray-700 hover:border-gray-500 rounded-lg transition-all group"
                    title="Ações"
                >
                    <MoreVertical className="w-5 h-5 text-gray-300 group-hover:text-white transition-colors" />
                </button>

                {/* Dropdown Menu */}
                {isOpen && (
                    <div className="absolute top-full right-0 mt-2 w-56 bg-gray-900 border border-gray-700 rounded-xl shadow-2xl overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                        {/* Watching */}
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                handleWatching();
                            }}
                            className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-800 transition-colors text-left"
                        >
                            <Eye className="w-5 h-5 text-blue-400" />
                            <div>
                                <div className="font-semibold text-white">Assistindo</div>
                                <div className="text-xs text-gray-400">Controle manual (0min)</div>
                            </div>
                        </button>

                        {/* Watched */}
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                handleWatched();
                            }}
                            className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-800 transition-colors text-left border-t border-gray-800"
                        >
                            <Check className="w-5 h-5 text-green-400" />
                            <div>
                                <div className="font-semibold text-white">Watched</div>
                                <div className="text-xs text-gray-400">Marcar como assistido</div>
                            </div>
                        </button>

                        {/* Restart */}
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                handleRestart();
                            }}
                            className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-800 transition-colors text-left border-t border-gray-800"
                        >
                            <RotateCcw className="w-5 h-5 text-orange-400" />
                            <div>
                                <div className="font-semibold text-white">Recomeçar</div>
                                <div className="text-xs text-gray-400">Resetar progresso</div>
                            </div>
                        </button>

                        {/* Select Episode (TV only) */}
                        {item.mediaType === 'tv' && (
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    handleSelectEpisode();
                                }}
                                className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-800 transition-colors text-left border-t border-gray-800"
                            >
                                <List className="w-5 h-5 text-purple-400" />
                                <div>
                                    <div className="font-semibold text-white">Episódios</div>
                                    <div className="text-xs text-gray-400">Selecionar episódio</div>
                                </div>
                            </button>
                        )}
                    </div>
                )}
            </div>

            {/* Rating Modal */}
            {showRatingModal && (
                <RatingModal
                    item={item}
                    onClose={() => setShowRatingModal(false)}
                    onSuccess={onStatusChange}
                />
            )}

            {/* Episode Selector Modal (TV only) */}
            {showEpisodeSelector && item.mediaType === 'tv' && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
                    <div className="relative w-full max-w-4xl bg-gray-900 rounded-2xl overflow-hidden">
                        <EpisodeSelector
                            showId={item.id}
                            onSelect={handleEpisodeSelect}
                            onClose={() => setShowEpisodeSelector(false)}
                        />
                    </div>
                </div>
            )}
        </>
    );
};

export default StatusButton;
