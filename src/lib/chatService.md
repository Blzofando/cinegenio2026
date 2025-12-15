"use server";

import { doc, getDoc, setDoc, addDoc, collection, query, orderBy, getDocs, serverTimestamp, deleteDoc, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase/client';
import { getWatchedItems, getWatchlistItems, getTMDbRadarCache, getRelevantReleases } from './firestore';
import { AllManagedWatchedData, Challenge, WeeklyRelevants, Recommendation } from '@/types';
// Importa do nosso novo serviço de IA unificado
import { formatWatchedDataForPrompt, generateAdvancedChatResponse, generateChatTitle } from './aiService';
// Importa do tmdb para o enriquecimento dos dados
import { getTMDbDetails, searchByTitleAndYear } from './tmdb';

export type ChatMessage = {
    role: 'user' | 'model';
    parts: { text: string }[];
};

export type ChatSession = {
    id: string;
    title: string;
    createdAt: Timestamp;
    messages: ChatMessage[];
}

// CORREÇÃO: Tipo intermediário para lidar com a inconsistência da IA de forma segura
type AmbiguousRecommendation = Recommendation & {
    media_type?: 'movie' | 'tv';
};


export const getAdvancedAIChatResponse = async (
    currentMessage: string,
    history: ChatMessage[]
) => {
    try {
        console.log("--- AÇÃO DO CHAT INICIADA ---");

        // ... (toda a sua lógica de busca de contexto permanece a mesma)
        const [watchedItems, watchlistItems, tmdbRadarItems, relevantRadarItems] = await Promise.all([
            getWatchedItems(),
            getWatchlistItems(),
            getTMDbRadarCache(),
            getRelevantReleases()
        ]);
        const watchedData: AllManagedWatchedData = watchedItems.reduce((acc, item) => {
            const rating = item.rating || 'meh';
            acc[rating].push(item);
            return acc;
        }, { amei: [], gostei: [], meh: [], naoGostei: [] } as AllManagedWatchedData);
        const now = new Date();
        const weekId = `${now.getFullYear()}-${Math.ceil((((now.getTime() - new Date(now.getFullYear(), 0, 1).getTime()) / 86400000) + new Date(now.getFullYear(), 0, 1).getDay() + 1) / 7)}`;
        const challengeSnap = await getDoc(doc(db, 'challenges', weekId));
        const challenge: Challenge | null = challengeSnap.exists() ? challengeSnap.data() as Challenge : null;
        const relevantsSnap = await getDoc(doc(db, 'weeklyRelevants', 'currentList'));
        const weeklyRelevants: WeeklyRelevants | null = relevantsSnap.exists() ? relevantsSnap.data() as WeeklyRelevants : null;
        const tasteProfile = await formatWatchedDataForPrompt(watchedData);
        const watchlistText = watchlistItems.map(item => `- ${item.title} (ID: ${item.id})`).join('\n') || 'Nenhuma';
        const challengeText = challenge ? `Desafio "${challenge.challengeType}": ${challenge.reason}\nItens do desafio:\n${challenge.steps.map(s => `- ${s.title} (ID: ${s.tmdbId})`).join('\n')}` : 'Nenhum desafio ativo';
        const relevantsText = weeklyRelevants?.categories.map(cat => `Categoria "${cat.categoryTitle}":\n` + cat.items.map(i => `- ${i.title} (ID: ${i.id})`).join('\n')).join('\n\n') || 'Nenhuma lista de relevantes encontrada';
        const tmdbRadarText = tmdbRadarItems.map(item => `- ${item.title} (${item.listType})`).join('\n') || 'Nenhum item no radar geral.';
        const relevantRadarText = relevantRadarItems.map(item => `- ${item.title} (Motivo: ${item.reason})`).join('\n') || 'Nenhum item no radar personalizado.';
        const prompt = `
            Você é o CineGênio, um assistente especialista.
            Analise o contexto e o histórico para responder à última mensagem do usuário.
            Sempre retorne no formato JSON definido. Decida o 'type' da resposta ('text', 'recommendation', 'list') com base na intenção.
            **REGRA CRÍTICA:** Se o usuário pedir para listar itens de uma seção específica (ex: "quais os filmes do desafio?"), sua resposta DEVE ser do tipo 'list' e o campo 'data.list' DEVE conter os itens EXATOS daquela seção, usando os IDs fornecidos no contexto. NÃO invente itens.
            **REGRA DE DUELO:** Se a mensagem do usuário for uma comparação ou duelo entre dois ou mais títulos, retorne sua resposta como type: 'recommendation', focando a análise e o 'title' no título vencedor.

            ### CONTEXTO DO USUÁRIO ###
            # PERFIL DE GOSTO:
            ${tasteProfile}
            # ITENS NA WATCHLIST:
            ${watchlistText}
            # DESAFIO DA SEMANA ATUAL:
            ${challengeText}
            # RELEVANTES DESTA SEMANA:
            ${relevantsText}
            # RADAR - TENDÊNCIAS E TOP 10s:
            ${tmdbRadarText}
            # RADAR - RELEVANTE PARA VOCÊ (IA):
            ${relevantRadarText}

            ### HISTÓRICO DA CONVERSA RECENTE ###
            ${history.map(msg => `${msg.role}: ${msg.parts[0].text}`).join('\n')}

            ### MENSAGEM ATUAL DO USUÁRIO ###
            user: ${currentMessage}
        `;

        const aiResponse = await generateAdvancedChatResponse(prompt);
        
        console.log("RAW AI Response:", JSON.stringify(aiResponse, null, 2));

        if (aiResponse.type === 'recommendation' && aiResponse.data.recommendation) {
            // CORREÇÃO: Usando o tipo AmbiguousRecommendation para evitar o 'any'
            const rec: AmbiguousRecommendation = aiResponse.data.recommendation;
            if (rec.media_type && !rec.tmdbMediaType) {
                console.log(`Normalizando 'media_type' para 'tmdbMediaType'. Valor: ${rec.media_type}`);
                rec.tmdbMediaType = rec.media_type;
                delete rec.media_type;
            }
        }
        
        if (aiResponse.type === 'recommendation' && aiResponse.data.recommendation) {
            const rec = aiResponse.data.recommendation;
            
            if (rec.title && rec.year && rec.tmdbMediaType) {
                console.log(`Enriquecendo dados para: ${rec.title} (${rec.year}), tipo: ${rec.tmdbMediaType}`);
                const tmdbResult = await searchByTitleAndYear(rec.title, rec.year, rec.tmdbMediaType);
                
                if (tmdbResult) {
                    console.log("Encontrado no TMDb:", tmdbResult.id);
                    aiResponse.data.recommendation.id = tmdbResult.id;
                    aiResponse.data.recommendation.posterUrl = tmdbResult.poster_path 
                        ? `https://image.tmdb.org/t/p/w500${tmdbResult.poster_path}` 
                        : undefined;
                } else {
                    console.warn(`Não foi possível encontrar um match no TMDb para "${rec.title}" (${rec.year}). O ID e o pôster estarão ausentes.`);
                }
            } else {
                 console.warn("A resposta da IA não continha title, year ou tmdbMediaType para a busca no TMDb.", rec);
            }
        }
        
        if (aiResponse.type === 'list' && aiResponse.data.list) {
            const enrichedList = await Promise.all(
                aiResponse.data.list.map(async (item) => {
                    if (!item.id || !item.tmdbMediaType) return item;
                    try {
                        const details = await getTMDbDetails(item.id, item.tmdbMediaType);
                        return { ...item, title: details.title || details.name, posterUrl: details.poster_path ? `https://image.tmdb.org/t/p/w500${details.poster_path}` : undefined, };
                    } catch { return item; }
                })
            );
            aiResponse.data.list = enrichedList;
        }
        
        console.log("Processamento concluído. Resposta final:", JSON.stringify(aiResponse, null, 2));
        return aiResponse;

    } catch (error) {
        console.error("ERRO CRÍTICO NA SERVER ACTION DO CHAT:", error);
        return { type: 'text', data: { text: "Desculpe, ocorreu um erro no servidor ao processar sua solicitação." } };
    }
};

// --- FUNÇÕES DE HISTÓRICO ---
const CHAT_HISTORY_COLLECTION = 'chatHistories';

export const listChatSessions = async (): Promise<{ id: string; title: string; }[]> => {
    try {
        const historyCollection = collection(db, CHAT_HISTORY_COLLECTION);
        const q = query(historyCollection, orderBy("createdAt", "desc"));
        const querySnapshot = await getDocs(q);
        return querySnapshot.docs.map(doc => ({
            id: doc.id,
            title: doc.data().title || "Chat sem título"
        }));
    } catch (error) {
        console.error("Erro ao listar sessões de chat:", error);
        return [];
    }
};

export const getChatSession = async (sessionId: string): Promise<ChatMessage[]> => {
    try {
        const docRef = doc(db, CHAT_HISTORY_COLLECTION, sessionId);
        const docSnap = await getDoc(docRef);
        return docSnap.exists() ? (docSnap.data().messages || []) : [];
    } catch (error) {
        console.error("Erro ao buscar sessão de chat:", error);
        return [];
    }
};

export const saveChatSession = async (sessionId: string | null, messages: ChatMessage[]): Promise<string> => {
    try {
        if (sessionId) {
            const docRef = doc(db, CHAT_HISTORY_COLLECTION, sessionId);
            await setDoc(docRef, { messages }, { merge: true });
            return sessionId;
        } else {
            const conversationText = messages.map(m => m.parts[0].text).slice(0, 4).join('\n');
            const prompt = `Gere um título curto e objetivo (máximo 5 palavras) para a seguinte conversa:\n\n---\n${conversationText}\n---`;
            const titleResponse = await generateChatTitle(prompt);
            
            const docRef = await addDoc(collection(db, CHAT_HISTORY_COLLECTION), {
                title: titleResponse.title || "Novo Chat",
                createdAt: serverTimestamp(),
                messages: messages,
            });
            return docRef.id;
        }
    } catch (error) {
        console.error("Erro ao salvar sessão de chat:", error);
        throw new Error("Não foi possível salvar a conversa.");
    }
};

export const deleteChatSession = async (sessionId: string): Promise<void> => {
    try {
        console.log(`SERVER ACTION: Apagando a sessão de chat: ${sessionId}`);
        const docRef = doc(db, CHAT_HISTORY_COLLECTION, sessionId);
        await deleteDoc(docRef);
    } catch (error) {
        console.error("Erro ao apagar sessão de chat:", error);
        throw new Error("Não foi possível apagar a conversa.");
    }
};

