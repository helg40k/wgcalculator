import getFirestoreForApp from './getFirestoreForApp';
import { DocumentData } from "@google-cloud/firestore";

/**
 * this method will fetch document data from firebase by provided id
 * @param {string} collectionName - string that represents database collection name
 * @param {string|number} id - that represents document id
 * @return {Promise<DocumentData|null>} - document data if fetch was successful or null if something went wrong
 */
const getDocumentById = async (
    collectionName: string,
    id: string|number
): Promise<DocumentData | null> => {
  /* A way to assign a default value to a variable if it is not defined. */
  const queryDocument = await getFirestoreForApp()
  .collection(collectionName)
  .doc(id.toString())
  .get();
  const queryDocumentData = queryDocument.exists && queryDocument.data();

  return queryDocumentData || null;
};

export default getDocumentById;
