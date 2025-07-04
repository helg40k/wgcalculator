"use client";

import { createContext, ReactNode } from "react";

import { GameSystem } from "@/app/lib/definitions";
import useGameSystem from "@/app/lib/hooks/useGameSystem";

export const GameSystemContext = createContext<GameSystem | undefined>(
  undefined,
);

export const GameSystemProvider = ({ children }: { children: ReactNode }) => {
  const gameSystem = useGameSystem();
  return (
    <GameSystemContext.Provider value={gameSystem}>
      {children}
    </GameSystemContext.Provider>
  );
};
