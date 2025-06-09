import {
  collection,
  DocumentSnapshot,
  limit,
  orderBy,
  OrderByDirection,
  query,
  startAfter,
  where,
  WhereFilterOp,
} from "firebase/firestore";

import firestore from "@/app/lib/services/firebase/utils/firestore";

const baseSortRule: [string, OrderByDirection] = ["_createdAt", "desc"];
const baseLimitRule: number = 100;

const collectionQuery = (
  collectionPath: string,
  filters: Array<[string, WhereFilterOp, any]> | undefined,
  sort: [string, OrderByDirection] | undefined,
  limitCount: number | undefined,
  pagination: DocumentSnapshot<any, any> | unknown[] | undefined,
) => {
  const collRef = collection(firestore, collectionPath);
  let q = query(collRef);

  // for future: add groups for OR implementing
  // filters.forEach((filterGroup) => {
  //   if (Array.isArray(filterGroup)) {
  //     const conditions = filterGroup
  //     .map((filter) => {
  //       if (filter.field && filter.operator && filter.value !== undefined) {
  //         return where(filter.field, filter.operator, filter.value)
  //       }
  //     })
  //     .filter(Boolean) // remove any undefined values
  //
  //     if (conditions.length > 0) {
  //       q = query(q, or(...conditions))
  //     }
  //   }
  if (filters) {
    filters.forEach((filter) => {
      if (filter[0] && filter[1] && filter[2] !== undefined) {
        q = query(q, where(...filter));
      }
    });
  }

  if (sort && sort[0] && sort[1]) {
    q = query(q, orderBy(...sort));
  } else {
    q = query(q, orderBy(...baseSortRule));
  }

  if (limitCount) {
    q = query(q, limit(limitCount));
  }

  if (pagination) {
    q = query(q, startAfter(pagination));
  }
  return q;
};

export default collectionQuery;
