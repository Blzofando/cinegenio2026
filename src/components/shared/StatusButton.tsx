"use client";

import React, { useState, useRef, useEffect } from 'react';
import { MoreVertical, Eye, Check, RotateCcw, List } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { markAsWatching, restartItem } from '@/lib/watchedService';
import RatingModal from './RatingModal';
import EpisodeSelector from './EpisodeSelector';
import { Button } from '@/components/ui/Button';

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
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={(e: React.MouseEvent) => {
                        e.stopPropagation();
                        setIsOpen(!isOpen);
                    }}
                    className="p-2 bg-black/40 hover:bg-black/60 backdrop-blur-sm border border-gray-700 hover:border-gray-500 rounded-lg transition-all group h-auto"
                    title="Ações"
                >
                    <MoreVertical className="w-5 h-5 text-gray-300 group-hover:text-white transition-colors" />
                </Button>

                {/* Dropdown Menu */}
                {isOpen && (
                    <div className="absolute top-full right-0 mt-2 w-56 bg-gray-900 border border-gray-700 rounded-xl shadow-2xl overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                        {/* Watching */}
                         <Button
                            variant="ghost"
                            justify="start"
                            onClick={(e: React.MouseEvent) => {
                                e.stopPropagation();
                                handleWatching();
                            }}
                            className="w-full gap-3 px-4 py-3 hover:bg-gray-800 transition-colors h-auto rounded-none"
                        >
                            <Eye className="w-5 h-5 text-blue-400 whitespace-nowrap" />
                            <div className="flex-1 min-w-0">
                                <div className="font-semibold text-white truncate">Assistindo</div>
                                <div className="text-xs text-gray-400 truncate">Controle manual (0min)</div>
                            </div>
                        </Button>

                        {/* Watched */}
                         <Button
                            variant="ghost"
                            justify="start"
                            onClick={(e: React.MouseEvent) => {
                                e.stopPropagation();
                                handleWatched();
                            }}
                            className="w-full gap-3 px-4 py-3 hover:bg-gray-800 transition-colors border-t border-gray-800 h-auto rounded-none"
                        >
                            <Check className="w-5 h-5 text-green-400 whitespace-nowrap" />
                            <div className="flex-1 min-w-0">
                                <div className="font-semibold text-white truncate">Watched</div>
                                <div className="text-xs text-gray-400 truncate">Marcar como assistido</div>
                            </div>
                        </Button>

                        {/* Restart */}
                         <Button
                            variant="ghost"
                            justify="start"
                            onClick={(e: React.MouseEvent) => {
                                e.stopPropagation();
                                handleRestart();
                            }}
                            className="w-full gap-3 px-4 py-3 hover:bg-gray-800 transition-colors border-t border-gray-800 h-auto rounded-none"
                        >
                            <RotateCcw className="w-5 h-5 text-orange-400 whitespace-nowrap" />
                            <div className="flex-1 min-w-0">
                                <div className="font-semibold text-white truncate">Recomeçar</div>
                                <div className="text-xs text-gray-400 truncate">Resetar progresso</div>
                            </div>
                        </Button>

                        {/* Select Episode (TV only) */}
                        {item.mediaType === 'tv' && (
                                 <Button
                                    variant="ghost"
                                    justify="start"
                                    onClick={(e: React.MouseEvent) => {
                                        e.stopPropagation();
                                        handleSelectEpisode();
                                    }}
                                    className="w-full gap-3 px-4 py-3 hover:bg-gray-800 transition-colors border-t border-gray-800 h-auto rounded-none"
                                >
                                    <List className="w-5 h-5 text-purple-400 whitespace-nowrap" />
                                    <div className="flex-1 min-w-0">
                                        <div className="font-semibold text-white truncate">Episódios</div>
                                        <div className="text-xs text-gray-400 truncate">Selecionar episódio</div>
                                    </div>
                                </Button>
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
