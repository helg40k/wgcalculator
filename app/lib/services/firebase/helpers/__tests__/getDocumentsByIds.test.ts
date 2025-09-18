import {
  collection,
  documentId,
  getDocs,
  query,
  where,
} from "firebase/firestore";

import getDocumentsByIds from "../getDocumentsByIds";

// Mock the firestore instance
jest.mock("../../../firebase/utils/firestore", () => ({
  __esModule: true,
  default: "mock-firestore-instance",
}));

// Mock Firebase functions
const mockGetDocs = getDocs as jest.MockedFunction<typeof getDocs>;
const mockCollection = collection as jest.MockedFunction<typeof collection>;
const mockQuery = query as jest.MockedFunction<typeof query>;
const mockWhere = where as jest.MockedFunction<typeof where>;
const mockDocumentId = documentId as jest.MockedFunction<typeof documentId>;

// Mock data
const mockDocData1 = { _id: "doc1", name: "Document 1", status: "active" };
const mockDocData2 = { _id: "doc2", name: "Document 2", status: "draft" };
const mockDocData3 = { _id: "doc3", name: "Document 3", status: "active" };

const createMockSnapshot = (docs: any[]) => ({
  docs: docs.map((data) => ({
    data: () => data,
  })),
});

describe("getDocumentsByIds", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should return empty array when no IDs provided", async () => {
    const result = await getDocumentsByIds("test-collection", []);
    expect(result).toEqual([]);
    expect(mockGetDocs).not.toHaveBeenCalled();
  });

  it("should fetch documents for single chunk (≤10 IDs)", async () => {
    const ids = ["doc1", "doc2", "doc3"];
    const mockSnapshot = createMockSnapshot([
      mockDocData1,
      mockDocData2,
      mockDocData3,
    ]);

    mockGetDocs.mockResolvedValueOnce(mockSnapshot as any);
    mockCollection.mockReturnValue("mock-collection" as any);
    mockQuery.mockReturnValue("mock-query" as any);
    mockWhere.mockReturnValue("mock-where" as any);
    mockDocumentId.mockReturnValue("mock-document-id" as any);

    const result = await getDocumentsByIds("test-collection", ids);

    expect(result).toEqual([mockDocData1, mockDocData2, mockDocData3]);
    expect(mockGetDocs).toHaveBeenCalledTimes(1);
    expect(mockWhere).toHaveBeenCalledWith("mock-document-id", "in", ids);
  });

  it("should handle multiple chunks for >10 IDs", async () => {
    // Create 15 IDs to test chunking
    const ids = Array.from({ length: 15 }, (_, i) => `doc${i + 1}`);
    const mockDocs = Array.from({ length: 15 }, (_, i) => ({
      _id: `doc${i + 1}`,
      name: `Document ${i + 1}`,
    }));

    // First chunk (docs 1-10)
    const mockSnapshot1 = createMockSnapshot(mockDocs.slice(0, 10));
    // Second chunk (docs 11-15)
    const mockSnapshot2 = createMockSnapshot(mockDocs.slice(10, 15));

    mockGetDocs
      .mockResolvedValueOnce(mockSnapshot1 as any)
      .mockResolvedValueOnce(mockSnapshot2 as any);

    mockCollection.mockReturnValue("mock-collection" as any);
    mockQuery.mockReturnValue("mock-query" as any);
    mockWhere.mockReturnValue("mock-where" as any);
    mockDocumentId.mockReturnValue("mock-document-id" as any);

    const result = await getDocumentsByIds("test-collection", ids);

    expect(result).toHaveLength(15);
    expect(result).toEqual(mockDocs);
    expect(mockGetDocs).toHaveBeenCalledTimes(2);

    // Verify chunks were created correctly
    expect(mockWhere).toHaveBeenNthCalledWith(
      1,
      "mock-document-id",
      "in",
      ids.slice(0, 10),
    );
    expect(mockWhere).toHaveBeenNthCalledWith(
      2,
      "mock-document-id",
      "in",
      ids.slice(10, 15),
    );
  });

  it("should handle empty results from Firebase", async () => {
    const ids = ["nonexistent1", "nonexistent2"];
    const emptySnapshot = createMockSnapshot([]);

    mockGetDocs.mockResolvedValueOnce(emptySnapshot as any);
    mockCollection.mockReturnValue("mock-collection" as any);
    mockQuery.mockReturnValue("mock-query" as any);
    mockWhere.mockReturnValue("mock-where" as any);
    mockDocumentId.mockReturnValue("mock-document-id" as any);

    const result = await getDocumentsByIds("test-collection", ids);

    expect(result).toEqual([]);
    expect(mockGetDocs).toHaveBeenCalledTimes(1);
  });

  it("should handle Firebase errors gracefully", async () => {
    const ids = ["doc1", "doc2"];
    const error = new Error("Firebase connection failed");

    mockGetDocs.mockRejectedValueOnce(error);
    mockCollection.mockReturnValue("mock-collection" as any);
    mockQuery.mockReturnValue("mock-query" as any);
    mockWhere.mockReturnValue("mock-where" as any);
    mockDocumentId.mockReturnValue("mock-document-id" as any);

    await expect(getDocumentsByIds("test-collection", ids)).rejects.toThrow(
      "Firebase connection failed",
    );
  });

  it("should handle exactly 10 IDs (boundary case)", async () => {
    const ids = Array.from({ length: 10 }, (_, i) => `doc${i + 1}`);
    const mockDocs = Array.from({ length: 10 }, (_, i) => ({
      _id: `doc${i + 1}`,
      name: `Document ${i + 1}`,
    }));
    const mockSnapshot = createMockSnapshot(mockDocs);

    mockGetDocs.mockResolvedValueOnce(mockSnapshot as any);
    mockCollection.mockReturnValue("mock-collection" as any);
    mockQuery.mockReturnValue("mock-query" as any);
    mockWhere.mockReturnValue("mock-where" as any);
    mockDocumentId.mockReturnValue("mock-document-id" as any);

    const result = await getDocumentsByIds("test-collection", ids);

    expect(result).toHaveLength(10);
    expect(mockGetDocs).toHaveBeenCalledTimes(1); // Should be single chunk
  });

  it("should handle exactly 11 IDs (boundary case)", async () => {
    const ids = Array.from({ length: 11 }, (_, i) => `doc${i + 1}`);
    const mockDocs = Array.from({ length: 11 }, (_, i) => ({
      _id: `doc${i + 1}`,
      name: `Document ${i + 1}`,
    }));

    const mockSnapshot1 = createMockSnapshot(mockDocs.slice(0, 10));
    const mockSnapshot2 = createMockSnapshot(mockDocs.slice(10, 11));

    mockGetDocs
      .mockResolvedValueOnce(mockSnapshot1 as any)
      .mockResolvedValueOnce(mockSnapshot2 as any);

    mockCollection.mockReturnValue("mock-collection" as any);
    mockQuery.mockReturnValue("mock-query" as any);
    mockWhere.mockReturnValue("mock-where" as any);
    mockDocumentId.mockReturnValue("mock-document-id" as any);

    const result = await getDocumentsByIds("test-collection", ids);

    expect(result).toHaveLength(11);
    expect(mockGetDocs).toHaveBeenCalledTimes(2); // Should be two chunks
  });
});
