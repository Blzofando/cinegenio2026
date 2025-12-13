"use client";

import React, { useState } from 'react';
import { X } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { markAsWatched, RatingType } from '@/lib/watchedService';

interface RatingModalProps {
    item: {
        id: number;
        mediaType: 'movie' | 'tv';
        title: string;
        posterUrl: string;
    };
    onClose: () => void;
    onSuccess?: () => void;
}

const RATINGS = [
    { type: 'amei' as RatingType, emoji: '❤️', label: 'Amei', gradient: 'from-pink-500 to-red-500', hoverGradient: 'from-pink-600 to-red-600' },
    { type: 'gostei' as RatingType, emoji: '👍', label: 'Gostei', gradient: 'from-green-500 to-emerald-500', hoverGradient: 'from-green-600 to-emerald-600' },
    { type: 'meh' as RatingType, emoji: '😐', label: 'Meh', gradient: 'from-yellow-500 to-orange-500', hoverGradient: 'from-yellow-600 to-orange-600' },
    { type: 'nao_gostei' as RatingType, emoji: '👎', label: 'Não Gostei', gradient: 'from-red-700 to-red-900', hoverGradient: 'from-red-800 to-black' },
];

const RatingModal: React.FC<RatingModalProps> = ({ item, onClose, onSuccess }) => {
    const { user } = useAuth();
    const [selectedRating, setSelectedRating] = useState<RatingType | null>(null);
    const [comment, setComment] = useState('');
    const [isSaving, setIsSaving] = useState(false);

    const handleSave = async () => {
        if (!user || !selectedRating) return;

        setIsSaving(true);
        try {
            await markAsWatched(user.uid, item, selectedRating, comment);

            console.log('✅ Avaliação salva com sucesso!');

            onSuccess?.();
            onClose();
        } catch (error) {
            console.error('Erro ao salvar avaliação:', error);
            alert('Erro ao salvar avaliação. Tente novamente.');
        } finally {
            setIsSaving(false);
        }
    };

    const selectedRatingData = RATINGS.find(r => r.type === selectedRating);

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/85 backdrop-blur-md"
                onClick={onClose}
            />

            {/* Modal */}
            <div className="relative w-full max-w-md bg-gradient-to-br from-gray-900 via-gray-900 to-black border border-gray-700/50 rounded-2xl shadow-2xl animate-in zoom-in-95 duration-300 overflow-hidden">
                {/* Decorative gradient top bar */}
                <div className={`h-1 bg-gradient-to-r ${selectedRatingData?.gradient || 'from-purple-500 to-pink-500'} transition-all duration-500`} />

                {/* Header */}
                <div className="relative p-6 pb-4">
                    <button
                        onClick={onClose}
                        className="absolute top-4 right-4 p-2 hover:bg-white/10 rounded-lg transition-colors group"
                    >
                        <X className="w-5 h-5 text-gray-400 group-hover:text-white transition-colors" />
                    </button>

                    <div className="pr-8">
                        <h2 className="text-2xl font-black text-white mb-1">
                            Como foi?
                        </h2>
                        <p className="text-sm text-gray-400 line-clamp-1">
                            {item.title}
                        </p>
                    </div>
                </div>

                {/* Rating Options - Compact */}
                <div className="px-6 pb-6">
                    <div className="flex justify-between gap-2 mb-6">
                        {RATINGS.map((rating) => {
                            const isSelected = selectedRating === rating.type;

                            return (
                                <button
                                    key={rating.type}
                                    onClick={() => setSelectedRating(rating.type)}
                                    className={`relative flex-1 aspect-square rounded-xl border-2 transition-all duration-300 transform hover:scale-110 ${isSelected
                                            ? `border-transparent bg-gradient-to-br ${rating.gradient} shadow-lg scale-110`
                                            : 'border-gray-700 bg-gray-800/50 hover:border-gray-600 hover:bg-gray-800'
                                        }`}
                                >
                                    {/* Glow effect when selected */}
                                    {isSelected && (
                                        <div className={`absolute -inset-1 bg-gradient-to-br ${rating.gradient} opacity-50 blur-lg rounded-xl -z-10`} />
                                    )}

                                    <div className="relative flex flex-col items-center justify-center h-full gap-1">
                                        <span className="text-3xl">{rating.emoji}</span>
                                        <span className={`font-bold text-xs ${isSelected ? 'text-white' : 'text-gray-400'
                                            }`}>
                                            {rating.label}
                                        </span>
                                    </div>

                                    {/* Selected checkmark */}
                                    {isSelected && (
                                        <div className="absolute -top-1 -right-1 w-5 h-5 bg-white rounded-full flex items-center justify-center shadow-lg">
                                            <svg className="w-3 h-3 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={4} d="M5 13l4 4L19 7" />
                                            </svg>
                                        </div>
                                    )}
                                </button>
                            );
                        })}
                    </div>

                    {/* Comment Field */}
                    <div className="space-y-2">
                        <label className="flex items-center gap-2 text-sm font-semibold text-gray-300">
                            <span>💭</span>
                            Seus pensamentos
                            <span className="text-gray-500 font-normal text-xs">(opcional)</span>
                        </label>
                        <div className="relative">
                            <textarea
                                value={comment}
                                onChange={(e) => setComment(e.target.value)}
                                placeholder="O que achou? Conte mais sobre sua experiência..."
                                rows={3}
                                maxLength={500}
                                className="w-full px-4 py-3 bg-gray-800/70 border border-gray-700 rounded-xl text-white text-sm placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 resize-none transition-all"
                            />
                            <div className="absolute bottom-2 right-3 text-xs text-gray-600">
                                {comment.length}/500
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="px-6 pb-6 flex gap-3">
                    <button
                        onClick={onClose}
                        disabled={isSaving}
                        className="flex-1 px-6 py-3 bg-gray-800 hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl font-bold text-white text-sm transition-all"
                    >
                        Cancelar
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={!selectedRating || isSaving}
                        className={`flex-1 px-6 py-3 rounded-xl font-bold text-white text-sm shadow-lg transition-all transform hover:scale-105 disabled:scale-100 disabled:cursor-not-allowed ${selectedRating && selectedRatingData
                                ? `bg-gradient-to-r ${selectedRatingData.hoverGradient}`
                                : 'bg-gray-700'
                            }`}
                    >
                        {isSaving ? (
                            <span className="flex items-center justify-center gap-2">
                                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                Salvando...
                            </span>
                        ) : (
                            'Salvar Avaliação'
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default RatingModal;
