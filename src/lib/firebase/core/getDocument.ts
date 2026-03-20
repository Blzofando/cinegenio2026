import { doc, getDoc, DocumentData, DocumentSnapshot } from 'firebase/firestore';
import { db } from '../client';

/**
 * Busca um documento específico no Firestore.
 * @param path Caminho completo do documento (ex: 'users/123')
 */
export async function getDocument<T = DocumentData>(path: string): Promise<T | null> {
  const docRef = doc(db, path);
  const docSnap = await getDoc(docRef);

  if (docSnap.exists()) {
    return { id: docSnap.id, ...docSnap.data() } as T;
  }

  return null;
}
