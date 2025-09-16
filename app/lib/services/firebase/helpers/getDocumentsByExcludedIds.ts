import {
  collection,
  DocumentData,
  documentId,
  getDocs,
  query,
  where,
} from "firebase/firestore";

import getDocuments from "@/app/lib/services/firebase/helpers/getDocuments";
import firestore from "@/app/lib/services/firebase/utils/firestore";

/**
 * Retrieves all documents from a Firestore collection which IDs are NOT in the array.
 * @param collectionPath - The path to the collection you want to get the document from.
 * @param excludedIds - The array of excluded IDs.
 * @returns The data from the documents
 */
const getDocumentsByExcludedIds = async (
  collectionPath: string,
  excludedIds: string[],
): Promise<DocumentData[]> => {
  if (!excludedIds.length || excludedIds.length > 10) {
    const documents = getDocuments(collectionPath, []);
    if (excludedIds.length) {
      return (await documents).filter((d) => !excludedIds.includes(d.id));
    }
    return documents;
  }

  const queryData = query(
    collection(firestore, collectionPath),
    where(documentId(), "not-in", excludedIds),
  );

  const querySnapshot = await getDocs(queryData);
  return querySnapshot.docs.map((doc) => doc?.data());
};

export default getDocumentsByExcludedIds;
