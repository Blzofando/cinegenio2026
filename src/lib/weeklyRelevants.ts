// src/lib/weeklyRelevants.ts

"use server";

import { db } from '@/lib/firebase/client';
import { doc, getDoc, setDoc, Timestamp, collection } from "firebase/firestore";
import { AllManagedWatchedData, WeeklyRelevants, WeeklyRelevantItem } from '@/types';
import { formatWatchedDataForPrompt, fetchWeeklyRelevants } from './aiService';
import { getTMDbDetails, searchByTitleAndYear } from './tmdb';

const METADATA_COLLECTION_NAME = 'metadata';
const METADATA_DOC_ID = 'weeklyRelevantsMetadata';

const shouldUpdate = async (): Promise<boolean> => {
    const metadataRef = doc(db, METADATA_COLLECTION_NAME, METADATA_DOC_ID);
    const metadataSnap = await getDoc(metadataRef);

    if (!metadataSnap.exists()) {
        console.log("Metadados dos Relevantes da Semana não encontrados. Primeira atualização necessária.");
        return true;
    }

    const lastUpdate = (metadataSnap.data().lastUpdate as Timestamp).toDate();
    const today = new Date();
    const lastMonday = new Date(today);
    lastMonday.setDate(today.getDate() - (today.getDay() + 6) % 7);
    lastMonday.setHours(0, 0, 0, 0);

    if (lastUpdate < lastMonday) {
        console.log("A última atualização foi antes desta segunda-feira. Nova lista de Relevantes da Semana necessária.");
        return true;
    }

    console.log("Cache dos Relevantes da Semana está atualizado.");
    return false;
};

// Definindo o tipo para o item que vem da IA
type AIResultItem = { title: string; year: number; media_type: 'movie' | 'tv'; reason: string; };
type AICategory = { categoryTitle: string; items: AIResultItem[] };

export const updateWeeklyRelevantsIfNeeded = async (watchedData: AllManagedWatchedData): Promise<void> => {
    if (!(await shouldUpdate())) {
        return;
    }

    console.log("SERVER ACTION: Iniciando atualização da lista de Relevantes da Semana...");

    try {
        const formattedData = await formatWatchedDataForPrompt(watchedData);
        const prompt = `
            Você é o "CineGênio Pessoal". Sua tarefa é analisar o PERFIL DE GOSTO DO USUÁRIO e gerar uma lista de EXATAMENTE 50 filmes e séries JÁ LANÇADOS que sejam altamente relevantes.

            **PERFIL DE GOSTO DO USUÁRIO (Use como inspiração):**
            ${formattedData}

            **LISTA DE EXCLUSÃO (NÃO inclua NENHUM destes títulos):**
            ${formattedData}

            REGRAS CRÍTICAS:
            1. FOCO NA SUGESTÃO: Sua tarefa é selecionar os títulos e retornar o nome, o ano de lançamento e o tipo de mídia ('movie' ou 'tv').
            2. EXCLUSÃO É PRIORIDADE MÁXIMA: É proibido incluir qualquer título da "LISTA DE EXCLUSÃO".
            3. QUANTIDADE E VARIEDADE: Gere EXATAMENTE 5 categorias criativas, cada uma com 10 títulos. Pelo menos UMA categoria deve ser de "Séries".
            4. FORMATO JSON: A resposta DEVE ser um JSON válido.
        `;

        const aiResult = await fetchWeeklyRelevants(prompt);

        const finalCategories = await Promise.all(
            aiResult.categories.map(async (category: AICategory) => {
                const enrichedItems = await Promise.all(
                    category.items.map(async (itemFromAI) => {
                        try {
                            const tmdbResult = await searchByTitleAndYear(itemFromAI.title, itemFromAI.year, itemFromAI.media_type);
                            if (!tmdbResult) {
                                console.warn(`Nenhum resultado encontrado no TMDb para "${itemFromAI.title}" (${itemFromAI.year}). Item ignorado.`);
                                return null;
                            }
                            const details = await getTMDbDetails(tmdbResult.id, tmdbResult.media_type as 'movie' | 'tv');
                            const finalItem: WeeklyRelevantItem = {
                                id: details.id,
                                tmdbMediaType: tmdbResult.media_type as 'movie' | 'tv',
                                title: details.title || details.name || 'Título não encontrado',
                                genre: details.genres?.[0]?.name || 'Indefinido',
                                synopsis: details.overview || 'Sinopse não disponível.',
                                reason: itemFromAI.reason,
                                posterUrl: details.poster_path ? `https://image.tmdb.org/t/p/w500${details.poster_path}` : undefined,
                            };
                            return finalItem;
                        } catch (e) {
                            console.error(`Falha ao processar "${itemFromAI.title}":`, e);
                            return null;
                        }
                    })
                );
                return { categoryTitle: category.categoryTitle, items: enrichedItems.filter((item): item is WeeklyRelevantItem => item !== null) };
            })
        );

        const nonEmptyCategories = finalCategories.filter(cat => cat.items.length > 0);
        const weeklyRelevants: WeeklyRelevants = {
            generatedAt: Date.now(),
            categories: nonEmptyCategories,
        };

        const listDocRef = doc(collection(db, 'weeklyRelevants'), 'currentList');
        await setDoc(listDocRef, weeklyRelevants);

        const metadataRef = doc(db, METADATA_COLLECTION_NAME, METADATA_DOC_ID);
        await setDoc(metadataRef, { lastUpdate: new Date() });

        console.log(`Relevantes da Semana atualizados! ${nonEmptyCategories.flatMap(c => c.items).length} itens salvos.`);
    } catch (error) {
        console.error("Falha ao atualizar a lista de Relevantes da Semana:", error);
    }
};