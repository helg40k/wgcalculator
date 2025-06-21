import { useState } from "react";

const useEntities = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error>();

  const saveEntity = () => {
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

  const loadEntities = () => {
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

  return { error, loadEntities, loading, saveEntity };
};

export default useEntities;
