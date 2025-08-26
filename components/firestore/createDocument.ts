import getDocumentCreationBase from "./getDocumentCreationBase";
import getFirestoreForApp from "./getFirestoreForApp";

/**
 * this method will create document in the firebase database with provided data with id if specified
 * @param {string} collectionName - string that represents database collection name
 * @param {object} dataToSave - represents object with document data that will used for data saving in the document
 * @param {string|number} [documentId] - represents document id to use, instead of randomly generated (based on the collection name and firebase SDK)
 * @param {boolean} returnDoc - boolean that indicates what to return after successful document creation - whole document if true, documentId if false
 * @param {boolean} isDocumentSet - boolean that indicates whether 'set' method of firestore or 'create' method use
 * @return {Promise<string|number|null>} - new (created) document id or null if something went wrong (firebase database was not initialized)
 */
const createDocument = async (
  collectionName: string,
  dataToSave: object,
  documentId?: string | number,
  returnDoc: boolean = false,
  isDocumentSet: boolean = false,
): Promise<object | string | number | null> => {
  /* A way to assign a default value to a variable if it is not defined. */
  const baseRefComputed = getFirestoreForApp();
  const documentRef = baseRefComputed.collection(collectionName).doc();

  const newDocumentIdComputed = documentId || documentRef.id;

  const documentBody = {
    ...dataToSave,
    ...getDocumentCreationBase(newDocumentIdComputed),
  };

  const finalQueryRef = baseRefComputed
    .collection(collectionName)
    .doc(newDocumentIdComputed.toString());
  if (isDocumentSet) {
    await finalQueryRef.set(documentBody);
  } else {
    await finalQueryRef.create(documentBody);
  }

  // returning of the new document id or document body
  return returnDoc ? documentBody : newDocumentIdComputed;
};

export default createDocument;
