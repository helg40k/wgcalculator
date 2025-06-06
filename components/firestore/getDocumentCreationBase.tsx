import { FieldValue } from 'firebase-admin/firestore';

const getDocumentCreationBase = (_id: string|number) => {
  return {
    _id,
    _createdAt: FieldValue.serverTimestamp(),
    _updatedAt: FieldValue.serverTimestamp(),
    _updatedBy: null,
    _isUpdated: false
  };
};

export default getDocumentCreationBase;
