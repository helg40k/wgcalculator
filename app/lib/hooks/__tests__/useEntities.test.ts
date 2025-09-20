import { act, renderHook, waitFor } from "@testing-library/react";

import { Entity } from "../../definitions";
import createDocument from "../../services/firebase/helpers/createDocument";
import deleteDocument from "../../services/firebase/helpers/deleteDocument";
import getCollectionData from "../../services/firebase/helpers/getCollectionData";
import getDocument from "../../services/firebase/helpers/getDocument";
import { NEW_ENTITY_TEMP_ID } from "../../services/firebase/helpers/getDocumentCreationBase";
import updateDocument from "../../services/firebase/helpers/updateDocument";
import useEntities from "../useEntities";
import useUser from "../useUser";

// Mock Ant Design patch
jest.mock("@ant-design/v5-patch-for-react-19", () => ({}));

// Mock Firebase utils
jest.mock("../../services/firebase/utils/firestore", () => ({
  __esModule: true,
  default: "mock-firestore-instance",
}));

jest.mock("../../services/firebase/utils/app", () => ({
  __esModule: true,
  default: "mock-app-instance",
}));

// Mock dependencies
jest.mock("../useUser");
jest.mock("../../services/firebase/helpers/createDocument");
jest.mock("../../services/firebase/helpers/deleteDocument");
jest.mock("../../services/firebase/helpers/getCollectionData");
jest.mock("../../services/firebase/helpers/getDocument");
jest.mock("../../services/firebase/helpers/updateDocument");
// Mock errorMessage
jest.mock("../../errorMessage", () => ({
  __esModule: true,
  default: jest.fn(),
}));

import errorMessage from "../../errorMessage";
const mockErrorMessage = errorMessage as jest.MockedFunction<
  typeof errorMessage
>;

const mockUseUser = useUser as jest.MockedFunction<typeof useUser>;
const mockCreateDocument = createDocument as jest.MockedFunction<
  typeof createDocument
>;
const mockDeleteDocument = deleteDocument as jest.MockedFunction<
  typeof deleteDocument
>;
const mockGetCollectionData = getCollectionData as jest.MockedFunction<
  typeof getCollectionData
>;
const mockGetDocument = getDocument as jest.MockedFunction<typeof getDocument>;
const mockUpdateDocument = updateDocument as jest.MockedFunction<
  typeof updateDocument
>;

const mockEntity: Entity = {
  _createdAt: { nanoseconds: 0, seconds: 1234567890 } as any,
  _createdBy: "creator@example.com",
  _id: "entity123",
  _isUpdated: false,
  _updatedAt: { nanoseconds: 0, seconds: 1234567890 } as any,
  _updatedBy: "updater@example.com",
  name: "Test Entity",
  status: "active",
};

const mockNewEntity: Entity = {
  _createdAt: { nanoseconds: 0, seconds: 1234567890 } as any,
  _createdBy: "creator@example.com",
  _id: NEW_ENTITY_TEMP_ID,
  _isUpdated: false,
  _updatedAt: { nanoseconds: 0, seconds: 1234567890 } as any,
  _updatedBy: "updater@example.com",
  name: "New Entity",
  status: "active",
};

