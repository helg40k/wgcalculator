import { deleteDoc, doc } from 'firebase/firestore';

import firestore from '@/app/lib/services/firebase/utils/firestore';

// import { LOG_TYPES } from '__constants__'
// import { createLog } from 'services/logs'

/**
 * It deletes a document from a collection in Firestore
 * @param collectionPath - The path to the collection you want to delete a document from.
 * @param id - The id of the document you want to delete.
 * @returns The result of the deleteDoc function.
 */
const deleteDocument = async (collectionPath:string, id:string):Promise<void> => {
  await deleteDoc(doc(firestore, collectionPath, id));
  // createLog(LOG_TYPES.DELETE, collectionPath, { _id: id });
}

export default deleteDocument;
