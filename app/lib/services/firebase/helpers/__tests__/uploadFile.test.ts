import { getDownloadURL, ref, uploadBytes } from "firebase/storage";

import uploadFile from "../uploadFile";

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
  getDownloadURL: jest.fn(),
  getStorage: jest.fn(),
  ref: jest.fn(),
  uploadBytes: jest.fn(),
}));

const mockRef = ref as jest.MockedFunction<typeof ref>;
const mockUploadBytes = uploadBytes as jest.MockedFunction<typeof uploadBytes>;
const mockGetDownloadURL = getDownloadURL as jest.MockedFunction<
  typeof getDownloadURL
>;

describe("uploadFile", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should upload file and return download URL and snapshot", async () => {
    const mockFile = new File(["test content"], "test.txt", {
      type: "text/plain",
    });
    const filePath = "uploads/test.txt";
    const mockStorageRef = { bucket: "test-bucket", fullPath: filePath };
    const mockSnapshot = {
      bytesTransferred: 12,
      metadata: {
        contentType: "text/plain",
        name: "test.txt",
        size: 12,
      },
      ref: mockStorageRef,
      state: "success",
      totalBytes: 12,
    };
    const mockDownloadURL =
      "https://storage.googleapis.com/test-bucket/uploads/test.txt";

    mockRef.mockReturnValue(mockStorageRef as any);
    mockUploadBytes.mockResolvedValueOnce(mockSnapshot as any);
    mockGetDownloadURL.mockResolvedValueOnce(mockDownloadURL);

    const result = await uploadFile(mockFile, filePath);

    expect(mockRef).toHaveBeenCalledWith("mock-storage-instance", filePath);
    expect(mockUploadBytes).toHaveBeenCalledWith(mockStorageRef, mockFile);
    expect(mockGetDownloadURL).toHaveBeenCalledWith(mockStorageRef);
    expect(result).toEqual([mockDownloadURL, mockSnapshot]);
  });

  it("should handle different file types", async () => {
    const testFiles = [
      {
        file: new File(["image data"], "image.jpg", { type: "image/jpeg" }),
        path: "images/image.jpg",
      },
      {
        file: new File(["pdf data"], "document.pdf", {
          type: "application/pdf",
        }),
        path: "documents/document.pdf",
      },
      {
        file: new File(["video data"], "video.mp4", { type: "video/mp4" }),
        path: "videos/video.mp4",
      },
      {
        file: new File(["audio data"], "audio.mp3", { type: "audio/mpeg" }),
        path: "audio/audio.mp3",
      },
    ];

    for (const { file, path } of testFiles) {
      const mockStorageRef = { bucket: "test-bucket", fullPath: path };
      const mockSnapshot = {
        metadata: { contentType: file.type, name: file.name, size: file.size },
        ref: mockStorageRef,
      };
      const mockDownloadURL = `https://storage.googleapis.com/test-bucket/${path}`;

      mockRef.mockReturnValue(mockStorageRef as any);
      mockUploadBytes.mockResolvedValueOnce(mockSnapshot as any);
      mockGetDownloadURL.mockResolvedValueOnce(mockDownloadURL);

      const result = await uploadFile(file, path);

      expect(mockRef).toHaveBeenCalledWith("mock-storage-instance", path);
      expect(mockUploadBytes).toHaveBeenCalledWith(mockStorageRef, file);
      expect(result).toEqual([mockDownloadURL, mockSnapshot]);

      jest.clearAllMocks();
    }
  });

  it("should handle different file paths", async () => {
    const mockFile = new File(["content"], "test.txt", { type: "text/plain" });
    const testPaths = [
      "simple.txt",
      "folder/file.txt",
      "deep/nested/folder/file.txt",
      "uploads/user123/profile.jpg",
      "documents/2023/report.pdf",
    ];

    for (const path of testPaths) {
      const mockStorageRef = { bucket: "test-bucket", fullPath: path };
      const mockSnapshot = { ref: mockStorageRef };
      const mockDownloadURL = `https://storage.googleapis.com/test-bucket/${path}`;

      mockRef.mockReturnValue(mockStorageRef as any);
      mockUploadBytes.mockResolvedValueOnce(mockSnapshot as any);
      mockGetDownloadURL.mockResolvedValueOnce(mockDownloadURL);

      const result = await uploadFile(mockFile, path);

      expect(mockRef).toHaveBeenCalledWith("mock-storage-instance", path);
      expect(result[0]).toBe(mockDownloadURL);
      expect(result[1]).toBe(mockSnapshot);

      jest.clearAllMocks();
    }
  });

  it("should handle large files", async () => {
    const largeFileContent = "x".repeat(1024 * 1024); // 1MB
    const mockFile = new File([largeFileContent], "large.txt", {
      type: "text/plain",
    });
    const filePath = "uploads/large.txt";
    const mockStorageRef = { bucket: "test-bucket", fullPath: filePath };
    const mockSnapshot = {
      bytesTransferred: largeFileContent.length,
      metadata: {
        contentType: "text/plain",
        name: "large.txt",
        size: largeFileContent.length,
      },
      ref: mockStorageRef,
      totalBytes: largeFileContent.length,
    };
    const mockDownloadURL =
      "https://storage.googleapis.com/test-bucket/uploads/large.txt";

    mockRef.mockReturnValue(mockStorageRef as any);
    mockUploadBytes.mockResolvedValueOnce(mockSnapshot as any);
    mockGetDownloadURL.mockResolvedValueOnce(mockDownloadURL);

    const result = await uploadFile(mockFile, filePath);

    expect(mockUploadBytes).toHaveBeenCalledWith(mockStorageRef, mockFile);
    expect(result).toEqual([mockDownloadURL, mockSnapshot]);
  });

  it("should handle empty files", async () => {
    const mockFile = new File([""], "empty.txt", { type: "text/plain" });
    const filePath = "uploads/empty.txt";
    const mockStorageRef = { bucket: "test-bucket", fullPath: filePath };
    const mockSnapshot = {
      metadata: { contentType: "text/plain", name: "empty.txt", size: 0 },
      ref: mockStorageRef,
    };
    const mockDownloadURL =
      "https://storage.googleapis.com/test-bucket/uploads/empty.txt";

    mockRef.mockReturnValue(mockStorageRef as any);
    mockUploadBytes.mockResolvedValueOnce(mockSnapshot as any);
    mockGetDownloadURL.mockResolvedValueOnce(mockDownloadURL);

    const result = await uploadFile(mockFile, filePath);

    expect(result).toEqual([mockDownloadURL, mockSnapshot]);
  });

  it("should handle files with special characters in name", async () => {
    const specialNames = [
      "file with spaces.txt",
      "file-with-dashes.txt",
      "file_with_underscores.txt",
      "file.with.dots.txt",
      "файл-українською.txt",
      "文件.txt",
    ];

    for (const fileName of specialNames) {
      const mockFile = new File(["content"], fileName, { type: "text/plain" });
      const filePath = `uploads/${fileName}`;
      const mockStorageRef = { bucket: "test-bucket", fullPath: filePath };
      const mockSnapshot = { ref: mockStorageRef };
      const mockDownloadURL = `https://storage.googleapis.com/test-bucket/${filePath}`;

      mockRef.mockReturnValue(mockStorageRef as any);
      mockUploadBytes.mockResolvedValueOnce(mockSnapshot as any);
      mockGetDownloadURL.mockResolvedValueOnce(mockDownloadURL);

      const result = await uploadFile(mockFile, filePath);

      expect(result).toEqual([mockDownloadURL, mockSnapshot]);

      jest.clearAllMocks();
    }
  });

  it("should handle Firebase Storage ref errors", async () => {
    const mockFile = new File(["content"], "test.txt", { type: "text/plain" });
    const filePath = "invalid/path";
    const error = new Error("Invalid storage reference");

    mockRef.mockImplementation(() => {
      throw error;
    });

    await expect(uploadFile(mockFile, filePath)).rejects.toThrow(
      "Invalid storage reference",
    );

    expect(mockRef).toHaveBeenCalledWith("mock-storage-instance", filePath);
  });

  it("should handle Firebase Storage uploadBytes errors", async () => {
    const mockFile = new File(["content"], "test.txt", { type: "text/plain" });
    const filePath = "uploads/test.txt";
    const mockStorageRef = { bucket: "test-bucket", fullPath: filePath };
    const error = new Error("Upload failed");

    mockRef.mockReturnValue(mockStorageRef as any);
    mockUploadBytes.mockRejectedValueOnce(error);

    await expect(uploadFile(mockFile, filePath)).rejects.toThrow(
      "Upload failed",
    );

    expect(mockUploadBytes).toHaveBeenCalledWith(mockStorageRef, mockFile);
    expect(mockGetDownloadURL).not.toHaveBeenCalled();
  });

  it("should handle Firebase Storage getDownloadURL errors", async () => {
    const mockFile = new File(["content"], "test.txt", { type: "text/plain" });
    const filePath = "uploads/test.txt";
    const mockStorageRef = { bucket: "test-bucket", fullPath: filePath };
    const mockSnapshot = { ref: mockStorageRef };
    const error = new Error("Failed to get download URL");

    mockRef.mockReturnValue(mockStorageRef as any);
    mockUploadBytes.mockResolvedValueOnce(mockSnapshot as any);
    mockGetDownloadURL.mockRejectedValueOnce(error);

    await expect(uploadFile(mockFile, filePath)).rejects.toThrow(
      "Failed to get download URL",
    );

    expect(mockUploadBytes).toHaveBeenCalledWith(mockStorageRef, mockFile);
    expect(mockGetDownloadURL).toHaveBeenCalledWith(mockStorageRef);
  });

  it("should handle Firebase Storage permission errors", async () => {
    const mockFile = new File(["content"], "test.txt", { type: "text/plain" });
    const filePath = "restricted/test.txt";
    const mockStorageRef = { bucket: "test-bucket", fullPath: filePath };
    const permissionError = new Error("Permission denied");
    Object.assign(permissionError, { code: "storage/unauthorized" });

    mockRef.mockReturnValue(mockStorageRef as any);
    mockUploadBytes.mockRejectedValueOnce(permissionError);

    await expect(uploadFile(mockFile, filePath)).rejects.toThrow(
      "Permission denied",
    );
  });

  it("should handle Firebase Storage quota exceeded errors", async () => {
    const mockFile = new File(["content"], "test.txt", { type: "text/plain" });
    const filePath = "uploads/test.txt";
    const mockStorageRef = { bucket: "test-bucket", fullPath: filePath };
    const quotaError = new Error("Quota exceeded");
    Object.assign(quotaError, { code: "storage/quota-exceeded" });

    mockRef.mockReturnValue(mockStorageRef as any);
    mockUploadBytes.mockRejectedValueOnce(quotaError);

    await expect(uploadFile(mockFile, filePath)).rejects.toThrow(
      "Quota exceeded",
    );
  });

  it("should handle Firebase Storage network errors", async () => {
    const mockFile = new File(["content"], "test.txt", { type: "text/plain" });
    const filePath = "uploads/test.txt";
    const mockStorageRef = { bucket: "test-bucket", fullPath: filePath };
    const networkError = new Error("Network request failed");
    Object.assign(networkError, { code: "storage/retry-limit-exceeded" });

    mockRef.mockReturnValue(mockStorageRef as any);
    mockUploadBytes.mockRejectedValueOnce(networkError);

    await expect(uploadFile(mockFile, filePath)).rejects.toThrow(
      "Network request failed",
    );
  });

  it("should return array with exactly two elements", async () => {
    const mockFile = new File(["content"], "test.txt", { type: "text/plain" });
    const filePath = "uploads/test.txt";
    const mockStorageRef = { fullPath: filePath };
    const mockSnapshot = { ref: mockStorageRef };
    const mockDownloadURL = "https://example.com/download-url";

    mockRef.mockReturnValue(mockStorageRef as any);
    mockUploadBytes.mockResolvedValueOnce(mockSnapshot as any);
    mockGetDownloadURL.mockResolvedValueOnce(mockDownloadURL);

    const result = await uploadFile(mockFile, filePath);

    expect(Array.isArray(result)).toBe(true);
    expect(result).toHaveLength(2);
    expect(typeof result[0]).toBe("string"); // Download URL
    expect(typeof result[1]).toBe("object"); // Snapshot
  });

  it("should handle files without extension", async () => {
    const mockFile = new File(["content"], "README", { type: "text/plain" });
    const filePath = "uploads/README";
    const mockStorageRef = { fullPath: filePath };
    const mockSnapshot = { ref: mockStorageRef };
    const mockDownloadURL =
      "https://storage.googleapis.com/test-bucket/uploads/README";

    mockRef.mockReturnValue(mockStorageRef as any);
    mockUploadBytes.mockResolvedValueOnce(mockSnapshot as any);
    mockGetDownloadURL.mockResolvedValueOnce(mockDownloadURL);

    const result = await uploadFile(mockFile, filePath);

    expect(result).toEqual([mockDownloadURL, mockSnapshot]);
  });
});
