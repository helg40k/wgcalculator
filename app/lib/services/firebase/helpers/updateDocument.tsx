import {doc, updateDoc, serverTimestamp, getDoc, DocumentData} from 'firebase/firestore';

import firestore from '@/app/lib/services/firebase/utils/firestore';
// import { LOG_TYPES } from '__constants__'
// import { createLog } from 'services/logs'

/**
 * It updates a document in a collection
 * @param collectionPath - The path to the collection you want to update.
 * @param id - The _id of the document you want to update.
 * @param data - The data to be updated.
 * @returns A promise that resolves to the data that was updated.
 */
const updateDocument = async (collectionPath:string, id:string, data:object):Promise<DocumentData|undefined> => {
  const ref = doc(firestore, collectionPath, id);
  const payload = {
    _updatedAt: serverTimestamp(),
    _isUpdated: true,
    ...data
  };
  await updateDoc(ref, payload);
  // createLog(LOG_TYPES.UPDATE, collectionPath, { ...data, _id })

  const docSnapshot = await getDoc(ref);
  return docSnapshot.data();
}

export default updateDocument;
