import firebase from "firebase/compat/app";

export const CollectionRegistry = {
  GameSystem: "systems",
  Source: "sources",
} as const;

export const sourceTypes = [
  "rulebook",
  "supplement",
  "expansion",
  "FAQ/errata",
  "playtest",
] as const;
export type SourceType = (typeof sourceTypes)[number];

export interface Entity {
  _id: string;
  _createdAt: firebase.firestore.Timestamp;
  _updatedAt: firebase.firestore.Timestamp;
  _createdBy: string;
  _updatedBy: string;
  _isUpdated: boolean;
  name: string;
}

export interface GameSystem extends Entity {
  key: string;
  owner: string;
  links?: string[];
  downloads?: string[];
  shops?: string[];
  description?: string;
  logo?: string;
  image?: string;
  rulebooks?: string[];
  supplements?: string[];
  additional: string[];
}

export interface Source extends Entity {
  systemId: string;
  authors?: string;
  year: number;
  version: string;
  type: SourceType;
  image?: string;
  urls?: string[];
  description?: string;
}
