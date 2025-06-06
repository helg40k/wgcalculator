import getFirestoreForApp from './getFirestoreForApp';
import { DocumentData, FieldValue } from "@google-cloud/firestore";

const UPDATED_BY_CONSTANT = 'NEXT_BACKEND';

/**
 * this method will update document in the firebase database by provided id
 * @param {string} collectionName - string that represents database collection name
 * @param {object} data - represents object with document data that will be merged with actual document (rewritten)
 * @param {string|number} id - represents document id
 * @return {Promise<DocumentData|undefined>} - firebase updating operation object
 */
const updateDocumentById = async (
    collectionName: string,
    data: { _updatedBy: string|null },
    id: string|number
): Promise<DocumentData|undefined> => {
  /* A way to assign a default value to a variable if it is not defined. */
  const baseRefComputed = getFirestoreForApp();
  const payload = {
    _updatedAt: FieldValue.serverTimestamp(),
    _isUpdated: true,
    ...data
  };
  if (!data._updatedBy) {
    payload._updatedBy = UPDATED_BY_CONSTANT;
  }

  // "received RST_STREAM" error workaround
  // https://stackoverflow.com/questions/69590889/js-sdk-v2-0-16-error-13-internal-received-rst-stream-with-code-0
  let count = 0;
  while (count < 2) {
    try {
      count++;
      return await baseRefComputed
      .collection(collectionName)
      .doc(id.toString())
      .update(payload);
    } catch (error) {
      console.error(
          `Error during updating operation for '${collectionName}' ID: ${id}`,
          error
      );
      if (!(error as Error).message.includes('RST_STREAM')) {
        throw error; // do not retry the operation if it's not RST_STREAM error
      }
    }
  }
};

export default updateDocumentById;
