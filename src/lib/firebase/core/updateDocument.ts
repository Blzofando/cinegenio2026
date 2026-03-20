import { doc, updateDoc, DocumentData } from 'firebase/firestore';
import { db } from '../client';

/**
 * Atualiza um documento específico no Firestore.
 * @param path Caminho completo do documento (ex: 'users/123')
 * @param data Dados a serem atualizados
 */
export async function updateDocument(path: string, data: Partial<DocumentData>): Promise<void> {
  const docRef = doc(db, path);
  await updateDoc(docRef, data);
}
