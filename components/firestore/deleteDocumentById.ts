import getFirestoreForApp from "./getFirestoreForApp";

/**
 * this method will delete document by provided id and collectionPath
 * @param {string} collectionName - string that represents database collection path
 * @param {string|number} id - represents document id
 * @return {Promise<string|number>} - deleted document id
 */
const deleteDocumentById = async (
  collectionName: string,
  id: string | number,
): Promise<string | number> => {
  /* A way to assign a default value to a variable if it is not defined. */
  await getFirestoreForApp()
    .collection(collectionName)
    .doc(id.toString())
    .delete();
  return id;
};

export default deleteDocumentById;
