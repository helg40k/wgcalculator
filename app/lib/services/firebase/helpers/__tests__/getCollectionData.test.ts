import { getDocs } from "firebase/firestore";

import collectionQuery from "../collectionQuery";
import getCollectionData, { Props } from "../getCollectionData";

// Mock the firestore instance and app
jest.mock("../../../firebase/utils/firestore", () => ({
  __esModule: true,
  default: "mock-firestore-instance",
}));

jest.mock("../../../firebase/utils/app", () => ({
  __esModule: true,
  default: "mock-app-instance",
}));

// Mock dependencies
jest.mock("../collectionQuery");
jest.mock("firebase/firestore", () => ({
  getDocs: jest.fn(),
  getFirestore: jest.fn(),
}));

const mockGetDocs = getDocs as jest.MockedFunction<typeof getDocs>;
const mockCollectionQuery = collectionQuery as jest.MockedFunction<
  typeof collectionQuery
>;

const createMockSnapshot = (docs: any[]) => ({
  docs: docs.map((data) => ({
    data: () => data,
  })),
});

const mockDocuments = [
  { _id: "doc1", name: "Document 1", priority: 1, status: "active" },
  { _id: "doc2", name: "Document 2", priority: 2, status: "draft" },
  { _id: "doc3", name: "Document 3", priority: 3, status: "active" },
];

