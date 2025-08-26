import { useEffect, useMemo, useState } from "react";
import { notification } from "antd";
import { usePathname } from "next/navigation";

import { CollectionRegistry, GameSystem } from "@/app/lib/definitions";
import getDocuments from "@/app/lib/services/firebase/helpers/getDocuments";

const useGameSystem = () => {
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

  return gameSystem;
};

export default useGameSystem;
