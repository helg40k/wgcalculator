"use client";

import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

import { useMultiCollectionInvalidation } from "@/app/lib/collectionInvalidation";
import { GameSystemContext } from "@/app/lib/contexts/GameSystemContext";
import { CollectionName, Mentions, Playable } from "@/app/lib/definitions";
import useEntities from "@/app/lib/hooks/useEntities";

interface MentionsContextType {
  getMentions: (entityId: string) => Mentions;
  reloadMentions: () => void;
  readonly mentionsLoaded: boolean;
}

export const MentionsContext = createContext<MentionsContextType | null>(null);

interface MentionsProviderProps {
  readonly children: ReactNode;
  readonly collectionName: CollectionName;
}

export const MentionsProvider = ({
  children,
  collectionName,
}: MentionsProviderProps) => {
  const [gameSystem, utils] = useContext(GameSystemContext);
  const { loadEntities } = useEntities();
  const [mentionsMap, setMentionsMap] = useState<Record<string, Mentions>>({});
  const [mentionsLoaded, setMentionsLoaded] = useState(false);
  const [version, setVersion] = useState(0);

  const mentioningCollections = useMemo(
    () => utils.canBeMentionedBy(collectionName),
    [utils, collectionName],
  );

  useEffect(() => {
    if (mentioningCollections.length === 0 || !gameSystem?._id) {
      setMentionsMap({});
      setMentionsLoaded(true);
      return;
    }

    let cancelled = false;

    const load = async () => {
      const newMap: Record<string, Mentions> = {};

      for (const mentionCollName of mentioningCollections) {
        const allEntities = await loadEntities<Playable>(mentionCollName, {
          filters: [["systemId", "==", gameSystem._id]],
          withoutSort: true,
        });

        if (cancelled) return;

        for (const ment of allEntities) {
          if (!ment.references) continue;
          for (const [refId, ref] of Object.entries(ment.references)) {
            if (ref.name === collectionName) {
              if (!newMap[refId]) newMap[refId] = {};
              if (!newMap[refId][mentionCollName])
                newMap[refId][mentionCollName] = [];
              newMap[refId][mentionCollName]!.push(ment);
            }
          }
        }
      }

      if (!cancelled) {
        setMentionsMap(newMap);
        setMentionsLoaded(true);
      }
    };

    setMentionsLoaded(false);
    load();

    return () => {
      cancelled = true;
    };
  }, [
    mentioningCollections,
    loadEntities,
    gameSystem?._id,
    collectionName,
    version,
  ]);

  const getMentions = useCallback(
    (entityId: string): Mentions => mentionsMap[entityId] ?? {},
    [mentionsMap],
  );

  const reloadMentions = useCallback(() => {
    setVersion((v) => v + 1);
  }, []);

  const invalidationCollections = useMemo(
    () => [collectionName, ...mentioningCollections],
    [collectionName, mentioningCollections],
  );
  useMultiCollectionInvalidation(invalidationCollections, reloadMentions);

  const value = useMemo(
    () => ({ getMentions, mentionsLoaded, reloadMentions }),
    [getMentions, mentionsLoaded, reloadMentions],
  );

  return (
    <MentionsContext.Provider value={value}>
      {children}
    </MentionsContext.Provider>
  );
};
