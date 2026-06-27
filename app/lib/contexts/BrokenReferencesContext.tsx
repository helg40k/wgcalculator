"use client";

import {
  createContext,
  ReactNode,
  useCallback,
  useMemo,
  useState,
} from "react";

import { CollectionName } from "@/app/lib/definitions";

const EMPTY_SET = new Set<string>();

export interface BrokenReferencesContextValue {
  getBrokenIds: (collectionName: CollectionName) => Set<string>;
  getCounts: () => Record<string, number>;
}

export interface BrokenReferencesManagerValue
  extends BrokenReferencesContextValue {
  setBrokenIds: (collectionName: CollectionName, ids: Set<string>) => void;
}

export const BrokenReferencesContext =
  createContext<BrokenReferencesContextValue | null>(null);

export const useBrokenReferencesState = (): BrokenReferencesManagerValue => {
  const [brokenMap, setBrokenMap] = useState<Map<CollectionName, Set<string>>>(
    new Map(),
  );

  const setBrokenIds = useCallback(
    (collectionName: CollectionName, ids: Set<string>) => {
      setBrokenMap((prev) => {
        const next = new Map(prev);
        next.set(collectionName, ids);
        return next;
      });
    },
    [],
  );

  const getBrokenIds = useCallback(
    (collectionName: CollectionName): Set<string> => {
      return brokenMap.get(collectionName) ?? EMPTY_SET;
    },
    [brokenMap],
  );

  const getCounts = useCallback((): Record<string, number> => {
    const result: Record<string, number> = {};
    for (const [collName, ids] of brokenMap) {
      if (ids.size > 0) {
        result[collName] = ids.size;
      }
    }
    return result;
  }, [brokenMap]);

  return useMemo(
    () => ({ getBrokenIds, getCounts, setBrokenIds }),
    [getBrokenIds, getCounts, setBrokenIds],
  );
};

export const BrokenReferencesProvider = ({
  children,
  value,
}: {
  children: ReactNode;
  value: BrokenReferencesContextValue;
}) => {
  return (
    <BrokenReferencesContext.Provider value={value}>
      {children}
    </BrokenReferencesContext.Provider>
  );
};
