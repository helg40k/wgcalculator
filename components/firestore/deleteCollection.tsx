import getFirestoreForApp from './getFirestoreForApp';
import { Firestore, Query } from "@google-cloud/firestore";

const deleteCollection = async (
    collectionName: string,
    batchSize = 15
) => {
  const db = getFirestoreForApp();
  const query = getFirestoreForApp()
    .collection(collectionName).orderBy('_id').limit(batchSize);

  return new Promise((resolve, reject) => {
    deleteQueryBatch(getFirestoreForApp(), query, resolve).catch(reject);
  });
};

const deleteQueryBatch = async (db:Firestore, query:Query, resolve:Function) => {
  const snapshot = await query.get();

  const batchSize = snapshot.size;
  if (batchSize === 0) {
    // When there are no documents left, we are done
    resolve();
    return;
  }

  // Delete documents in a batch
  const batch = db.batch();
  snapshot.docs.forEach((doc) => {
    batch.delete(doc.ref);
  });
  await batch.commit();

  // Recurse on the next process tick, to avoid
  // exploding the stack.
  process.nextTick(() => {
    deleteQueryBatch(db, query, resolve);
  });
};

export default deleteCollection;
