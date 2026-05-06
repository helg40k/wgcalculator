import { useEffect } from "react";

import { CollectionName } from "@/app/lib/definitions";

const eventTarget = new EventTarget();
const EVENT_NAME = "collection-invalidated";

export function invalidateCollections(collections: CollectionName[]): void {
  const unique = [...new Set(collections)];
  for (const name of unique) {
    eventTarget.dispatchEvent(new CustomEvent(EVENT_NAME, { detail: name }));
  }
}

export function useCollectionInvalidation(
  collection: CollectionName,
  callback: () => void,
): void {
  useEffect(() => {
    const handler = (e: Event) => {
      if ((e as CustomEvent).detail === collection) callback();
    };
    eventTarget.addEventListener(EVENT_NAME, handler);
    return () => eventTarget.removeEventListener(EVENT_NAME, handler);
  }, [collection, callback]);
}
