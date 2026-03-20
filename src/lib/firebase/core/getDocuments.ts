import { collection, getDocs, DocumentData, QueryConstraint, query } from 'firebase/firestore';
import { db } from '../client';

/**
 * Busca todos os documentos de uma coleção no Firestore com suporte a filtros.
 * @param path Caminho da coleção (ex: 'users/123/watchedItems')
 * @param constraints Opcional. Restrições de consulta (where, orderBy, limit, etc.)
 */
export async function getDocuments<T = DocumentData>(path: string, ...constraints: QueryConstraint[]): Promise<T[]> {
  const colRef = collection(db, path);
  const q = query(colRef, ...constraints);
  const querySnapshot = await getDocs(q);
  
  return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as T));
}
