import { collection, doc } from "firebase/firestore";

import getId from "../getId";

// Mock the firestore instance
jest.mock("../../../firebase/utils/firestore", () => ({
  __esModule: true,
  default: "mock-firestore-instance",
}));

const mockCollection = collection as jest.MockedFunction<typeof collection>;
const mockDoc = doc as jest.MockedFunction<typeof doc>;

describe("getId", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should generate unique ID for collection", () => {
    const collectionPath = "test-collection";
    const mockCollectionRef = { id: "mock-collection-ref" };
    const mockDocRef = { id: "generated-unique-id-123" };

    mockCollection.mockReturnValue(mockCollectionRef as any);
    mockDoc.mockReturnValue(mockDocRef as any);

    const result = getId(collectionPath);

    expect(mockCollection).toHaveBeenCalledWith(
      "mock-firestore-instance",
      collectionPath,
    );
    expect(mockDoc).toHaveBeenCalledWith(mockCollectionRef);
    expect(result).toBe("generated-unique-id-123");
  });

  it("should handle different collection paths", () => {
    const testCases = [
      "users",
      "products/categories",
      "nested/deep/collection",
      "simple-collection",
    ];

    testCases.forEach((collectionPath, index) => {
      const mockCollectionRef = { id: `mock-collection-${index}` };
      const mockDocRef = { id: `unique-id-${index}` };

      mockCollection.mockReturnValue(mockCollectionRef as any);
      mockDoc.mockReturnValue(mockDocRef as any);

      const result = getId(collectionPath);

      expect(mockCollection).toHaveBeenCalledWith(
        "mock-firestore-instance",
        collectionPath,
      );
      expect(result).toBe(`unique-id-${index}`);

      // Clear mocks for next iteration
      jest.clearAllMocks();
    });
  });

  it("should generate different IDs for multiple calls", () => {
    const collectionPath = "test-collection";
    const mockCollectionRef = { id: "mock-collection-ref" };

    // Mock different IDs for each call
    const mockIds = ["id-1", "id-2", "id-3"];

    mockCollection.mockReturnValue(mockCollectionRef as any);

    mockIds.forEach((id, index) => {
      const mockDocRef = { id };
      mockDoc.mockReturnValueOnce(mockDocRef as any);

      const result = getId(collectionPath);
      expect(result).toBe(id);
    });

    expect(mockDoc).toHaveBeenCalledTimes(3);
  });

  it("should handle empty collection path", () => {
    const mockCollectionRef = { id: "empty-collection-ref" };
    const mockDocRef = { id: "empty-path-id" };

    mockCollection.mockReturnValue(mockCollectionRef as any);
    mockDoc.mockReturnValue(mockDocRef as any);

    const result = getId("");

    expect(mockCollection).toHaveBeenCalledWith("mock-firestore-instance", "");
    expect(result).toBe("empty-path-id");
  });

  it("should handle special characters in collection path", () => {
    const specialPaths = [
      "collection-with-dashes",
      "collection_with_underscores",
      "collection.with.dots",
      "collection@with@symbols",
    ];

    specialPaths.forEach((path, index) => {
      const mockCollectionRef = { id: `special-collection-${index}` };
      const mockDocRef = { id: `special-id-${index}` };

      mockCollection.mockReturnValue(mockCollectionRef as any);
      mockDoc.mockReturnValue(mockDocRef as any);

      const result = getId(path);

      expect(mockCollection).toHaveBeenCalledWith(
        "mock-firestore-instance",
        path,
      );
      expect(result).toBe(`special-id-${index}`);

      jest.clearAllMocks();
    });
  });

  it("should return string type", () => {
    const mockCollectionRef = { id: "mock-collection" };
    const mockDocRef = { id: "string-id" };

    mockCollection.mockReturnValue(mockCollectionRef as any);
    mockDoc.mockReturnValue(mockDocRef as any);

    const result = getId("test-collection");

    expect(typeof result).toBe("string");
    expect(result).toBe("string-id");
  });

  it("should handle Firebase errors gracefully", () => {
    const collectionPath = "error-collection";
    const error = new Error("Firebase connection failed");

    mockCollection.mockImplementation(() => {
      throw error;
    });

    expect(() => getId(collectionPath)).toThrow("Firebase connection failed");
  });

  it("should handle doc creation errors", () => {
    const collectionPath = "doc-error-collection";
    const mockCollectionRef = { id: "mock-collection" };
    const error = new Error("Failed to create doc reference");

    mockCollection.mockReturnValue(mockCollectionRef as any);
    mockDoc.mockImplementation(() => {
      throw error;
    });

    expect(() => getId(collectionPath)).toThrow(
      "Failed to create doc reference",
    );
  });

  it("should handle undefined or null ID from Firebase", () => {
    const mockCollectionRef = { id: "mock-collection" };
    const mockDocRef = { id: undefined };

    mockCollection.mockReturnValue(mockCollectionRef as any);
    mockDoc.mockReturnValue(mockDocRef as any);

    const result = getId("test-collection");

    expect(result).toBeUndefined();
  });

  it("should maintain consistent behavior across multiple collection types", () => {
    const collections = ["users", "posts", "comments", "categories"];

    collections.forEach((collectionName) => {
      const mockCollectionRef = { id: `${collectionName}-ref` };
      const mockDocRef = { id: `${collectionName}-doc-id` };

      mockCollection.mockReturnValue(mockCollectionRef as any);
      mockDoc.mockReturnValue(mockDocRef as any);

      const result = getId(collectionName);

      expect(mockCollection).toHaveBeenCalledWith(
        "mock-firestore-instance",
        collectionName,
      );
      expect(mockDoc).toHaveBeenCalledWith(mockCollectionRef);
      expect(result).toBe(`${collectionName}-doc-id`);

      jest.clearAllMocks();
    });
  });
});
