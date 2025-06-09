import { getFirestore } from "firebase/firestore";

import app from "./app";

const databaseId = process.env.NEXT_PUBLIC_DATABASE_ID || "(default)";
const firestore = getFirestore(app, databaseId);

export default firestore;
