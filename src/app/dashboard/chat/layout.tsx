// src/app/chat/layout.tsx

"use client"; // Precisa ser um Client Component para gerenciar o estado do menu

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { listChatSessions } from '@/lib/chatService';
import ChatSidebarClient from '@/components/chat/ChatSidebarClient';

type ChatSessionInfo = {
    id: string;
    title: string;
};

// Componente de layout principal que agora controla o menu mobile
export default function ChatLayout({ children }: { children: React.ReactNode }) {
    const [sessions, setSessions] = useState<ChatSessionInfo[]>([]);
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const pathname = usePathname();

    // Carrega as sessões de chat no cliente
    useEffect(() => {
        listChatSessions().then(setSessions);
    }, []);

    // Fecha o menu ao navegar para um novo chat
    useEffect(() => {
        setIsMenuOpen(false);
    }, [pathname]);

    return (
        <div className="flex h-[calc(100vh-80px)]">
            {/* Barra lateral para Desktop (sempre visível) */}
            <div className="hidden lg:block">
                <ChatSidebarClient initialSessions={sessions} />
            </div>

            {/* Menu flutuante para Celular */}
            <div className={`lg:hidden fixed inset-0 z-40 transition-transform duration-300 ${isMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}>
                 <ChatSidebarClient initialSessions={sessions} />
            </div>
            
            {/* Overlay escuro quando o menu está aberto no celular */}
            {isMenuOpen && <div onClick={() => setIsMenuOpen(false)} className="lg:hidden fixed inset-0 bg-black/50 z-30" />}

            <main className="flex-1 bg-black/20 flex flex-col">
                {/* Header para o Celular com o botão de menu */}
                <div className="lg:hidden flex items-center p-2 border-b border-white/10">
                    <button onClick={() => setIsMenuOpen(true)} className="p-2 text-gray-300 hover:text-white">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
                    </button>
                    <Link href="/chat/new" className="ml-auto text-sm bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-1 px-3 rounded-lg">
                        + Novo Chat
                    </Link>
                </div>
                <div className="flex-grow">
                    {children}
                </div>
            </main>
        </div>
    );
}