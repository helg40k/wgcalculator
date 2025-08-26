import { doc, getDoc, setDoc } from "firebase/firestore";

import firestore from "@/app/lib/services/firebase/utils/firestore";

import getDocumentCreationBase from "./getDocumentCreationBase";
import getId from "./getId";

// import { LOG_TYPES } from '__constants__'
// import { createLog } from 'services/logs'

/**
 * It creates a document in a collection with a given ID
 * @param collectionPath - The path to the collection you want to create a document in.
 * @param documentData - The data you want to store in the document.
 * @param id - The id of the document to create. If not provided, a random id will be generated.
 * @returns The id of the document that was created.
 */
const createDocument = async (
  collectionPath: string,
  documentData: object,
  id?: string,
) => {
  const _id = id || getId(collectionPath);
  const ref = doc(firestore, collectionPath, _id);
  const data = {
    ...documentData,
    ...getDocumentCreationBase(_id),
  };

  await setDoc(ref, data);
  // createLog(LOG_TYPES.CREATE, collectionPath, data);

  const docSnapshot = await getDoc(ref);
  return docSnapshot.data();
};

export default createDocument;
