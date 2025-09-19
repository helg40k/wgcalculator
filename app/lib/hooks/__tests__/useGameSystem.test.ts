import { renderHook, waitFor } from "@testing-library/react";
import { notification } from "antd";
import { usePathname } from "next/navigation";

import {
  CollectionName,
  CollectionRegistry,
  GameSystem,
} from "../../definitions";
import getDocuments from "../../services/firebase/helpers/getDocuments";
import useGameSystem from "../useGameSystem";

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
jest.mock("next/navigation");
jest.mock("../../services/firebase/helpers/getDocuments");
jest.mock("antd", () => ({
  notification: {
    error: jest.fn(),
  },
}));

const mockUsePathname = usePathname as jest.MockedFunction<typeof usePathname>;
const mockGetDocuments = getDocuments as jest.MockedFunction<
  typeof getDocuments
>;
const mockNotification = notification.error as jest.MockedFunction<
  typeof notification.error
>;

const mockGameSystem: GameSystem = {
  _createdAt: { nanoseconds: 0, seconds: 1234567890 } as any,
  _createdBy: "creator@example.com",
  _id: "system123",
  _isUpdated: false,
  _updatedAt: { nanoseconds: 0, seconds: 1234567890 } as any,
  _updatedBy: "updater@example.com",
  additional: [],
  key: "testgame",
  name: "Test Game System",
  owner: "test-owner",
  referenceHierarchy: {
    "cos-armors": ["cos-traits"],
    "cos-profiles": ["cos-weapons", "cos-armors"],
    "cos-traits": [],
    "cos-weapons": ["cos-traits"],
  } as any,
  status: "active",
};

