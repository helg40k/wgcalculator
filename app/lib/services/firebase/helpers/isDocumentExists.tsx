import getDocument from './getDocument';

/**
 * Get a document from a collection by id, and return true if it exists, false otherwise.
 * @param collection - The name of the collection you want to check.
 * @param id - The id of the document you want to get.
 * @returns A boolean value
 */
const isDocumentExists = async (collection:string, id:string):Promise<boolean> => {
  const document = await getDocument(collection, id);
  return !!document?._id;
}

export default isDocumentExists
