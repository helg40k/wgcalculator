import { collection, getDocs, query, where } from "firebase/firestore";

import getDocuments from "../getDocuments";

// Mock the firestore instance
jest.mock("../../../firebase/utils/firestore", () => ({
  __esModule: true,
  default: "mock-firestore-instance",
}));

const mockCollection = collection as jest.MockedFunction<typeof collection>;
const mockGetDocs = getDocs as jest.MockedFunction<typeof getDocs>;
const mockQuery = query as jest.MockedFunction<typeof query>;
const mockWhere = where as jest.MockedFunction<typeof where>;

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

describe("getDocuments", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should get documents with single filter", async () => {
    const collectionPath = "test-collection";
    const filters: [string, any, any][] = [["status", "==", "active"]];
    const filteredDocs = [mockDocuments[0], mockDocuments[2]]; // Only active docs
    const mockSnapshot = createMockSnapshot(filteredDocs);

    const mockCollectionRef = { id: "test-collection-ref" };
    const mockWhereClause = {
      field: "status",
      operator: "==",
      value: "active",
    };
    const mockQueryRef = {
      collection: mockCollectionRef,
      where: mockWhereClause,
    };

    mockCollection.mockReturnValue(mockCollectionRef as any);
    mockWhere.mockReturnValue(mockWhereClause as any);
    mockQuery.mockReturnValue(mockQueryRef as any);
    mockGetDocs.mockResolvedValueOnce(mockSnapshot as any);

    const result = await getDocuments(collectionPath, filters);

    expect(mockCollection).toHaveBeenCalledWith(
      "mock-firestore-instance",
      collectionPath,
    );
    expect(mockWhere).toHaveBeenCalledWith("status", "==", "active");
    expect(mockQuery).toHaveBeenCalledWith(mockCollectionRef, mockWhereClause);
    expect(mockGetDocs).toHaveBeenCalledWith(mockQueryRef);
    expect(result).toEqual(filteredDocs);
  });

  it("should get documents with multiple filters", async () => {
    const collectionPath = "multi-filter-collection";
    const filters: [string, any, any][] = [
      ["status", "==", "active"],
      ["priority", ">", 1],
      ["name", "!=", ""],
    ];
    const filteredDocs = [mockDocuments[2]]; // Only doc3 matches all filters
    const mockSnapshot = createMockSnapshot(filteredDocs);

    const mockCollectionRef = { id: "multi-filter-collection-ref" };
    const mockWhereClause1 = {
      field: "status",
      operator: "==",
      value: "active",
    };
    const mockWhereClause2 = { field: "priority", operator: ">", value: 1 };
    const mockWhereClause3 = { field: "name", operator: "!=", value: "" };
    const mockQueryRef = {
      collection: mockCollectionRef,
      where: [mockWhereClause1, mockWhereClause2, mockWhereClause3],
    };

    mockCollection.mockReturnValue(mockCollectionRef as any);
    mockWhere
      .mockReturnValueOnce(mockWhereClause1 as any)
      .mockReturnValueOnce(mockWhereClause2 as any)
      .mockReturnValueOnce(mockWhereClause3 as any);
    mockQuery.mockReturnValue(mockQueryRef as any);
    mockGetDocs.mockResolvedValueOnce(mockSnapshot as any);

    const result = await getDocuments(collectionPath, filters);

    expect(mockWhere).toHaveBeenCalledTimes(3);
    expect(mockWhere).toHaveBeenNthCalledWith(1, "status", "==", "active");
    expect(mockWhere).toHaveBeenNthCalledWith(2, "priority", ">", 1);
    expect(mockWhere).toHaveBeenNthCalledWith(3, "name", "!=", "");
    expect(result).toEqual(filteredDocs);
  });

  it("should handle empty filters array", async () => {
    const collectionPath = "no-filter-collection";
    const filters = [] as any[];
    const mockSnapshot = createMockSnapshot(mockDocuments);

    const mockCollectionRef = { id: "no-filter-collection-ref" };
    const mockQueryRef = { collection: mockCollectionRef };

    mockCollection.mockReturnValue(mockCollectionRef as any);
    mockQuery.mockReturnValue(mockQueryRef as any);
    mockGetDocs.mockResolvedValueOnce(mockSnapshot as any);

    const result = await getDocuments(collectionPath, filters);

    expect(mockCollection).toHaveBeenCalledWith(
      "mock-firestore-instance",
      collectionPath,
    );
    expect(mockWhere).not.toHaveBeenCalled();
    expect(mockQuery).toHaveBeenCalledWith(mockCollectionRef);
    expect(result).toEqual(mockDocuments);
  });

  it("should handle null/undefined filters", async () => {
    const collectionPath = "null-filter-collection";
    const mockSnapshot = createMockSnapshot(mockDocuments);

    const mockCollectionRef = { id: "null-filter-collection-ref" };
    const mockQueryRef = { collection: mockCollectionRef };

    mockCollection.mockReturnValue(mockCollectionRef as any);
    mockQuery.mockReturnValue(mockQueryRef as any);
    mockGetDocs.mockResolvedValueOnce(mockSnapshot as any);

    // Test with null filters
    let result = await getDocuments(collectionPath, null as any);
    expect(result).toEqual(mockDocuments);

    jest.clearAllMocks();
    mockCollection.mockReturnValue(mockCollectionRef as any);
    mockQuery.mockReturnValue(mockQueryRef as any);
    mockGetDocs.mockResolvedValueOnce(mockSnapshot as any);

    // Test with undefined filters
    result = await getDocuments(collectionPath, undefined as any);
    expect(result).toEqual(mockDocuments);
  });

  it("should handle different filter operators", async () => {
    const operators = [
      "==",
      "!=",
      "<",
      "<=",
      ">",
      ">=",
      "in",
      "not-in",
      "array-contains",
      "array-contains-any",
    ];

    for (const operator of operators) {
      const collectionPath = `${operator}-collection`;
      const filters: [string, any, any][] = [
        ["field", operator as any, "value"],
      ];
      const mockSnapshot = createMockSnapshot([{ _id: "test", operator }]);

      const mockCollectionRef = { id: `${operator}-collection-ref` };
      const mockWhereClause = { field: "field", operator, value: "value" };
      const mockQueryRef = {
        collection: mockCollectionRef,
        where: mockWhereClause,
      };

      mockCollection.mockReturnValue(mockCollectionRef as any);
      mockWhere.mockReturnValue(mockWhereClause as any);
      mockQuery.mockReturnValue(mockQueryRef as any);
      mockGetDocs.mockResolvedValueOnce(mockSnapshot as any);

      const result = await getDocuments(collectionPath, filters);

      expect(mockWhere).toHaveBeenCalledWith("field", operator, "value");
      expect(result).toEqual([{ _id: "test", operator }]);

      jest.clearAllMocks();
    }
  });

  it("should handle different collection paths", async () => {
    const testPaths = [
      "users",
      "products/categories",
      "nested/deep/collection",
      "simple-collection",
    ];

    for (const path of testPaths) {
      const filters: [string, any, any][] = [["_id", "!=", ""]];
      const mockSnapshot = createMockSnapshot([
        { _id: `${path}-doc`, collection: path },
      ]);

      const mockCollectionRef = { id: `${path}-ref` };
      const mockWhereClause = { field: "_id", operator: "!=", value: "" };
      const mockQueryRef = {
        collection: mockCollectionRef,
        where: mockWhereClause,
      };

      mockCollection.mockReturnValue(mockCollectionRef as any);
      mockWhere.mockReturnValue(mockWhereClause as any);
      mockQuery.mockReturnValue(mockQueryRef as any);
      mockGetDocs.mockResolvedValueOnce(mockSnapshot as any);

      const result = await getDocuments(path, filters);

      expect(mockCollection).toHaveBeenCalledWith(
        "mock-firestore-instance",
        path,
      );
      expect(result).toEqual([{ _id: `${path}-doc`, collection: path }]);

      jest.clearAllMocks();
    }
  });

  it("should handle empty results", async () => {
    const collectionPath = "empty-results-collection";
    const filters: [string, any, any][] = [["nonexistent", "==", "value"]];
    const emptySnapshot = createMockSnapshot([]);

    const mockCollectionRef = { id: "empty-results-collection-ref" };
    const mockWhereClause = {
      field: "nonexistent",
      operator: "==",
      value: "value",
    };
    const mockQueryRef = {
      collection: mockCollectionRef,
      where: mockWhereClause,
    };

    mockCollection.mockReturnValue(mockCollectionRef as any);
    mockWhere.mockReturnValue(mockWhereClause as any);
    mockQuery.mockReturnValue(mockQueryRef as any);
    mockGetDocs.mockResolvedValueOnce(emptySnapshot as any);

    const result = await getDocuments(collectionPath, filters);

    expect(result).toEqual([]);
  });

  it("should handle complex filter values", async () => {
    const collectionPath = "complex-filter-collection";
    const complexValue = {
      array: [1, 2, 3],
      boolean: true,
      nested: { property: "value" },
      number: 42,
    };
    const filters: [string, any, any][] = [
      ["complexField", "==", complexValue],
    ];
    const mockSnapshot = createMockSnapshot([
      { _id: "complex", data: complexValue },
    ]);

    const mockCollectionRef = { id: "complex-filter-collection-ref" };
    const mockWhereClause = {
      field: "complexField",
      operator: "==",
      value: complexValue,
    };
    const mockQueryRef = {
      collection: mockCollectionRef,
      where: mockWhereClause,
    };

    mockCollection.mockReturnValue(mockCollectionRef as any);
    mockWhere.mockReturnValue(mockWhereClause as any);
    mockQuery.mockReturnValue(mockQueryRef as any);
    mockGetDocs.mockResolvedValueOnce(mockSnapshot as any);

    const result = await getDocuments(collectionPath, filters);

    expect(mockWhere).toHaveBeenCalledWith("complexField", "==", complexValue);
    expect(result).toEqual([{ _id: "complex", data: complexValue }]);
  });

  it("should handle Firebase collection errors", async () => {
    const collectionPath = "error-collection";
    const filters: [string, any, any][] = [["field", "==", "value"]];
    const error = new Error("Failed to access collection");

    mockCollection.mockImplementation(() => {
      throw error;
    });

    await expect(getDocuments(collectionPath, filters)).rejects.toThrow(
      "Failed to access collection",
    );
  });

  it("should handle Firebase where clause errors", async () => {
    const collectionPath = "where-error-collection";
    const filters: [string, any, any][] = [
      ["invalidField", "invalid-operator" as any, "value"],
    ];
    const error = new Error("Invalid where clause");

    const mockCollectionRef = { id: "where-error-collection-ref" };
    mockCollection.mockReturnValue(mockCollectionRef as any);
    mockWhere.mockImplementation(() => {
      throw error;
    });

    await expect(getDocuments(collectionPath, filters)).rejects.toThrow(
      "Invalid where clause",
    );
  });

  it("should handle Firebase query errors", async () => {
    const collectionPath = "query-error-collection";
    const filters: [string, any, any][] = [["field", "==", "value"]];
    const error = new Error("Failed to create query");

    const mockCollectionRef = { id: "query-error-collection-ref" };
    const mockWhereClause = { field: "field", operator: "==", value: "value" };

    mockCollection.mockReturnValue(mockCollectionRef as any);
    mockWhere.mockReturnValue(mockWhereClause as any);
    mockQuery.mockImplementation(() => {
      throw error;
    });

    await expect(getDocuments(collectionPath, filters)).rejects.toThrow(
      "Failed to create query",
    );
  });

  it("should handle Firebase getDocs errors", async () => {
    const collectionPath = "getdocs-error-collection";
    const filters: [string, any, any][] = [["field", "==", "value"]];
    const error = new Error("Failed to get documents");

    const mockCollectionRef = { id: "getdocs-error-collection-ref" };
    const mockWhereClause = { field: "field", operator: "==", value: "value" };
    const mockQueryRef = {
      collection: mockCollectionRef,
      where: mockWhereClause,
    };

    mockCollection.mockReturnValue(mockCollectionRef as any);
    mockWhere.mockReturnValue(mockWhereClause as any);
    mockQuery.mockReturnValue(mockQueryRef as any);
    mockGetDocs.mockRejectedValueOnce(error);

    await expect(getDocuments(collectionPath, filters)).rejects.toThrow(
      "Failed to get documents",
    );
  });

  it("should handle null/undefined document data", async () => {
    const collectionPath = "null-data-collection";
    const filters: [string, any, any][] = [["field", "==", "value"]];
    const mockSnapshot = {
      docs: [
        { data: () => null },
        { data: () => undefined },
        { data: () => ({ _id: "valid", name: "Valid Document" }) },
      ],
    };

    const mockCollectionRef = { id: "null-data-collection-ref" };
    const mockWhereClause = { field: "field", operator: "==", value: "value" };
    const mockQueryRef = {
      collection: mockCollectionRef,
      where: mockWhereClause,
    };

    mockCollection.mockReturnValue(mockCollectionRef as any);
    mockWhere.mockReturnValue(mockWhereClause as any);
    mockQuery.mockReturnValue(mockQueryRef as any);
    mockGetDocs.mockResolvedValueOnce(mockSnapshot as any);

    const result = await getDocuments(collectionPath, filters);

    expect(result).toEqual([
      null,
      undefined,
      { _id: "valid", name: "Valid Document" },
    ]);
  });
});
