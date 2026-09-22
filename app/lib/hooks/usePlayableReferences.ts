import { useCallback, useContext, useEffect, useState } from "react";
import { deleteField } from "firebase/firestore";

import { GameSystemContext } from "@/app/lib/contexts/GameSystemContext";
import {
  CollectionName,
  Playable,
  Reference,
  References,
} from "@/app/lib/definitions";
import errorMessage from "@/app/lib/errorMessage";
import useUser from "@/app/lib/hooks/useUser";
import { getPlayableScopeFilters } from "@/app/lib/playableScope";
import getDocumentsByExcludedIds from "@/app/lib/services/firebase/helpers/getDocumentsByExcludedIds";
import getDocumentsByIds from "@/app/lib/services/firebase/helpers/getDocumentsByIds";
import updateDocument from "@/app/lib/services/firebase/helpers/updateDocument";

const usePlayableReferences = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error>();

  const { email } = useUser();
  const [gameSystem, selectedEdition] = useContext(GameSystemContext);

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

      const filters = getPlayableScopeFilters(gameSystem, selectedEdition);
      if (!filters) {
        return [];
      }

      const type = dbRef as string;

      try {
        setLoading(true);
        return (await getDocumentsByExcludedIds(
          type,
          excludedIds,
          filters,
        )) as T[];
      } catch (err: any) {
        console.error(err);
        setError(err);
      } finally {
        setLoading(false);
      }
      return [];
    },
    [gameSystem, selectedEdition],
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

  const reassignIncomingReferences = useCallback(
    async (
      oldReferencedId: string,
      assignments: Array<{
        collectionName: CollectionName;
        documentId: string;
        newReferencedId: string;
        reference: Reference;
      }>,
    ): Promise<boolean> => {
      checkEmail();
      if (!oldReferencedId) {
        setError(new Error("Saved document ID is unknown!"));
        return false;
      }
      if (assignments.length === 0) {
        return true;
      }

      try {
        setLoading(true);
        for (const {
          collectionName,
          documentId,
          newReferencedId,
          reference,
        } of assignments) {
          await updateDocument(collectionName, documentId, {
            _updatedBy: email as string,
            [`references.${oldReferencedId}`]: deleteField(),
            [`references.${newReferencedId}`]: reference,
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
    reassignIncomingReferences,
    removeIncomingReferences,
    saveReferences,
  };
};

export default usePlayableReferences;
