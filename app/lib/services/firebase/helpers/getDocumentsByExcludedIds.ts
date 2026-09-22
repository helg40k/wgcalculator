import {
  collection,
  DocumentData,
  documentId,
  getDocs,
  query,
  where,
  WhereFilterOp,
} from "firebase/firestore";

import getDocuments from "@/app/lib/services/firebase/helpers/getDocuments";
import firestore from "@/app/lib/services/firebase/utils/firestore";

type DocumentFilters = Array<[string, WhereFilterOp, any]>;

const excludeByIds = (
  documents: DocumentData[],
  excludedIds: string[],
): DocumentData[] => {
  if (!excludedIds.length) {
    return documents;
  }

  return documents.filter((doc) => {
    const id = doc._id ?? doc.id;
    return !excludedIds.includes(id);
  });
};

/**
 * Retrieves all documents from a Firestore collection which IDs are NOT in the array.
 * @param collectionPath - The path to the collection you want to get the document from.
 * @param excludedIds - The array of excluded IDs.
 * @param filters - Optional field filters. When set, query by filters then drop excluded IDs in memory.
 * @returns The data from the documents
 */
const getDocumentsByExcludedIds = async (
  collectionPath: string,
  excludedIds: string[],
  filters?: DocumentFilters,
): Promise<DocumentData[]> => {
  if (filters) {
    const scopedDocuments = await getDocuments(collectionPath, filters);
    return excludeByIds(scopedDocuments, excludedIds);
  }

  if (!excludedIds.length || excludedIds.length > 10) {
    const documents = await getDocuments(collectionPath, []);
    return excludeByIds(documents, excludedIds);
  }

  const queryData = query(
    collection(firestore, collectionPath),
    where(documentId(), "not-in", excludedIds),
  );

  const querySnapshot = await getDocs(queryData);
  return querySnapshot.docs.map((doc) => doc?.data());
};

export default getDocumentsByExcludedIds;
