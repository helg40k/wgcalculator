import {
  Edition,
  Editions,
  EntityStatus,
  EntityStatusRegistry,
  GameSystem,
} from "../definitions";
import getActiveSystemEditions from "../getActiveSystemEditions";

const createEdition = (
  id: string,
  order: number,
  status: EntityStatus = EntityStatusRegistry.ACTIVE,
  name = id,
): Edition => ({
  _createdAt: { nanoseconds: 0, seconds: 0 } as never,
  _createdBy: "test@example.com",
  _id: id,
  _isUpdated: false,
  _updatedAt: { nanoseconds: 0, seconds: 0 } as never,
  _updatedBy: "test@example.com",
  name,
  order,
  status,
});

const createGameSystem = (editions: Editions): GameSystem => ({
  _createdAt: { nanoseconds: 0, seconds: 0 } as never,
  _createdBy: "test@example.com",
  _id: "sys-1",
  _isUpdated: false,
  _updatedAt: { nanoseconds: 0, seconds: 0 } as never,
  _updatedBy: "test@example.com",
  additional: [],
  editions,
  key: "testgame",
  name: "Test Game",
  owner: "test-owner",
  status: EntityStatusRegistry.ACTIVE,
});

describe("getActiveSystemEditions", () => {
  it("should return empty list when game system is undefined", () => {
    const editions = [createEdition("ed-1", 1)];

    expect(getActiveSystemEditions(undefined, editions)).toEqual([]);
  });

  it("should return empty list when editions map is empty", () => {
    const gameSystem = createGameSystem({});
    const editions = [createEdition("ed-1", 1)];

    expect(getActiveSystemEditions(gameSystem, editions)).toEqual([]);
  });

  it("should include edition when status is active and map value is true", () => {
    const edition = createEdition("ed-1", 1, EntityStatusRegistry.ACTIVE);
    const gameSystem = createGameSystem({ "ed-1": true });

    expect(getActiveSystemEditions(gameSystem, [edition])).toEqual([edition]);
  });

  it("should exclude edition when map value is false", () => {
    const edition = createEdition("ed-1", 1);
    const gameSystem = createGameSystem({ "ed-1": false });

    expect(getActiveSystemEditions(gameSystem, [edition])).toEqual([]);
  });

  it("should exclude edition when map key is missing", () => {
    const edition = createEdition("ed-1", 1);
    const gameSystem = createGameSystem({ "ed-other": true });

    expect(getActiveSystemEditions(gameSystem, [edition])).toEqual([]);
  });

  it("should exclude disabled edition even when map value is true", () => {
    const edition = createEdition("ed-1", 1, EntityStatusRegistry.DISABLED);
    const gameSystem = createGameSystem({ "ed-1": true });

    expect(getActiveSystemEditions(gameSystem, [edition])).toEqual([]);
  });

  it("should exclude obsolete edition even when map value is true", () => {
    const edition = createEdition("ed-1", 1, EntityStatusRegistry.OBSOLETE);
    const gameSystem = createGameSystem({ "ed-1": true });

    expect(getActiveSystemEditions(gameSystem, [edition])).toEqual([]);
  });

  it("should sort active editions by order descending", () => {
    const low = createEdition("ed-low", 1, EntityStatusRegistry.ACTIVE, "Low");
    const high = createEdition(
      "ed-high",
      10,
      EntityStatusRegistry.ACTIVE,
      "High",
    );
    const mid = createEdition("ed-mid", 5, EntityStatusRegistry.ACTIVE, "Mid");
    const gameSystem = createGameSystem({
      "ed-high": true,
      "ed-low": true,
      "ed-mid": true,
    });

    expect(
      getActiveSystemEditions(gameSystem, [low, high, mid]).map(
        (edition) => edition._id,
      ),
    ).toEqual(["ed-high", "ed-mid", "ed-low"]);
  });

  it("should keep only editions that are both active and enabled", () => {
    const activeEnabled = createEdition("ed-ok", 2);
    const activeDisabledInMap = createEdition("ed-off", 3);
    const disabledEnabled = createEdition(
      "ed-disabled",
      4,
      EntityStatusRegistry.DISABLED,
    );
    const gameSystem = createGameSystem({
      "ed-disabled": true,
      "ed-off": false,
      "ed-ok": true,
    });

    expect(
      getActiveSystemEditions(gameSystem, [
        activeEnabled,
        activeDisabledInMap,
        disabledEnabled,
      ]),
    ).toEqual([activeEnabled]);
  });
});
