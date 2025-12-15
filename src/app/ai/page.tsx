"use client";

import React from 'react';
import { Sparkles, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import DashboardHeader from '@/components/shared/DashboardHeader';
import MobileBottomNav from '@/components/shared/MobileBottomNav';

export default function AIPlaceholderPage() {
    return (
        <div className="min-h-screen bg-gradient-to-b from-black via-gray-900 to-black text-white pb-16 md:pb-0">
            <DashboardHeader />
            <MobileBottomNav />

            <div className="flex flex-col items-center justify-center min-h-[80vh] px-6">
                <div className="max-w-2xl w-full text-center space-y-8">
                    {/* AI Icon */}
                    <div className="flex justify-center">
                        <div className="relative">
                            <div className="absolute inset-0 bg-purple-500/20 blur-3xl rounded-full"></div>
                            <div className="relative bg-gradient-to-br from-purple-600 to-blue-600 p-8 rounded-full">
                                <Sparkles className="w-20 h-20 text-white" strokeWidth={1.5} />
                            </div>
                        </div>
                    </div>

                    {/* Title */}
                    <div className="space-y-4">
                        <h1 className="text-4xl md:text-6xl font-black bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
                            Agente IA
                        </h1>
                        <p className="text-xl md:text-2xl text-gray-400 font-medium">
                            Em Breve
                        </p>
                    </div>

                    {/* Description */}
                    <div className="space-y-4 text-gray-300">
                        <p className="text-lg md:text-xl leading-relaxed">
                            Converse com nossa inteligência artificial para receber recomendações personalizadas de filmes e séries!
                        </p>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-6">
                            <div className="p-4 bg-white/5 rounded-xl border border-white/10 backdrop-blur-sm">
                                <span className="text-3xl mb-2 block">🎬</span>
                                <h3 className="font-bold mb-1">Recomendações</h3>
                                <p className="text-sm text-gray-400">Sugestões baseadas no seu gosto</p>
                            </div>
                            <div className="p-4 bg-white/5 rounded-xl border border-white/10 backdrop-blur-sm">
                                <span className="text-3xl mb-2 block">💬</span>
                                <h3 className="font-bold mb-1">Chat Inteligente</h3>
                                <p className="text-sm text-gray-400">Converse naturalmente</p>
                            </div>
                            <div className="p-4 bg-white/5 rounded-xl border border-white/10 backdrop-blur-sm">
                                <span className="text-3xl mb-2 block">⚡</span>
                                <h3 className="font-bold mb-1">Respostas Rápidas</h3>
                                <p className="text-sm text-gray-400">Informações instantâneas</p>
                            </div>
                        </div>
                    </div>

                    {/* Back Button */}
                    <div className="pt-8">
                        <Link
                            href="/dashboard"
                            className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 rounded-lg font-bold text-white transition-all transform hover:scale-105 shadow-lg shadow-purple-600/50"
                        >
                            <ArrowLeft className="w-5 h-5" />
                            Voltar ao Início
                        </Link>
                    </div>

                    {/* Coming Soon Badge */}
                    <div className="pt-4">
                        <div className="inline-flex items-center gap-2 px-4 py-2 bg-purple-500/10 border border-purple-500/30 rounded-full">
                            <span className="relative flex h-2 w-2">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-purple-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-purple-500"></span>
                            </span>
                            <span className="text-sm font-medium text-purple-300">
                                Novidade em Desenvolvimento
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
