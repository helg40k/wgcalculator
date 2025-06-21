import firebase from "firebase/compat/app";

export const CollectionRegistry = {
  GameSystem: "systems",
  Source: "sources",
} as const;

export type SourceType =
  | "RULEBOOK"
  | "SUPPLEMENT"
  | "EXPANSION"
  | "FAQ_ERRATA"
  | "PLAYTEST";

export interface Entity {
  _id: string;
  _createdAt: firebase.firestore.Timestamp;
  _updatedAt: firebase.firestore.Timestamp;
  _createdBy: string;
  _updatedBy: string;
  _isUpdated: boolean;
  _type: string;
}

export interface GameSystem extends Entity {
  _type: "systems";
  name: string;
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
  _type: "sources";
  name: string;
  authors?: string;
  year: number;
  version: string;
  type: SourceType;
  image?: string;
  url?: string;
  description?: string;
}
