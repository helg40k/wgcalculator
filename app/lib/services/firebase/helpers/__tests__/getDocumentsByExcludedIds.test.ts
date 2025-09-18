import {
  collection,
  documentId,
  getDocs,
  query,
  where,
} from "firebase/firestore";

import getDocuments from "../getDocuments";
import getDocumentsByExcludedIds from "../getDocumentsByExcludedIds";

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
jest.mock("../getDocuments");

const mockGetDocs = getDocs as jest.MockedFunction<typeof getDocs>;
const mockCollection = collection as jest.MockedFunction<typeof collection>;
const mockQuery = query as jest.MockedFunction<typeof query>;
const mockWhere = where as jest.MockedFunction<typeof where>;
const mockDocumentId = documentId as jest.MockedFunction<typeof documentId>;
const mockGetDocuments = getDocuments as jest.MockedFunction<
  typeof getDocuments
>;

const createMockSnapshot = (docs: any[]) => ({
  docs: docs.map((data) => ({
    data: () => data,
  })),
});

const mockDocuments = [
  { _id: "doc1", id: "doc1", name: "Document 1", status: "active" },
  { _id: "doc2", id: "doc2", name: "Document 2", status: "draft" },
  { _id: "doc3", id: "doc3", name: "Document 3", status: "active" },
  { _id: "doc4", id: "doc4", name: "Document 4", status: "inactive" },
  { _id: "doc5", id: "doc5", name: "Document 5", status: "active" },
];

