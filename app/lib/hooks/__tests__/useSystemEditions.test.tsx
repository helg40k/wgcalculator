import { renderHook, waitFor } from "@testing-library/react";

import {
  CollectionRegistry,
  Edition,
  EntityStatus,
  EntityStatusRegistry,
  GameSystem,
} from "../../definitions";
import errorMessage from "../../errorMessage";
import getDocumentsByIds from "../../services/firebase/helpers/getDocumentsByIds";
import useSystemEditions from "../useSystemEditions";

jest.mock("@ant-design/v5-patch-for-react-19", () => ({}));

jest.mock("../../services/firebase/utils/firestore", () => ({
  __esModule: true,
  default: "mock-firestore-instance",
}));

jest.mock("../../services/firebase/utils/app", () => ({
  __esModule: true,
  default: "mock-app-instance",
}));

jest.mock("../../services/firebase/helpers/getDocumentsByIds");

jest.mock("../../errorMessage", () => ({
  __esModule: true,
  default: jest.fn(),
}));

const mockGetDocumentsByIds = getDocumentsByIds as jest.MockedFunction<
  typeof getDocumentsByIds
>;
const mockErrorMessage = errorMessage as jest.MockedFunction<
  typeof errorMessage
>;

const createEdition = (
  id: string,
  order: number,
  status: EntityStatus = EntityStatusRegistry.ACTIVE,
): Edition => ({
  _createdAt: { nanoseconds: 0, seconds: 0 } as never,
  _createdBy: "test@example.com",
  _id: id,
  _isUpdated: false,
  _updatedAt: { nanoseconds: 0, seconds: 0 } as never,
  _updatedBy: "test@example.com",
  name: id,
  order,
  status,
});

const createGameSystem = (editions: GameSystem["editions"]): GameSystem => ({
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

describe("useSystemEditions", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetDocumentsByIds.mockResolvedValue([]);
  });

  it("should not fetch when game system is undefined", async () => {
    const { result } = renderHook(() => useSystemEditions());

    await waitFor(() => {
      expect(result.current).toEqual([]);
    });
    expect(mockGetDocumentsByIds).not.toHaveBeenCalled();
  });

  it("should not fetch when no edition is enabled", async () => {
    const gameSystem = createGameSystem({
      "ed-1": false,
      "ed-2": false,
    });

    const { result } = renderHook(() => useSystemEditions(gameSystem));

    await waitFor(() => {
      expect(result.current).toEqual([]);
    });
    expect(mockGetDocumentsByIds).not.toHaveBeenCalled();
  });

  it("should fetch only edition IDs marked true", async () => {
    const gameSystem = createGameSystem({
      "ed-off": false,
      "ed-on": true,
    });
    const edition = createEdition("ed-on", 2);
    mockGetDocumentsByIds.mockResolvedValueOnce([edition]);

    const { result } = renderHook(() => useSystemEditions(gameSystem));

    await waitFor(() => {
      expect(result.current).toEqual([edition]);
    });
    expect(mockGetDocumentsByIds).toHaveBeenCalledWith(
      CollectionRegistry.Editions,
      ["ed-on"],
    );
  });

  it("should omit fetched editions that are not active", async () => {
    const gameSystem = createGameSystem({
      "ed-active": true,
      "ed-disabled": true,
    });
    mockGetDocumentsByIds.mockResolvedValueOnce([
      createEdition("ed-disabled", 5, EntityStatusRegistry.DISABLED),
      createEdition("ed-active", 1),
    ]);

    const { result } = renderHook(() => useSystemEditions(gameSystem));

    await waitFor(() => {
      expect(result.current.map((edition) => edition._id)).toEqual([
        "ed-active",
      ]);
    });
  });

  it("should sort fetched active editions by order descending", async () => {
    const gameSystem = createGameSystem({
      "ed-high": true,
      "ed-low": true,
    });
    mockGetDocumentsByIds.mockResolvedValueOnce([
      createEdition("ed-low", 1),
      createEdition("ed-high", 8),
    ]);

    const { result } = renderHook(() => useSystemEditions(gameSystem));

    await waitFor(() => {
      expect(result.current.map((edition) => edition._id)).toEqual([
        "ed-high",
        "ed-low",
      ]);
    });
  });

  it("should return empty list and report error when fetch fails", async () => {
    const gameSystem = createGameSystem({ "ed-on": true });
    const error = new Error("Failed to load editions");
    mockGetDocumentsByIds.mockRejectedValueOnce(error);
    const consoleSpy = jest.spyOn(console, "error").mockImplementation();

    const { result } = renderHook(() => useSystemEditions(gameSystem));

    await waitFor(() => {
      expect(mockErrorMessage).toHaveBeenCalledWith("Failed to load editions");
    });
    expect(result.current).toEqual([]);

    consoleSpy.mockRestore();
  });
});