describe("getCollectionData", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should fetch collection data with basic parameters", async () => {
    const collectionPath = "test-collection";
    const mockQuery = { path: collectionPath };
    const mockSnapshot = createMockSnapshot(mockDocuments);

    const options: Props = {
      filters: undefined,
      limit: undefined,
      pagination: undefined,
      sort: undefined,
      withoutSort: undefined,
    };

    mockCollectionQuery.mockReturnValue(mockQuery as any);
    mockGetDocs.mockResolvedValueOnce(mockSnapshot as any);

    const result = await getCollectionData(collectionPath, options);

    expect(mockCollectionQuery).toHaveBeenCalledWith(
      collectionPath,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
    );
    expect(mockGetDocs).toHaveBeenCalledWith(mockQuery);
    expect(result).toEqual(mockDocuments);
  });

  it("should handle filters correctly", async () => {
    const collectionPath = "filtered-collection";
    const mockQuery = { path: collectionPath };
    const filteredDocs = [mockDocuments[0], mockDocuments[2]]; // Only active docs
    const mockSnapshot = createMockSnapshot(filteredDocs);

    const options: Props = {
      filters: [["status", "==", "active"]],
      limit: undefined,
      pagination: undefined,
      sort: undefined,
      withoutSort: undefined,
    };

    mockCollectionQuery.mockReturnValue(mockQuery as any);
    mockGetDocs.mockResolvedValueOnce(mockSnapshot as any);

    const result = await getCollectionData(collectionPath, options);

    expect(mockCollectionQuery).toHaveBeenCalledWith(
      collectionPath,
      [["status", "==", "active"]],
      undefined,
      undefined,
      undefined,
      undefined,
    );
    expect(result).toEqual(filteredDocs);
  });

  it("should handle sorting correctly", async () => {
    const collectionPath = "sorted-collection";
    const mockQuery = { path: collectionPath };
    const sortedDocs = [...mockDocuments].reverse(); // Descending order
    const mockSnapshot = createMockSnapshot(sortedDocs);

    const options: Props = {
      filters: undefined,
      limit: undefined,
      pagination: undefined,
      sort: ["priority", "desc"],
      withoutSort: undefined,
    };

    mockCollectionQuery.mockReturnValue(mockQuery as any);
    mockGetDocs.mockResolvedValueOnce(mockSnapshot as any);

    const result = await getCollectionData(collectionPath, options);

    expect(mockCollectionQuery).toHaveBeenCalledWith(
      collectionPath,
      undefined,
      ["priority", "desc"],
      undefined,
      undefined,
      undefined,
    );
    expect(result).toEqual(sortedDocs);
  });

  it("should handle limit correctly", async () => {
    const collectionPath = "limited-collection";
    const mockQuery = { path: collectionPath };
    const limitedDocs = mockDocuments.slice(0, 2); // First 2 docs
    const mockSnapshot = createMockSnapshot(limitedDocs);

    const options: Props = {
      filters: undefined,
      limit: 2,
      pagination: undefined,
      sort: undefined,
      withoutSort: undefined,
    };

    mockCollectionQuery.mockReturnValue(mockQuery as any);
    mockGetDocs.mockResolvedValueOnce(mockSnapshot as any);

    const result = await getCollectionData(collectionPath, options);

    expect(mockCollectionQuery).toHaveBeenCalledWith(
      collectionPath,
      undefined,
      undefined,
      2,
      undefined,
      undefined,
    );
    expect(result).toEqual(limitedDocs);
  });

  it("should handle pagination correctly", async () => {
    const collectionPath = "paginated-collection";
    const mockQuery = { path: collectionPath };
    const paginatedDocs = mockDocuments.slice(1); // Skip first doc
    const mockSnapshot = createMockSnapshot(paginatedDocs);
    const mockPaginationCursor = { id: "doc1" } as any;

    const options: Props = {
      filters: undefined,
      limit: undefined,
      pagination: mockPaginationCursor,
      sort: undefined,
      withoutSort: undefined,
    };

    mockCollectionQuery.mockReturnValue(mockQuery as any);
    mockGetDocs.mockResolvedValueOnce(mockSnapshot as any);

    const result = await getCollectionData(collectionPath, options);

    expect(mockCollectionQuery).toHaveBeenCalledWith(
      collectionPath,
      undefined,
      undefined,
      undefined,
      mockPaginationCursor,
      undefined,
    );
    expect(result).toEqual(paginatedDocs);
  });

  it("should handle withoutSort flag", async () => {
    const collectionPath = "unsorted-collection";
    const mockQuery = { path: collectionPath };
    const mockSnapshot = createMockSnapshot(mockDocuments);

    const options: Props = {
      filters: undefined,
      limit: undefined,
      pagination: undefined,
      sort: undefined,
      withoutSort: true,
    };

    mockCollectionQuery.mockReturnValue(mockQuery as any);
    mockGetDocs.mockResolvedValueOnce(mockSnapshot as any);

    const result = await getCollectionData(collectionPath, options);

    expect(mockCollectionQuery).toHaveBeenCalledWith(
      collectionPath,
      undefined,
      undefined,
      undefined,
      undefined,
      true,
    );
    expect(result).toEqual(mockDocuments);
  });

  it("should handle complex filter combinations", async () => {
    const collectionPath = "complex-filtered-collection";
    const mockQuery = { path: collectionPath };
    const mockSnapshot = createMockSnapshot([mockDocuments[0]]);

    const options: Props = {
      filters: [
        ["status", "==", "active"],
        ["priority", ">", 0],
        ["name", "!=", ""],
      ],
      limit: 10,
      pagination: undefined,
      sort: ["priority", "asc"],
      withoutSort: false,
    };

    mockCollectionQuery.mockReturnValue(mockQuery as any);
    mockGetDocs.mockResolvedValueOnce(mockSnapshot as any);

    const result = await getCollectionData(collectionPath, options);

    expect(mockCollectionQuery).toHaveBeenCalledWith(
      collectionPath,
      [
        ["status", "==", "active"],
        ["priority", ">", 0],
        ["name", "!=", ""],
      ],
      ["priority", "asc"],
      10,
      undefined,
      false,
    );
    expect(result).toEqual([mockDocuments[0]]);
  });

  it("should handle empty results", async () => {
    const collectionPath = "empty-collection";
    const mockQuery = { path: collectionPath };
    const emptySnapshot = createMockSnapshot([]);

    const options: Props = {
      filters: [["nonexistent", "==", "value"]],
      limit: undefined,
      pagination: undefined,
      sort: undefined,
      withoutSort: undefined,
    };

    mockCollectionQuery.mockReturnValue(mockQuery as any);
    mockGetDocs.mockResolvedValueOnce(emptySnapshot as any);

    const result = await getCollectionData(collectionPath, options);

    expect(result).toEqual([]);
  });

  it("should handle Firebase query errors", async () => {
    const collectionPath = "error-collection";
    const error = new Error("Firebase query failed");

    const options: Props = {
      filters: undefined,
      limit: undefined,
      pagination: undefined,
      sort: undefined,
      withoutSort: undefined,
    };

    mockCollectionQuery.mockImplementation(() => {
      throw error;
    });

    await expect(getCollectionData(collectionPath, options)).rejects.toThrow(
      "Firebase query failed",
    );
  });

  it("should handle getDocs errors", async () => {
    const collectionPath = "getdocs-error-collection";
    const mockQuery = { path: collectionPath };
    const error = new Error("Failed to get documents");

    const options: Props = {
      filters: undefined,
      limit: undefined,
      pagination: undefined,
      sort: undefined,
      withoutSort: undefined,
    };

    mockCollectionQuery.mockReturnValue(mockQuery as any);
    mockGetDocs.mockRejectedValueOnce(error);

    await expect(getCollectionData(collectionPath, options)).rejects.toThrow(
      "Failed to get documents",
    );
  });

  it("should handle different collection paths", async () => {
    const testPaths = [
      "users",
      "products/categories",
      "nested/deep/collection",
      "simple-collection",
    ];

    for (const path of testPaths) {
      const mockQuery = { path };
      const mockSnapshot = createMockSnapshot([
        { _id: `${path}-doc`, name: `${path} document` },
      ]);

      const options: Props = {
        filters: undefined,
        limit: undefined,
        pagination: undefined,
        sort: undefined,
        withoutSort: undefined,
      };

      mockCollectionQuery.mockReturnValue(mockQuery as any);
      mockGetDocs.mockResolvedValueOnce(mockSnapshot as any);

      const result = await getCollectionData(path, options);

      expect(mockCollectionQuery).toHaveBeenCalledWith(
        path,
        undefined,
        undefined,
        undefined,
        undefined,
        undefined,
      );
      expect(result).toEqual([
        { _id: `${path}-doc`, name: `${path} document` },
      ]);

      jest.clearAllMocks();
    }
  });

  it("should handle array pagination parameter", async () => {
    const collectionPath = "array-pagination-collection";
    const mockQuery = { path: collectionPath };
    const mockSnapshot = createMockSnapshot(mockDocuments);
    const arrayPagination = ["cursor1", "cursor2"];

    const options: Props = {
      filters: undefined,
      limit: undefined,
      pagination: arrayPagination,
      sort: undefined,
      withoutSort: undefined,
    };

    mockCollectionQuery.mockReturnValue(mockQuery as any);
    mockGetDocs.mockResolvedValueOnce(mockSnapshot as any);

    const result = await getCollectionData(collectionPath, options);

    expect(mockCollectionQuery).toHaveBeenCalledWith(
      collectionPath,
      undefined,
      undefined,
      undefined,
      arrayPagination,
      undefined,
    );
    expect(result).toEqual(mockDocuments);
  });
});
