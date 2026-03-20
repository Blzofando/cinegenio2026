"use client";

import React, { useState, useRef, useEffect } from 'react';
import { Play, RotateCcw, MoreVertical, Eye, EyeOff, Check, List, Plus, XCircle } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { markAsWatching, restartItem } from '@/lib/watchedService';
import { markAsDropped } from '@/lib/droppedService';
import { db } from '@/lib/firebase/client';
import { doc, getDoc, deleteDoc, collection, getDocs, updateDoc, setDoc } from 'firebase/firestore';
import RatingModal from './RatingModal';
import EpisodeSelector from './EpisodeSelector';
import { saveDualEpisodes } from '@/lib/dualEpisodeService';
import { Button } from '@/components/ui/Button';
import { ModalWrapper } from '@/components/ui/Modal';
import ConfirmModal from '@/components/ui/ConfirmModal';

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
    const [showRestartConfirm, setShowRestartConfirm] = useState(false);
    const [showDroppedConfirm, setShowDroppedConfirm] = useState(false);
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

        try {
            // Reset timestamp to 0 in Firebase IMMEDIATELY
            if (item.mediaType === 'movie') {
                const nowWatchingRef = collection(db, 'users', user.uid, 'nowWatching');
                const snapshot = await getDocs(nowWatchingRef);
                const docId = `movie_${item.id}`;
                const matchingDoc = snapshot.docs.find(d => d.id.startsWith(docId));

                if (matchingDoc) {
                    await updateDoc(matchingDoc.ref, { timestamp: 0 });
                    console.log('✅ Movie timestamp reset to 0');
                }
            } else if (item.mediaType === 'tv') {
                const nowWatchingRef = collection(db, 'users', user.uid, 'nowWatching');
                const snapshot = await getDocs(nowWatchingRef);
                const docId = `tv_${item.id}`;
                const matchingDoc = snapshot.docs.find(d => d.id.startsWith(docId));

                if (matchingDoc) {
                    const data = matchingDoc.data();
                    const currentSeason = data.season || 1;
                    const currentEpisode = data.episode || 1;
                    const episodeDocId = `s${currentSeason}e${currentEpisode}`;

                    const episodesRef = collection(matchingDoc.ref, 'episodes');
                    const episodesSnap = await getDocs(episodesRef);
                    const episodeDoc = episodesSnap.docs.find(d => d.id === episodeDocId);

                    if (episodeDoc) {
                        await updateDoc(episodeDoc.ref, { timestamp: 0 });
                        console.log(`✅ Episode ${episodeDocId} timestamp reset to 0`);
                    }
                }
            }

            setIsOpen(false);

            // Add delay for Firebase to update (especially for TV)
            await new Promise(resolve => setTimeout(resolve, 300));

            // Open player AFTER resetting timestamp
            if (onPlay) {
                onPlay();
                console.log('✅ Player opened with timestamp 0');
            }

            onStatusChange?.();
        } catch (error) {
            console.error('Erro:', error);
            alert('Erro ao reiniciar');
        }
    };

    const handleDropped = async () => {
        if (!user) return;

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
                    <Button
                        onClick={
                            watchStatus === 'dropped' || watchStatus === 'watched'
                                ? () => setIsOpen(!isOpen)
                                : onPlay
                        }
                        variant={
                            watchStatus === 'dropped' ? 'danger' :
                            watchStatus === 'rewatch' ? 'secondary' :
                            watchStatus === 'resume' ? 'success' :
                            watchStatus === 'watched' ? 'secondary' : 'primary'
                        }
                        className="rounded-r-none"
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
                                <Check className="w-5 h-5" />
                                Watched
                            </>
                        ) : (
                            <>
                                <Play className="w-5 h-5 fill-current" />
                                Assistir
                            </>
                        )}
                    </Button>

                    {/* Dropdown Toggle */}
                    <Button
                        ref={buttonRef}
                        variant={
                            watchStatus === 'dropped' ? 'danger' :
                            watchStatus === 'rewatch' ? 'secondary' :
                            watchStatus === 'resume' ? 'success' :
                            watchStatus === 'watched' ? 'secondary' : 'primary'
                        }
                        size="icon"
                        onClick={(e: React.MouseEvent<HTMLButtonElement>) => {
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
                        className="rounded-l-none border-l border-black/20"
                    >
                        <MoreVertical className="w-5 h-5 text-white" />
                    </Button>
                </div>

                {/* Dropdown Menu */}
                {isOpen && (
                    <div className={`absolute left-0 w-64 bg-gray-900 border border-gray-700 rounded-xl shadow-2xl overflow-hidden z-50 animate-in fade-in duration-200 ${dropdownPosition === 'above' ? 'bottom-full mb-2' : 'top-full mt-2'}`}>
                        {/* Watching - mostrar para NEW e DROPPED */}
                        {(watchStatus === 'new' || watchStatus === 'dropped') && (
                            <Button
                                variant="ghost"
                                justify="start"
                                onClick={(e: React.MouseEvent<HTMLButtonElement>) => {
                                    e.stopPropagation();
                                    handleWatching();
                                }}
                                className="w-full gap-3 px-4 py-3 hover:bg-gray-800 transition-colors"
                            >
                                <Eye className="w-5 h-5 text-blue-400" />
                                <div>
                                    <div className="font-semibold text-white">Assistindo</div>
                                    <div className="text-xs text-gray-400">Marcar como assistindo</div>
                                </div>
                            </Button>
                        )}

                        {/* Watchlist - sempre disponível */}
                        <Button
                            variant="ghost"
                            justify="start"
                            onClick={(e: React.MouseEvent<HTMLButtonElement>) => {
                                e.stopPropagation();
                                if (onWatchlistToggle) {
                                    onWatchlistToggle();
                                } else {
                                    console.log('Watchlist toggle not available');
                                }
                                setIsOpen(false);
                            }}
                            className="w-full gap-3 px-4 py-3 hover:bg-gray-800 transition-colors border-t border-gray-800"
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
                        </Button>

                        {/* Watched option */}
                        <Button
                            variant="ghost"
                            justify="start"
                            onClick={(e: React.MouseEvent<HTMLButtonElement>) => {
                                e.stopPropagation();
                                handleWatched();
                            }}
                            className="w-full gap-3 px-4 py-3 hover:bg-gray-800 transition-colors border-t border-gray-800"
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
                        </Button>

                        {/* Restart - só mostrar para resume, reWatch ou dropped */}
                        {(watchStatus === 'resume' || watchStatus === 'rewatch' || watchStatus === 'dropped') && (
                        <Button
                                variant="ghost"
                                justify="start"
                                onClick={(e: React.MouseEvent<HTMLButtonElement>) => {
                                    e.stopPropagation();
                                    setShowRestartConfirm(true);
                                }}
                                className="w-full gap-3 px-4 py-3 hover:bg-gray-800 transition-colors border-t border-gray-800"
                            >
                                <RotateCcw className="w-5 h-5 text-orange-400" />
                                <div>
                                    <div className="font-semibold text-white">Recomeçar</div>
                                    <div className="text-xs text-gray-400">Resetar progresso</div>
                                </div>
                            </Button>
                        )}

                        {/* Abandonar - só mostrar se RESUME ou REWATCH (não mostrar em NEW ou DROPPED) */}
                        {(watchStatus === 'resume' || watchStatus === 'rewatch') && (
                            <Button
                                variant="ghost"
                                justify="start"
                                onClick={(e: React.MouseEvent<HTMLButtonElement>) => {
                                    e.stopPropagation();
                                    setShowDroppedConfirm(true);
                                }}
                                className="w-full gap-3 px-4 py-3 hover:bg-gray-800 transition-colors border-t border-gray-800"
                            >
                                <XCircle className="w-5 h-5 text-red-400" />
                                <div>
                                    <div className="font-semibold text-white">Abandonar</div>
                                    <div className="text-xs text-gray-400">Parei de assistir</div>
                                </div>
                            </Button>
                        )}

                        {/* Select Episode (TV only) */}
                        {item.mediaType === 'tv' && (
                            <Button
                                variant="ghost"
                                justify="start"
                                onClick={(e: React.MouseEvent<HTMLButtonElement>) => {
                                    e.stopPropagation();
                                    handleSelectEpisode();
                                }}
                                className="w-full gap-3 px-4 py-3 hover:bg-gray-800 transition-colors border-t border-gray-800"
                            >
                                <List className="w-5 h-5 text-purple-400" />
                                <div>
                                    <div className="font-semibold text-white">Episódios</div>
                                    <div className="text-xs text-gray-400">Selecionar episódio</div>
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
            <ModalWrapper 
                isOpen={showEpisodeSelector && item.mediaType === 'tv'} 
                onClose={() => setShowEpisodeSelector(false)}
                size="lg"
            >
                <EpisodeSelector
                    showId={item.id}
                    onSelect={handleEpisodeSelect}
                    onClose={() => setShowEpisodeSelector(false)}
                />
            </ModalWrapper>

            {/* Restart Confirmation */}
            <ConfirmModal
                isOpen={showRestartConfirm}
                onClose={() => setShowRestartConfirm(false)}
                onConfirm={handleRestart}
                title="Recomeçar Título"
                message={`Deseja recomeçar "${item.title}" do início? Isso resetará seu progresso atual.`}
            />

            {/* Dropped Confirmation */}
            <ConfirmModal
                isOpen={showDroppedConfirm}
                onClose={() => setShowDroppedConfirm(false)}
                onConfirm={handleDropped}
                title="Abandonar Título"
                message={`Tem certeza que deseja marcar "${item.title}" como abandonado? Ele será movido para sua lista de títulos abandonados.`}
            />
        </>
    );
};

export default CombinedPlayButton;
