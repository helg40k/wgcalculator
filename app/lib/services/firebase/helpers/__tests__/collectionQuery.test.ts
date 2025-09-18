import {
  collection,
  DocumentSnapshot,
  limit,
  orderBy,
  query,
  startAfter,
  where,
} from "firebase/firestore";

import collectionQuery from "../collectionQuery";

// Mock the firestore instance and app
jest.mock("../../../firebase/utils/firestore", () => ({
  __esModule: true,
  default: "mock-firestore-instance",
}));

jest.mock("../../../firebase/utils/app", () => ({
  __esModule: true,
  default: "mock-app-instance",
}));

const mockCollection = collection as jest.MockedFunction<typeof collection>;
const mockQuery = query as jest.MockedFunction<typeof query>;
const mockWhere = where as jest.MockedFunction<typeof where>;
const mockOrderBy = orderBy as jest.MockedFunction<typeof orderBy>;
const mockLimit = limit as jest.MockedFunction<typeof limit>;
const mockStartAfter = startAfter as jest.MockedFunction<typeof startAfter>;

describe("collectionQuery", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should create basic query with collection only", () => {
    const collectionPath = "test-collection";
    const mockCollectionRef = { id: "test-collection-ref" };
    const mockQueryRef = { collection: mockCollectionRef };

    mockCollection.mockReturnValue(mockCollectionRef as any);
    mockQuery.mockReturnValue(mockQueryRef as any);
    mockOrderBy.mockReturnValue({
      direction: "desc",
      field: "_createdAt",
    } as any);

    const result = collectionQuery(
      collectionPath,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
    );

    expect(mockCollection).toHaveBeenCalledWith(
      "mock-firestore-instance",
      collectionPath,
    );
    expect(mockQuery).toHaveBeenCalledWith(mockCollectionRef);
    expect(mockOrderBy).toHaveBeenCalledWith("_createdAt", "desc"); // Default sort
    expect(result).toBe(mockQueryRef);
  });

  it("should apply single filter correctly", () => {
    const collectionPath = "filtered-collection";
    const filters: [string, any, any][] = [["status", "==", "active"]];

    const mockCollectionRef = { id: "filtered-collection-ref" };
    const mockQueryRef1 = { collection: mockCollectionRef };
    const mockQueryRef2 = {
      collection: mockCollectionRef,
      where: "status-filter",
    };
    const mockQueryRef3 = {
      collection: mockCollectionRef,
      orderBy: "default-sort",
      where: "status-filter",
    };
    const mockWhereClause = {
      field: "status",
      operator: "==",
      value: "active",
    };
    const mockOrderByClause = { direction: "desc", field: "_createdAt" };

    mockCollection.mockReturnValue(mockCollectionRef as any);
    mockQuery
      .mockReturnValueOnce(mockQueryRef1 as any) // Initial query
      .mockReturnValueOnce(mockQueryRef2 as any) // After where
      .mockReturnValueOnce(mockQueryRef3 as any); // After orderBy
    mockWhere.mockReturnValue(mockWhereClause as any);
    mockOrderBy.mockReturnValue(mockOrderByClause as any);

    const result = collectionQuery(
      collectionPath,
      filters,
      undefined,
      undefined,
      undefined,
      undefined,
    );

    expect(mockWhere).toHaveBeenCalledWith("status", "==", "active");
    expect(mockQuery).toHaveBeenCalledWith(mockQueryRef1, mockWhereClause);
    expect(mockOrderBy).toHaveBeenCalledWith("_createdAt", "desc");
    expect(result).toBe(mockQueryRef3);
  });

  it("should apply multiple filters correctly", () => {
    const collectionPath = "multi-filter-collection";
    const filters: [string, any, any][] = [
      ["status", "==", "active"],
      ["priority", ">", 1],
      ["category", "in", ["cat1", "cat2"]],
    ];

    const mockCollectionRef = { id: "multi-filter-collection-ref" };
    const mockQueryRefs = [
      { collection: mockCollectionRef },
      { collection: mockCollectionRef, where: "filter1" },
      { collection: mockCollectionRef, where: "filter1-filter2" },
      { collection: mockCollectionRef, where: "filter1-filter2-filter3" },
      {
        collection: mockCollectionRef,
        orderBy: "default-sort",
        where: "filter1-filter2-filter3",
      },
    ];
    const mockWhereClauses = [
      { field: "status", operator: "==", value: "active" },
      { field: "priority", operator: ">", value: 1 },
      { field: "category", operator: "in", value: ["cat1", "cat2"] },
    ];

    mockCollection.mockReturnValue(mockCollectionRef as any);
    mockQuery
      .mockReturnValueOnce(mockQueryRefs[0] as any)
      .mockReturnValueOnce(mockQueryRefs[1] as any)
      .mockReturnValueOnce(mockQueryRefs[2] as any)
      .mockReturnValueOnce(mockQueryRefs[3] as any)
      .mockReturnValueOnce(mockQueryRefs[4] as any);
    mockWhere
      .mockReturnValueOnce(mockWhereClauses[0] as any)
      .mockReturnValueOnce(mockWhereClauses[1] as any)
      .mockReturnValueOnce(mockWhereClauses[2] as any);
    mockOrderBy.mockReturnValue({
      direction: "desc",
      field: "_createdAt",
    } as any);

    const result = collectionQuery(
      collectionPath,
      filters,
      undefined,
      undefined,
      undefined,
      undefined,
    );

    expect(mockWhere).toHaveBeenCalledTimes(3);
    expect(mockWhere).toHaveBeenNthCalledWith(1, "status", "==", "active");
    expect(mockWhere).toHaveBeenNthCalledWith(2, "priority", ">", 1);
    expect(mockWhere).toHaveBeenNthCalledWith(3, "category", "in", [
      "cat1",
      "cat2",
    ]);
    expect(result).toBe(mockQueryRefs[4]);
  });

  it("should skip invalid filters", () => {
    const collectionPath = "invalid-filter-collection";
    const filters = [
      ["status", "==", "active"], // Valid
      ["", "==", "invalid"], // Invalid: empty field
      ["field", "", "invalid"], // Invalid: empty operator
      ["field", "==", undefined], // Invalid: undefined value
      ["validField", "!=", null], // Valid: null is allowed
      ["validField2", "==", ""], // Valid: empty string is allowed
    ] as any[];

    const mockCollectionRef = { id: "invalid-filter-collection-ref" };
    const mockQueryRefs = [
      { collection: mockCollectionRef },
      { collection: mockCollectionRef, where: "filter1" },
      { collection: mockCollectionRef, where: "filter1-filter2" },
      { collection: mockCollectionRef, where: "filter1-filter2-filter3" },
      {
        collection: mockCollectionRef,
        orderBy: "default-sort",
        where: "filter1-filter2-filter3",
      },
    ];

    mockCollection.mockReturnValue(mockCollectionRef as any);
    mockQuery
      .mockReturnValueOnce(mockQueryRefs[0] as any)
      .mockReturnValueOnce(mockQueryRefs[1] as any)
      .mockReturnValueOnce(mockQueryRefs[2] as any)
      .mockReturnValueOnce(mockQueryRefs[3] as any)
      .mockReturnValueOnce(mockQueryRefs[4] as any);
    mockWhere
      .mockReturnValueOnce({ field: "status" } as any)
      .mockReturnValueOnce({ field: "validField" } as any)
      .mockReturnValueOnce({ field: "validField2" } as any);
    mockOrderBy.mockReturnValue({
      direction: "desc",
      field: "_createdAt",
    } as any);

    const result = collectionQuery(
      collectionPath,
      filters,
      undefined,
      undefined,
      undefined,
      undefined,
    );

    expect(mockWhere).toHaveBeenCalledTimes(3); // Only 3 valid filters
    expect(mockWhere).toHaveBeenNthCalledWith(1, "status", "==", "active");
    expect(mockWhere).toHaveBeenNthCalledWith(2, "validField", "!=", null);
    expect(mockWhere).toHaveBeenNthCalledWith(3, "validField2", "==", "");
  });

  it("should apply custom sort instead of default", () => {
    const collectionPath = "custom-sort-collection";
    const sort: [string, any] = ["priority", "asc"];

    const mockCollectionRef = { id: "custom-sort-collection-ref" };
    const mockQueryRef1 = { collection: mockCollectionRef };
    const mockQueryRef2 = {
      collection: mockCollectionRef,
      orderBy: "custom-sort",
    };
    const mockOrderByClause = { direction: "asc", field: "priority" };

    mockCollection.mockReturnValue(mockCollectionRef as any);
    mockQuery
      .mockReturnValueOnce(mockQueryRef1 as any)
      .mockReturnValueOnce(mockQueryRef2 as any);
    mockOrderBy.mockReturnValue(mockOrderByClause as any);

    const result = collectionQuery(
      collectionPath,
      undefined,
      sort,
      undefined,
      undefined,
      undefined,
    );

    expect(mockOrderBy).toHaveBeenCalledWith("priority", "asc");
    expect(mockOrderBy).not.toHaveBeenCalledWith("_createdAt", "desc");
    expect(result).toBe(mockQueryRef2);
  });

  it("should skip invalid sort and use default", () => {
    const collectionPath = "invalid-sort-collection";
    const invalidSorts = [
      ["", "asc"], // Invalid: empty field
      ["field", ""], // Invalid: empty direction
      [null, "asc"], // Invalid: null field
      ["field", null], // Invalid: null direction
    ] as any[];

    for (const invalidSort of invalidSorts) {
      const mockCollectionRef = { id: "invalid-sort-collection-ref" };
      const mockQueryRef1 = { collection: mockCollectionRef };
      const mockQueryRef2 = {
        collection: mockCollectionRef,
        orderBy: "default-sort",
      };

      mockCollection.mockReturnValue(mockCollectionRef as any);
      mockQuery
        .mockReturnValueOnce(mockQueryRef1 as any)
        .mockReturnValueOnce(mockQueryRef2 as any);
      mockOrderBy.mockReturnValue({
        direction: "desc",
        field: "_createdAt",
      } as any);

      const result = collectionQuery(
        collectionPath,
        undefined,
        invalidSort,
        undefined,
        undefined,
        undefined,
      );

      expect(mockOrderBy).toHaveBeenCalledWith("_createdAt", "desc"); // Should use default
      expect(result).toBe(mockQueryRef2);

      jest.clearAllMocks();
    }
  });

  it("should skip sorting when withoutSort is true", () => {
    const collectionPath = "no-sort-collection";
    const sort: [string, any] = ["priority", "asc"];

    const mockCollectionRef = { id: "no-sort-collection-ref" };
    const mockQueryRef = { collection: mockCollectionRef };

    mockCollection.mockReturnValue(mockCollectionRef as any);
    mockQuery.mockReturnValue(mockQueryRef as any);

    const result = collectionQuery(
      collectionPath,
      undefined,
      sort,
      undefined,
      undefined,
      true,
    );

    expect(mockOrderBy).not.toHaveBeenCalled();
    expect(result).toBe(mockQueryRef);
  });

  it("should apply limit correctly", () => {
    const collectionPath = "limited-collection";
    const limitCount = 50;

    const mockCollectionRef = { id: "limited-collection-ref" };
    const mockQueryRef1 = { collection: mockCollectionRef };
    const mockQueryRef2 = {
      collection: mockCollectionRef,
      orderBy: "default-sort",
    };
    const mockQueryRef3 = {
      collection: mockCollectionRef,
      limit: 50,
      orderBy: "default-sort",
    };
    const mockLimitClause = { count: 50 };

    mockCollection.mockReturnValue(mockCollectionRef as any);
    mockQuery
      .mockReturnValueOnce(mockQueryRef1 as any)
      .mockReturnValueOnce(mockQueryRef2 as any)
      .mockReturnValueOnce(mockQueryRef3 as any);
    mockOrderBy.mockReturnValue({
      direction: "desc",
      field: "_createdAt",
    } as any);
    mockLimit.mockReturnValue(mockLimitClause as any);

    const result = collectionQuery(
      collectionPath,
      undefined,
      undefined,
      limitCount,
      undefined,
      undefined,
    );

    expect(mockLimit).toHaveBeenCalledWith(limitCount);
    expect(result).toBe(mockQueryRef3);
  });

  it("should skip limit when limitCount is falsy", () => {
    const collectionPath = "no-limit-collection";
    const falsyLimits = [0, null, undefined, false];

    for (const falsyLimit of falsyLimits) {
      const mockCollectionRef = { id: "no-limit-collection-ref" };
      const mockQueryRef1 = { collection: mockCollectionRef };
      const mockQueryRef2 = {
        collection: mockCollectionRef,
        orderBy: "default-sort",
      };

      mockCollection.mockReturnValue(mockCollectionRef as any);
      mockQuery
        .mockReturnValueOnce(mockQueryRef1 as any)
        .mockReturnValueOnce(mockQueryRef2 as any);
      mockOrderBy.mockReturnValue({
        direction: "desc",
        field: "_createdAt",
      } as any);

      const result = collectionQuery(
        collectionPath,
        undefined,
        undefined,
        falsyLimit as any,
        undefined,
        undefined,
      );

      expect(mockLimit).not.toHaveBeenCalled();
      expect(result).toBe(mockQueryRef2);

      jest.clearAllMocks();
    }
  });

  it("should apply pagination correctly", () => {
    const collectionPath = "paginated-collection";
    const mockPaginationCursor = { id: "last-doc-id" } as DocumentSnapshot;

    const mockCollectionRef = { id: "paginated-collection-ref" };
    const mockQueryRef1 = { collection: mockCollectionRef };
    const mockQueryRef2 = {
      collection: mockCollectionRef,
      orderBy: "default-sort",
    };
    const mockQueryRef3 = {
      collection: mockCollectionRef,
      orderBy: "default-sort",
      startAfter: "cursor",
    };
    const mockStartAfterClause = { cursor: mockPaginationCursor };

    mockCollection.mockReturnValue(mockCollectionRef as any);
    mockQuery
      .mockReturnValueOnce(mockQueryRef1 as any)
      .mockReturnValueOnce(mockQueryRef2 as any)
      .mockReturnValueOnce(mockQueryRef3 as any);
    mockOrderBy.mockReturnValue({
      direction: "desc",
      field: "_createdAt",
    } as any);
    mockStartAfter.mockReturnValue(mockStartAfterClause as any);

    const result = collectionQuery(
      collectionPath,
      undefined,
      undefined,
      undefined,
      mockPaginationCursor,
      undefined,
    );

    expect(mockStartAfter).toHaveBeenCalledWith(mockPaginationCursor);
    expect(result).toBe(mockQueryRef3);
  });

  it("should apply pagination with array cursor", () => {
    const collectionPath = "array-paginated-collection";
    const mockArrayCursor = ["cursor1", "cursor2"];

    const mockCollectionRef = { id: "array-paginated-collection-ref" };
    const mockQueryRef1 = { collection: mockCollectionRef };
    const mockQueryRef2 = {
      collection: mockCollectionRef,
      orderBy: "default-sort",
    };
    const mockQueryRef3 = {
      collection: mockCollectionRef,
      orderBy: "default-sort",
      startAfter: "array-cursor",
    };
    const mockStartAfterClause = { cursor: mockArrayCursor };

    mockCollection.mockReturnValue(mockCollectionRef as any);
    mockQuery
      .mockReturnValueOnce(mockQueryRef1 as any)
      .mockReturnValueOnce(mockQueryRef2 as any)
      .mockReturnValueOnce(mockQueryRef3 as any);
    mockOrderBy.mockReturnValue({
      direction: "desc",
      field: "_createdAt",
    } as any);
    mockStartAfter.mockReturnValue(mockStartAfterClause as any);

    const result = collectionQuery(
      collectionPath,
      undefined,
      undefined,
      undefined,
      mockArrayCursor,
      undefined,
    );

    expect(mockStartAfter).toHaveBeenCalledWith(mockArrayCursor);
    expect(result).toBe(mockQueryRef3);
  });

  it("should combine all parameters correctly", () => {
    const collectionPath = "complex-collection";
    const filters: [string, any, any][] = [
      ["status", "==", "active"],
      ["priority", ">", 1],
    ];
    const sort: [string, any] = ["name", "asc"];
    const limitCount = 25;
    const mockPaginationCursor = {
      id: "pagination-cursor",
    } as DocumentSnapshot;

    const mockCollectionRef = { id: "complex-collection-ref" };
    const mockQueryRefs = [
      { collection: mockCollectionRef }, // Initial
      { collection: mockCollectionRef, where: "filter1" }, // After first filter
      { collection: mockCollectionRef, where: "filter1-filter2" }, // After second filter
      {
        collection: mockCollectionRef,
        orderBy: "custom-sort",
        where: "filter1-filter2",
      }, // After orderBy
      {
        collection: mockCollectionRef,
        limit: 25,
        orderBy: "custom-sort",
        where: "filter1-filter2",
      }, // After limit
      {
        collection: mockCollectionRef,
        limit: 25,
        orderBy: "custom-sort",
        startAfter: "cursor",
        where: "filter1-filter2",
      }, // Final
    ];

    mockCollection.mockReturnValue(mockCollectionRef as any);
    mockQuery
      .mockReturnValueOnce(mockQueryRefs[0] as any)
      .mockReturnValueOnce(mockQueryRefs[1] as any)
      .mockReturnValueOnce(mockQueryRefs[2] as any)
      .mockReturnValueOnce(mockQueryRefs[3] as any)
      .mockReturnValueOnce(mockQueryRefs[4] as any)
      .mockReturnValueOnce(mockQueryRefs[5] as any);
    mockWhere
      .mockReturnValueOnce({ field: "status" } as any)
      .mockReturnValueOnce({ field: "priority" } as any);
    mockOrderBy.mockReturnValue({ direction: "asc", field: "name" } as any);
    mockLimit.mockReturnValue({ count: 25 } as any);
    mockStartAfter.mockReturnValue({ cursor: mockPaginationCursor } as any);

    const result = collectionQuery(
      collectionPath,
      filters,
      sort,
      limitCount,
      mockPaginationCursor,
      false,
    );

    expect(mockCollection).toHaveBeenCalledWith(
      "mock-firestore-instance",
      collectionPath,
    );
    expect(mockWhere).toHaveBeenCalledTimes(2);
    expect(mockOrderBy).toHaveBeenCalledWith("name", "asc");
    expect(mockLimit).toHaveBeenCalledWith(25);
    expect(mockStartAfter).toHaveBeenCalledWith(mockPaginationCursor);
    expect(result).toBe(mockQueryRefs[5]);
  });

  it("should handle different collection paths", () => {
    const testPaths = [
      "users",
      "products/categories",
      "nested/deep/collection",
      "simple-collection",
    ];

    for (const path of testPaths) {
      const mockCollectionRef = { id: `${path}-ref` };
      const mockQueryRef1 = { collection: mockCollectionRef };
      const mockQueryRef2 = {
        collection: mockCollectionRef,
        orderBy: "default-sort",
      };

      mockCollection.mockReturnValue(mockCollectionRef as any);
      mockQuery
        .mockReturnValueOnce(mockQueryRef1 as any)
        .mockReturnValueOnce(mockQueryRef2 as any);
      mockOrderBy.mockReturnValue({
        direction: "desc",
        field: "_createdAt",
      } as any);

      const result = collectionQuery(
        path,
        undefined,
        undefined,
        undefined,
        undefined,
        undefined,
      );

      expect(mockCollection).toHaveBeenCalledWith(
        "mock-firestore-instance",
        path,
      );
      expect(result).toBe(mockQueryRef2);

      jest.clearAllMocks();
    }
  });

  it("should handle Firebase collection errors", () => {
    const collectionPath = "error-collection";
    const error = new Error("Failed to access collection");

    mockCollection.mockImplementation(() => {
      throw error;
    });

    expect(() =>
      collectionQuery(
        collectionPath,
        undefined,
        undefined,
        undefined,
        undefined,
        undefined,
      ),
    ).toThrow("Failed to access collection");
  });

  it("should handle Firebase query errors", () => {
    const collectionPath = "query-error-collection";
    const error = new Error("Failed to create query");

    const mockCollectionRef = { id: "query-error-collection-ref" };
    mockCollection.mockReturnValue(mockCollectionRef as any);
    mockQuery.mockImplementation(() => {
      throw error;
    });

    expect(() =>
      collectionQuery(
        collectionPath,
        undefined,
        undefined,
        undefined,
        undefined,
        undefined,
      ),
    ).toThrow("Failed to create query");
  });

  it("should handle Firebase where clause errors", () => {
    const collectionPath = "where-error-collection";
    const filters: [string, any, any][] = [
      ["invalidField", "invalid-operator" as any, "value"],
    ];
    const error = new Error("Invalid where clause");

    const mockCollectionRef = { id: "where-error-collection-ref" };
    const mockQueryRef = { collection: mockCollectionRef };
    mockCollection.mockReturnValue(mockCollectionRef as any);
    mockQuery.mockReturnValue(mockQueryRef as any);
    mockWhere.mockImplementation(() => {
      throw error;
    });

    expect(() =>
      collectionQuery(
        collectionPath,
        filters,
        undefined,
        undefined,
        undefined,
        undefined,
      ),
    ).toThrow("Invalid where clause");
  });

  it("should handle Firebase orderBy errors", () => {
    const collectionPath = "orderby-error-collection";
    const error = new Error("Invalid orderBy clause");

    const mockCollectionRef = { id: "orderby-error-collection-ref" };
    const mockQueryRef = { collection: mockCollectionRef };
    mockCollection.mockReturnValue(mockCollectionRef as any);
    mockQuery.mockReturnValue(mockQueryRef as any);
    mockOrderBy.mockImplementation(() => {
      throw error;
    });

    expect(() =>
      collectionQuery(
        collectionPath,
        undefined,
        undefined,
        undefined,
        undefined,
        undefined,
      ),
    ).toThrow("Invalid orderBy clause");
  });

  it("should handle Firebase limit errors", () => {
    const collectionPath = "limit-error-collection";
    const limitCount = -1; // Invalid limit
    const error = new Error("Invalid limit value");

    const mockCollectionRef = { id: "limit-error-collection-ref" };
    const mockQueryRef1 = { collection: mockCollectionRef };
    const mockQueryRef2 = {
      collection: mockCollectionRef,
      orderBy: "default-sort",
    };
    mockCollection.mockReturnValue(mockCollectionRef as any);
    mockQuery
      .mockReturnValueOnce(mockQueryRef1 as any)
      .mockReturnValueOnce(mockQueryRef2 as any);
    mockOrderBy.mockReturnValue({
      direction: "desc",
      field: "_createdAt",
    } as any);
    mockLimit.mockImplementation(() => {
      throw error;
    });

    expect(() =>
      collectionQuery(
        collectionPath,
        undefined,
        undefined,
        limitCount,
        undefined,
        undefined,
      ),
    ).toThrow("Invalid limit value");
  });

  it("should handle Firebase startAfter errors", () => {
    const collectionPath = "startafter-error-collection";
    const invalidCursor: any = "invalid-cursor";
    const error = new Error("Invalid cursor for startAfter");

    const mockCollectionRef = { id: "startafter-error-collection-ref" };
    const mockQueryRef1 = { collection: mockCollectionRef };
    const mockQueryRef2 = {
      collection: mockCollectionRef,
      orderBy: "default-sort",
    };
    mockCollection.mockReturnValue(mockCollectionRef as any);
    mockQuery
      .mockReturnValueOnce(mockQueryRef1 as any)
      .mockReturnValueOnce(mockQueryRef2 as any);
    mockOrderBy.mockReturnValue({
      direction: "desc",
      field: "_createdAt",
    } as any);
    mockStartAfter.mockImplementation(() => {
      throw error;
    });

    expect(() =>
      collectionQuery(
        collectionPath,
        undefined,
        undefined,
        undefined,
        invalidCursor,
        undefined,
      ),
    ).toThrow("Invalid cursor for startAfter");
  });
});