describe("useGameSystem", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUsePathname.mockReturnValue("/testgame/some/path");
  });

  describe("pathname parsing", () => {
    it("should extract game system key from pathname", async () => {
      mockUsePathname.mockReturnValue("/testgame/admin/profiles");
      mockGetDocuments.mockResolvedValueOnce([mockGameSystem]);

      renderHook(() => useGameSystem());

      await waitFor(() => {
        expect(mockGetDocuments).toHaveBeenCalledWith(
          CollectionRegistry.GameSystem,
          [["key", "==", "testgame"]],
        );
      });
    });

    it("should handle root pathname", async () => {
      mockUsePathname.mockReturnValue("/");
      mockGetDocuments.mockResolvedValueOnce([]);

      renderHook(() => useGameSystem());

      await waitFor(() => {
        expect(mockGetDocuments).toHaveBeenCalledWith(
          CollectionRegistry.GameSystem,
          [["key", "==", ""]],
        );
      });
    });

    it("should handle null pathname", async () => {
      mockUsePathname.mockReturnValue(null);
      mockGetDocuments.mockResolvedValueOnce([]);

      renderHook(() => useGameSystem());

      await waitFor(() => {
        expect(mockGetDocuments).toHaveBeenCalledWith(
          CollectionRegistry.GameSystem,
          [["key", "==", ""]],
        );
      });
    });
  });

  describe("game system loading", () => {
    it("should load game system successfully", async () => {
      mockGetDocuments.mockResolvedValueOnce([mockGameSystem]);

      const { result } = renderHook(() => useGameSystem());

      await waitFor(() => {
        expect(result.current[0]).toEqual(mockGameSystem);
      });
    });

    it("should return undefined when no game system found", async () => {
      mockGetDocuments.mockResolvedValueOnce([]);

      const { result } = renderHook(() => useGameSystem());

      await waitFor(() => {
        expect(result.current[0]).toBeUndefined();
      });
    });

    it("should return first game system when multiple found", async () => {
      const secondSystem = { ...mockGameSystem, _id: "system456" };
      mockGetDocuments.mockResolvedValueOnce([mockGameSystem, secondSystem]);

      const { result } = renderHook(() => useGameSystem());

      await waitFor(() => {
        expect(result.current[0]).toEqual(mockGameSystem);
      });
    });

    it("should handle loading errors", async () => {
      const error = new Error("Failed to load game system");
      mockGetDocuments.mockRejectedValueOnce(error);

      renderHook(() => useGameSystem());

      await waitFor(() => {
        expect(mockNotification).toHaveBeenCalledWith({
          description: error,
          message: "Error",
        });
      });
    });
  });

  describe("getAllowedToRefer", () => {
    it("should return allowed references for collection", async () => {
      mockGetDocuments.mockResolvedValueOnce([mockGameSystem]);

      const { result } = renderHook(() => useGameSystem());

      await waitFor(() => {
        expect(result.current[0]).toEqual(mockGameSystem);
      });

      const allowedRefs = result.current[1].getAllowedToRefer(
        "cos-profiles" as CollectionName,
      );
      expect(allowedRefs).toEqual(["cos-weapons", "cos-armors"]);
    });

    it("should return empty array for collection not in hierarchy", async () => {
      mockGetDocuments.mockResolvedValueOnce([mockGameSystem]);

      const { result } = renderHook(() => useGameSystem());

      await waitFor(() => {
        expect(result.current[0]).toEqual(mockGameSystem);
      });

      const allowedRefs = result.current[1].getAllowedToRefer(
        "non-existent" as CollectionName,
      );
      expect(allowedRefs).toEqual([]);
    });

    it("should return empty array when no game system loaded", () => {
      mockGetDocuments.mockResolvedValueOnce([]);

      const { result } = renderHook(() => useGameSystem());

      const allowedRefs = result.current[1].getAllowedToRefer(
        "cos-profiles" as CollectionName,
      );
      expect(allowedRefs).toEqual([]);
    });

    it("should return empty array when game system has no reference hierarchy", async () => {
      const systemWithoutHierarchy = {
        ...mockGameSystem,
        referenceHierarchy: undefined,
      };
      mockGetDocuments.mockResolvedValueOnce([systemWithoutHierarchy]);

      const { result } = renderHook(() => useGameSystem());

      await waitFor(() => {
        expect(result.current[0]).toEqual(systemWithoutHierarchy);
      });

      const allowedRefs = result.current[1].getAllowedToRefer(
        "cos-profiles" as CollectionName,
      );
      expect(allowedRefs).toEqual([]);
    });
  });

  describe("canBeMentionedBy", () => {
    it("should return collections that can mention the given collection", async () => {
      mockGetDocuments.mockResolvedValueOnce([mockGameSystem]);

      const { result } = renderHook(() => useGameSystem());

      await waitFor(() => {
        expect(result.current[0]).toEqual(mockGameSystem);
      });

      const mentionedBy = result.current[1].canBeMentionedBy(
        "cos-weapons" as CollectionName,
      );
      expect(mentionedBy).toEqual(["cos-profiles"]);
    });

    it("should return multiple collections that can mention the target", async () => {
      mockGetDocuments.mockResolvedValueOnce([mockGameSystem]);

      const { result } = renderHook(() => useGameSystem());

      await waitFor(() => {
        expect(result.current[0]).toEqual(mockGameSystem);
      });

      const mentionedBy = result.current[1].canBeMentionedBy(
        "cos-traits" as CollectionName,
      );
      expect(mentionedBy).toEqual(["cos-armors", "cos-weapons"]);
    });

    it("should return empty array for collection not referenced by any", async () => {
      mockGetDocuments.mockResolvedValueOnce([mockGameSystem]);

      const { result } = renderHook(() => useGameSystem());

      await waitFor(() => {
        expect(result.current[0]).toEqual(mockGameSystem);
      });

      const mentionedBy = result.current[1].canBeMentionedBy(
        "cos-profiles" as CollectionName,
      );
      expect(mentionedBy).toEqual([]);
    });

    it("should return empty array when no game system loaded", () => {
      mockGetDocuments.mockResolvedValueOnce([]);

      const { result } = renderHook(() => useGameSystem());

      const mentionedBy = result.current[1].canBeMentionedBy(
        "cos-weapons" as CollectionName,
      );
      expect(mentionedBy).toEqual([]);
    });
  });

  describe("function stability", () => {
    it("should maintain function references when game system doesn't change", async () => {
      mockGetDocuments.mockResolvedValue([mockGameSystem]);

      const { result, rerender } = renderHook(() => useGameSystem());

      await waitFor(() => {
        expect(result.current[0]).toEqual(mockGameSystem);
      });

      const initialUtils = result.current[1];

      rerender();

      await waitFor(() => {
        expect(result.current[1].getAllowedToRefer).toBe(
          initialUtils.getAllowedToRefer,
        );
        expect(result.current[1].canBeMentionedBy).toBe(
          initialUtils.canBeMentionedBy,
        );
      });
    });
  });

  describe("return structure", () => {
    it("should return consistent tuple structure", async () => {
      mockGetDocuments.mockResolvedValueOnce([mockGameSystem]);

      const { result } = renderHook(() => useGameSystem());

      await waitFor(() => {
        expect(result.current[0]).toEqual(mockGameSystem);
      });

      expect(Array.isArray(result.current)).toBe(true);
      expect(result.current).toHaveLength(2);

      const [gameSystem, utils] = result.current;
      expect(gameSystem).toEqual(mockGameSystem);
      expect(typeof utils).toBe("object");
      expect(typeof utils.getAllowedToRefer).toBe("function");
      expect(typeof utils.canBeMentionedBy).toBe("function");
    });

    it("should return undefined game system and valid utils when no system found", async () => {
      mockGetDocuments.mockResolvedValueOnce([]);

      const { result } = renderHook(() => useGameSystem());

      await waitFor(() => {
        expect(result.current[0]).toBeUndefined();
      });

      const [gameSystem, utils] = result.current;
      expect(gameSystem).toBeUndefined();
      expect(typeof utils).toBe("object");
      expect(typeof utils.getAllowedToRefer).toBe("function");
      expect(typeof utils.canBeMentionedBy).toBe("function");

      // Utils should still work with empty results
      expect(utils.getAllowedToRefer("cos-profiles" as CollectionName)).toEqual(
        [],
      );
      expect(utils.canBeMentionedBy("cos-weapons" as CollectionName)).toEqual(
        [],
      );
    });
  });

  describe("complex scenarios", () => {
    it("should handle complex reference hierarchy", async () => {
      const complexHierarchy = {
        level1: ["level2a", "level2b"],
        level2a: ["level3"],
        level2b: ["level3", "level4"],
        level3: [],
        level4: [],
      } as any;

      const complexSystem: GameSystem = {
        ...mockGameSystem,
        referenceHierarchy: complexHierarchy,
      };

      mockGetDocuments.mockResolvedValueOnce([complexSystem]);

      const { result } = renderHook(() => useGameSystem());

      await waitFor(() => {
        expect(result.current[0]).toBeDefined();
      });

      // Test getAllowedToRefer with complex hierarchy
      expect(
        result.current[1].getAllowedToRefer("level1" as CollectionName),
      ).toEqual(["level2a", "level2b"]);

      expect(
        result.current[1].getAllowedToRefer("level2a" as CollectionName),
      ).toEqual(["level3"]);

      expect(
        result.current[1].getAllowedToRefer("level2b" as CollectionName),
      ).toEqual(["level3", "level4"]);

      // Test canBeMentionedBy with complex hierarchy
      expect(
        result.current[1].canBeMentionedBy("level2a" as CollectionName),
      ).toEqual(["level1"]);

      expect(
        result.current[1].canBeMentionedBy("level3" as CollectionName),
      ).toEqual(["level2a", "level2b"]);

      expect(
        result.current[1].canBeMentionedBy("level4" as CollectionName),
      ).toEqual(["level2b"]);
    });

    it("should handle empty reference hierarchy", async () => {
      const emptyHierarchySystem: GameSystem = {
        ...mockGameSystem,
        referenceHierarchy: {} as Record<CollectionName, CollectionName[]>,
      };

      mockGetDocuments.mockResolvedValueOnce([emptyHierarchySystem]);

      const { result } = renderHook(() => useGameSystem());

      await waitFor(() => {
        expect(result.current[0]).toBeDefined();
      });

      expect(
        result.current[1].getAllowedToRefer("any-collection" as CollectionName),
      ).toEqual([]);

      expect(
        result.current[1].canBeMentionedBy("any-collection" as CollectionName),
      ).toEqual([]);
    });

    it("should handle pathname changes", async () => {
      mockGetDocuments.mockResolvedValueOnce([mockGameSystem]);

      const { result, rerender } = renderHook(() => useGameSystem());

      await waitFor(() => {
        expect(result.current[0]).toEqual(mockGameSystem);
      });

      expect(mockGetDocuments).toHaveBeenCalledTimes(1);

      // Change pathname
      mockUsePathname.mockReturnValue("/anothergame/path");
      const anotherSystem = { ...mockGameSystem, key: "anothergame" };
      mockGetDocuments.mockResolvedValueOnce([anotherSystem]);

      rerender();

      await waitFor(() => {
        expect(mockGetDocuments).toHaveBeenCalledWith(
          CollectionRegistry.GameSystem,
          [["key", "==", "anothergame"]],
        );
      });

      expect(mockGetDocuments).toHaveBeenCalledTimes(2);
    });
  });

  describe("error handling", () => {
    it("should handle console.error during error", async () => {
      const consoleSpy = jest.spyOn(console, "error").mockImplementation();
      const error = new Error("Network error");
      mockGetDocuments.mockRejectedValueOnce(error);

      renderHook(() => useGameSystem());

      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalledWith("useGameSystem()", error);
      });

      consoleSpy.mockRestore();
    });

    it("should show notification for errors", async () => {
      const error = new Error("Test error");
      mockGetDocuments.mockRejectedValueOnce(error);

      renderHook(() => useGameSystem());

      await waitFor(() => {
        expect(mockNotification).toHaveBeenCalledWith({
          description: error,
          message: "Error",
        });
      });
    });
  });
});
