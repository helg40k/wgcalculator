import { FieldValue } from "firebase-admin/firestore";

const getDocumentCreationBase = (_id: string | number) => {
  return {
    _createdAt: FieldValue.serverTimestamp(),
    _id,
    _isUpdated: false,
    _updatedAt: FieldValue.serverTimestamp(),
    _updatedBy: null,
  };
};

export default getDocumentCreationBase;
