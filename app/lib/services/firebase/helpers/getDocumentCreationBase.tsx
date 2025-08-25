import { serverTimestamp } from "firebase/firestore";

import { EntityStatusRegistry } from "@/app/lib/definitions";

export const NEW_ENTITY_TEMP_ID = "new";

const getDocumentCreationBase = (_id: string | number) => {
  const now = serverTimestamp();
  return {
    _createdAt: now,
    _id,
    _isUpdated: false,
    _updatedAt: now,
    status: EntityStatusRegistry.ACTIVE,
  };
};

export default getDocumentCreationBase;
