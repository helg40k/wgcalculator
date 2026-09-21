import { Edition, EntityStatusRegistry, GameSystem } from "../definitions";
import { getPlayableScopeFilters } from "../playableScope";

const createGameSystem = (): GameSystem => ({
  _createdAt: { nanoseconds: 0, seconds: 0 } as never,
  _createdBy: "test@example.com",
  _id: "sys-1",
  _isUpdated: false,
  _updatedAt: { nanoseconds: 0, seconds: 0 } as never,
  _updatedBy: "test@example.com",
  additional: [],
  editions: { "ed-1": true },
  key: "testgame",
  name: "Test Game",
  owner: "test-owner",
  status: EntityStatusRegistry.ACTIVE,
});

const createEdition = (): Edition => ({
  _createdAt: { nanoseconds: 0, seconds: 0 } as never,
  _createdBy: "test@example.com",
  _id: "ed-1",
  _isUpdated: false,
  _updatedAt: { nanoseconds: 0, seconds: 0 } as never,
  _updatedBy: "test@example.com",
  name: "First Edition",
  order: 1,
  status: EntityStatusRegistry.ACTIVE,
});

describe("getPlayableScopeFilters", () => {
  it("should return systemId and editionId filters when both exist", () => {
    expect(
      getPlayableScopeFilters(createGameSystem(), createEdition()),
    ).toEqual([
      ["systemId", "==", "sys-1"],
      ["editionId", "==", "ed-1"],
    ]);
  });

  it("should return undefined when game system is missing", () => {
    expect(getPlayableScopeFilters(undefined, createEdition())).toBeUndefined();
  });

  it("should return undefined when edition is missing", () => {
    expect(
      getPlayableScopeFilters(createGameSystem(), undefined),
    ).toBeUndefined();
  });
});
