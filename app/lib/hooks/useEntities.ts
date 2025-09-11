import { useCallback, useEffect, useState } from "react";
import { notification } from "antd";
import {
  DocumentSnapshot,
  OrderByDirection,
  WhereFilterOp,
} from "firebase/firestore";

import { Entity } from "@/app/lib/definitions";
import useUser from "@/app/lib/hooks/useUser";
import createDocument from "@/app/lib/services/firebase/helpers/createDocument";
import deleteDocument from "@/app/lib/services/firebase/helpers/deleteDocument";
import getCollectionData, {
  Props,
} from "@/app/lib/services/firebase/helpers/getCollectionData";
import { NEW_ENTITY_TEMP_ID } from "@/app/lib/services/firebase/helpers/getDocumentCreationBase";
import updateDocument from "@/app/lib/services/firebase/helpers/updateDocument";

import "@ant-design/v5-patch-for-react-19";

type EntityProps = {
  filters?: [string, WhereFilterOp, any][] | undefined;
  limit?: number | undefined;
  pagination?: DocumentSnapshot<any, any> | unknown[] | undefined;
  sort?: [string, OrderByDirection] | undefined;
  withoutSort?: boolean;
};

const useEntities = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error>();

  const { email } = useUser();

  useEffect(() => {
    if (error) {
      notification.error({
        description: error.message || "Something in useEntities()",
        message: "Error",
      });
    }
  }, [error]);

  const checkEmail = () => {
    if (!email) {
      throw new Error("Unauthorized modifying!");
    }
  };

  const prepareToSave = (entity: any) => {
    if (entity) {
      Object.keys(entity)
        .filter((key) => entity[key] === undefined)
        .forEach((key) => {
          entity[key] = null;
        });
    }
  };

  const deleteEntity = useCallback(
    async (
      dbRef: string | null | undefined,
      id: string | null | undefined,
    ): Promise<void> => {
      checkEmail();
      if (!dbRef || !id) {
        setError(
          new Error(
            !dbRef
              ? "Document site to delete is unknown!"
              : "Deleted document ID is empty!",
          ),
        );
        return;
      }
      const type = dbRef as string;

      try {
        setLoading(true);
        await deleteDocument(type, id);
      } catch (err: any) {
        console.error(err);
        setError(err);
      } finally {
        setLoading(false);
      }
    },
    [email],
  );

  const loadEntities = useCallback(
    async <T extends Entity>(
      dbRef: string | null | undefined,
      options?: EntityProps,
    ): Promise<T[]> => {
      if (!dbRef) {
        return [];
      }
      const type = dbRef as string;

      const opts: Props = {
        filters: options?.filters,
        limit: options?.limit,
        pagination: options?.pagination,
        sort: options?.sort,
        withoutSort: options?.withoutSort,
      };

      try {
        setLoading(true);
        return (await getCollectionData(type, opts)) as T[];
      } catch (err: any) {
        console.error(err);
        setError(err);
      } finally {
        setLoading(false);
      }
      return [];
    },
    [],
  );

  const saveEntity = useCallback(
    async <T extends Entity>(
      dbRef: string | null | undefined,
      entity: T,
    ): Promise<T | null> => {
      checkEmail();
      if (!dbRef || !entity) {
        setError(
          new Error(
            !dbRef
              ? "Document save destination is unknown!"
              : "Saved document is empty!",
          ),
        );
        return null;
      }
      const type = dbRef as string;

      try {
        setLoading(true);
        const id = entity._id;

        entity._updatedBy = email as string;
        prepareToSave(entity);
        if (id && NEW_ENTITY_TEMP_ID !== id) {
          return (await updateDocument(type, id, entity)) as T;
        } else {
          entity._createdBy = email as string;
          return (await createDocument(type, entity)) as T;
        }
      } catch (err: any) {
        console.error(err);
        setError(err);
      } finally {
        setLoading(false);
      }
      return null;
    },
    [email],
  );

  return { deleteEntity, loadEntities, loading, saveEntity };
};

export default useEntities;
