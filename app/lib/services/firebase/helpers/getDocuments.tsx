import {collection, DocumentData, getDocs, WhereFilterOp, query, where} from 'firebase/firestore';

import firestore from '@/app/lib/services/firebase/utils/firestore';

/**
 * Retrieves several (alone?) documents from a Firestore collection based on the provided parameters.
 * @param collectionPath - The path to the collection you want to get the document from.
 * @param filters - The condition(s).
 * @returns The data from the documents
 */
const getDocuments = async (collectionPath:string, filters: Array<[string, WhereFilterOp, any]>):Promise<DocumentData[]> => {
  const queryData = query(
    collection(firestore, collectionPath),
    ...(filters?.map?.((rule) => where(...rule)) || []));

  const querySnapshot = await getDocs(queryData);
  return querySnapshot.docs.map((doc) => doc?.data());
}

export default getDocuments
