import { FieldValue } from "firebase-admin/firestore";

const getDocumentCreationBase = (_id: string | number) => {
  const now = FieldValue.serverTimestamp();
  return {
    _createdAt: now,
    _id,
    _isUpdated: false,
    _updatedAt: now,
  };
};

export default getDocumentCreationBase;
