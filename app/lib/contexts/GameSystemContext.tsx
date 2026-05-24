"use client";

import { createContext, ReactNode, useMemo } from "react";

import useGameSystem from "@/app/lib/hooks/useGameSystem";

type GameSystemContextType = readonly [
  ReturnType<typeof useGameSystem>[0],
  ReturnType<typeof useGameSystem>[1],
];

export const GameSystemContext = createContext<GameSystemContextType>([
  undefined,
  {
    canBeMentionedBy: () => [],
    getAllowedToRefer: () => [],
  },
] as const);

export const GameSystemProvider = ({ children }: { children: ReactNode }) => {
  const [gameSystem, utils] = useGameSystem();
  const value = useMemo(
    () => [gameSystem, utils] as const,
    [gameSystem, utils],
  );
  return (
    <GameSystemContext.Provider value={value}>
      {children}
    </GameSystemContext.Provider>
  );
};
