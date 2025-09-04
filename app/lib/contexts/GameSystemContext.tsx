"use client";

import { createContext, ReactNode } from "react";

import useGameSystem from "@/app/lib/hooks/useGameSystem";

type GameSystemContextType = ReturnType<typeof useGameSystem>;

export const GameSystemContext = createContext<GameSystemContextType>([
  undefined,
  {
    canBeMentionedBy: () => [],
    getAllowedToRefer: () => [],
  },
]);

export const GameSystemProvider = ({ children }: { children: ReactNode }) => {
  const [gameSystem, utils] = useGameSystem();
  return (
    <GameSystemContext.Provider value={[gameSystem, utils]}>
      {children}
    </GameSystemContext.Provider>
  );
};