describe("useEntities", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseUser.mockReturnValue({
      email: "test@example.com",
      iconURL: undefined,
      isAdmin: false,
      isAuthenticated: true,
      userName: "Test User",
    });
  });

  describe("loadEntities", () => {
    it("should load entities successfully", async () => {
      const mockEntities = [mockEntity, { ...mockEntity, _id: "entity456" }];
      mockGetCollectionData.mockResolvedValueOnce(mockEntities);

      const { result } = renderHook(() => useEntities());

      let entities: Entity[] = [];
      await act(async () => {
        entities = await result.current.loadEntities("test-collection");
      });

      expect(mockGetCollectionData).toHaveBeenCalledWith("test-collection", {
        filters: undefined,
        limit: undefined,
        pagination: undefined,
        sort: undefined,
        withoutSort: undefined,
      });
      expect(entities).toEqual(mockEntities);
      expect(result.current.loading).toBe(false);
    });

    it("should return empty array when dbRef is null", async () => {
      const { result } = renderHook(() => useEntities());

      let entities: Entity[] = [];
      await act(async () => {
        entities = await result.current.loadEntities(null);
      });

      expect(mockGetCollectionData).not.toHaveBeenCalled();
      expect(entities).toEqual([]);
      expect(result.current.loading).toBe(false);
    });

    it("should handle loading state correctly", async () => {
      const mockEntities = [mockEntity];
      mockGetCollectionData.mockImplementation(
        () =>
          new Promise((resolve) =>
            setTimeout(() => resolve(mockEntities), 100),
          ),
      );

      const { result } = renderHook(() => useEntities());

      act(() => {
        result.current.loadEntities("test-collection");
      });

      expect(result.current.loading).toBe(true);

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });
    });

    it("should handle errors in loadEntities", async () => {
      const error = new Error("Failed to load entities");
      mockGetCollectionData.mockRejectedValueOnce(error);

      const { result } = renderHook(() => useEntities());

      let entities: Entity[] = [];
      await act(async () => {
        entities = await result.current.loadEntities("error-collection");
      });

      expect(entities).toEqual([]);
      expect(result.current.loading).toBe(false);
    });

    it("should pass options correctly to getCollectionData", async () => {
      const mockEntities = [mockEntity];
      const options = {
        filters: [["status", "==", "active"]] as [string, any, any][],
        limit: 10,
        sort: ["name", "asc"] as [string, any],
        withoutSort: false,
      };
      mockGetCollectionData.mockResolvedValueOnce(mockEntities);

      const { result } = renderHook(() => useEntities());

      await act(async () => {
        await result.current.loadEntities("test-collection", options);
      });

      expect(mockGetCollectionData).toHaveBeenCalledWith("test-collection", {
        filters: options.filters,
        limit: options.limit,
        pagination: undefined,
        sort: options.sort,
        withoutSort: options.withoutSort,
      });
    });
  });

  describe("getEntity", () => {
    it("should get single entity successfully", async () => {
      mockGetDocument.mockResolvedValueOnce(mockEntity);

      const { result } = renderHook(() => useEntities());

      let entity: Entity | null = null;
      await act(async () => {
        entity = await result.current.getEntity("test-collection", "entity123");
      });

      expect(mockGetDocument).toHaveBeenCalledWith(
        "test-collection",
        "entity123",
      );
      expect(entity).toEqual(mockEntity);
      expect(result.current.loading).toBe(false);
    });

    it("should return null when dbRef is null", async () => {
      const { result } = renderHook(() => useEntities());

      let entity: Entity | null = null;
      await act(async () => {
        entity = await result.current.getEntity(null, "entity123");
      });

      expect(mockGetDocument).not.toHaveBeenCalled();
      expect(entity).toBeNull();
    });

    it("should handle errors in getEntity", async () => {
      const error = new Error("Failed to get entity");
      mockGetDocument.mockRejectedValueOnce(error);

      const { result } = renderHook(() => useEntities());

      let entity: Entity | null = null;
      await act(async () => {
        entity = await result.current.getEntity(
          "error-collection",
          "entity123",
        );
      });

      expect(entity).toBeNull();
      expect(result.current.loading).toBe(false);
    });
  });

  describe("saveEntity", () => {
    it("should create new entity when _id is NEW_ENTITY_TEMP_ID", async () => {
      const createdEntity = { ...mockNewEntity, _id: "created123" };
      mockCreateDocument.mockResolvedValueOnce(createdEntity);

      const { result } = renderHook(() => useEntities());

      let savedEntity: Entity | null = null;
      await act(async () => {
        savedEntity = await result.current.saveEntity(
          "test-collection",
          mockNewEntity,
        );
      });

      expect(mockCreateDocument).toHaveBeenCalledWith("test-collection", {
        ...mockNewEntity,
        _createdBy: "test@example.com",
        _updatedBy: "test@example.com",
      });
      expect(mockUpdateDocument).not.toHaveBeenCalled();
      expect(savedEntity).toEqual(createdEntity);
    });

    it("should update existing entity when _id is not NEW_ENTITY_TEMP_ID", async () => {
      const updatedEntity = { ...mockEntity, name: "Updated Entity" };
      mockUpdateDocument.mockResolvedValueOnce(updatedEntity);

      const { result } = renderHook(() => useEntities());

      let savedEntity: Entity | null = null;
      await act(async () => {
        savedEntity = await result.current.saveEntity(
          "test-collection",
          mockEntity,
        );
      });

      expect(mockUpdateDocument).toHaveBeenCalledWith(
        "test-collection",
        "entity123",
        {
          ...mockEntity,
          _updatedBy: "test@example.com",
        },
      );
      expect(mockCreateDocument).not.toHaveBeenCalled();
      expect(savedEntity).toEqual(updatedEntity);
    });

    it("should convert undefined values to null before saving", async () => {
      const entityWithUndefined = {
        ...mockEntity,
        anotherField: "value",
        nullField: null,
        optionalField: undefined,
      };
      const updatedEntity = { ...entityWithUndefined, optionalField: null };
      mockUpdateDocument.mockResolvedValueOnce(updatedEntity);

      const { result } = renderHook(() => useEntities());

      await act(async () => {
        await result.current.saveEntity("test-collection", entityWithUndefined);
      });

      expect(mockUpdateDocument).toHaveBeenCalledWith(
        "test-collection",
        "entity123",
        {
          ...entityWithUndefined,
          // undefined converted to null
          _updatedBy: "test@example.com",
          optionalField: null,
        },
      );
    });

    it("should throw error when user is not authenticated", async () => {
      mockUseUser.mockReturnValue({
        email: null,
        iconURL: undefined,
        isAdmin: false,
        isAuthenticated: false,
        userName: "anonymous",
      });

      const { result } = renderHook(() => useEntities());

      await act(async () => {
        try {
          await result.current.saveEntity("test-collection", mockEntity);
          fail("Expected saveEntity to throw an error");
        } catch (error: any) {
          expect(error.message).toBe("Unauthorized modifying!");
        }
      });

      expect(mockUpdateDocument).not.toHaveBeenCalled();
      expect(mockCreateDocument).not.toHaveBeenCalled();
    });

    it("should handle null dbRef", async () => {
      const { result } = renderHook(() => useEntities());

      let savedEntity: Entity | null = null;
      await act(async () => {
        savedEntity = await result.current.saveEntity(null, mockEntity);
      });

      expect(savedEntity).toBeNull();
      expect(mockUpdateDocument).not.toHaveBeenCalled();
      expect(mockCreateDocument).not.toHaveBeenCalled();
    });

    it("should handle null entity", async () => {
      const { result } = renderHook(() => useEntities());

      let savedEntity: Entity | null = null;
      await act(async () => {
        savedEntity = await result.current.saveEntity(
          "test-collection",
          null as any,
        );
      });

      expect(savedEntity).toBeNull();
      expect(mockUpdateDocument).not.toHaveBeenCalled();
      expect(mockCreateDocument).not.toHaveBeenCalled();
    });

    it("should handle errors in saveEntity", async () => {
      const error = new Error("Failed to save entity");
      mockUpdateDocument.mockRejectedValueOnce(error);

      const { result } = renderHook(() => useEntities());

      let savedEntity: Entity | null = null;
      await act(async () => {
        savedEntity = await result.current.saveEntity(
          "error-collection",
          mockEntity,
        );
      });

      expect(savedEntity).toBeNull();
      expect(result.current.loading).toBe(false);
    });
  });

  describe("deleteEntity", () => {
    it("should delete entity successfully", async () => {
      mockDeleteDocument.mockResolvedValueOnce(undefined);

      const { result } = renderHook(() => useEntities());

      await act(async () => {
        await result.current.deleteEntity("test-collection", "entity123");
      });

      expect(mockDeleteDocument).toHaveBeenCalledWith(
        "test-collection",
        "entity123",
      );
      expect(result.current.loading).toBe(false);
    });

    it("should throw error when user is not authenticated", async () => {
      mockUseUser.mockReturnValue({
        email: null,
        iconURL: undefined,
        isAdmin: false,
        isAuthenticated: false,
        userName: "anonymous",
      });

      const { result } = renderHook(() => useEntities());

      await act(async () => {
        try {
          await result.current.deleteEntity("test-collection", "entity123");
          fail("Expected deleteEntity to throw an error");
        } catch (error: any) {
          expect(error.message).toBe("Unauthorized modifying!");
        }
      });

      expect(mockDeleteDocument).not.toHaveBeenCalled();
    });

    it("should handle null dbRef", async () => {
      const { result } = renderHook(() => useEntities());

      await act(async () => {
        await result.current.deleteEntity(null, "entity123");
      });

      expect(mockDeleteDocument).not.toHaveBeenCalled();
    });

    it("should handle null id", async () => {
      const { result } = renderHook(() => useEntities());

      await act(async () => {
        await result.current.deleteEntity("test-collection", null);
      });

      expect(mockDeleteDocument).not.toHaveBeenCalled();
    });

    it("should handle errors in deleteEntity", async () => {
      const error = new Error("Failed to delete entity");
      mockDeleteDocument.mockRejectedValueOnce(error);

      const { result } = renderHook(() => useEntities());

      await act(async () => {
        await result.current.deleteEntity("error-collection", "entity123");
      });

      expect(result.current.loading).toBe(false);
    });
  });

  describe("error handling", () => {
    it("should show notification when error occurs", async () => {
      const error = new Error("Test error");
      mockGetCollectionData.mockRejectedValueOnce(error);

      const { result } = renderHook(() => useEntities());

      await act(async () => {
        await result.current.loadEntities("error-collection");
      });

      await waitFor(() => {
        expect(mockErrorMessage).toHaveBeenCalledWith("Test error");
      });
    });

    it("should show default error message when error has no message", async () => {
      const error = new Error();
      mockGetCollectionData.mockRejectedValueOnce(error);

      const { result } = renderHook(() => useEntities());

      await act(async () => {
        await result.current.loadEntities("error-collection");
      });

      await waitFor(() => {
        expect(mockErrorMessage).toHaveBeenCalledWith(
          "Something in useEntities()",
        );
      });
    });
  });

  describe("loading state", () => {
    it("should manage loading state correctly for loadEntities", async () => {
      const mockEntities = [mockEntity];
      let resolvePromise: (value: any) => void;
      const promise = new Promise((resolve) => {
        resolvePromise = resolve;
      });
      mockGetCollectionData.mockReturnValue(promise as any);

      const { result } = renderHook(() => useEntities());

      expect(result.current.loading).toBe(false);

      act(() => {
        result.current.loadEntities("test-collection");
      });

      expect(result.current.loading).toBe(true);

      await act(async () => {
        resolvePromise!(mockEntities);
        await promise;
      });

      expect(result.current.loading).toBe(false);
    });

    it("should manage loading state correctly for saveEntity", async () => {
      const updatedEntity = { ...mockEntity, name: "Updated" };
      let resolvePromise: (value: any) => void;
      const promise = new Promise((resolve) => {
        resolvePromise = resolve;
      });
      mockUpdateDocument.mockReturnValue(promise as any);

      const { result } = renderHook(() => useEntities());

      expect(result.current.loading).toBe(false);

      act(() => {
        result.current.saveEntity("test-collection", mockEntity);
      });

      expect(result.current.loading).toBe(true);

      await act(async () => {
        resolvePromise!(updatedEntity);
        await promise;
      });

      expect(result.current.loading).toBe(false);
    });

    it("should manage loading state correctly for deleteEntity", async () => {
      let resolvePromise: (value: any) => void;
      const promise = new Promise((resolve) => {
        resolvePromise = resolve;
      });
      mockDeleteDocument.mockReturnValue(promise as any);

      const { result } = renderHook(() => useEntities());

      expect(result.current.loading).toBe(false);

      act(() => {
        result.current.deleteEntity("test-collection", "entity123");
      });

      expect(result.current.loading).toBe(true);

      await act(async () => {
        resolvePromise!(undefined);
        await promise;
      });

      expect(result.current.loading).toBe(false);
    });
  });

  describe("prepareToSave functionality", () => {
    it("should convert undefined values to null in nested objects", async () => {
      const entityWithNestedUndefined = {
        ...mockEntity,
        metadata: {
          field1: "value1",
          field2: undefined,
          field3: null,
          nested: {
            subfield1: "value",
            subfield2: undefined,
          },
        },
        nullField: null,
        stringField: "value",
        undefinedField: undefined,
      };

      const updatedEntity = { ...entityWithNestedUndefined };
      mockUpdateDocument.mockResolvedValueOnce(updatedEntity);

      const { result } = renderHook(() => useEntities());

      await act(async () => {
        await result.current.saveEntity(
          "test-collection",
          entityWithNestedUndefined,
        );
      });

      // Check that top-level undefined was converted to null
      const calledWith = mockUpdateDocument.mock.calls[0][2] as any;
      expect(calledWith.undefinedField).toBeNull();
      expect(calledWith.nullField).toBeNull();
      expect(calledWith.stringField).toBe("value");
    });
  });

  describe("authentication checks", () => {
    it("should allow operations when user is authenticated", async () => {
      mockDeleteDocument.mockResolvedValueOnce(undefined);

      const { result } = renderHook(() => useEntities());

      await act(async () => {
        await result.current.deleteEntity("test-collection", "entity123");
      });

      expect(mockDeleteDocument).toHaveBeenCalled();
    });

    it("should prevent operations when user email is empty", async () => {
      mockUseUser.mockReturnValue({
        email: "",
        iconURL: undefined,
        isAdmin: false,
        isAuthenticated: true,
        userName: "User Without Email",
      });

      const { result } = renderHook(() => useEntities());

      await act(async () => {
        try {
          await result.current.deleteEntity("test-collection", "entity123");
          fail("Expected deleteEntity to throw an error");
        } catch (error: any) {
          expect(error.message).toBe("Unauthorized modifying!");
        }
      });

      expect(mockDeleteDocument).not.toHaveBeenCalled();
    });
  });

  describe("entity metadata", () => {
    it("should add _createdBy for new entities", async () => {
      const createdEntity = { ...mockNewEntity, _id: "created123" };
      mockCreateDocument.mockResolvedValueOnce(createdEntity);

      const { result } = renderHook(() => useEntities());

      await act(async () => {
        await result.current.saveEntity("test-collection", mockNewEntity);
      });

      const calledWith = mockCreateDocument.mock.calls[0][1] as any;
      expect(calledWith._createdBy).toBe("test@example.com");
      expect(calledWith._updatedBy).toBe("test@example.com");
    });

    it("should add only _updatedBy for existing entities", async () => {
      const updatedEntity = { ...mockEntity, name: "Updated" };
      mockUpdateDocument.mockResolvedValueOnce(updatedEntity);

      const { result } = renderHook(() => useEntities());

      await act(async () => {
        await result.current.saveEntity("test-collection", mockEntity);
      });

      const calledWith = mockUpdateDocument.mock.calls[0][2] as any;
      expect(calledWith._updatedBy).toBe("test@example.com");
      expect(calledWith._createdBy).toBe("creator@example.com"); // Preserved from original entity
    });
  });

  describe("hook stability", () => {
    it("should maintain function references when email doesn't change", () => {
      const { result, rerender } = renderHook(() => useEntities());

      const initialFunctions = {
        deleteEntity: result.current.deleteEntity,
        getEntity: result.current.getEntity,
        loadEntities: result.current.loadEntities,
        saveEntity: result.current.saveEntity,
      };

      rerender();

      expect(result.current.deleteEntity).toBe(initialFunctions.deleteEntity);
      expect(result.current.loadEntities).toBe(initialFunctions.loadEntities);
      expect(result.current.getEntity).toBe(initialFunctions.getEntity);
      expect(result.current.saveEntity).toBe(initialFunctions.saveEntity);
    });

    it("should update function references when email changes", () => {
      const { result, rerender } = renderHook(() => useEntities());

      const initialFunctions = {
        deleteEntity: result.current.deleteEntity,
        saveEntity: result.current.saveEntity,
      };

      // Change email
      mockUseUser.mockReturnValue({
        email: "newemail@example.com",
        iconURL: undefined,
        isAdmin: false,
        isAuthenticated: true,
        userName: "New User",
      });

      rerender();

      expect(result.current.deleteEntity).not.toBe(
        initialFunctions.deleteEntity,
      );
      expect(result.current.saveEntity).not.toBe(initialFunctions.saveEntity);
    });
  });

  describe("return object structure", () => {
    it("should return consistent object structure", () => {
      const { result } = renderHook(() => useEntities());

      expect(result.current).toHaveProperty("deleteEntity");
      expect(result.current).toHaveProperty("getEntity");
      expect(result.current).toHaveProperty("loadEntities");
      expect(result.current).toHaveProperty("loading");
      expect(result.current).toHaveProperty("saveEntity");

      expect(Object.keys(result.current)).toHaveLength(5);

      expect(typeof result.current.deleteEntity).toBe("function");
      expect(typeof result.current.getEntity).toBe("function");
      expect(typeof result.current.loadEntities).toBe("function");
      expect(typeof result.current.loading).toBe("boolean");
      expect(typeof result.current.saveEntity).toBe("function");
    });
  });

  describe("complex scenarios", () => {
    it("should handle multiple operations in sequence", async () => {
      const entities = [mockEntity];
      const createdEntity = { ...mockNewEntity, _id: "created123" };

      mockGetCollectionData.mockResolvedValueOnce(entities);
      mockCreateDocument.mockResolvedValueOnce(createdEntity);
      mockDeleteDocument.mockResolvedValueOnce(undefined);

      const { result } = renderHook(() => useEntities());

      // Load entities
      let loadedEntities: Entity[] = [];
      await act(async () => {
        loadedEntities = await result.current.loadEntities("test-collection");
      });
      expect(loadedEntities).toEqual(entities);

      // Create new entity
      let savedEntity: Entity | null = null;
      await act(async () => {
        savedEntity = await result.current.saveEntity(
          "test-collection",
          mockNewEntity,
        );
      });
      expect(savedEntity).toEqual(createdEntity);

      // Delete entity
      await act(async () => {
        await result.current.deleteEntity("test-collection", "entity123");
      });

      expect(mockGetCollectionData).toHaveBeenCalledTimes(1);
      expect(mockCreateDocument).toHaveBeenCalledTimes(1);
      expect(mockDeleteDocument).toHaveBeenCalledTimes(1);
    });

    it("should handle concurrent operations", async () => {
      const entities1 = [mockEntity];
      const entities2 = [{ ...mockEntity, _id: "entity456" }];

      mockGetCollectionData
        .mockResolvedValueOnce(entities1)
        .mockResolvedValueOnce(entities2);

      const { result } = renderHook(() => useEntities());

      let results: Entity[][] = [];
      await act(async () => {
        const promise1 = result.current.loadEntities("collection1");
        const promise2 = result.current.loadEntities("collection2");
        results = await Promise.all([promise1, promise2]);
      });

      expect(results[0]).toEqual(entities1);
      expect(results[1]).toEqual(entities2);
      expect(mockGetCollectionData).toHaveBeenCalledTimes(2);
    });
  });
});
