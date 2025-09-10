import { useEffect, useState } from "react";
import { notification } from "antd";

import { Entity } from "@/app/lib/definitions";
import getDocumentsByIds from "@/app/lib/services/firebase/helpers/getDocumentsByIds";

const useLoadReferences = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error>();

  useEffect(() => {
    if (error) {
      notification.error({
        description: error.message || "Something in useLoadReferences()",
        message: "Error",
      });
    }
  }, [error]);

  const loadReferences = async <T extends Entity>(
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
  };

  return { loadReferences, loading };
};

export default useLoadReferences;
