import { getDatabase } from "firebase/database";

import app from "./app";

const rtdb = getDatabase(app);

export default rtdb;
