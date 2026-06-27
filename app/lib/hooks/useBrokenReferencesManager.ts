import { useCallback, useContext, useEffect, useRef } from "react";

import { useMultiCollectionInvalidation } from "@/app/lib/collectionInvalidation";
import { BrokenReferencesManagerValue } from "@/app/lib/contexts/BrokenReferencesContext";
import { GameSystemContext } from "@/app/lib/contexts/GameSystemContext";
import { CollectionName, Playable } from "@/app/lib/definitions";
import { validateBrokenReferences } from "@/app/lib/hooks/useBrokenReferences";
import useEntities from "@/app/lib/hooks/useEntities";

const useBrokenReferencesManager = (
  collections: readonly CollectionName[],
  manager: BrokenReferencesManagerValue,
): void => {
  const [gameSystem] = useContext(GameSystemContext);
  const { loadEntities } = useEntities();
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const validateCollection = useCallback(
    async (collectionName: CollectionName) => {
      if (!gameSystem?._id) return;

      const entities = await loadEntities<Playable>(collectionName, {
        filters: [["systemId", "==", gameSystem._id]],
        withoutSort: true,
      });

      const brokenIds = await validateBrokenReferences(entities);
      manager.setBrokenIds(collectionName, brokenIds);
    },
    [gameSystem?._id, loadEntities, manager],
  );

  const validateAll = useCallback(async () => {
    if (!gameSystem?._id) return;
    await Promise.all(collections.map(validateCollection));
  }, [collections, validateCollection, gameSystem?._id]);

  useEffect(() => {
    void validateAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- run on mount and when gameSystem changes
  }, [gameSystem?._id]);

  const handleInvalidation = useCallback(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
    debounceRef.current = setTimeout(() => {
      debounceRef.current = null;
      void validateAll();
    }, 100);
  }, [validateAll]);

  useEffect(() => {
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, []);

  useMultiCollectionInvalidation(collections, handleInvalidation);
};

export default useBrokenReferencesManager;
