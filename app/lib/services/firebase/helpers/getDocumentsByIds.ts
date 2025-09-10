import {
  collection,
  DocumentData,
  documentId,
  getDocs,
  query,
  where,
} from "firebase/firestore";

import firestore from "@/app/lib/services/firebase/utils/firestore";

/**
 * Retrieves several (alone?) documents from a Firestore collection based by their ID array.
 * @param collectionPath - The path to the collection you want to get the document from.
 * @param ids - The array of IDs.
 * @returns The data from the documents
 */
const getDocumentsByIds = async (
  collectionPath: string,
  ids: string[],
): Promise<DocumentData[]> => {
  if (!ids.length) {
    return [];
  }

  const chunks: string[][] = [];
  for (let i = 0; i < ids.length; i += 10) {
    chunks.push(ids.slice(i, i + 10));
  }

  const queries = chunks.map((chunk) =>
    getDocs(
      query(
        collection(firestore, collectionPath),
        where(documentId(), "in", chunk),
      ),
    ),
  );

  const snapshots = await Promise.all(queries);
  return snapshots.flatMap((snap) => snap.docs.map((doc) => doc?.data()));
};

export default getDocumentsByIds;
