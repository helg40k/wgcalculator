import { useCallback, useEffect, useState } from "react";
import { deleteField } from "firebase/firestore";

import { CollectionName, Playable, References } from "@/app/lib/definitions";
import errorMessage from "@/app/lib/errorMessage";
import useUser from "@/app/lib/hooks/useUser";
import getDocumentsByExcludedIds from "@/app/lib/services/firebase/helpers/getDocumentsByExcludedIds";
import getDocumentsByIds from "@/app/lib/services/firebase/helpers/getDocumentsByIds";
import updateDocument from "@/app/lib/services/firebase/helpers/updateDocument";

const usePlayableReferences = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error>();

  const { email } = useUser();

  useEffect(() => {
    if (error) {
      errorMessage(error?.message || "Something in usePlayableReferences()");
    }
  }, [error]);

  const checkEmail = () => {
    if (!email) {
      throw new Error("Unauthorized modifying!");
    }
  };

  const loadReferences = useCallback(
    async <T extends Playable>(
      dbRef: string | null | undefined,
      ids: string[],
    ): Promise<T[]> => {
      if (!dbRef) {
        return [];
      }
      const type = dbRef as string;

      try {
        setLoading(true);
        return (await getDocumentsByIds(type, ids)) as T[];
      } catch (err: any) {
        console.error(err);
        setError(err);
      } finally {
        setLoading(false);
      }
      return [];
    },
    [],
  );

  const loadEntitiesForReferences = useCallback(
    async <T extends Playable>(
      dbRef: string | null | undefined,
      excludedIds: string[],
    ): Promise<T[]> => {
      if (!dbRef) {
        return [];
      }
      const type = dbRef as string;

      try {
        setLoading(true);
        return (await getDocumentsByExcludedIds(type, excludedIds)) as T[];
      } catch (err: any) {
        console.error(err);
        setError(err);
      } finally {
        setLoading(false);
      }
      return [];
    },
    [],
  );

  const saveReferences = useCallback(
    async <T extends Playable>(
      dbRef: string | null | undefined,
      id: string,
      references?: References,
    ): Promise<T | null> => {
      checkEmail();
      if (!dbRef || !id) {
        setError(
          new Error(
            !dbRef
              ? "Document save destination is unknown!"
              : "Saved document ID is unknown!",
          ),
        );
        return null;
      }
      const type = dbRef as string;

      try {
        setLoading(true);

        const entity = {
          _updatedBy: email as string,
          references: references ?? {},
        };
        return (await updateDocument(type, id, entity)) as T;
      } catch (err: any) {
        console.error(err);
        setError(err);
      } finally {
        setLoading(false);
      }
      return null;
    },
    [email],
  );

  const removeIncomingReferences = useCallback(
    async (
      referencedEntityId: string,
      removals: Array<{ collectionName: CollectionName; documentId: string }>,
    ): Promise<boolean> => {
      checkEmail();
      if (!referencedEntityId) {
        setError(new Error("Saved document ID is unknown!"));
        return false;
      }
      if (removals.length === 0) {
        return true;
      }

      try {
        setLoading(true);
        for (const { collectionName, documentId } of removals) {
          await updateDocument(collectionName, documentId, {
            _updatedBy: email as string,
            [`references.${referencedEntityId}`]: deleteField(),
          });
        }
        return true;
      } catch (err: any) {
        console.error(err);
        setError(err);
        return false;
      } finally {
        setLoading(false);
      }
    },
    [email],
  );

  return {
    loadEntitiesForReferences,
    loadReferences,
    loading,
    removeIncomingReferences,
    saveReferences,
  };
};

export default usePlayableReferences;
