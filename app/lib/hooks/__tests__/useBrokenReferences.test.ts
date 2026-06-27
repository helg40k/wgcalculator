import { renderHook, waitFor } from "@testing-library/react";

import { Playable } from "../../definitions";
import getDocumentsByIds from "../../services/firebase/helpers/getDocumentsByIds";
import useBrokenReferences from "../useBrokenReferences";

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

const mockGetDocumentsByIds = getDocumentsByIds as jest.MockedFunction<
  typeof getDocumentsByIds
>;

const createEntity = (
  id: string,
  references?: Record<string, { name: string }>,
): Playable => ({
  _createdAt: { nanoseconds: 0, seconds: 1234567890 } as any,
  _createdBy: "creator@example.com",
  _id: id,
  _isUpdated: false,
  _updatedAt: { nanoseconds: 0, seconds: 1234567890 } as any,
  _updatedBy: "updater@example.com",
  name: `Entity ${id}`,
  references: references as any,
  status: "active",
  systemId: "test-system",
});

describe("useBrokenReferences", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should return empty set when entities have no references", async () => {
    const entities = [createEntity("e1"), createEntity("e2")];

    const { result } = renderHook(() => useBrokenReferences(entities));

    await waitFor(() => {
      expect(result.current.size).toBe(0);
    });
    expect(mockGetDocumentsByIds).not.toHaveBeenCalled();
  });

  it("should return empty set when all references are valid", async () => {
    const entities = [
      createEntity("e1", {
        ref1: { name: "keywords" },
        ref2: { name: "sources" },
      }),
    ];

    mockGetDocumentsByIds.mockImplementation(async (collectionPath, _ids) => {
      if (collectionPath === "keywords") {
        return [{ _id: "ref1", name: "Keyword 1" }];
      }
      if (collectionPath === "sources") {
        return [{ _id: "ref2", name: "Source 1" }];
      }
      return [];
    });

    const { result } = renderHook(() => useBrokenReferences(entities));

    await waitFor(() => {
      expect(mockGetDocumentsByIds).toHaveBeenCalledTimes(2);
    });
    expect(result.current.size).toBe(0);
  });

  it("should detect entity with a broken reference", async () => {
    const entities = [
      createEntity("e1", {
        "broken-ref": { name: "keywords" },
        ref1: { name: "keywords" },
      }),
    ];

    mockGetDocumentsByIds.mockResolvedValueOnce([
      { _id: "ref1", name: "Keyword 1" },
    ]);

    const { result } = renderHook(() => useBrokenReferences(entities));

    await waitFor(() => {
      expect(result.current.has("e1")).toBe(true);
    });
    expect(result.current.size).toBe(1);
  });

  it("should only mark entities that have broken references", async () => {
    const entities = [
      createEntity("e1", {
        ref1: { name: "keywords" },
      }),
      createEntity("e2", {
        "broken-ref": { name: "keywords" },
      }),
    ];

    mockGetDocumentsByIds.mockResolvedValueOnce([
      { _id: "ref1", name: "Keyword 1" },
    ]);

    const { result } = renderHook(() => useBrokenReferences(entities));

    await waitFor(() => {
      expect(result.current.has("e2")).toBe(true);
    });
    expect(result.current.has("e1")).toBe(false);
    expect(result.current.size).toBe(1);
  });

  it("should batch references by collection", async () => {
    const entities = [
      createEntity("e1", {
        ref1: { name: "keywords" },
        ref2: { name: "keywords" },
        ref3: { name: "sources" },
      }),
    ];

    mockGetDocumentsByIds.mockImplementation(async (collectionPath, _ids) => {
      if (collectionPath === "keywords") {
        return [
          { _id: "ref1", name: "K1" },
          { _id: "ref2", name: "K2" },
        ];
      }
      if (collectionPath === "sources") {
        return [{ _id: "ref3", name: "S1" }];
      }
      return [];
    });

    const { result } = renderHook(() => useBrokenReferences(entities));

    await waitFor(() => {
      expect(mockGetDocumentsByIds).toHaveBeenCalledTimes(2);
    });

    expect(mockGetDocumentsByIds).toHaveBeenCalledWith("keywords", [
      "ref1",
      "ref2",
    ]);
    expect(mockGetDocumentsByIds).toHaveBeenCalledWith("sources", ["ref3"]);
    expect(result.current.size).toBe(0);
  });

  it("should not re-query when non-reference fields change", async () => {
    const entities = [createEntity("e1", { ref1: { name: "keywords" } })];

    mockGetDocumentsByIds.mockResolvedValue([{ _id: "ref1", name: "K1" }]);

    const { rerender } = renderHook((props) => useBrokenReferences(props), {
      initialProps: entities,
    });

    await waitFor(() => {
      expect(mockGetDocumentsByIds).toHaveBeenCalledTimes(1);
    });

    const updatedEntities = [
      { ...entities[0], name: "Updated Name", status: "disabled" as const },
    ];
    rerender(updatedEntities);

    await waitFor(() => {
      expect(mockGetDocumentsByIds).toHaveBeenCalledTimes(1);
    });
  });

  it("should re-query when references change", async () => {
    const entities = [createEntity("e1", { ref1: { name: "keywords" } })];

    mockGetDocumentsByIds.mockResolvedValue([{ _id: "ref1", name: "K1" }]);

    const { rerender } = renderHook((props) => useBrokenReferences(props), {
      initialProps: entities,
    });

    await waitFor(() => {
      expect(mockGetDocumentsByIds).toHaveBeenCalledTimes(1);
    });

    const updatedEntities = [
      createEntity("e1", {
        ref1: { name: "keywords" },
        ref2: { name: "sources" },
      }),
    ];
    rerender(updatedEntities);

    await waitFor(() => {
      expect(mockGetDocumentsByIds).toHaveBeenCalledTimes(3);
    });
  });

  it("should handle entities with empty references object", async () => {
    const entities = [createEntity("e1", {})];

    const { result } = renderHook(() => useBrokenReferences(entities));

    await waitFor(() => {
      expect(result.current.size).toBe(0);
    });
    expect(mockGetDocumentsByIds).not.toHaveBeenCalled();
  });

  it("should handle multiple entities sharing the same broken reference", async () => {
    const entities = [
      createEntity("e1", { "shared-broken": { name: "keywords" } }),
      createEntity("e2", { "shared-broken": { name: "keywords" } }),
    ];

    mockGetDocumentsByIds.mockResolvedValueOnce([]);

    const { result } = renderHook(() => useBrokenReferences(entities));

    await waitFor(() => {
      expect(result.current.size).toBe(2);
    });
    expect(result.current.has("e1")).toBe(true);
    expect(result.current.has("e2")).toBe(true);
  });
});
