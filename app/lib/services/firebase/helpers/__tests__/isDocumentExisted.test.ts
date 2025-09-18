import getDocument from "../getDocument";
import isDocumentExisted from "../isDocumentExisted";

// Mock the firestore instance and app
jest.mock("../../../firebase/utils/firestore", () => ({
  __esModule: true,
  default: "mock-firestore-instance",
}));

jest.mock("../../../firebase/utils/app", () => ({
  __esModule: true,
  default: "mock-app-instance",
}));

// Mock the getDocument dependency
jest.mock("../getDocument");

const mockGetDocument = getDocument as jest.MockedFunction<typeof getDocument>;

describe("isDocumentExists", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should return true when document exists with _id", async () => {
    const collection = "test-collection";
    const id = "existing-doc-id";
    const mockDocument = {
      _id: id,
      name: "Existing Document",
      status: "active",
    };

    mockGetDocument.mockResolvedValueOnce(mockDocument);

    const result = await isDocumentExisted(collection, id);

    expect(mockGetDocument).toHaveBeenCalledWith(collection, id);
    expect(result).toBe(true);
  });

  it("should return false when document does not exist", async () => {
    const collection = "test-collection";
    const id = "non-existent-id";

    mockGetDocument.mockResolvedValueOnce(undefined);

    const result = await isDocumentExisted(collection, id);

    expect(mockGetDocument).toHaveBeenCalledWith(collection, id);
    expect(result).toBe(false);
  });

  it("should return false when document exists but has no _id", async () => {
    const collection = "test-collection";
    const id = "no-id-doc";
    const mockDocument = {
      name: "Document without _id",
      status: "active",
      // No _id property
    };

    mockGetDocument.mockResolvedValueOnce(mockDocument);

    const result = await isDocumentExisted(collection, id);

    expect(mockGetDocument).toHaveBeenCalledWith(collection, id);
    expect(result).toBe(false);
  });

  it("should return false when document has null _id", async () => {
    const collection = "test-collection";
    const id = "null-id-doc";
    const mockDocument = {
      _id: null,
      name: "Document with null _id",
      status: "active",
    };

    mockGetDocument.mockResolvedValueOnce(mockDocument);

    const result = await isDocumentExisted(collection, id);

    expect(result).toBe(false);
  });

  it("should return false when document has undefined _id", async () => {
    const collection = "test-collection";
    const id = "undefined-id-doc";
    const mockDocument = {
      _id: undefined,
      name: "Document with undefined _id",
      status: "active",
    };

    mockGetDocument.mockResolvedValueOnce(mockDocument);

    const result = await isDocumentExisted(collection, id);

    expect(result).toBe(false);
  });

  it("should return false when document has empty string _id", async () => {
    const collection = "test-collection";
    const id = "empty-id-doc";
    const mockDocument = {
      _id: "",
      name: "Document with empty _id",
      status: "active",
    };

    mockGetDocument.mockResolvedValueOnce(mockDocument);

    const result = await isDocumentExisted(collection, id);

    expect(result).toBe(false);
  });

  it("should return true when document has numeric _id", async () => {
    const collection = "test-collection";
    const id = "numeric-id-doc";
    const mockDocument = {
      _id: 12345,
      name: "Document with numeric _id",
      status: "active",
    };

    mockGetDocument.mockResolvedValueOnce(mockDocument);

    const result = await isDocumentExisted(collection, id);

    expect(result).toBe(true);
  });

  it("should return false when document has zero _id", async () => {
    const collection = "test-collection";
    const id = "zero-id-doc";
    const mockDocument = {
      _id: 0,
      name: "Document with zero _id",
      status: "active",
    };

    mockGetDocument.mockResolvedValueOnce(mockDocument);

    const result = await isDocumentExisted(collection, id);

    expect(result).toBe(false);
  });

  it("should handle different collection paths", async () => {
    const testCases = [
      { collection: "users", id: "user123" },
      { collection: "products/categories", id: "category456" },
      { collection: "nested/deep/collection", id: "deep789" },
      { collection: "simple", id: "simple-id" },
    ];

    for (const testCase of testCases) {
      const mockDocument = {
        _id: testCase.id,
        collection: testCase.collection,
      };

      mockGetDocument.mockResolvedValueOnce(mockDocument);

      const result = await isDocumentExisted(testCase.collection, testCase.id);

      expect(mockGetDocument).toHaveBeenCalledWith(
        testCase.collection,
        testCase.id,
      );
      expect(result).toBe(true);

      jest.clearAllMocks();
    }
  });

  it("should handle special characters in document ID", async () => {
    const specialIds = [
      "doc-with-dashes",
      "doc_with_underscores",
      "doc.with.dots",
      "doc@with@symbols",
      "12345-numeric-start",
      "UPPERCASE-ID",
    ];

    for (const docId of specialIds) {
      const collection = "test-collection";
      const mockDocument = {
        _id: docId,
        name: `Document ${docId}`,
      };

      mockGetDocument.mockResolvedValueOnce(mockDocument);

      const result = await isDocumentExisted(collection, docId);

      expect(mockGetDocument).toHaveBeenCalledWith(collection, docId);
      expect(result).toBe(true);

      jest.clearAllMocks();
    }
  });

  it("should handle empty string parameters", async () => {
    const mockDocument = {
      _id: "some-id",
      name: "Document for empty params",
    };

    mockGetDocument.mockResolvedValueOnce(mockDocument);

    const result = await isDocumentExisted("", "");

    expect(mockGetDocument).toHaveBeenCalledWith("", "");
    expect(result).toBe(true);
  });

  it("should handle getDocument errors gracefully", async () => {
    const collection = "error-collection";
    const id = "error-id";
    const error = new Error("Failed to get document");

    mockGetDocument.mockRejectedValueOnce(error);

    await expect(isDocumentExisted(collection, id)).rejects.toThrow(
      "Failed to get document",
    );

    expect(mockGetDocument).toHaveBeenCalledWith(collection, id);
  });

  it("should handle Firebase permission errors", async () => {
    const collection = "restricted-collection";
    const id = "restricted-id";
    const permissionError = new Error("Permission denied");
    Object.assign(permissionError, { code: "permission-denied" });

    mockGetDocument.mockRejectedValueOnce(permissionError);

    await expect(isDocumentExisted(collection, id)).rejects.toThrow(
      "Permission denied",
    );
  });

  it("should handle null document response", async () => {
    const collection = "null-collection";
    const id = "null-id";

    mockGetDocument.mockResolvedValueOnce(undefined);

    const result = await isDocumentExisted(collection, id);

    expect(result).toBe(false);
  });

  it("should handle complex document structures", async () => {
    const collection = "complex-collection";
    const id = "complex-id";
    const complexDocument = {
      _id: id,
      metadata: {
        settings: {
          enabled: true,
          priority: 5,
        },
        tags: ["tag1", "tag2"],
      },
      name: "Complex Document",
      references: {
        ref1: "collection1",
        ref2: "collection2",
      },
    };

    mockGetDocument.mockResolvedValueOnce(complexDocument);

    const result = await isDocumentExisted(collection, id);

    expect(result).toBe(true);
  });

  it("should use truthy evaluation for _id check", async () => {
    const truthyIds = ["valid-id", 123, true, "0", 1, "false"];
    const falsyIds = [null, undefined, "", 0, false, NaN];

    // Test truthy values
    for (const truthyId of truthyIds) {
      const mockDocument = { _id: truthyId };
      mockGetDocument.mockResolvedValueOnce(mockDocument);

      const result = await isDocumentExisted("test", "test");
      expect(result).toBe(true);

      jest.clearAllMocks();
    }

    // Test falsy values
    for (const falsyId of falsyIds) {
      const mockDocument = { _id: falsyId };
      mockGetDocument.mockResolvedValueOnce(mockDocument);

      const result = await isDocumentExisted("test", "test");
      expect(result).toBe(false);

      jest.clearAllMocks();
    }
  });
});
