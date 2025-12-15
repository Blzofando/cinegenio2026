"use client";

import React, { useState, useRef, useEffect } from 'react';
import { Play, RotateCcw, MoreVertical, Eye, EyeOff, Check, List, Plus, XCircle } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { markAsWatching, restartItem } from '@/lib/watchedService';
import { markAsDropped } from '@/lib/droppedService';
import { db } from '@/lib/firebase/client';
import { doc, getDoc, deleteDoc } from 'firebase/firestore';
import RatingModal from './RatingModal';
import EpisodeSelector from './EpisodeSelector';
import { saveDualEpisodes } from '@/lib/dualEpisodeService';

interface CombinedPlayButtonProps {
    item: {
        id: number;
        mediaType: 'movie' | 'tv';
        title: string;
        posterUrl: string;
    };
    watchStatus: 'new' | 'resume' | 'rewatch' | 'dropped' | 'watched';
    onPlay: () => void;
    onWatchlistToggle?: () => void;
    isInWatchlist?: boolean;
    onStatusChange?: () => void;
}

const CombinedPlayButton: React.FC<CombinedPlayButtonProps> = ({
    item,
    watchStatus,
    onPlay,
    onWatchlistToggle,
    isInWatchlist = false,
    onStatusChange
}) => {
    const { user } = useAuth();
    const [isOpen, setIsOpen] = useState(false);
    const [showRatingModal, setShowRatingModal] = useState(false);
    const [showEpisodeSelector, setShowEpisodeSelector] = useState(false);
    const [isWatching, setIsWatching] = useState(false);
    const [dropdownPosition, setDropdownPosition] = useState<'below' | 'above'>('below');
    const dropdownRef = useRef<HTMLDivElement>(null);
    const buttonRef = useRef<HTMLButtonElement>(null);

    // Check if item is in nowWatching
    useEffect(() => {
        const checkWatchingStatus = async () => {
            if (!user) return;

            try {
                const docRef = doc(db, 'users', user.uid, 'nowWatching', String(item.id));
                const docSnap = await getDoc(docRef);
                setIsWatching(docSnap.exists());
            } catch (error) {
                console.error('Error checking watching status:', error);
            }
        };

        checkWatchingStatus();
    }, [user, item.id]);

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
            // Se estiver em dropped, remover primeiro
            if (watchStatus === 'dropped') {
                const droppedRef = doc(db, 'users', user.uid, 'dropped', `${item.mediaType}_${item.id}`);
                await deleteDoc(droppedRef);
                console.log('✅ Removido de abandonados');
            }

            // Marcar como assistindo
            await markAsWatching(user.uid, item);
            console.log('✅ Marcado como assistindo');

            setIsOpen(false);
            onStatusChange?.();
        } catch (error) {
            console.error('Erro:', error);
            alert('Erro ao alterar status');
        }
    };

    const handleWatched = async () => {
        // Se estiver em dropped, remover primeiro
        if (user && watchStatus === 'dropped') {
            try {
                const droppedRef = doc(db, 'users', user.uid, 'dropped', `${item.mediaType}_${item.id}`);
                await deleteDoc(droppedRef);
                console.log('✅ Removido de abandonados antes de marcar como watched');
            } catch (error) {
                console.error('Erro ao remover de dropped:', error);
            }
        }

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

    const handleDropped = async () => {
        if (!user) return;

        const confirm = window.confirm(`Abandonar "${item.title}"? O título será movido para Abandonados.`);
        if (!confirm) return;

        try {
            await markAsDropped(user.uid, item);
            console.log('✅ Item marcado como abandonado');
            setIsOpen(false);
            onStatusChange?.();
        } catch (error) {
            console.error('Erro:', error);
            alert('Erro ao marcar como abandonado');
        }
    };

    const handleSelectEpisode = () => {
        setIsOpen(false);
        setShowEpisodeSelector(true);
    };


    const handleEpisodeSelect = async (season: number, episode: number) => {
        console.log(`Episódio selecionado: S${season}E${episode}`);
        setShowEpisodeSelector(false);

        // Salvar episódio selecionado no Firebase ANTES de abrir player
        if (user && item.mediaType === 'tv') {
            try {
                await saveDualEpisodes(
                    user.uid,
                    item.id,
                    item.title,
                    item.posterUrl,
                    undefined,
                    { season, episode },
                    null,
                    'videasy',
                    0,
                    0
                );
                await new Promise(resolve => setTimeout(resolve, 200));
            } catch (error) {
                console.error('[CombinedPlayButton] Erro:', error);
            }
        }

        onPlay();
    };

    return (
        <>
            <div ref={dropdownRef} className="relative inline-flex">
                {/* Combined Button - items-stretch ensures equal height */}
                <div className="flex items-stretch rounded-lg overflow-hidden shadow-lg">
                    {/* Main Play Button */}
                    <button
                        onClick={
                            watchStatus === 'dropped' || watchStatus === 'watched'
                                ? () => setIsOpen(!isOpen)
                                : onPlay
                        }
                        className={`flex items-center gap-2 px-8 py-3 font-bold text-white transition-all ${watchStatus === 'dropped'
                            ? 'bg-orange-600 hover:bg-orange-700'
                            : watchStatus === 'rewatch'
                                ? 'bg-purple-600 hover:bg-purple-700'
                                : watchStatus === 'resume'
                                    ? 'bg-green-600 hover:bg-green-700'
                                    : watchStatus === 'watched'
                                        ? 'bg-white/10 hover:bg-white/20 border border-white/20 backdrop-blur-sm shadow-[0_0_15px_rgba(255,255,255,0.1)]'
                                        : 'bg-red-600 hover:bg-red-700'
                            }`}
                    >
                        {watchStatus === 'dropped' ? (
                            <>
                                <XCircle className="w-5 h-5" />
                                Abandonado
                            </>
                        ) : watchStatus === 'rewatch' ? (
                            <>
                                <RotateCcw className="w-5 h-5" />
                                Rewatch
                            </>
                        ) : watchStatus === 'resume' ? (
                            <>
                                <Play className="w-5 h-5 fill-current" />
                                Resume
                            </>
                        ) : watchStatus === 'watched' ? (
                            <>
                                <Check className="w-5 h-5 fill-current" />
                                Watched
                            </>
                        ) : (
                            <>
                                <Play className="w-5 h-5 fill-current" />
                                Assistir
                            </>
                        )}
                    </button>

                    {/* Dropdown Toggle */}
                    <button
                        ref={buttonRef}
                        onClick={(e) => {
                            e.stopPropagation();

                            // Calcular posição do dropdown
                            if (buttonRef.current) {
                                const rect = buttonRef.current.getBoundingClientRect();
                                const spaceBelow = window.innerHeight - rect.bottom;
                                const spaceAbove = rect.top;
                                const dropdownHeight = 300; // altura estimada

                                // Se não couber embaixo mas couber em cima, renderizar em cima
                                if (spaceBelow < dropdownHeight && spaceAbove > dropdownHeight) {
                                    setDropdownPosition('above');
                                } else {
                                    setDropdownPosition('below');
                                }
                            }

                            setIsOpen(!isOpen);
                        }}
                        className={`flex items-center px-3 border-l-2 transition-all ${watchStatus === 'dropped'
                            ? 'bg-orange-600 hover:bg-orange-700 border-black/20'
                            : watchStatus === 'rewatch'
                                ? 'bg-purple-600 hover:bg-purple-700 border-black/20'
                                : watchStatus === 'resume'
                                    ? 'bg-green-600 hover:bg-green-700 border-black/20'
                                    : watchStatus === 'watched'
                                        ? 'bg-white/10 hover:bg-white/20 border-white/20 backdrop-blur-md'
                                        : 'bg-red-600 hover:bg-red-700 border-black/20'
                            }`}
                    >
                        <MoreVertical className="w-5 h-5 text-white" />
                    </button>
                </div>

                {/* Dropdown Menu */}
                {isOpen && (
                    <div className={`absolute left-0 w-64 bg-gray-900 border border-gray-700 rounded-xl shadow-2xl overflow-hidden z-50 animate-in fade-in duration-200 ${dropdownPosition === 'above' ? 'bottom-full mb-2' : 'top-full mt-2'}`}>
                        {/* Watching - mostrar para NEW e DROPPED */}
                        {(watchStatus === 'new' || watchStatus === 'dropped') && (
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
                                    <div className="text-xs text-gray-400">Marcar como assistindo</div>
                                </div>
                            </button>
                        )}

                        {/* Watchlist - sempre disponível */}
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                if (onWatchlistToggle) {
                                    onWatchlistToggle();
                                } else {
                                    console.log('Watchlist toggle not available');
                                }
                                setIsOpen(false);
                            }}
                            className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-800 transition-colors text-left border-t border-gray-800"
                        >
                            {isInWatchlist ? (
                                <>
                                    <Check className="w-5 h-5 text-green-400" />
                                    <div>
                                        <div className="font-semibold text-white">Na Lista</div>
                                        <div className="text-xs text-gray-400">Remover da watchlist</div>
                                    </div>
                                </>
                            ) : (
                                <>
                                    <Plus className="w-5 h-5 text-purple-400" />
                                    <div>
                                        <div className="font-semibold text-white">Minha Lista</div>
                                        <div className="text-xs text-gray-400">Adicionar à watchlist</div>
                                    </div>
                                </>
                            )}
                        </button>

                        {/* Watched option */}
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                handleWatched();
                            }}
                            className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-800 transition-colors text-left border-t border-gray-800"
                        >
                            <Check className={`w-5 h-5 ${watchStatus === 'watched' ? 'text-yellow-400' : 'text-green-400'}`} />
                            <div>
                                <div className="font-semibold text-white">
                                    {watchStatus === 'watched' ? 'Rate it' : 'Watched'}
                                </div>
                                <div className="text-xs text-gray-400">
                                    {watchStatus === 'watched' ? 'Deixe outra avaliação' : 'Marcar como assistido'}
                                </div>
                            </div>
                        </button>

                        {/* Restart - só mostrar para resume, reWatch ou dropped */}
                        {(watchStatus === 'resume' || watchStatus === 'rewatch' || watchStatus === 'dropped') && (
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
                        )}

                        {/* Abandonar - só mostrar se RESUME ou REWATCH (não mostrar em NEW ou DROPPED) */}
                        {(watchStatus === 'resume' || watchStatus === 'rewatch') && (
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    handleDropped();
                                }}
                                className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-800 transition-colors text-left border-t border-gray-800"
                            >
                                <XCircle className="w-5 h-5 text-red-400" />
                                <div>
                                    <div className="font-semibold text-white">Abandonar</div>
                                    <div className="text-xs text-gray-400">Parei de assistir</div>
                                </div>
                            </button>
                        )}

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

export default CombinedPlayButton;
