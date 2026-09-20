import { Edition, EntityStatusRegistry } from "../definitions";
import {
  getSelectedEditionStorageKey,
  readStoredEditionId,
  resolveSelectedEdition,
  writeStoredEditionId,
} from "../selectedEditionStorage";

const createEdition = (id: string, order: number): Edition => ({
  _createdAt: { nanoseconds: 0, seconds: 0 } as never,
  _createdBy: "test@example.com",
  _id: id,
  _isUpdated: false,
  _updatedAt: { nanoseconds: 0, seconds: 0 } as never,
  _updatedBy: "test@example.com",
  name: id,
  order,
  status: EntityStatusRegistry.ACTIVE,
});

describe("selectedEditionStorage", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("should build a per-system storage key", () => {
    expect(getSelectedEditionStorageKey("clashofspears")).toBe(
      "selectedEdition:clashofspears",
    );
  });

  it("should write and read the stored edition id", () => {
    writeStoredEditionId("testgame", "ed-2");

    expect(readStoredEditionId("testgame")).toBe("ed-2");
    expect(readStoredEditionId("other")).toBeNull();
  });

  it("should return null when localStorage getItem throws", () => {
    jest.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw new Error("denied");
    });

    expect(readStoredEditionId("testgame")).toBeNull();
  });

  it("should not throw when localStorage setItem throws", () => {
    jest.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new Error("denied");
    });

    expect(() => writeStoredEditionId("testgame", "ed-1")).not.toThrow();
  });

  it("should return undefined when there are no editions", () => {
    expect(resolveSelectedEdition([], "ed-1")).toBeUndefined();
  });

  it("should return the only edition and ignore stored id", () => {
    const only = createEdition("ed-1", 1);

    expect(resolveSelectedEdition([only], "ed-other")).toBe(only);
  });

  it("should restore a stored id that is still active", () => {
    const high = createEdition("ed-high", 3);
    const low = createEdition("ed-low", 1);

    expect(resolveSelectedEdition([high, low], "ed-low")).toBe(low);
  });

  it("should fall back to the first edition when stored id is missing or stale", () => {
    const high = createEdition("ed-high", 3);
    const low = createEdition("ed-low", 1);

    expect(resolveSelectedEdition([high, low], null)).toBe(high);
    expect(resolveSelectedEdition([high, low], "gone")).toBe(high);
  });
});
