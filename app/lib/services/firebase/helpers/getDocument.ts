import { doc, DocumentData, getDoc } from "firebase/firestore";

import firestore from "@/app/lib/services/firebase/utils/firestore";

/**
 * It gets a document from a collection in Firestore
 * @param collectionPath - The path to the collection you want to get the document from.
 * @param id - The id of the document you want to get.
 * @returns The data from the document
 */
const getDocument = async (
  collectionPath: string,
  id: string,
): Promise<DocumentData | undefined> => {
  const ref = doc(firestore, collectionPath, id);
  const docSnapshot = await getDoc(ref);
  return docSnapshot.data();
};

export default getDocument;
