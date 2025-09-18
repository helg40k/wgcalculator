import { deleteDoc, doc } from "firebase/firestore";

import deleteDocument from "../deleteDocument";

// Mock the firestore instance
jest.mock("../../../firebase/utils/firestore", () => ({
  __esModule: true,
  default: "mock-firestore-instance",
}));

const mockDeleteDoc = deleteDoc as jest.MockedFunction<typeof deleteDoc>;
const mockDoc = doc as jest.MockedFunction<typeof doc>;

describe("deleteDocument", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should delete document successfully", async () => {
    const docId = "test-delete-id";
    const collectionPath = "test-collection";
    const mockRef = { id: docId, path: `${collectionPath}/${docId}` };

    mockDoc.mockReturnValue(mockRef as any);
    mockDeleteDoc.mockResolvedValueOnce(undefined);

    await deleteDocument(collectionPath, docId);

    expect(mockDoc).toHaveBeenCalledWith(
      "mock-firestore-instance",
      collectionPath,
      docId,
    );
    expect(mockDeleteDoc).toHaveBeenCalledWith(mockRef);
  });

  it("should handle deleteDoc failure gracefully", async () => {
    const docId = "fail-delete-id";
    const collectionPath = "test-collection";
    const mockRef = { id: docId, path: `${collectionPath}/${docId}` };
    const error = new Error("Failed to delete document");

    mockDoc.mockReturnValue(mockRef as any);
    mockDeleteDoc.mockRejectedValueOnce(error);

    await expect(deleteDocument(collectionPath, docId)).rejects.toThrow(
      "Failed to delete document",
    );

    expect(mockDoc).toHaveBeenCalledWith(
      "mock-firestore-instance",
      collectionPath,
      docId,
    );
    expect(mockDeleteDoc).toHaveBeenCalledWith(mockRef);
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

      mockDoc.mockReturnValue(mockRef as any);
      mockDeleteDoc.mockResolvedValueOnce(undefined);

      await deleteDocument(testCase.collection, testCase.id);

      expect(mockDoc).toHaveBeenCalledWith(
        "mock-firestore-instance",
        testCase.collection,
        testCase.id,
      );
      expect(mockDeleteDoc).toHaveBeenCalledWith(mockRef);

      // Clear mocks for next iteration
      jest.clearAllMocks();
    }
  });

  it("should handle special characters in document ID", async () => {
    const specialIds = [
      "doc-with-dashes",
      "doc_with_underscores",
      "doc.with.dots",
      "doc with spaces", // Note: This might not be valid in real Firestore
      "doc@with@symbols",
      "12345-numeric-start",
      "UPPERCASE-ID",
    ];

    for (const docId of specialIds) {
      const collectionPath = "test-collection";
      const mockRef = { id: docId, path: `${collectionPath}/${docId}` };

      mockDoc.mockReturnValue(mockRef as any);
      mockDeleteDoc.mockResolvedValueOnce(undefined);

      await deleteDocument(collectionPath, docId);

      expect(mockDoc).toHaveBeenCalledWith(
        "mock-firestore-instance",
        collectionPath,
        docId,
      );
      expect(mockDeleteDoc).toHaveBeenCalledWith(mockRef);

      // Clear mocks for next iteration
      jest.clearAllMocks();
    }
  });

  it("should handle Firebase permission errors", async () => {
    const docId = "permission-denied-id";
    const collectionPath = "restricted-collection";
    const mockRef = { id: docId, path: `${collectionPath}/${docId}` };
    const permissionError = new Error("Permission denied");

    // Simulate Firebase permission error
    Object.assign(permissionError, { code: "permission-denied" });

    mockDoc.mockReturnValue(mockRef as any);
    mockDeleteDoc.mockRejectedValueOnce(permissionError);

    await expect(deleteDocument(collectionPath, docId)).rejects.toThrow(
      "Permission denied",
    );

    expect(mockDeleteDoc).toHaveBeenCalledWith(mockRef);
  });

  it("should handle Firebase not-found errors", async () => {
    const docId = "nonexistent-id";
    const collectionPath = "test-collection";
    const mockRef = { id: docId, path: `${collectionPath}/${docId}` };
    const notFoundError = new Error("Document not found");

    // Simulate Firebase not-found error
    Object.assign(notFoundError, { code: "not-found" });

    mockDoc.mockReturnValue(mockRef as any);
    mockDeleteDoc.mockRejectedValueOnce(notFoundError);

    await expect(deleteDocument(collectionPath, docId)).rejects.toThrow(
      "Document not found",
    );

    expect(mockDeleteDoc).toHaveBeenCalledWith(mockRef);
  });

  it("should handle network errors", async () => {
    const docId = "network-error-id";
    const collectionPath = "test-collection";
    const mockRef = { id: docId, path: `${collectionPath}/${docId}` };
    const networkError = new Error("Network request failed");

    // Simulate network error
    Object.assign(networkError, { code: "unavailable" });

    mockDoc.mockReturnValue(mockRef as any);
    mockDeleteDoc.mockRejectedValueOnce(networkError);

    await expect(deleteDocument(collectionPath, docId)).rejects.toThrow(
      "Network request failed",
    );

    expect(mockDeleteDoc).toHaveBeenCalledWith(mockRef);
  });

  it("should not return any value (void function)", async () => {
    const docId = "void-test-id";
    const collectionPath = "test-collection";
    const mockRef = { id: docId, path: `${collectionPath}/${docId}` };

    mockDoc.mockReturnValue(mockRef as any);
    mockDeleteDoc.mockResolvedValueOnce(undefined);

    const result = await deleteDocument(collectionPath, docId);

    expect(result).toBeUndefined();
  });

  it("should handle empty string parameters gracefully", async () => {
    const mockRef = { id: "", path: "/" };

    mockDoc.mockReturnValue(mockRef as any);
    mockDeleteDoc.mockResolvedValueOnce(undefined);

    await deleteDocument("", "");

    expect(mockDoc).toHaveBeenCalledWith("mock-firestore-instance", "", "");
    expect(mockDeleteDoc).toHaveBeenCalledWith(mockRef);
  });
});
