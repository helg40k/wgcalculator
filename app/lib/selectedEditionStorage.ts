import { Edition } from "@/app/lib/definitions";

export const getSelectedEditionStorageKey = (systemKey: string): string =>
  `selectedEdition:${systemKey}`;

export const readStoredEditionId = (systemKey: string): string | null => {
  try {
    return localStorage.getItem(getSelectedEditionStorageKey(systemKey));
  } catch {
    return null;
  }
};

export const writeStoredEditionId = (
  systemKey: string,
  editionId: string,
): void => {
  try {
    localStorage.setItem(getSelectedEditionStorageKey(systemKey), editionId);
  } catch {
    return;
  }
};

export const resolveSelectedEdition = (
  editions: Edition[],
  storedId: string | null,
): Edition | undefined => {
  if (editions.length === 0) {
    return undefined;
  }

  if (editions.length === 1) {
    return editions[0];
  }

  return editions.find((edition) => edition._id === storedId) ?? editions[0];
};
