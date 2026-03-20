import { doc, deleteDoc } from 'firebase/firestore';
import { db } from '../client';

/**
 * Remove um documento específico no Firestore.
 * @param path Caminho completo do documento (ex: 'users/123')
 */
export async function deleteDocument(path: string): Promise<void> {
  const docRef = doc(db, path);
  await deleteDoc(docRef);
}
