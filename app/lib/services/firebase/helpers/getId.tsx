import { collection, doc } from "firebase/firestore";

import firestore from "@/app/lib/services/firebase/utils/firestore";

/**
 * It returns the id of a document in a collection
 * @returns The id of the document
 */
const getId = (collectionPath: string): string => {
  const ref = doc(collection(firestore, collectionPath));
  return ref.id;
};

export default getId;
