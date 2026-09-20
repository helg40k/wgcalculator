import { useEffect, useMemo, useState } from "react";

import { CollectionRegistry, Edition, GameSystem } from "@/app/lib/definitions";
import errorMessage from "@/app/lib/errorMessage";
import getActiveSystemEditions from "@/app/lib/getActiveSystemEditions";
import getDocumentsByIds from "@/app/lib/services/firebase/helpers/getDocumentsByIds";

const getEnabledEditionIds = (gameSystem?: GameSystem): string[] => {
  if (!gameSystem?.editions) {
    return [];
  }

  return Object.entries(gameSystem.editions)
    .filter(([, isEnabled]) => isEnabled)
    .map(([id]) => id);
};

const useSystemEditions = (gameSystem?: GameSystem): Edition[] => {
  const [editions, setEditions] = useState<Edition[]>([]);
  const [error, setError] = useState<Error>();

  const enabledIds = useMemo(
    () => getEnabledEditionIds(gameSystem),
    [gameSystem],
  );

  useEffect(() => {
    if (error) {
      errorMessage(error.message || "Something in useSystemEditions()");
    }
  }, [error]);

  useEffect(() => {
    if (!gameSystem || enabledIds.length === 0) {
      setEditions([]);
      return;
    }

    let isCancelled = false;

    getDocumentsByIds(CollectionRegistry.Editions, enabledIds)
      .then((docs) => {
        if (isCancelled) {
          return;
        }
        setError(undefined);
        setEditions(docs as Edition[]);
      })
      .catch((reason) => {
        if (isCancelled) {
          return;
        }
        console.error("useSystemEditions()", reason);
        setError(reason);
        setEditions([]);
      });

    return () => {
      isCancelled = true;
    };
  }, [enabledIds, gameSystem]);

  return useMemo(
    () => getActiveSystemEditions(gameSystem, editions),
    [editions, gameSystem],
  );
};

export default useSystemEditions;
