import { DocumentData } from "@google-cloud/firestore";

import getFirestoreForApp from "./getFirestoreForApp";

/**
 * this method will fetch all document data from a firebase table (collection)
 * @param {string} collectionName - string that represents database collection name
 * @return {Promise<DocumentData[]>} - document data if fetch was successful
 */
const getDocuments = async (
  collectionName: string,
): Promise<DocumentData[]> => {
  /* A way to assign a default value to a variable if it is not defined. */
  const snapshot = await getFirestoreForApp().collection(collectionName).get();
  return !snapshot.empty
    ? snapshot.docs.map((doc) => doc.data() as DocumentData)
    : ([] as DocumentData[]);
};

export default getDocuments;
