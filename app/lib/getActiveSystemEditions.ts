import {
  Edition,
  EntityStatusRegistry,
  GameSystem,
} from "@/app/lib/definitions";

const getActiveSystemEditions = (
  gameSystem: GameSystem | undefined,
  editions: Edition[],
): Edition[] => {
  if (!gameSystem?.editions) {
    return [];
  }

  return editions
    .filter(
      (edition) =>
        edition.status === EntityStatusRegistry.ACTIVE &&
        gameSystem.editions[edition._id],
    )
    .sort((left, right) => right.order - left.order);
};

export default getActiveSystemEditions;
