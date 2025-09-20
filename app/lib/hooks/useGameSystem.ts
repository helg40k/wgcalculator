import { useCallback, useEffect, useMemo, useState } from "react";
import { usePathname } from "next/navigation";

import {
  CollectionName,
  CollectionRegistry,
  GameSystem,
} from "@/app/lib/definitions";
import errorMessage from "@/app/lib/errorMessage";
import getDocuments from "@/app/lib/services/firebase/helpers/getDocuments";

interface GameSystemUtils {
  canBeMentionedBy: (name: CollectionName) => CollectionName[];
  getAllowedToRefer: (name: CollectionName) => CollectionName[];
}

const useGameSystem = (): [GameSystem | undefined, GameSystemUtils] => {
  const [gameSystem, setGameSystem] = useState<GameSystem | undefined>();
  const [error, setError] = useState<Error>();
  const pathname = usePathname();

  useEffect(() => {
    if (error) {
      errorMessage(error?.message || "Something in useGameSystem()");
    }
  }, [error]);

  const key = useMemo(() => {
    return pathname ? pathname.slice(1).split("/")[0] : "";
  }, [pathname]);

  useEffect(() => {
    getDocuments(CollectionRegistry.GameSystem, [["key", "==", key]])
      .then((docs) => {
        const systems = docs as GameSystem[];
        setError(undefined);
        setGameSystem(systems.length ? systems[0] : undefined);
      })
      .catch((reason) => {
        console.error("useGameSystem()", reason);
        setError(reason);
        setGameSystem(undefined);
      });
  }, [key]);

  const getAllowedToRefer = useCallback(
    (name: CollectionName): CollectionName[] => {
      if (!gameSystem?.referenceHierarchy) {
        return [];
      }
      return gameSystem.referenceHierarchy[name] || [];
    },
    [gameSystem?.referenceHierarchy],
  );

  const canBeMentionedBy = useCallback(
    (name: CollectionName): CollectionName[] => {
      if (!gameSystem?.referenceHierarchy) {
        return [];
      }
      return Object.entries(gameSystem.referenceHierarchy)
        .filter(([, references]) =>
          references.some((colName) => colName === name),
        )
        .map(([collectionKey]) => collectionKey as CollectionName);
    },
    [gameSystem?.referenceHierarchy],
  );

  return [gameSystem, { canBeMentionedBy, getAllowedToRefer }];
};

export default useGameSystem;
