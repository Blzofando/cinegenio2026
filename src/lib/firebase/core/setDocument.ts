import { doc, setDoc, DocumentData } from 'firebase/firestore';
import { db } from '../client';

/**
 * Define (cria ou sobrescreve) um documento específico no Firestore com um ID pré-definido.
 * @param path Caminho completo do documento (ex: 'users/123')
 * @param data Dados do documento
 */
export async function setDocument<T = DocumentData>(
  path: string, 
  data: T, 
  options: { merge?: boolean; mergeFields?: string[] } = {}
): Promise<void> {
  const docRef = doc(db, path);
  await setDoc(docRef, data as any, options);
}
