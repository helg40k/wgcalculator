import { act, renderHook, waitFor } from "@testing-library/react";

import { Playable } from "../../definitions";
import getDocumentsByExcludedIds from "../../services/firebase/helpers/getDocumentsByExcludedIds";
import getDocumentsByIds from "../../services/firebase/helpers/getDocumentsByIds";
import usePlayableReferences from "../usePlayableReferences";

// Mock Ant Design patch
jest.mock("@ant-design/v5-patch-for-react-19", () => ({}));

// Mock Firebase utils
jest.mock("../../services/firebase/utils/firestore", () => ({
  __esModule: true,
  default: "mock-firestore-instance",
}));

jest.mock("../../services/firebase/utils/app", () => ({
  __esModule: true,
  default: "mock-app-instance",
}));

// Mock dependencies
jest.mock("../../services/firebase/helpers/getDocumentsByExcludedIds");
jest.mock("../../services/firebase/helpers/getDocumentsByIds");
// Mock errorMessage
jest.mock("../../errorMessage", () => ({
  __esModule: true,
  default: jest.fn(),
}));

import errorMessage from "../../errorMessage";
const mockErrorMessage = errorMessage as jest.MockedFunction<
  typeof errorMessage
>;

const mockGetDocumentsByIds = getDocumentsByIds as jest.MockedFunction<
  typeof getDocumentsByIds
>;
const mockGetDocumentsByExcludedIds =
  getDocumentsByExcludedIds as jest.MockedFunction<
    typeof getDocumentsByExcludedIds
  >;

const mockPlayableEntity: Playable = {
  _createdAt: { nanoseconds: 0, seconds: 1234567890 } as any,
  _createdBy: "creator@example.com",
  _id: "entity123",
  _isUpdated: false,
  _updatedAt: { nanoseconds: 0, seconds: 1234567890 } as any,
  _updatedBy: "updater@example.com",
  name: "Test Entity",
  status: "active",
  systemId: "test-system",
};

const mockPlayableEntities: Playable[] = [
  mockPlayableEntity,
  {
    ...mockPlayableEntity,
    _id: "entity456",
    name: "Second Entity",
  },
  {
    ...mockPlayableEntity,
    _id: "entity789",
    name: "Third Entity",
  },
];