describe("getDocumentsByExcludedIds", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should return all documents when excludedIds is empty", async () => {
    const collectionPath = "test-collection";
    const excludedIds: string[] = [];

    mockGetDocuments.mockResolvedValueOnce(mockDocuments);

    const result = await getDocumentsByExcludedIds(collectionPath, excludedIds);

    expect(mockGetDocuments).toHaveBeenCalledWith(collectionPath, []);
    expect(result).toEqual(mockDocuments);
    expect(mockGetDocs).not.toHaveBeenCalled(); // Should use getDocuments instead
  });

  it("should filter documents when excludedIds has more than 10 items", async () => {
    const collectionPath = "large-excluded-collection";
    const excludedIds = Array.from(
      { length: 15 },
      (_, i) => `excluded${i + 1}`,
    );
    const allDocuments = [
      ...mockDocuments,
      { _id: "excluded1", id: "excluded1", name: "Excluded 1" },
      { _id: "excluded2", id: "excluded2", name: "Excluded 2" },
    ];

    mockGetDocuments.mockResolvedValueOnce(allDocuments);

    const result = await getDocumentsByExcludedIds(collectionPath, excludedIds);

    expect(mockGetDocuments).toHaveBeenCalledWith(collectionPath, []);
    expect(result).toEqual(mockDocuments); // Should filter out excluded documents
    expect(mockGetDocs).not.toHaveBeenCalled();
  });

  it("should use Firebase not-in query for 1-10 excluded IDs", async () => {
    const collectionPath = "not-in-collection";
    const excludedIds = ["doc1", "doc3"];
    const filteredDocs = [mockDocuments[1], mockDocuments[3], mockDocuments[4]]; // doc2, doc4, doc5
    const mockSnapshot = createMockSnapshot(filteredDocs);

    const mockCollectionRef = { id: "not-in-collection-ref" };
    const mockDocumentIdRef = { field: "__name__" };
    const mockWhereClause = {
      field: "__name__",
      operator: "not-in",
      value: excludedIds,
    };
    const mockQueryRef = {
      collection: mockCollectionRef,
      where: mockWhereClause,
    };

    mockCollection.mockReturnValue(mockCollectionRef as any);
    mockDocumentId.mockReturnValue(mockDocumentIdRef as any);
    mockWhere.mockReturnValue(mockWhereClause as any);
    mockQuery.mockReturnValue(mockQueryRef as any);
    mockGetDocs.mockResolvedValueOnce(mockSnapshot as any);

    const result = await getDocumentsByExcludedIds(collectionPath, excludedIds);

    expect(mockCollection).toHaveBeenCalledWith(
      "mock-firestore-instance",
      collectionPath,
    );
    expect(mockDocumentId).toHaveBeenCalled();
    expect(mockWhere).toHaveBeenCalledWith(
      mockDocumentIdRef,
      "not-in",
      excludedIds,
    );
    expect(mockQuery).toHaveBeenCalledWith(mockCollectionRef, mockWhereClause);
    expect(mockGetDocs).toHaveBeenCalledWith(mockQueryRef);
    expect(result).toEqual(filteredDocs);
    expect(mockGetDocuments).not.toHaveBeenCalled(); // Should use Firebase query instead
  });

  it("should handle exactly 10 excluded IDs (boundary case)", async () => {
    const collectionPath = "boundary-collection";
    const excludedIds = Array.from(
      { length: 10 },
      (_, i) => `excluded${i + 1}`,
    );
    const filteredDocs = mockDocuments;
    const mockSnapshot = createMockSnapshot(filteredDocs);

    const mockCollectionRef = { id: "boundary-collection-ref" };
    const mockDocumentIdRef = { field: "__name__" };
    const mockWhereClause = {
      field: "__name__",
      operator: "not-in",
      value: excludedIds,
    };
    const mockQueryRef = {
      collection: mockCollectionRef,
      where: mockWhereClause,
    };

    mockCollection.mockReturnValue(mockCollectionRef as any);
    mockDocumentId.mockReturnValue(mockDocumentIdRef as any);
    mockWhere.mockReturnValue(mockWhereClause as any);
    mockQuery.mockReturnValue(mockQueryRef as any);
    mockGetDocs.mockResolvedValueOnce(mockSnapshot as any);

    const result = await getDocumentsByExcludedIds(collectionPath, excludedIds);

    expect(mockWhere).toHaveBeenCalledWith(
      mockDocumentIdRef,
      "not-in",
      excludedIds,
    );
    expect(result).toEqual(filteredDocs);
  });

  it("should handle exactly 11 excluded IDs (boundary case)", async () => {
    const collectionPath = "over-boundary-collection";
    const excludedIds = Array.from(
      { length: 11 },
      (_, i) => `excluded${i + 1}`,
    );
    const allDocuments = [
      ...mockDocuments,
      { _id: "excluded1", id: "excluded1", name: "Excluded 1" },
    ];

    mockGetDocuments.mockResolvedValueOnce(allDocuments);

    const result = await getDocumentsByExcludedIds(collectionPath, excludedIds);

    expect(mockGetDocuments).toHaveBeenCalledWith(collectionPath, []);
    expect(result).toEqual(mockDocuments); // Should filter out excluded1
    expect(mockGetDocs).not.toHaveBeenCalled();
  });

  it("should handle single excluded ID", async () => {
    const collectionPath = "single-excluded-collection";
    const excludedIds = ["doc2"];
    const filteredDocs = [
      mockDocuments[0],
      mockDocuments[2],
      mockDocuments[3],
      mockDocuments[4],
    ];
    const mockSnapshot = createMockSnapshot(filteredDocs);

    const mockCollectionRef = { id: "single-excluded-collection-ref" };
    const mockDocumentIdRef = { field: "__name__" };
    const mockWhereClause = {
      field: "__name__",
      operator: "not-in",
      value: excludedIds,
    };
    const mockQueryRef = {
      collection: mockCollectionRef,
      where: mockWhereClause,
    };

    mockCollection.mockReturnValue(mockCollectionRef as any);
    mockDocumentId.mockReturnValue(mockDocumentIdRef as any);
    mockWhere.mockReturnValue(mockWhereClause as any);
    mockQuery.mockReturnValue(mockQueryRef as any);
    mockGetDocs.mockResolvedValueOnce(mockSnapshot as any);

    const result = await getDocumentsByExcludedIds(collectionPath, excludedIds);

    expect(result).toEqual(filteredDocs);
  });

  it("should handle different collection paths", async () => {
    const testPaths = [
      "users",
      "products/categories",
      "nested/deep/collection",
      "simple-collection",
    ];

    for (const path of testPaths) {
      const excludedIds = ["excluded1"];
      const mockSnapshot = createMockSnapshot([
        { collection: path, id: `${path}-doc` },
      ]);

      const mockCollectionRef = { id: `${path}-ref` };
      const mockDocumentIdRef = { field: "__name__" };
      const mockWhereClause = {
        field: "__name__",
        operator: "not-in",
        value: excludedIds,
      };
      const mockQueryRef = {
        collection: mockCollectionRef,
        where: mockWhereClause,
      };

      mockCollection.mockReturnValue(mockCollectionRef as any);
      mockDocumentId.mockReturnValue(mockDocumentIdRef as any);
      mockWhere.mockReturnValue(mockWhereClause as any);
      mockQuery.mockReturnValue(mockQueryRef as any);
      mockGetDocs.mockResolvedValueOnce(mockSnapshot as any);

      const result = await getDocumentsByExcludedIds(path, excludedIds);

      expect(mockCollection).toHaveBeenCalledWith(
        "mock-firestore-instance",
        path,
      );
      expect(result).toEqual([{ collection: path, id: `${path}-doc` }]);

      jest.clearAllMocks();
    }
  });

  it("should handle empty results from Firebase query", async () => {
    const collectionPath = "empty-results-collection";
    const excludedIds = ["doc1", "doc2"];
    const emptySnapshot = createMockSnapshot([]);

    const mockCollectionRef = { id: "empty-results-collection-ref" };
    const mockDocumentIdRef = { field: "__name__" };
    const mockWhereClause = {
      field: "__name__",
      operator: "not-in",
      value: excludedIds,
    };
    const mockQueryRef = {
      collection: mockCollectionRef,
      where: mockWhereClause,
    };

    mockCollection.mockReturnValue(mockCollectionRef as any);
    mockDocumentId.mockReturnValue(mockDocumentIdRef as any);
    mockWhere.mockReturnValue(mockWhereClause as any);
    mockQuery.mockReturnValue(mockQueryRef as any);
    mockGetDocs.mockResolvedValueOnce(emptySnapshot as any);

    const result = await getDocumentsByExcludedIds(collectionPath, excludedIds);

    expect(result).toEqual([]);
  });

  it("should handle Firebase collection errors", async () => {
    const collectionPath = "error-collection";
    const excludedIds = ["doc1"];
    const error = new Error("Failed to access collection");

    mockCollection.mockImplementation(() => {
      throw error;
    });

    await expect(
      getDocumentsByExcludedIds(collectionPath, excludedIds),
    ).rejects.toThrow("Failed to access collection");
  });

  it("should handle Firebase documentId errors", async () => {
    const collectionPath = "documentid-error-collection";
    const excludedIds = ["doc1"];
    const error = new Error("Failed to get document ID reference");

    const mockCollectionRef = { id: "documentid-error-collection-ref" };
    mockCollection.mockReturnValue(mockCollectionRef as any);
    mockDocumentId.mockImplementation(() => {
      throw error;
    });

    await expect(
      getDocumentsByExcludedIds(collectionPath, excludedIds),
    ).rejects.toThrow("Failed to get document ID reference");
  });

  it("should handle Firebase where clause errors", async () => {
    const collectionPath = "where-error-collection";
    const excludedIds = ["doc1"];
    const error = new Error("Invalid where clause");

    const mockCollectionRef = { id: "where-error-collection-ref" };
    const mockDocumentIdRef = { field: "__name__" };
    mockCollection.mockReturnValue(mockCollectionRef as any);
    mockDocumentId.mockReturnValue(mockDocumentIdRef as any);
    mockWhere.mockImplementation(() => {
      throw error;
    });

    await expect(
      getDocumentsByExcludedIds(collectionPath, excludedIds),
    ).rejects.toThrow("Invalid where clause");
  });

  it("should handle Firebase query errors", async () => {
    const collectionPath = "query-error-collection";
    const excludedIds = ["doc1"];
    const error = new Error("Failed to create query");

    const mockCollectionRef = { id: "query-error-collection-ref" };
    const mockDocumentIdRef = { field: "__name__" };
    const mockWhereClause = {
      field: "__name__",
      operator: "not-in",
      value: excludedIds,
    };

    mockCollection.mockReturnValue(mockCollectionRef as any);
    mockDocumentId.mockReturnValue(mockDocumentIdRef as any);
    mockWhere.mockReturnValue(mockWhereClause as any);
    mockQuery.mockImplementation(() => {
      throw error;
    });

    await expect(
      getDocumentsByExcludedIds(collectionPath, excludedIds),
    ).rejects.toThrow("Failed to create query");
  });

  it("should handle Firebase getDocs errors", async () => {
    const collectionPath = "getdocs-error-collection";
    const excludedIds = ["doc1"];
    const error = new Error("Failed to get documents");

    const mockCollectionRef = { id: "getdocs-error-collection-ref" };
    const mockDocumentIdRef = { field: "__name__" };
    const mockWhereClause = {
      field: "__name__",
      operator: "not-in",
      value: excludedIds,
    };
    const mockQueryRef = {
      collection: mockCollectionRef,
      where: mockWhereClause,
    };

    mockCollection.mockReturnValue(mockCollectionRef as any);
    mockDocumentId.mockReturnValue(mockDocumentIdRef as any);
    mockWhere.mockReturnValue(mockWhereClause as any);
    mockQuery.mockReturnValue(mockQueryRef as any);
    mockGetDocs.mockRejectedValueOnce(error);

    await expect(
      getDocumentsByExcludedIds(collectionPath, excludedIds),
    ).rejects.toThrow("Failed to get documents");
  });

  it("should handle getDocuments errors for large excluded arrays", async () => {
    const collectionPath = "getdocuments-error-collection";
    const excludedIds = Array.from(
      { length: 15 },
      (_, i) => `excluded${i + 1}`,
    );
    const error = new Error("getDocuments failed");

    mockGetDocuments.mockRejectedValueOnce(error);

    await expect(
      getDocumentsByExcludedIds(collectionPath, excludedIds),
    ).rejects.toThrow("getDocuments failed");
  });

  it("should handle null/undefined document data", async () => {
    const collectionPath = "null-data-collection";
    const excludedIds = ["doc1"];
    const mockSnapshot = {
      docs: [
        { data: () => null },
        { data: () => undefined },
        { data: () => ({ id: "valid", name: "Valid Document" }) },
      ],
    };

    const mockCollectionRef = { id: "null-data-collection-ref" };
    const mockDocumentIdRef = { field: "__name__" };
    const mockWhereClause = {
      field: "__name__",
      operator: "not-in",
      value: excludedIds,
    };
    const mockQueryRef = {
      collection: mockCollectionRef,
      where: mockWhereClause,
    };

    mockCollection.mockReturnValue(mockCollectionRef as any);
    mockDocumentId.mockReturnValue(mockDocumentIdRef as any);
    mockWhere.mockReturnValue(mockWhereClause as any);
    mockQuery.mockReturnValue(mockQueryRef as any);
    mockGetDocs.mockResolvedValueOnce(mockSnapshot as any);

    const result = await getDocumentsByExcludedIds(collectionPath, excludedIds);

    expect(result).toEqual([
      null,
      undefined,
      { id: "valid", name: "Valid Document" },
    ]);
  });

  it("should properly filter documents by id property for large excluded arrays", async () => {
    const collectionPath = "filter-by-id-collection";
    const excludedIds = Array.from(
      { length: 15 },
      (_, i) => `excluded${i + 1}`,
    );
    const allDocuments = [
      { id: "doc1", name: "Document 1" },
      { id: "excluded1", name: "Excluded 1" },
      { id: "doc2", name: "Document 2" },
      { id: "excluded2", name: "Excluded 2" },
      { id: "doc3", name: "Document 3" },
    ];
    const expectedFiltered = [
      { id: "doc1", name: "Document 1" },
      { id: "doc2", name: "Document 2" },
      { id: "doc3", name: "Document 3" },
    ];

    mockGetDocuments.mockResolvedValueOnce(allDocuments);

    const result = await getDocumentsByExcludedIds(collectionPath, excludedIds);

    expect(result).toEqual(expectedFiltered);
  });
});
