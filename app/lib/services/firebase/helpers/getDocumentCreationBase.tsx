import { serverTimestamp } from "firebase/firestore";

export const NEW_ENTITY_TEMP_ID = "new";

const getDocumentCreationBase = (_id: string | number) => {
  const now = serverTimestamp();
  return {
    _createdAt: now,
    _id,
    _isUpdated: false,
    _updatedAt: now,
  };
};

export default getDocumentCreationBase;
