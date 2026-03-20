import { collection, addDoc, DocumentData } from 'firebase/firestore';
import { db } from '../client';

/**
 * Adiciona um novo documento a uma coleção no Firestore.
 * @param collectionPath Caminho da coleção (ex: 'users')
 * @param data Dados do novo documento
 */
export async function addDocument<T = DocumentData>(collectionPath: string, data: T): Promise<string> {
  const colRef = collection(db, collectionPath);
  const docRef = await addDoc(colRef, data as any);
  return docRef.id;
}
