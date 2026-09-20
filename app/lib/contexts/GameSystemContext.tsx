"use client";

import {
  createContext,
  ReactNode,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import { Edition } from "@/app/lib/definitions";
import useGameSystem from "@/app/lib/hooks/useGameSystem";
import useSystemEditions from "@/app/lib/hooks/useSystemEditions";
import {
  readStoredEditionId,
  resolveSelectedEdition,
  writeStoredEditionId,
} from "@/app/lib/selectedEditionStorage";

type GameSystemContextUtils = ReturnType<typeof useGameSystem>[1] & {
  getActiveEditions: () => Edition[];
  setSelectedEdition: (editionId: string) => void;
};

type GameSystemContextType = readonly [
  ReturnType<typeof useGameSystem>[0],
  Edition | undefined,
  GameSystemContextUtils,
];

const noopUtils: GameSystemContextUtils = {
  canBeMentionedBy: () => [],
  getActiveEditions: () => [],
  getAllowedToRefer: () => [],
  setSelectedEdition: () => {},
};

export const GameSystemContext = createContext<GameSystemContextType>([
  undefined,
  undefined,
  noopUtils,
] as const);

export const GameSystemProvider = ({ children }: { children: ReactNode }) => {
  const [gameSystem, gameSystemUtils] = useGameSystem();
  const activeEditions = useSystemEditions(gameSystem);
  const [selectedEdition, setSelectedEditionState] = useState<
    Edition | undefined
  >();

  useEffect(() => {
    if (!gameSystem?.key) {
      setSelectedEditionState(undefined);
      return;
    }

    const storedId =
      activeEditions.length > 1 ? readStoredEditionId(gameSystem.key) : null;
    setSelectedEditionState(resolveSelectedEdition(activeEditions, storedId));
  }, [activeEditions, gameSystem?.key]);

  const setSelectedEdition = useCallback(
    (editionId: string) => {
      const edition = activeEditions.find((item) => item._id === editionId);
      if (!edition || !gameSystem?.key) {
        return;
      }

      setSelectedEditionState(edition);
      writeStoredEditionId(gameSystem.key, editionId);
    },
    [activeEditions, gameSystem?.key],
  );

  const getActiveEditions = useCallback(() => activeEditions, [activeEditions]);

  const utils = useMemo(
    () => ({
      ...gameSystemUtils,
      getActiveEditions,
      setSelectedEdition,
    }),
    [gameSystemUtils, getActiveEditions, setSelectedEdition],
  );

  const value = useMemo(
    () => [gameSystem, selectedEdition, utils] as const,
    [gameSystem, selectedEdition, utils],
  );

  return (
    <GameSystemContext.Provider value={value}>
      {children}
    </GameSystemContext.Provider>
  );
};
