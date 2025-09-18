import { deleteObject, ref } from "firebase/storage";

import removeFile from "../removeFile";

// Mock the storage instance and app
jest.mock("../../../firebase/utils/storage", () => ({
  __esModule: true,
  default: "mock-storage-instance",
}));

jest.mock("../../../firebase/utils/app", () => ({
  __esModule: true,
  default: "mock-app-instance",
}));

// Mock Firebase Storage functions
jest.mock("firebase/storage", () => ({
  deleteObject: jest.fn(),
  getStorage: jest.fn(),
  ref: jest.fn(),
}));

const mockRef = ref as jest.MockedFunction<typeof ref>;
const mockDeleteObject = deleteObject as jest.MockedFunction<
  typeof deleteObject
>;

describe("removeFile", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should remove file successfully", async () => {
    const filePath = "uploads/test.txt";
    const mockStorageRef = { bucket: "test-bucket", fullPath: filePath };

    mockRef.mockReturnValue(mockStorageRef as any);
    mockDeleteObject.mockResolvedValueOnce(undefined);

    const result = await removeFile(filePath);

    expect(mockRef).toHaveBeenCalledWith("mock-storage-instance", filePath);
    expect(mockDeleteObject).toHaveBeenCalledWith(mockStorageRef);
    expect(result).toBeUndefined(); // Function returns void
  });

  it("should handle different file paths", async () => {
    const testPaths = [
      "simple.txt",
      "folder/file.txt",
      "deep/nested/folder/file.txt",
      "uploads/user123/profile.jpg",
      "documents/2023/report.pdf",
      "images/gallery/photo001.png",
    ];

    for (const path of testPaths) {
      const mockStorageRef = { bucket: "test-bucket", fullPath: path };

      mockRef.mockReturnValue(mockStorageRef as any);
      mockDeleteObject.mockResolvedValueOnce(undefined);

      const result = await removeFile(path);

      expect(mockRef).toHaveBeenCalledWith("mock-storage-instance", path);
      expect(mockDeleteObject).toHaveBeenCalledWith(mockStorageRef);
      expect(result).toBeUndefined();

      jest.clearAllMocks();
    }
  });

  it("should handle files with special characters in path", async () => {
    const specialPaths = [
      "uploads/file with spaces.txt",
      "uploads/file-with-dashes.txt",
      "uploads/file_with_underscores.txt",
      "uploads/file.with.dots.txt",
      "uploads/файл-українською.txt",
      "uploads/文件.txt",
      "uploads/file@symbol.txt",
      "uploads/file#hash.txt",
      "uploads/file%percent.txt",
    ];

    for (const path of specialPaths) {
      const mockStorageRef = { bucket: "test-bucket", fullPath: path };

      mockRef.mockReturnValue(mockStorageRef as any);
      mockDeleteObject.mockResolvedValueOnce(undefined);

      const result = await removeFile(path);

      expect(mockRef).toHaveBeenCalledWith("mock-storage-instance", path);
      expect(mockDeleteObject).toHaveBeenCalledWith(mockStorageRef);
      expect(result).toBeUndefined();

      jest.clearAllMocks();
    }
  });

  it("should handle different file types", async () => {
    const fileTypes = [
      "documents/file.pdf",
      "images/photo.jpg",
      "images/photo.png",
      "images/photo.gif",
      "videos/video.mp4",
      "videos/video.avi",
      "audio/song.mp3",
      "audio/song.wav",
      "archives/archive.zip",
      "archives/archive.rar",
    ];

    for (const path of fileTypes) {
      const mockStorageRef = { bucket: "test-bucket", fullPath: path };

      mockRef.mockReturnValue(mockStorageRef as any);
      mockDeleteObject.mockResolvedValueOnce(undefined);

      const result = await removeFile(path);

      expect(mockRef).toHaveBeenCalledWith("mock-storage-instance", path);
      expect(result).toBeUndefined();

      jest.clearAllMocks();
    }
  });

  it("should handle empty string path", async () => {
    const emptyPath = "";
    const mockStorageRef = { bucket: "test-bucket", fullPath: emptyPath };

    mockRef.mockReturnValue(mockStorageRef as any);
    mockDeleteObject.mockResolvedValueOnce(undefined);

    const result = await removeFile(emptyPath);

    expect(mockRef).toHaveBeenCalledWith("mock-storage-instance", emptyPath);
    expect(mockDeleteObject).toHaveBeenCalledWith(mockStorageRef);
    expect(result).toBeUndefined();
  });

  it("should handle files without extension", async () => {
    const pathsWithoutExtension = [
      "uploads/README",
      "uploads/LICENSE",
      "uploads/Dockerfile",
      "uploads/makefile",
      "config/settings",
    ];

    for (const path of pathsWithoutExtension) {
      const mockStorageRef = { bucket: "test-bucket", fullPath: path };

      mockRef.mockReturnValue(mockStorageRef as any);
      mockDeleteObject.mockResolvedValueOnce(undefined);

      const result = await removeFile(path);

      expect(mockRef).toHaveBeenCalledWith("mock-storage-instance", path);
      expect(result).toBeUndefined();

      jest.clearAllMocks();
    }
  });

  it("should handle Firebase Storage ref errors", async () => {
    const filePath = "invalid/path";
    const error = new Error("Invalid storage reference");

    mockRef.mockImplementation(() => {
      throw error;
    });

    try {
      await removeFile(filePath);
      fail("Expected removeFile to throw an error");
    } catch (thrownError) {
      expect(thrownError).toEqual(error);
    }

    expect(mockRef).toHaveBeenCalledWith("mock-storage-instance", filePath);
    expect(mockDeleteObject).not.toHaveBeenCalled();
  });

  it("should handle Firebase Storage deleteObject errors", async () => {
    const filePath = "uploads/test.txt";
    const mockStorageRef = { bucket: "test-bucket", fullPath: filePath };
    const error = new Error("Delete operation failed");

    mockRef.mockReturnValue(mockStorageRef as any);
    mockDeleteObject.mockRejectedValueOnce(error);

    await expect(removeFile(filePath)).rejects.toThrow(
      "Delete operation failed",
    );

    expect(mockRef).toHaveBeenCalledWith("mock-storage-instance", filePath);
    expect(mockDeleteObject).toHaveBeenCalledWith(mockStorageRef);
  });

  it("should handle Firebase Storage file not found errors", async () => {
    const filePath = "uploads/nonexistent.txt";
    const mockStorageRef = { bucket: "test-bucket", fullPath: filePath };
    const notFoundError = new Error("Object not found");
    Object.assign(notFoundError, { code: "storage/object-not-found" });

    mockRef.mockReturnValue(mockStorageRef as any);
    mockDeleteObject.mockRejectedValueOnce(notFoundError);

    await expect(removeFile(filePath)).rejects.toThrow("Object not found");

    expect(mockDeleteObject).toHaveBeenCalledWith(mockStorageRef);
  });

  it("should handle Firebase Storage permission errors", async () => {
    const filePath = "restricted/protected.txt";
    const mockStorageRef = { bucket: "test-bucket", fullPath: filePath };
    const permissionError = new Error("Permission denied");
    Object.assign(permissionError, { code: "storage/unauthorized" });

    mockRef.mockReturnValue(mockStorageRef as any);
    mockDeleteObject.mockRejectedValueOnce(permissionError);

    await expect(removeFile(filePath)).rejects.toThrow("Permission denied");

    expect(mockDeleteObject).toHaveBeenCalledWith(mockStorageRef);
  });

  it("should handle Firebase Storage network errors", async () => {
    const filePath = "uploads/test.txt";
    const mockStorageRef = { bucket: "test-bucket", fullPath: filePath };
    const networkError = new Error("Network request failed");
    Object.assign(networkError, { code: "storage/retry-limit-exceeded" });

    mockRef.mockReturnValue(mockStorageRef as any);
    mockDeleteObject.mockRejectedValueOnce(networkError);

    await expect(removeFile(filePath)).rejects.toThrow(
      "Network request failed",
    );

    expect(mockDeleteObject).toHaveBeenCalledWith(mockStorageRef);
  });

  it("should handle Firebase Storage bucket not found errors", async () => {
    const filePath = "uploads/test.txt";
    const mockStorageRef = { bucket: "nonexistent-bucket", fullPath: filePath };
    const bucketError = new Error("Bucket not found");
    Object.assign(bucketError, { code: "storage/bucket-not-found" });

    mockRef.mockReturnValue(mockStorageRef as any);
    mockDeleteObject.mockRejectedValueOnce(bucketError);

    await expect(removeFile(filePath)).rejects.toThrow("Bucket not found");

    expect(mockDeleteObject).toHaveBeenCalledWith(mockStorageRef);
  });

  it("should handle Firebase Storage quota exceeded errors", async () => {
    const filePath = "uploads/test.txt";
    const mockStorageRef = { bucket: "test-bucket", fullPath: filePath };
    const quotaError = new Error("Quota exceeded");
    Object.assign(quotaError, { code: "storage/quota-exceeded" });

    mockRef.mockReturnValue(mockStorageRef as any);
    mockDeleteObject.mockRejectedValueOnce(quotaError);

    await expect(removeFile(filePath)).rejects.toThrow("Quota exceeded");

    expect(mockDeleteObject).toHaveBeenCalledWith(mockStorageRef);
  });

  it("should handle Firebase Storage canceled operations", async () => {
    const filePath = "uploads/test.txt";
    const mockStorageRef = { bucket: "test-bucket", fullPath: filePath };
    const canceledError = new Error("Operation canceled");
    Object.assign(canceledError, { code: "storage/canceled" });

    mockRef.mockReturnValue(mockStorageRef as any);
    mockDeleteObject.mockRejectedValueOnce(canceledError);

    await expect(removeFile(filePath)).rejects.toThrow("Operation canceled");

    expect(mockDeleteObject).toHaveBeenCalledWith(mockStorageRef);
  });

  it("should return Promise<void>", async () => {
    const filePath = "uploads/test.txt";
    const mockStorageRef = { bucket: "test-bucket", fullPath: filePath };

    mockRef.mockReturnValue(mockStorageRef as any);
    mockDeleteObject.mockResolvedValueOnce(undefined);

    const result = removeFile(filePath);

    expect(result).toBeInstanceOf(Promise);

    const resolvedResult = await result;
    expect(resolvedResult).toBeUndefined();
  });

  it("should handle very long file paths", async () => {
    const longPath =
      "uploads/" +
      "very-long-folder-name/".repeat(20) +
      "very-long-file-name.txt";
    const mockStorageRef = { bucket: "test-bucket", fullPath: longPath };

    mockRef.mockReturnValue(mockStorageRef as any);
    mockDeleteObject.mockResolvedValueOnce(undefined);

    const result = await removeFile(longPath);

    expect(mockRef).toHaveBeenCalledWith("mock-storage-instance", longPath);
    expect(result).toBeUndefined();
  });

  it("should handle paths with leading/trailing slashes", async () => {
    const pathsWithSlashes = [
      "/uploads/file.txt",
      "uploads/file.txt/",
      "/uploads/file.txt/",
      "//uploads//file.txt//",
      "/folder/subfolder/file.txt",
    ];

    for (const path of pathsWithSlashes) {
      const mockStorageRef = { bucket: "test-bucket", fullPath: path };

      mockRef.mockReturnValue(mockStorageRef as any);
      mockDeleteObject.mockResolvedValueOnce(undefined);

      const result = await removeFile(path);

      expect(mockRef).toHaveBeenCalledWith("mock-storage-instance", path);
      expect(result).toBeUndefined();

      jest.clearAllMocks();
    }
  });
});
