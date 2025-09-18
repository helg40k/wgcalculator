import { doc, getDoc, setDoc } from "firebase/firestore";

import { EntityStatusRegistry } from "@/app/lib/definitions";

import createDocument from "../createDocument";
import getDocumentCreationBase from "../getDocumentCreationBase";
import getId from "../getId";

// Mock the firestore instance
jest.mock("../../../firebase/utils/firestore", () => ({
  __esModule: true,
  default: "mock-firestore-instance",
}));

// Mock dependencies
jest.mock("../getDocumentCreationBase");
jest.mock("../getId");

const mockDoc = doc as jest.MockedFunction<typeof doc>;
const mockGetDoc = getDoc as jest.MockedFunction<typeof getDoc>;
const mockSetDoc = setDoc as jest.MockedFunction<typeof setDoc>;
const mockGetDocumentCreationBase =
  getDocumentCreationBase as jest.MockedFunction<
    typeof getDocumentCreationBase
  >;
const mockGetId = getId as jest.MockedFunction<typeof getId>;

const mockCreationBase = {
  _createdAt: expect.any(Object),
  _id: "test-id",
  _isUpdated: false,
  _updatedAt: expect.any(Object),
  status: EntityStatusRegistry.ACTIVE,
};

const mockDocumentData = {
  category: "test",
  description: "Test description",
  name: "Test Document",
};

const mockCreatedDocument = {
  ...mockDocumentData,
  ...mockCreationBase,
};

describe("createDocument", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetDocumentCreationBase.mockReturnValue(mockCreationBase);
  });

  it("should create document with provided ID", async () => {
    const customId = "custom-id";
    const mockRef = { id: customId };
    const mockSnapshot = { data: () => mockCreatedDocument };

    mockDoc.mockReturnValue(mockRef as any);
    mockSetDoc.mockResolvedValueOnce(undefined);
    mockGetDoc.mockResolvedValueOnce(mockSnapshot as any);

    const result = await createDocument(
      "test-collection",
      mockDocumentData,
      customId,
    );

    expect(mockDoc).toHaveBeenCalledWith(
      expect.anything(),
      "test-collection",
      customId,
    );
    expect(mockGetDocumentCreationBase).toHaveBeenCalledWith(customId);
    expect(mockSetDoc).toHaveBeenCalledWith(mockRef, mockCreatedDocument);
    expect(mockGetDoc).toHaveBeenCalledWith(mockRef);
    expect(result).toEqual(mockCreatedDocument);
    expect(mockGetId).not.toHaveBeenCalled(); // Should not generate ID when provided
  });

  it("should create document with auto-generated ID when not provided", async () => {
    const generatedId = "auto-generated-id";
    const mockRef = { id: generatedId };
    const mockSnapshot = { data: () => mockCreatedDocument };

    mockGetId.mockReturnValue(generatedId);
    mockDoc.mockReturnValue(mockRef as any);
    mockSetDoc.mockResolvedValueOnce(undefined);
    mockGetDoc.mockResolvedValueOnce(mockSnapshot as any);

    const result = await createDocument("test-collection", mockDocumentData);

    expect(mockGetId).toHaveBeenCalledWith("test-collection");
    expect(mockDoc).toHaveBeenCalledWith(
      expect.anything(),
      "test-collection",
      generatedId,
    );
    expect(mockGetDocumentCreationBase).toHaveBeenCalledWith(generatedId);
    expect(mockSetDoc).toHaveBeenCalledWith(mockRef, mockCreatedDocument);
    expect(result).toEqual(mockCreatedDocument);
  });

  it("should merge document data with creation base correctly", async () => {
    const customId = "test-merge-id";
    const mockRef = { id: customId };
    const mockSnapshot = { data: () => mockCreatedDocument };

    const customCreationBase = {
      ...mockCreationBase,
      _id: customId,
    };
    mockGetDocumentCreationBase.mockReturnValue(customCreationBase);

    mockDoc.mockReturnValue(mockRef as any);
    mockSetDoc.mockResolvedValueOnce(undefined);
    mockGetDoc.mockResolvedValueOnce(mockSnapshot as any);

    await createDocument("test-collection", mockDocumentData, customId);

    const expectedData = {
      ...mockDocumentData,
      ...customCreationBase,
    };

    expect(mockSetDoc).toHaveBeenCalledWith(mockRef, expectedData);
  });

  it("should handle empty document data", async () => {
    const customId = "empty-data-id";
    const mockRef = { id: customId };
    const emptyData = {};
    const expectedDocument = { ...emptyData, ...mockCreationBase };
    const mockSnapshot = { data: () => expectedDocument };

    mockDoc.mockReturnValue(mockRef as any);
    mockSetDoc.mockResolvedValueOnce(undefined);
    mockGetDoc.mockResolvedValueOnce(mockSnapshot as any);

    const result = await createDocument("test-collection", emptyData, customId);

    expect(mockSetDoc).toHaveBeenCalledWith(mockRef, expectedDocument);
    expect(result).toEqual(expectedDocument);
  });

  it("should handle setDoc failure", async () => {
    const customId = "fail-id";
    const mockRef = { id: customId };
    const error = new Error("Failed to create document");

    mockDoc.mockReturnValue(mockRef as any);
    mockSetDoc.mockRejectedValueOnce(error);

    await expect(
      createDocument("test-collection", mockDocumentData, customId),
    ).rejects.toThrow("Failed to create document");

    expect(mockGetDoc).not.toHaveBeenCalled(); // Should not try to fetch if setDoc fails
  });

  it("should handle getDoc failure after successful setDoc", async () => {
    const customId = "getdoc-fail-id";
    const mockRef = { id: customId };
    const error = new Error("Failed to fetch created document");

    mockDoc.mockReturnValue(mockRef as any);
    mockSetDoc.mockResolvedValueOnce(undefined);
    mockGetDoc.mockRejectedValueOnce(error);

    await expect(
      createDocument("test-collection", mockDocumentData, customId),
    ).rejects.toThrow("Failed to fetch created document");

    expect(mockSetDoc).toHaveBeenCalled(); // Should still try to create
  });

  it("should handle document data with nested objects", async () => {
    const complexData = {
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

    const customId = "complex-id";
    const mockRef = { id: customId };
    const expectedDocument = { ...complexData, ...mockCreationBase };
    const mockSnapshot = { data: () => expectedDocument };

    mockDoc.mockReturnValue(mockRef as any);
    mockSetDoc.mockResolvedValueOnce(undefined);
    mockGetDoc.mockResolvedValueOnce(mockSnapshot as any);

    const result = await createDocument(
      "test-collection",
      complexData,
      customId,
    );

    expect(mockSetDoc).toHaveBeenCalledWith(mockRef, expectedDocument);
    expect(result).toEqual(expectedDocument);
  });
});
