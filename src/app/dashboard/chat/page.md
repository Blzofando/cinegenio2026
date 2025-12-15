// src/app/chat/page.tsx

import React from 'react';
import Link from 'next/link';

export default function ChatWelcomePage() {
    return (
        <div className="flex flex-col items-center justify-center h-full text-center p-4">
            <h1 className="text-4xl font-bold mb-4">CineGênio Pessoal</h1>
            <p className="text-lg text-gray-400 mb-6">Selecione uma conversa ou inicie um novo chat.</p>
            <Link href="/chat/new" className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-6 rounded-lg">
                + Iniciar Novo Chat
            </Link>
        </div>
    );
}