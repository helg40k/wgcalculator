import { useEffect, useMemo, useRef, useState } from "react";

import { CollectionName, Playable } from "@/app/lib/definitions";
import getDocumentsByIds from "@/app/lib/services/firebase/helpers/getDocumentsByIds";

const groupReferencesByCollection = (
  entities: Playable[],
): Map<CollectionName, Map<string, Set<string>>> => {
  const result = new Map<CollectionName, Map<string, Set<string>>>();

  for (const entity of entities) {
    if (!entity.references || Object.keys(entity.references).length === 0) {
      continue;
    }

    for (const [refId, ref] of Object.entries(entity.references)) {
      if (!result.has(ref.name)) {
        result.set(ref.name, new Map());
      }
      const collMap = result.get(ref.name)!;
      if (!collMap.has(refId)) {
        collMap.set(refId, new Set());
      }
      collMap.get(refId)!.add(entity._id);
    }
  }

  return result;
};

const useBrokenReferences = (entities: Playable[]): Set<string> => {
  const [brokenEntityIds, setBrokenEntityIds] = useState<Set<string>>(
    new Set(),
  );
  const abortRef = useRef(false);

  const fingerprint = useMemo(() => {
    return entities
      .filter((e) => e.references && Object.keys(e.references).length > 0)
      .map((e) => `${e._id}:${Object.keys(e.references!).sort().join(",")}`)
      .sort()
      .join("|");
  }, [entities]);

  useEffect(() => {
    if (!fingerprint) {
      setBrokenEntityIds(new Set());
      return;
    }

    abortRef.current = false;

    const validate = async () => {
      const grouped = groupReferencesByCollection(entities);
      const broken = new Set<string>();

      const queries: Array<{
        collectionName: CollectionName;
        refIds: string[];
      }> = [];
      for (const [collectionName, refIdToEntities] of grouped) {
        queries.push({
          collectionName,
          refIds: [...refIdToEntities.keys()],
        });
      }

      const results = await Promise.all(
        queries.map(({ collectionName, refIds }) =>
          getDocumentsByIds(collectionName, refIds).then((docs) => ({
            collectionName,
            refIds,
            returnedIds: new Set(
              docs.map((doc) => doc._id as string).filter(Boolean),
            ),
          })),
        ),
      );

      if (abortRef.current) return;

      for (const { collectionName, refIds, returnedIds } of results) {
        const collMap = grouped.get(collectionName)!;
        for (const refId of refIds) {
          if (!returnedIds.has(refId)) {
            const ownerEntities = collMap.get(refId);
            if (ownerEntities) {
              for (const entityId of ownerEntities) {
                broken.add(entityId);
              }
            }
          }
        }
      }

      setBrokenEntityIds(broken);
    };

    void validate();

    return () => {
      abortRef.current = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- fingerprint captures reference changes; entities ref used inside validate
  }, [fingerprint]);

  return brokenEntityIds;
};

export default useBrokenReferences;
