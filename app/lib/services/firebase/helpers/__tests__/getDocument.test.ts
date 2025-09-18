import { doc, getDoc } from "firebase/firestore";

import getDocument from "../getDocument";

// Mock the firestore instance
jest.mock("../../../firebase/utils/firestore", () => ({
  __esModule: true,
  default: "mock-firestore-instance",
}));

const mockDoc = doc as jest.MockedFunction<typeof doc>;
const mockGetDoc = getDoc as jest.MockedFunction<typeof getDoc>;

describe("getDocument", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should get document successfully", async () => {
    const collectionPath = "test-collection";
    const docId = "test-doc-id";
    const mockRef = { id: docId, path: `${collectionPath}/${docId}` };
    const mockDocumentData = {
      _id: docId,
      createdAt: "2023-01-01",
      name: "Test Document",
      status: "active",
    };
    const mockSnapshot = { data: () => mockDocumentData };

    mockDoc.mockReturnValue(mockRef as any);
    mockGetDoc.mockResolvedValueOnce(mockSnapshot as any);

    const result = await getDocument(collectionPath, docId);

    expect(mockDoc).toHaveBeenCalledWith(
      "mock-firestore-instance",
      collectionPath,
      docId,
    );
    expect(mockGetDoc).toHaveBeenCalledWith(mockRef);
    expect(result).toEqual(mockDocumentData);
  });

  it("should return undefined for non-existent document", async () => {
    const collectionPath = "test-collection";
    const docId = "non-existent-id";
    const mockRef = { id: docId, path: `${collectionPath}/${docId}` };
    const mockSnapshot = { data: () => undefined }; // Document doesn't exist

    mockDoc.mockReturnValue(mockRef as any);
    mockGetDoc.mockResolvedValueOnce(mockSnapshot as any);

    const result = await getDocument(collectionPath, docId);

    expect(mockDoc).toHaveBeenCalledWith(
      "mock-firestore-instance",
      collectionPath,
      docId,
    );
    expect(mockGetDoc).toHaveBeenCalledWith(mockRef);
    expect(result).toBeUndefined();
  });

  it("should handle different collection paths", async () => {
    const testCases = [
      { collection: "users", id: "user123" },
      { collection: "products/categories", id: "category456" },
      { collection: "nested/deep/collection", id: "deep789" },
      { collection: "simple", id: "simple-id" },
    ];

    for (const testCase of testCases) {
      const mockRef = {
        id: testCase.id,
        path: `${testCase.collection}/${testCase.id}`,
      };
      const mockDocumentData = {
        _id: testCase.id,
        collection: testCase.collection,
      };
      const mockSnapshot = { data: () => mockDocumentData };

      mockDoc.mockReturnValue(mockRef as any);
      mockGetDoc.mockResolvedValueOnce(mockSnapshot as any);

      const result = await getDocument(testCase.collection, testCase.id);

      expect(mockDoc).toHaveBeenCalledWith(
        "mock-firestore-instance",
        testCase.collection,
        testCase.id,
      );
      expect(result).toEqual(mockDocumentData);

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
      const collectionPath = "test-collection";
      const mockRef = { id: docId, path: `${collectionPath}/${docId}` };
      const mockDocumentData = { _id: docId, name: `Document ${docId}` };
      const mockSnapshot = { data: () => mockDocumentData };

      mockDoc.mockReturnValue(mockRef as any);
      mockGetDoc.mockResolvedValueOnce(mockSnapshot as any);

      const result = await getDocument(collectionPath, docId);

      expect(mockDoc).toHaveBeenCalledWith(
        "mock-firestore-instance",
        collectionPath,
        docId,
      );
      expect(result).toEqual(mockDocumentData);

      jest.clearAllMocks();
    }
  });

  it("should handle empty string parameters", async () => {
    const mockRef = { id: "", path: "/" };
    const mockDocumentData = { _id: "", name: "Empty ID Document" };
    const mockSnapshot = { data: () => mockDocumentData };

    mockDoc.mockReturnValue(mockRef as any);
    mockGetDoc.mockResolvedValueOnce(mockSnapshot as any);

    const result = await getDocument("", "");

    expect(mockDoc).toHaveBeenCalledWith("mock-firestore-instance", "", "");
    expect(result).toEqual(mockDocumentData);
  });

  it("should handle Firebase doc creation errors", async () => {
    const collectionPath = "error-collection";
    const docId = "error-id";
    const error = new Error("Failed to create document reference");

    mockDoc.mockImplementation(() => {
      throw error;
    });

    await expect(getDocument(collectionPath, docId)).rejects.toThrow(
      "Failed to create document reference",
    );
  });

  it("should handle Firebase getDoc errors", async () => {
    const collectionPath = "getdoc-error-collection";
    const docId = "getdoc-error-id";
    const mockRef = { id: docId, path: `${collectionPath}/${docId}` };
    const error = new Error("Failed to get document");

    mockDoc.mockReturnValue(mockRef as any);
    mockGetDoc.mockRejectedValueOnce(error);

    await expect(getDocument(collectionPath, docId)).rejects.toThrow(
      "Failed to get document",
    );

    expect(mockDoc).toHaveBeenCalledWith(
      "mock-firestore-instance",
      collectionPath,
      docId,
    );
  });

  it("should handle complex document data", async () => {
    const collectionPath = "complex-collection";
    const docId = "complex-id";
    const mockRef = { id: docId };
    const complexData = {
      _id: docId,
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
      timestamps: {
        createdAt: { nanoseconds: 0, seconds: 1234567890 },
        updatedAt: { nanoseconds: 0, seconds: 1234567900 },
      },
    };
    const mockSnapshot = { data: () => complexData };

    mockDoc.mockReturnValue(mockRef as any);
    mockGetDoc.mockResolvedValueOnce(mockSnapshot as any);

    const result = await getDocument(collectionPath, docId);

    expect(result).toEqual(complexData);
  });

  it("should handle null data from snapshot", async () => {
    const collectionPath = "null-collection";
    const docId = "null-id";
    const mockRef = { id: docId };
    const mockSnapshot = { data: () => null };

    mockDoc.mockReturnValue(mockRef as any);
    mockGetDoc.mockResolvedValueOnce(mockSnapshot as any);

    const result = await getDocument(collectionPath, docId);

    expect(result).toBeNull();
  });

  it("should handle Firebase permission errors", async () => {
    const collectionPath = "restricted-collection";
    const docId = "restricted-id";
    const mockRef = { id: docId };
    const permissionError = new Error("Permission denied");
    Object.assign(permissionError, { code: "permission-denied" });

    mockDoc.mockReturnValue(mockRef as any);
    mockGetDoc.mockRejectedValueOnce(permissionError);

    await expect(getDocument(collectionPath, docId)).rejects.toThrow(
      "Permission denied",
    );
  });

  it("should handle Firebase network errors", async () => {
    const collectionPath = "network-collection";
    const docId = "network-id";
    const mockRef = { id: docId };
    const networkError = new Error("Network request failed");
    Object.assign(networkError, { code: "unavailable" });

    mockDoc.mockReturnValue(mockRef as any);
    mockGetDoc.mockRejectedValueOnce(networkError);

    await expect(getDocument(collectionPath, docId)).rejects.toThrow(
      "Network request failed",
    );
  });
});
