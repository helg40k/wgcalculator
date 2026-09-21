import { useCallback, useContext, useEffect, useMemo, useRef } from "react";

import { useMultiCollectionInvalidation } from "@/app/lib/collectionInvalidation";
import { BrokenReferencesManagerValue } from "@/app/lib/contexts/BrokenReferencesContext";
import { GameSystemContext } from "@/app/lib/contexts/GameSystemContext";
import { CollectionName, Playable } from "@/app/lib/definitions";
import { validateBrokenReferences } from "@/app/lib/hooks/useBrokenReferences";
import useEntities from "@/app/lib/hooks/useEntities";
import { getPlayableScopeFilters } from "@/app/lib/playableScope";

const useBrokenReferencesManager = (
  collections: readonly CollectionName[],
  manager: BrokenReferencesManagerValue,
): void => {
  const [gameSystem, selectedEdition] = useContext(GameSystemContext);
  const { loadEntities } = useEntities();
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const filters = useMemo(
    () => getPlayableScopeFilters(gameSystem, selectedEdition),
    [gameSystem, selectedEdition],
  );

  const validateCollection = useCallback(
    async (collectionName: CollectionName) => {
      if (!filters) return;

      const entities = await loadEntities<Playable>(collectionName, {
        filters,
        withoutSort: true,
      });

      const brokenIds = await validateBrokenReferences(entities);
      manager.setBrokenIds(collectionName, brokenIds);
    },
    [filters, loadEntities, manager],
  );

  const validateAll = useCallback(async () => {
    if (!filters) return;
    await Promise.all(collections.map(validateCollection));
  }, [collections, validateCollection, filters]);

  useEffect(() => {
    void validateAll();
  }, [validateAll]);

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
