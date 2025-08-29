import { useCallback, useEffect, useMemo, useState } from "react";
import { notification } from "antd";
import { usePathname } from "next/navigation";

import {
  CollectionName,
  CollectionRegistry,
  GameSystem,
} from "@/app/lib/definitions";
import getDocuments from "@/app/lib/services/firebase/helpers/getDocuments";

interface GameSystemUtils {
  getAllowedToRefer: (name: CollectionName) => CollectionName[];
}

const useGameSystem = (): [GameSystem | undefined, GameSystemUtils] => {
  const [gameSystem, setGameSystem] = useState<GameSystem | undefined>();
  const [error, setError] = useState<any>();
  const pathname = usePathname();

  useEffect(() => {
    if (error) {
      notification.error({
        description: error || "Something in useGameSystem()",
        message: "Error",
      });
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

  return [gameSystem, { getAllowedToRefer }];
};

export default useGameSystem;
