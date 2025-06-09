import { Firestore } from "@google-cloud/firestore";
import { getFirestore } from "firebase-admin/firestore";

import getFirebaseAppInstance from "@/components/firebase/app";

/**
 * returns firestore object; otherwise throws an error
 * if the firestore is not initialized on the moment of the call
 */
const getFirestoreForApp = (): Firestore => {
  const databaseId = process.env.NEXT_PUBLIC_DATABASE_ID;
  if (!databaseId) {
    throw new Error("Firebase is not initialized, database ID is not defined");
  }

  const firestore = getFirestore(getFirebaseAppInstance(), databaseId);
  if (!firestore) {
    throw new Error("Firebase is not initialized, firestore is not defined");
  }
  return firestore;
};

export default getFirestoreForApp;
