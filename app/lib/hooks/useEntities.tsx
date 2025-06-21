import { useEffect, useState } from "react";
import { notification } from "antd";

import { Entity } from "@/app/lib/definitions";
import getCollectionData from "@/app/lib/services/firebase/helpers/getCollectionData";

import "@ant-design/v5-patch-for-react-19";

const options = {
  filters: undefined,
  limit: undefined,
  pagination: undefined,
  sort: undefined,
};

const useEntities = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error>();

  useEffect(() => {
    if (error) {
      notification.error({
        description: error.message || "Something in useEntities()",
        message: "Error",
      });
    }
  }, [error]);

  const saveEntity = async () => {
    try {
      setLoading(true);
      // body
    } catch (err: any) {
      console.error(err);
      setError(err);
    } finally {
      setLoading(false);
    }
  };

  const loadEntities = async <T extends Entity>(
    dbRef: string | null | undefined,
  ): Promise<T[]> => {
    if (!dbRef) {
      return [];
    }
    const type = dbRef as string;

    try {
      setLoading(true);
      return (await getCollectionData(type, options)) as T[];
    } catch (err: any) {
      console.error(err);
      setError(err);
    } finally {
      setLoading(false);
    }
    return [];
  };

  return { loadEntities, loading, saveEntity };
};

export default useEntities;
