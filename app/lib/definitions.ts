import firebase from "firebase/compat/app";

// *** COMMON using types ***

export const CollectionRegistry = {
  GameSystem: "systems",
  Keyword: "keywords",
  Source: "sources",
} as const;
export type CollectionName =
  (typeof CollectionRegistry)[keyof typeof CollectionRegistry];

export const EntityStatusRegistry = {
  ACTIVE: "active",
  DISABLED: "disabled",
  OBSOLETE: "obsolete",
} as const;
export const entityStatuses = Object.values(EntityStatusRegistry) as Array<
  (typeof EntityStatusRegistry)[keyof typeof EntityStatusRegistry]
>;
export type EntityStatus = (typeof entityStatuses)[number];

export const sourceTypes = [
  "rulebook",
  "supplement",
  "expansion",
  "FAQ/errata",
  "playtest",
  "technical",
] as const;
export type SourceType = (typeof sourceTypes)[number];

export interface References {
  [key: string]: CollectionName;
}

export type ReferenceHierarchy = {
  [K in CollectionName]?: CollectionName[];
};

export interface Entity {
  _id: string;
  _createdAt: firebase.firestore.Timestamp;
  _updatedAt: firebase.firestore.Timestamp;
  _createdBy: string;
  _updatedBy: string;
  _isUpdated: boolean;
  name: string;
  status: EntityStatus;
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
  referenceHierarchy?: ReferenceHierarchy;
}

export interface Playable extends Entity {
  systemId: string;
  references?: References;
  description?: string;
}

export type Mentions = {
  [K in CollectionName]?: Playable[];
};

export interface Source extends Playable {
  authors?: string;
  year: number;
  version: string;
  type: SourceType;
  image?: string;
  urls?: string[];
}

/* eslint-disable @typescript-eslint/no-empty-object-type */
export interface Keyword extends Playable {
  // there is no fields yet
}
/* eslint-enable @typescript-eslint/no-empty-object-type */
