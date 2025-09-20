import { useCallback, useEffect, useState } from "react";

import { Playable } from "@/app/lib/definitions";
import errorMessage from "@/app/lib/errorMessage";
import getDocumentsByExcludedIds from "@/app/lib/services/firebase/helpers/getDocumentsByExcludedIds";
import getDocumentsByIds from "@/app/lib/services/firebase/helpers/getDocumentsByIds";

const usePlayableReferences = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error>();

  useEffect(() => {
    if (error) {
      errorMessage(error?.message || "Something in useLoadReferences()");
    }
  }, [error]);

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

  return { loadEntitiesForReferences, loadReferences, loading };
};

export default usePlayableReferences;
