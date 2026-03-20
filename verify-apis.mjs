import dotenv from 'dotenv';
import path from 'path';
import { GoogleGenerativeAI } from "@google/generative-ai";
import admin from "firebase-admin";

// Load .env.local
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

async function verifyGemini() {
    console.log("--- Verificando Gemini ---");
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
        console.error("ERRO: GEMINI_API_KEY não encontrada.");
        return;
    }
    console.log(`Chave encontrada (prefixo): ${apiKey.substring(0, 10)}...`);
    
    try {
        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
        const result = await model.generateContent("Diga 'Olá Mundo' em uma palavra.");
        console.log("Sucesso! Resposta do Gemini:", result.response.text().trim());
    } catch (error) {
        console.error("ERRO ao conectar com Gemini:", error.message);
    }
}

async function verifyFirebase() {
    console.log("\n--- Verificando Firebase Admin ---");
    const projectId = process.env.FIREBASE_PROJECT_ID;
    const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
    let privateKey = process.env.FIREBASE_PRIVATE_KEY;

    if (!projectId || !clientEmail || !privateKey) {
        console.error("ERRO: Variáveis do Firebase Admin ausentes.");
        return;
    }

    // Emular a lógica de src/lib/firebase/admin.ts
    privateKey = privateKey.replace(/\\n/g, "\n");

    try {
        if (!admin.apps.length) {
            admin.initializeApp({
                credential: admin.credential.cert({
                    projectId,
                    clientEmail,
                    privateKey,
                }),
            });
        }
        const db = admin.firestore();
        // Tenta listar coleções (mínimo privilégio de teste)
        const collections = await db.listCollections();
        console.log("Sucesso! Conectado ao Firebase. Coleções encontradas:", collections.length);
    } catch (error) {
        console.error("ERRO ao conectar com Firebase:", error.message);
    }
}

async function main() {
    await verifyGemini();
    await verifyFirebase();
    process.exit(0);
}

main();
