import { doc, getDoc, serverTimestamp, updateDoc } from "firebase/firestore";

import updateDocument from "../updateDocument";

// Mock the firestore instance
jest.mock("../../../firebase/utils/firestore", () => ({
  __esModule: true,
  default: "mock-firestore-instance",
}));

const mockDoc = doc as jest.MockedFunction<typeof doc>;
const mockGetDoc = getDoc as jest.MockedFunction<typeof getDoc>;
const mockUpdateDoc = updateDoc as jest.MockedFunction<typeof updateDoc>;
const mockServerTimestamp = serverTimestamp as jest.MockedFunction<
  typeof serverTimestamp
>;

const mockTimestamp = { nanoseconds: 0, seconds: 1234567890 };
const mockUpdateData = {
  category: "updated",
  description: "Updated description",
  name: "Updated Document",
};

const mockUpdatedDocument = {
  _id: "test-id",
  ...mockUpdateData,
  _createdAt: { nanoseconds: 0, seconds: 1234567800 },
  _isUpdated: true,
  _updatedAt: mockTimestamp,
  status: "active",
};

describe("updateDocument", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockServerTimestamp.mockReturnValue(mockTimestamp as any);
  });

  it("should update document successfully", async () => {
    const docId = "test-id";
    const mockRef = { id: docId };
    const mockSnapshot = { data: () => mockUpdatedDocument };

    mockDoc.mockReturnValue(mockRef as any);
    mockUpdateDoc.mockResolvedValueOnce(undefined);
    mockGetDoc.mockResolvedValueOnce(mockSnapshot as any);

    const result = await updateDocument(
      "test-collection",
      docId,
      mockUpdateData,
    );

    const expectedPayload = {
      ...mockUpdateData,
      _isUpdated: true,
      _updatedAt: mockTimestamp,
    };

    expect(mockDoc).toHaveBeenCalledWith(
      "mock-firestore-instance",
      "test-collection",
      docId,
    );
    expect(mockUpdateDoc).toHaveBeenCalledWith(mockRef, expectedPayload);
    expect(mockGetDoc).toHaveBeenCalledWith(mockRef);
    expect(result).toEqual(mockUpdatedDocument);
  });

  it("should handle empty update data", async () => {
    const docId = "empty-update-id";
    const mockRef = { id: docId };
    const emptyUpdateData = {};
    const mockSnapshot = {
      data: () => ({
        _id: docId,
        _isUpdated: true,
        _updatedAt: mockTimestamp,
        originalField: "unchanged",
      }),
    };

    mockDoc.mockReturnValue(mockRef as any);
    mockUpdateDoc.mockResolvedValueOnce(undefined);
    mockGetDoc.mockResolvedValueOnce(mockSnapshot as any);

    const result = await updateDocument(
      "test-collection",
      docId,
      emptyUpdateData,
    );

    const expectedPayload = {
      _isUpdated: true,
      _updatedAt: mockTimestamp,
    };

    expect(mockUpdateDoc).toHaveBeenCalledWith(mockRef, expectedPayload);
    expect(result).toEqual({
      _id: docId,
      _isUpdated: true,
      _updatedAt: mockTimestamp,
      originalField: "unchanged",
    });
  });

  it("should handle complex nested update data", async () => {
    const complexUpdateData = {
      metadata: {
        settings: {
          enabled: false,
          priority: 10,
        },
        tags: ["updated", "complex"],
      },
      name: "Complex Update",
      references: {
        ref1: "updated-collection1",
        ref3: "new-collection3",
      },
    };

    const docId = "complex-id";
    const mockRef = { id: docId };
    const mockSnapshot = {
      data: () => ({
        _id: docId,
        ...complexUpdateData,
        _isUpdated: true,
        _updatedAt: mockTimestamp,
      }),
    };

    mockDoc.mockReturnValue(mockRef as any);
    mockUpdateDoc.mockResolvedValueOnce(undefined);
    mockGetDoc.mockResolvedValueOnce(mockSnapshot as any);

    const result = await updateDocument(
      "test-collection",
      docId,
      complexUpdateData,
    );

    const expectedPayload = {
      ...complexUpdateData,
      _isUpdated: true,
      _updatedAt: mockTimestamp,
    };

    expect(mockUpdateDoc).toHaveBeenCalledWith(mockRef, expectedPayload);
    expect(result).toEqual({
      _id: docId,
      ...complexUpdateData,
      _isUpdated: true,
      _updatedAt: mockTimestamp,
    });
  });

  it("should handle updateDoc failure", async () => {
    const docId = "fail-update-id";
    const mockRef = { id: docId };
    const error = new Error("Failed to update document");

    mockDoc.mockReturnValue(mockRef as any);
    mockUpdateDoc.mockRejectedValueOnce(error);

    await expect(
      updateDocument("test-collection", docId, mockUpdateData),
    ).rejects.toThrow("Failed to update document");

    expect(mockGetDoc).not.toHaveBeenCalled(); // Should not try to fetch if update fails
  });

  it("should handle getDoc failure after successful update", async () => {
    const docId = "getdoc-fail-id";
    const mockRef = { id: docId };
    const error = new Error("Failed to fetch updated document");

    mockDoc.mockReturnValue(mockRef as any);
    mockUpdateDoc.mockResolvedValueOnce(undefined);
    mockGetDoc.mockRejectedValueOnce(error);

    await expect(
      updateDocument("test-collection", docId, mockUpdateData),
    ).rejects.toThrow("Failed to fetch updated document");

    expect(mockUpdateDoc).toHaveBeenCalled(); // Should still try to update
  });

  it("should preserve existing document fields not being updated", async () => {
    const docId = "preserve-fields-id";
    const mockRef = { id: docId };
    const partialUpdate = { name: "New Name" };

    // Simulate document with existing fields that should be preserved
    const existingDocument = {
      // This should be preserved
      _createdAt: { nanoseconds: 0, seconds: 1234567800 },

      _id: docId,

      _isUpdated: true,

      _updatedAt: mockTimestamp,

      // This should be preserved
      category: "original",

      // This gets updated
      description: "Original description",

      name: "New Name",
      status: "active",
    };

    const mockSnapshot = { data: () => existingDocument };

    mockDoc.mockReturnValue(mockRef as any);
    mockUpdateDoc.mockResolvedValueOnce(undefined);
    mockGetDoc.mockResolvedValueOnce(mockSnapshot as any);

    const result = await updateDocument(
      "test-collection",
      docId,
      partialUpdate,
    );

    const expectedPayload = {
      _isUpdated: true,
      _updatedAt: mockTimestamp,
      name: "New Name",
    };

    expect(mockUpdateDoc).toHaveBeenCalledWith(mockRef, expectedPayload);
    expect(result).toEqual(existingDocument);
  });

  it("should handle document that does not exist after update", async () => {
    const docId = "nonexistent-id";
    const mockRef = { id: docId };
    const mockSnapshot = { data: () => undefined }; // Document doesn't exist

    mockDoc.mockReturnValue(mockRef as any);
    mockUpdateDoc.mockResolvedValueOnce(undefined);
    mockGetDoc.mockResolvedValueOnce(mockSnapshot as any);

    const result = await updateDocument(
      "test-collection",
      docId,
      mockUpdateData,
    );

    expect(result).toBeUndefined();
  });

  it("should always set _isUpdated to true and add _updatedAt timestamp", async () => {
    const docId = "metadata-test-id";
    const mockRef = { id: docId };
    const updateData = { customField: "custom value" };
    const mockSnapshot = {
      data: () => ({
        _id: docId,
        _isUpdated: true,
        _updatedAt: mockTimestamp,
        customField: "custom value",
      }),
    };

    mockDoc.mockReturnValue(mockRef as any);
    mockUpdateDoc.mockResolvedValueOnce(undefined);
    mockGetDoc.mockResolvedValueOnce(mockSnapshot as any);

    await updateDocument("test-collection", docId, updateData);

    const expectedPayload = {
      _isUpdated: true,
      _updatedAt: mockTimestamp,
      customField: "custom value",
    };

    expect(mockUpdateDoc).toHaveBeenCalledWith(mockRef, expectedPayload);
    expect(mockServerTimestamp).toHaveBeenCalled();
  });
});
