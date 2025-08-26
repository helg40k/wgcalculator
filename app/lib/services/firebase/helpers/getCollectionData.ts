import {
  DocumentData,
  DocumentSnapshot,
  getDocs,
  OrderByDirection,
  WhereFilterOp,
} from "firebase/firestore";

import collectionQuery from "@/app/lib/services/firebase/helpers/collectionQuery";

export type Props = {
  filters: Array<[string, WhereFilterOp, any]> | undefined;
  sort: [string, OrderByDirection] | undefined;
  limit: number | undefined;
  pagination: DocumentSnapshot<any, any> | unknown[] | undefined;
};

/**
 * Retrieves a big amount of data from a Firestore collection based on the provided parameters.
 *
 * @param collectionPath - The path to the collection you want to get the document from.
 * @param options - Additional options for filtering, sorting, limiting, and pagination.
 *
 * @returns A promise that resolves to an array of documents from the collection.
 */
const getCollectionData = async (
  collectionPath: string,
  { filters, sort, limit: limitCount, pagination }: Props,
): Promise<DocumentData[]> => {
  const quer = collectionQuery(
    collectionPath,
    filters,
    sort,
    limitCount,
    pagination,
  );
  const snapshot = await getDocs(quer);
  return snapshot.docs.map((doc) => doc.data());
};

export default getCollectionData;