describe("usePlayableReferences", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("initial state", () => {
    it("should return correct initial state", () => {
      const { result } = renderHook(() => usePlayableReferences());

      expect(result.current.loading).toBe(false);
      expect(typeof result.current.loadReferences).toBe("function");
      expect(typeof result.current.loadEntitiesForReferences).toBe("function");
    });
  });

  describe("loadReferences", () => {
    it("should load references successfully", async () => {
      mockGetDocumentsByIds.mockResolvedValueOnce(mockPlayableEntities);

      const { result } = renderHook(() => usePlayableReferences());

      let loadedEntities: Playable[] = [];
      await act(async () => {
        loadedEntities = await result.current.loadReferences(
          "test-collection",
          ["entity123", "entity456"],
        );
      });

      expect(mockGetDocumentsByIds).toHaveBeenCalledWith("test-collection", [
        "entity123",
        "entity456",
      ]);
      expect(loadedEntities).toEqual(mockPlayableEntities);
      expect(result.current.loading).toBe(false);
    });

    it("should return empty array when dbRef is null", async () => {
      const { result } = renderHook(() => usePlayableReferences());

      let loadedEntities: Playable[] = [];
      await act(async () => {
        loadedEntities = await result.current.loadReferences(null, [
          "entity123",
        ]);
      });

      expect(mockGetDocumentsByIds).not.toHaveBeenCalled();
      expect(loadedEntities).toEqual([]);
      expect(result.current.loading).toBe(false);
    });

    it("should return empty array when dbRef is undefined", async () => {
      const { result } = renderHook(() => usePlayableReferences());

      let loadedEntities: Playable[] = [];
      await act(async () => {
        loadedEntities = await result.current.loadReferences(undefined, [
          "entity123",
        ]);
      });

      expect(mockGetDocumentsByIds).not.toHaveBeenCalled();
      expect(loadedEntities).toEqual([]);
      expect(result.current.loading).toBe(false);
    });

    it("should return empty array when dbRef is empty string", async () => {
      const { result } = renderHook(() => usePlayableReferences());

      let loadedEntities: Playable[] = [];
      await act(async () => {
        loadedEntities = await result.current.loadReferences("", ["entity123"]);
      });

      expect(mockGetDocumentsByIds).not.toHaveBeenCalled();
      expect(loadedEntities).toEqual([]);
      expect(result.current.loading).toBe(false);
    });

    it("should handle loading state correctly", async () => {
      let resolvePromise: (value: Playable[]) => void;
      const promise = new Promise<Playable[]>((resolve) => {
        resolvePromise = resolve;
      });
      mockGetDocumentsByIds.mockReturnValue(promise as any);

      const { result } = renderHook(() => usePlayableReferences());

      expect(result.current.loading).toBe(false);

      act(() => {
        result.current.loadReferences("test-collection", ["entity123"]);
      });

      expect(result.current.loading).toBe(true);

      await act(async () => {
        resolvePromise!(mockPlayableEntities);
        await promise;
      });

      expect(result.current.loading).toBe(false);
    });

    it("should handle errors in loadReferences", async () => {
      const error = new Error("Failed to load references");
      mockGetDocumentsByIds.mockRejectedValueOnce(error);

      const { result } = renderHook(() => usePlayableReferences());

      let loadedEntities: Playable[] = [];
      await act(async () => {
        loadedEntities = await result.current.loadReferences(
          "error-collection",
          ["entity123"],
        );
      });

      expect(loadedEntities).toEqual([]);
      expect(result.current.loading).toBe(false);

      await waitFor(() => {
        expect(mockErrorMessage).toHaveBeenCalledWith(error.message);
      });
    });

    it("should handle errors without message", async () => {
      const error = new Error("");
      mockGetDocumentsByIds.mockRejectedValueOnce(error);

      const { result } = renderHook(() => usePlayableReferences());

      await act(async () => {
        await result.current.loadReferences("error-collection", ["entity123"]);
      });

      await waitFor(() => {
        expect(mockErrorMessage).toHaveBeenCalledWith(
          "Something in useLoadReferences()",
        );
      });
    });

    it("should handle console.error during error", async () => {
      const consoleSpy = jest.spyOn(console, "error").mockImplementation();
      const error = new Error("Network error");
      mockGetDocumentsByIds.mockRejectedValueOnce(error);

      const { result } = renderHook(() => usePlayableReferences());

      await act(async () => {
        await result.current.loadReferences("error-collection", ["entity123"]);
      });

      expect(consoleSpy).toHaveBeenCalledWith(error);
      consoleSpy.mockRestore();
    });

    it("should work with empty ids array", async () => {
      mockGetDocumentsByIds.mockResolvedValueOnce([]);

      const { result } = renderHook(() => usePlayableReferences());

      let loadedEntities: Playable[] = [];
      await act(async () => {
        loadedEntities = await result.current.loadReferences(
          "test-collection",
          [],
        );
      });

      expect(mockGetDocumentsByIds).toHaveBeenCalledWith("test-collection", []);
      expect(loadedEntities).toEqual([]);
    });
  });

  describe("loadEntitiesForReferences", () => {
    it("should load entities for references successfully", async () => {
      mockGetDocumentsByExcludedIds.mockResolvedValueOnce(mockPlayableEntities);

      const { result } = renderHook(() => usePlayableReferences());

      let loadedEntities: Playable[] = [];
      await act(async () => {
        loadedEntities = await result.current.loadEntitiesForReferences(
          "test-collection",
          ["entity123", "entity456"],
        );
      });

      expect(mockGetDocumentsByExcludedIds).toHaveBeenCalledWith(
        "test-collection",
        ["entity123", "entity456"],
      );
      expect(loadedEntities).toEqual(mockPlayableEntities);
      expect(result.current.loading).toBe(false);
    });

    it("should return empty array when dbRef is null", async () => {
      const { result } = renderHook(() => usePlayableReferences());

      let loadedEntities: Playable[] = [];
      await act(async () => {
        loadedEntities = await result.current.loadEntitiesForReferences(null, [
          "entity123",
        ]);
      });

      expect(mockGetDocumentsByExcludedIds).not.toHaveBeenCalled();
      expect(loadedEntities).toEqual([]);
      expect(result.current.loading).toBe(false);
    });

    it("should return empty array when dbRef is undefined", async () => {
      const { result } = renderHook(() => usePlayableReferences());

      let loadedEntities: Playable[] = [];
      await act(async () => {
        loadedEntities = await result.current.loadEntitiesForReferences(
          undefined,
          ["entity123"],
        );
      });

      expect(mockGetDocumentsByExcludedIds).not.toHaveBeenCalled();
      expect(loadedEntities).toEqual([]);
      expect(result.current.loading).toBe(false);
    });

    it("should return empty array when dbRef is empty string", async () => {
      const { result } = renderHook(() => usePlayableReferences());

      let loadedEntities: Playable[] = [];
      await act(async () => {
        loadedEntities = await result.current.loadEntitiesForReferences("", [
          "entity123",
        ]);
      });

      expect(mockGetDocumentsByExcludedIds).not.toHaveBeenCalled();
      expect(loadedEntities).toEqual([]);
      expect(result.current.loading).toBe(false);
    });

    it("should handle loading state correctly", async () => {
      let resolvePromise: (value: Playable[]) => void;
      const promise = new Promise<Playable[]>((resolve) => {
        resolvePromise = resolve;
      });
      mockGetDocumentsByExcludedIds.mockReturnValue(promise as any);

      const { result } = renderHook(() => usePlayableReferences());

      expect(result.current.loading).toBe(false);

      act(() => {
        result.current.loadEntitiesForReferences("test-collection", [
          "entity123",
        ]);
      });

      expect(result.current.loading).toBe(true);

      await act(async () => {
        resolvePromise!(mockPlayableEntities);
        await promise;
      });

      expect(result.current.loading).toBe(false);
    });

    it("should handle errors in loadEntitiesForReferences", async () => {
      const error = new Error("Failed to load entities for references");
      mockGetDocumentsByExcludedIds.mockRejectedValueOnce(error);

      const { result } = renderHook(() => usePlayableReferences());

      let loadedEntities: Playable[] = [];
      await act(async () => {
        loadedEntities = await result.current.loadEntitiesForReferences(
          "error-collection",
          ["entity123"],
        );
      });

      expect(loadedEntities).toEqual([]);
      expect(result.current.loading).toBe(false);

      await waitFor(() => {
        expect(mockErrorMessage).toHaveBeenCalledWith(error.message);
      });
    });

    it("should handle errors without message", async () => {
      const error = new Error("");
      mockGetDocumentsByExcludedIds.mockRejectedValueOnce(error);

      const { result } = renderHook(() => usePlayableReferences());

      await act(async () => {
        await result.current.loadEntitiesForReferences("error-collection", [
          "entity123",
        ]);
      });

      await waitFor(() => {
        expect(mockErrorMessage).toHaveBeenCalledWith(
          "Something in useLoadReferences()",
        );
      });
    });

    it("should handle console.error during error", async () => {
      const consoleSpy = jest.spyOn(console, "error").mockImplementation();
      const error = new Error("Network error");
      mockGetDocumentsByExcludedIds.mockRejectedValueOnce(error);

      const { result } = renderHook(() => usePlayableReferences());

      await act(async () => {
        await result.current.loadEntitiesForReferences("error-collection", [
          "entity123",
        ]);
      });

      expect(consoleSpy).toHaveBeenCalledWith(error);
      consoleSpy.mockRestore();
    });

    it("should work with empty excludedIds array", async () => {
      mockGetDocumentsByExcludedIds.mockResolvedValueOnce(mockPlayableEntities);

      const { result } = renderHook(() => usePlayableReferences());

      let loadedEntities: Playable[] = [];
      await act(async () => {
        loadedEntities = await result.current.loadEntitiesForReferences(
          "test-collection",
          [],
        );
      });

      expect(mockGetDocumentsByExcludedIds).toHaveBeenCalledWith(
        "test-collection",
        [],
      );
      expect(loadedEntities).toEqual(mockPlayableEntities);
    });
  });

  describe("function stability", () => {
    it("should maintain function references across renders", () => {
      const { result, rerender } = renderHook(() => usePlayableReferences());

      const initialLoadReferences = result.current.loadReferences;
      const initialLoadEntitiesForReferences =
        result.current.loadEntitiesForReferences;

      rerender();

      expect(result.current.loadReferences).toBe(initialLoadReferences);
      expect(result.current.loadEntitiesForReferences).toBe(
        initialLoadEntitiesForReferences,
      );
    });
  });

  describe("return structure", () => {
    it("should return consistent object structure", () => {
      const { result } = renderHook(() => usePlayableReferences());

      expect(result.current).toHaveProperty("loadReferences");
      expect(result.current).toHaveProperty("loadEntitiesForReferences");
      expect(result.current).toHaveProperty("loading");

      expect(Object.keys(result.current)).toHaveLength(3);

      expect(typeof result.current.loadReferences).toBe("function");
      expect(typeof result.current.loadEntitiesForReferences).toBe("function");
      expect(typeof result.current.loading).toBe("boolean");
    });
  });

  describe("concurrent operations", () => {
    it("should handle concurrent loadReferences calls", async () => {
      const entities1 = [mockPlayableEntity];
      const entities2 = [{ ...mockPlayableEntity, _id: "entity456" }];

      mockGetDocumentsByIds
        .mockResolvedValueOnce(entities1)
        .mockResolvedValueOnce(entities2);

      const { result } = renderHook(() => usePlayableReferences());

      let results: Playable[][] = [];
      await act(async () => {
        const promise1 = result.current.loadReferences("collection1", [
          "entity123",
        ]);
        const promise2 = result.current.loadReferences("collection2", [
          "entity456",
        ]);
        results = await Promise.all([promise1, promise2]);
      });

      expect(results[0]).toEqual(entities1);
      expect(results[1]).toEqual(entities2);
      expect(mockGetDocumentsByIds).toHaveBeenCalledTimes(2);
    });

    it("should handle concurrent loadEntitiesForReferences calls", async () => {
      const entities1 = [mockPlayableEntity];
      const entities2 = [{ ...mockPlayableEntity, _id: "entity456" }];

      mockGetDocumentsByExcludedIds
        .mockResolvedValueOnce(entities1)
        .mockResolvedValueOnce(entities2);

      const { result } = renderHook(() => usePlayableReferences());

      let results: Playable[][] = [];
      await act(async () => {
        const promise1 = result.current.loadEntitiesForReferences(
          "collection1",
          ["excluded1"],
        );
        const promise2 = result.current.loadEntitiesForReferences(
          "collection2",
          ["excluded2"],
        );
        results = await Promise.all([promise1, promise2]);
      });

      expect(results[0]).toEqual(entities1);
      expect(results[1]).toEqual(entities2);
      expect(mockGetDocumentsByExcludedIds).toHaveBeenCalledTimes(2);
    });

    it("should handle mixed concurrent operations", async () => {
      const referencesEntities = [mockPlayableEntity];
      const excludedEntities = [{ ...mockPlayableEntity, _id: "entity456" }];

      mockGetDocumentsByIds.mockResolvedValueOnce(referencesEntities);
      mockGetDocumentsByExcludedIds.mockResolvedValueOnce(excludedEntities);

      const { result } = renderHook(() => usePlayableReferences());

      let referencesResult: Playable[] = [];
      let excludedResult: Playable[] = [];

      await act(async () => {
        const referencesPromise = result.current.loadReferences("collection1", [
          "entity123",
        ]);
        const excludedPromise = result.current.loadEntitiesForReferences(
          "collection2",
          ["excluded1"],
        );

        [referencesResult, excludedResult] = await Promise.all([
          referencesPromise,
          excludedPromise,
        ]);
      });

      expect(referencesResult).toEqual(referencesEntities);
      expect(excludedResult).toEqual(excludedEntities);
      expect(mockGetDocumentsByIds).toHaveBeenCalledTimes(1);
      expect(mockGetDocumentsByExcludedIds).toHaveBeenCalledTimes(1);
    });
  });

  describe("type casting", () => {
    interface CustomPlayable extends Playable {
      customField: string;
    }

    it("should properly cast types for loadReferences", async () => {
      const customEntity: CustomPlayable = {
        ...mockPlayableEntity,
        customField: "custom value",
      };

      mockGetDocumentsByIds.mockResolvedValueOnce([customEntity]);

      const { result } = renderHook(() => usePlayableReferences());

      let loadedEntities: CustomPlayable[] = [];
      await act(async () => {
        loadedEntities = await result.current.loadReferences<CustomPlayable>(
          "custom-collection",
          ["entity123"],
        );
      });

      expect(loadedEntities[0].customField).toBe("custom value");
    });

    it("should properly cast types for loadEntitiesForReferences", async () => {
      const customEntity: CustomPlayable = {
        ...mockPlayableEntity,
        customField: "custom value",
      };

      mockGetDocumentsByExcludedIds.mockResolvedValueOnce([customEntity]);

      const { result } = renderHook(() => usePlayableReferences());

      let loadedEntities: CustomPlayable[] = [];
      await act(async () => {
        loadedEntities =
          await result.current.loadEntitiesForReferences<CustomPlayable>(
            "custom-collection",
            ["excluded123"],
          );
      });

      expect(loadedEntities[0].customField).toBe("custom value");
    });
  });

  describe("edge cases", () => {
    it("should handle very large ids arrays", async () => {
      const largeIdsArray = Array.from({ length: 1000 }, (_, i) => `id${i}`);
      mockGetDocumentsByIds.mockResolvedValueOnce([]);

      const { result } = renderHook(() => usePlayableReferences());

      await act(async () => {
        await result.current.loadReferences("test-collection", largeIdsArray);
      });

      expect(mockGetDocumentsByIds).toHaveBeenCalledWith(
        "test-collection",
        largeIdsArray,
      );
    });

    it("should handle very large excludedIds arrays", async () => {
      const largeExcludedArray = Array.from(
        { length: 1000 },
        (_, i) => `excluded${i}`,
      );
      mockGetDocumentsByExcludedIds.mockResolvedValueOnce([]);

      const { result } = renderHook(() => usePlayableReferences());

      await act(async () => {
        await result.current.loadEntitiesForReferences(
          "test-collection",
          largeExcludedArray,
        );
      });

      expect(mockGetDocumentsByExcludedIds).toHaveBeenCalledWith(
        "test-collection",
        largeExcludedArray,
      );
    });

    it("should handle special characters in collection names", async () => {
      mockGetDocumentsByIds.mockResolvedValueOnce([mockPlayableEntity]);

      const { result } = renderHook(() => usePlayableReferences());

      await act(async () => {
        await result.current.loadReferences("special-collection_123", [
          "entity123",
        ]);
      });

      expect(mockGetDocumentsByIds).toHaveBeenCalledWith(
        "special-collection_123",
        ["entity123"],
      );
    });
  });
});
