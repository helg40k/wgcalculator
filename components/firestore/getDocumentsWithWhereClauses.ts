import { DocumentData } from "@google-cloud/firestore";
import { WhereFilterOp } from "firebase/firestore";

import getFirestoreForApp from "./getFirestoreForApp";

/**
 * Given a collection reference and a where clauses array, return data from database
 * @param {object} collectionName - The Firestore collection name.
 * @param {array<[string, WhereFilterOp, any]>} where - A list of where clauses to apply to the query.
 * @return {Promise<DocumentData[]>} An array of data from database according to query.
 */
const getDocumentsWithWhereClauses = async (
  collectionName: string,
  where: [string, WhereFilterOp, any][],
): Promise<DocumentData[]> => {
  /* A way to assign a default value to a variable if it is not defined. */
  let refWithClauses: FirebaseFirestore.Query<
    FirebaseFirestore.DocumentData,
    FirebaseFirestore.DocumentData
  > = getFirestoreForApp().collection(collectionName);

  where.forEach(([fieldPath, operation, value]) => {
    refWithClauses = refWithClauses.where(fieldPath, operation, value);
  });

  const snapshot = await refWithClauses.get();
  return !snapshot.empty
    ? snapshot.docs.map((doc) => doc.data() as DocumentData)
    : ([] as DocumentData[]);
};

export default getDocumentsWithWhereClauses;
