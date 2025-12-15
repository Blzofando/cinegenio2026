// src/components/chat/ChatSidebarClient.tsx

"use client";

import React, { useTransition } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { deleteChatSession } from '@/lib/chatService';

type ChatSessionInfo = {
    id: string;
    title: string;
};

interface ChatSidebarClientProps {
    initialSessions: ChatSessionInfo[];
}

export default function ChatSidebarClient({ initialSessions }: ChatSidebarClientProps) {
    const router = useRouter();
    const [isPending, startTransition] = useTransition();

    const handleDelete = (sessionId: string) => {
        if (window.confirm("Tem certeza que deseja apagar esta conversa?")) {
            startTransition(async () => {
                await deleteChatSession(sessionId);
                // Recarrega a página para atualizar a lista da barra lateral
                router.refresh(); 
            });
        }
    };

    return (
        <aside className="hidden lg:flex flex-col w-64 bg-gray-900/50 border-r border-white/10 p-4">
            <Link href="/chat/new" className="mb-4 text-center bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded-lg transition-colors">
                + Novo Chat
            </Link>
            <div className="flex-grow overflow-y-auto space-y-1">
                <p className="text-xs text-gray-500 font-semibold uppercase px-2 mb-2">Histórico</p>
                <nav className="flex flex-col gap-1">
                    {initialSessions.map(session => (
                        <div key={session.id} className="group flex items-center justify-between p-2 text-sm text-gray-300 hover:bg-gray-700/50 rounded-lg">
                            <Link href={`/chat/${session.id}`} className="truncate flex-grow">
                                {session.title}
                            </Link>
                            <button 
                                onClick={() => handleDelete(session.id)}
                                className="ml-2 p-1 text-gray-500 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                                aria-label={`Apagar conversa ${session.title}`}
                            >
                                {/* Ícone de lixeira (SVG) */}
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                            </button>
                        </div>
                    ))}
                </nav>
            </div>
        </aside>
    );
}