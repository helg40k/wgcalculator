import { WhereFilterOp } from "firebase/firestore";

import { Edition, GameSystem } from "@/app/lib/definitions";

export const getPlayableScopeFilters = (
  gameSystem?: GameSystem,
  edition?: Edition,
): [string, WhereFilterOp, string][] | undefined => {
  if (!gameSystem?._id || !edition?._id) {
    return undefined;
  }

  return [
    ["systemId", "==", gameSystem._id],
    ["editionId", "==", edition._id],
  ];
};
