import { serverTimestamp } from "firebase/firestore";

import { EntityStatusRegistry } from "@/app/lib/definitions";

import getDocumentCreationBase, {
  NEW_ENTITY_TEMP_ID,
} from "../getDocumentCreationBase";

const mockServerTimestamp = serverTimestamp as jest.MockedFunction<
  typeof serverTimestamp
>;

const mockTimestamp = { nanoseconds: 0, seconds: 1234567890 };

describe("getDocumentCreationBase", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockServerTimestamp.mockReturnValue(mockTimestamp as any);
  });

  it("should create base document with string ID", () => {
    const testId = "test-document-id";

    const result = getDocumentCreationBase(testId);

    expect(mockServerTimestamp).toHaveBeenCalledTimes(1);
    expect(result).toEqual({
      _createdAt: mockTimestamp,
      _id: testId,
      _isUpdated: false,
      _updatedAt: mockTimestamp,
      status: EntityStatusRegistry.ACTIVE,
    });
  });

  it("should create base document with numeric ID", () => {
    const testId = 12345;

    const result = getDocumentCreationBase(testId);

    expect(mockServerTimestamp).toHaveBeenCalledTimes(1);
    expect(result).toEqual({
      _createdAt: mockTimestamp,
      _id: testId,
      _isUpdated: false,
      _updatedAt: mockTimestamp,
      status: EntityStatusRegistry.ACTIVE,
    });
  });

  it("should use same timestamp for both _createdAt and _updatedAt", () => {
    const testId = "timestamp-test";

    const result = getDocumentCreationBase(testId);

    expect(result._createdAt).toBe(result._updatedAt);
    expect(result._createdAt).toBe(mockTimestamp);
    expect(mockServerTimestamp).toHaveBeenCalledTimes(1); // Called only once, reused
  });

  it("should always set _isUpdated to false for new documents", () => {
    const testIds = ["id1", "id2", 123, 456];

    testIds.forEach((id) => {
      const result = getDocumentCreationBase(id);
      expect(result._isUpdated).toBe(false);
    });
  });

  it("should always set status to ACTIVE", () => {
    const testIds = ["active-test", 999];

    testIds.forEach((id) => {
      const result = getDocumentCreationBase(id);
      expect(result.status).toBe(EntityStatusRegistry.ACTIVE);
    });
  });

  it("should handle empty string ID", () => {
    const emptyId = "";

    const result = getDocumentCreationBase(emptyId);

    expect(result._id).toBe("");
    expect(result.status).toBe(EntityStatusRegistry.ACTIVE);
    expect(result._isUpdated).toBe(false);
  });

  it("should handle zero numeric ID", () => {
    const zeroId = 0;

    const result = getDocumentCreationBase(zeroId);

    expect(result._id).toBe(0);
    expect(result.status).toBe(EntityStatusRegistry.ACTIVE);
    expect(result._isUpdated).toBe(false);
  });

  it("should handle special string IDs", () => {
    const specialIds = [
      "id-with-dashes",
      "id_with_underscores",
      "id.with.dots",
      "id@with@symbols",
      "UPPERCASE-ID",
      "123-numeric-start",
      NEW_ENTITY_TEMP_ID,
    ];

    specialIds.forEach((id) => {
      const result = getDocumentCreationBase(id);

      expect(result._id).toBe(id);
      expect(result.status).toBe(EntityStatusRegistry.ACTIVE);
      expect(result._isUpdated).toBe(false);
      expect(result._createdAt).toBe(mockTimestamp);
      expect(result._updatedAt).toBe(mockTimestamp);
    });
  });

  it("should handle negative numeric IDs", () => {
    const negativeIds = [-1, -123, -999];

    negativeIds.forEach((id) => {
      const result = getDocumentCreationBase(id);

      expect(result._id).toBe(id);
      expect(result.status).toBe(EntityStatusRegistry.ACTIVE);
    });
  });

  it("should handle large numeric IDs", () => {
    const largeIds = [999999999, Number.MAX_SAFE_INTEGER];

    largeIds.forEach((id) => {
      const result = getDocumentCreationBase(id);

      expect(result._id).toBe(id);
      expect(result.status).toBe(EntityStatusRegistry.ACTIVE);
    });
  });

  it("should create different timestamps for multiple calls", () => {
    const timestamps = [
      { nanoseconds: 0, seconds: 1000000000 },
      { nanoseconds: 0, seconds: 2000000000 },
      { nanoseconds: 0, seconds: 3000000000 },
    ];

    timestamps.forEach((timestamp, index) => {
      mockServerTimestamp.mockReturnValueOnce(timestamp as any);

      const result = getDocumentCreationBase(`test-${index}`);

      expect(result._createdAt).toBe(timestamp);
      expect(result._updatedAt).toBe(timestamp);
    });
  });

  it("should have all required properties", () => {
    const result = getDocumentCreationBase("property-test");

    const requiredProperties = [
      "_createdAt",
      "_id",
      "_isUpdated",
      "_updatedAt",
      "status",
    ];

    requiredProperties.forEach((prop) => {
      expect(result).toHaveProperty(prop);
    });

    expect(Object.keys(result)).toHaveLength(5);
  });

  it("should handle serverTimestamp errors gracefully", () => {
    const error = new Error("Server timestamp failed");
    mockServerTimestamp.mockImplementation(() => {
      throw error;
    });

    expect(() => getDocumentCreationBase("error-test")).toThrow(
      "Server timestamp failed",
    );
  });

  it("should export NEW_ENTITY_TEMP_ID constant", () => {
    expect(NEW_ENTITY_TEMP_ID).toBeDefined();
    expect(typeof NEW_ENTITY_TEMP_ID).toBe("string");
    expect(NEW_ENTITY_TEMP_ID).toBe("new");
  });

  it("should work with NEW_ENTITY_TEMP_ID", () => {
    const result = getDocumentCreationBase(NEW_ENTITY_TEMP_ID);

    expect(result._id).toBe(NEW_ENTITY_TEMP_ID);
    expect(result.status).toBe(EntityStatusRegistry.ACTIVE);
    expect(result._isUpdated).toBe(false);
  });

  it("should maintain type consistency", () => {
    const stringResult = getDocumentCreationBase("string-id");
    const numberResult = getDocumentCreationBase(123);

    // Both should have same structure
    expect(typeof stringResult._id).toBe("string");
    expect(typeof numberResult._id).toBe("number");

    // But same other properties
    expect(typeof stringResult._isUpdated).toBe("boolean");
    expect(typeof numberResult._isUpdated).toBe("boolean");
    expect(stringResult.status).toBe(numberResult.status);
  });
});
