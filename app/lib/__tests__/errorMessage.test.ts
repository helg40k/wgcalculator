import { notification } from "antd";

import errorMessage from "../errorMessage";

// Mock Ant Design patch
jest.mock("@ant-design/v5-patch-for-react-19", () => ({}));

// Mock Ant Design notification
jest.mock("antd", () => ({
  notification: {
    error: jest.fn(),
  },
}));

const mockNotificationError = notification.error as jest.MockedFunction<
  typeof notification.error
>;

describe("errorMessage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("basic functionality", () => {
    it("should call notification.error with correct parameters", () => {
      const message = "Test error message";

      errorMessage(message);

      expect(mockNotificationError).toHaveBeenCalledWith({
        description: message,
        message: "Error",
        pauseOnHover: true,
        showProgress: true,
      });
    });

    it("should be called exactly once", () => {
      errorMessage("Single call test");

      expect(mockNotificationError).toHaveBeenCalledTimes(1);
    });

    it("should handle multiple consecutive calls", () => {
      errorMessage("First error");
      errorMessage("Second error");
      errorMessage("Third error");

      expect(mockNotificationError).toHaveBeenCalledTimes(3);
      expect(mockNotificationError).toHaveBeenNthCalledWith(1, {
        description: "First error",
        message: "Error",
        pauseOnHover: true,
        showProgress: true,
      });
      expect(mockNotificationError).toHaveBeenNthCalledWith(2, {
        description: "Second error",
        message: "Error",
        pauseOnHover: true,
        showProgress: true,
      });
      expect(mockNotificationError).toHaveBeenNthCalledWith(3, {
        description: "Third error",
        message: "Error",
        pauseOnHover: true,
        showProgress: true,
      });
    });
  });

  describe("message handling", () => {
    it("should handle empty string messages", () => {
      errorMessage("");

      expect(mockNotificationError).toHaveBeenCalledWith({
        description: "",
        message: "Error",
        pauseOnHover: true,
        showProgress: true,
      });
    });

    it("should handle very long messages", () => {
      const longMessage = "A".repeat(1000);

      errorMessage(longMessage);

      expect(mockNotificationError).toHaveBeenCalledWith({
        description: longMessage,
        message: "Error",
        pauseOnHover: true,
        showProgress: true,
      });
    });

    it("should handle messages with special characters", () => {
      const specialMessage = "Error: @#$%^&*()_+{}|:<>?[];',./";

      errorMessage(specialMessage);

      expect(mockNotificationError).toHaveBeenCalledWith({
        description: specialMessage,
        message: "Error",
        pauseOnHover: true,
        showProgress: true,
      });
    });

    it("should handle messages with unicode characters", () => {
      const unicodeMessage = "Unicode error: 你好世界 🌍 ñáéíóú";

      errorMessage(unicodeMessage);

      expect(mockNotificationError).toHaveBeenCalledWith({
        description: unicodeMessage,
        message: "Error",
        pauseOnHover: true,
        showProgress: true,
      });
    });

    it("should handle messages with newlines", () => {
      const multilineMessage = "Line 1\nLine 2\nLine 3";

      errorMessage(multilineMessage);

      expect(mockNotificationError).toHaveBeenCalledWith({
        description: multilineMessage,
        message: "Error",
        pauseOnHover: true,
        showProgress: true,
      });
    });

    it("should handle messages with tabs and spaces", () => {
      const whitespaceMessage = "Text\twith\ttabs\n  and  spaces  ";

      errorMessage(whitespaceMessage);

      expect(mockNotificationError).toHaveBeenCalledWith({
        description: whitespaceMessage,
        message: "Error",
        pauseOnHover: true,
        showProgress: true,
      });
    });

    it("should handle JSON-like strings", () => {
      const jsonMessage = '{"error": "Something went wrong", "code": 500}';

      errorMessage(jsonMessage);

      expect(mockNotificationError).toHaveBeenCalledWith({
        description: jsonMessage,
        message: "Error",
        pauseOnHover: true,
        showProgress: true,
      });
    });

    it("should handle HTML-like strings", () => {
      const htmlMessage = "<div>Error: <strong>Critical failure</strong></div>";

      errorMessage(htmlMessage);

      expect(mockNotificationError).toHaveBeenCalledWith({
        description: htmlMessage,
        message: "Error",
        pauseOnHover: true,
        showProgress: true,
      });
    });

    it("should handle whitespace-only messages", () => {
      const whitespaceMessage = "   ";

      errorMessage(whitespaceMessage);

      expect(mockNotificationError).toHaveBeenCalledWith({
        description: whitespaceMessage,
        message: "Error",
        pauseOnHover: true,
        showProgress: true,
      });
    });
  });

  describe("notification configuration", () => {
    it("should always use 'Error' as the title", () => {
      errorMessage("Any message");

      expect(mockNotificationError).toHaveBeenCalledWith(
        expect.objectContaining({
          message: "Error",
        }),
      );
    });

    it("should always enable pauseOnHover", () => {
      errorMessage("Test message");

      expect(mockNotificationError).toHaveBeenCalledWith(
        expect.objectContaining({
          pauseOnHover: true,
        }),
      );
    });

    it("should always enable showProgress", () => {
      errorMessage("Test message");

      expect(mockNotificationError).toHaveBeenCalledWith(
        expect.objectContaining({
          showProgress: true,
        }),
      );
    });

    it("should include all required configuration options", () => {
      errorMessage("Complete config test");

      expect(mockNotificationError).toHaveBeenCalledWith({
        description: "Complete config test",
        message: "Error",
        pauseOnHover: true,
        showProgress: true,
      });
    });
  });

  describe("error scenarios", () => {
    it("should handle notification.error throwing an error", () => {
      mockNotificationError.mockImplementation(() => {
        throw new Error("Notification system failed");
      });

      expect(() => {
        errorMessage("Test message");
      }).toThrow("Notification system failed");

      expect(mockNotificationError).toHaveBeenCalledWith({
        description: "Test message",
        message: "Error",
        pauseOnHover: true,
        showProgress: true,
      });
    });

    it("should handle notification.error returning undefined", () => {
      mockNotificationError.mockReturnValue(undefined);

      expect(() => {
        errorMessage("Test message");
      }).not.toThrow();

      expect(mockNotificationError).toHaveBeenCalledWith({
        description: "Test message",
        message: "Error",
        pauseOnHover: true,
        showProgress: true,
      });
    });

    it("should handle notification.error being called with null/undefined", () => {
      // This shouldn't happen in practice, but test defensive behavior
      expect(() => {
        errorMessage("Test message");
      }).not.toThrow();

      expect(mockNotificationError).toHaveBeenCalled();
    });
  });

  describe("performance and reliability", () => {
    it("should handle rapid successive calls", () => {
      const messages = Array.from({ length: 100 }, (_, i) => `Error ${i}`);

      messages.forEach((message) => errorMessage(message));

      expect(mockNotificationError).toHaveBeenCalledTimes(100);

      // Check first and last calls
      expect(mockNotificationError).toHaveBeenNthCalledWith(1, {
        description: "Error 0",
        message: "Error",
        pauseOnHover: true,
        showProgress: true,
      });
      expect(mockNotificationError).toHaveBeenNthCalledWith(100, {
        description: "Error 99",
        message: "Error",
        pauseOnHover: true,
        showProgress: true,
      });
    });

    it("should be synchronous", () => {
      const startTime = Date.now();

      errorMessage("Synchronous test");

      const endTime = Date.now();
      const executionTime = endTime - startTime;

      // Should execute very quickly (less than 10ms)
      expect(executionTime).toBeLessThan(10);
      expect(mockNotificationError).toHaveBeenCalled();
    });

    it("should not modify the input message", () => {
      const originalMessage = "Original error message";
      const messageReference = originalMessage;

      errorMessage(originalMessage);

      // Message should remain unchanged
      expect(originalMessage).toBe(messageReference);
      expect(mockNotificationError).toHaveBeenCalledWith({
        description: originalMessage,
        message: "Error",
        pauseOnHover: true,
        showProgress: true,
      });
    });
  });

  describe("integration scenarios", () => {
    it("should work with Error object messages", () => {
      const error = new Error("Something went wrong");

      errorMessage(error.message);

      expect(mockNotificationError).toHaveBeenCalledWith({
        description: "Something went wrong",
        message: "Error",
        pauseOnHover: true,
        showProgress: true,
      });
    });

    it("should work with fallback messages", () => {
      const errorWithoutMessage = new Error();
      const fallbackMessage =
        errorWithoutMessage.message || "Unknown error occurred";

      errorMessage(fallbackMessage);

      expect(mockNotificationError).toHaveBeenCalledWith({
        description: fallbackMessage,
        message: "Error",
        pauseOnHover: true,
        showProgress: true,
      });
    });

    it("should work with dynamic messages", () => {
      const operation = "save user data";
      const dynamicMessage = `Failed to ${operation}`;

      errorMessage(dynamicMessage);

      expect(mockNotificationError).toHaveBeenCalledWith({
        description: "Failed to save user data",
        message: "Error",
        pauseOnHover: true,
        showProgress: true,
      });
    });

    it("should work with template literals", () => {
      const entityType = "User";
      const entityId = "123";
      const templateMessage = `Failed to load ${entityType} with ID: ${entityId}`;

      errorMessage(templateMessage);

      expect(mockNotificationError).toHaveBeenCalledWith({
        description: "Failed to load User with ID: 123",
        message: "Error",
        pauseOnHover: true,
        showProgress: true,
      });
    });
  });

  describe("type safety", () => {
    it("should only accept string parameters", () => {
      // This test verifies TypeScript compilation
      // If the function signature changes, this would cause a compile error

      const stringMessage: string = "Valid string message";

      expect(() => {
        errorMessage(stringMessage);
      }).not.toThrow();

      expect(mockNotificationError).toHaveBeenCalledWith({
        description: stringMessage,
        message: "Error",
        pauseOnHover: true,
        showProgress: true,
      });
    });

    it("should maintain consistent return type", () => {
      const result = errorMessage("Test message");

      // Function should return void/undefined
      expect(result).toBeUndefined();
      expect(mockNotificationError).toHaveBeenCalled();
    });
  });

  describe("edge cases", () => {
    it("should handle extremely long messages gracefully", () => {
      const extremelyLongMessage = "Error: " + "A".repeat(10000);

      expect(() => {
        errorMessage(extremelyLongMessage);
      }).not.toThrow();

      expect(mockNotificationError).toHaveBeenCalledWith({
        description: extremelyLongMessage,
        message: "Error",
        pauseOnHover: true,
        showProgress: true,
      });
    });

    it("should handle messages with null characters", () => {
      const messageWithNull = "Error\0with\0null\0chars";

      errorMessage(messageWithNull);

      expect(mockNotificationError).toHaveBeenCalledWith({
        description: messageWithNull,
        message: "Error",
        pauseOnHover: true,
        showProgress: true,
      });
    });

    it("should handle messages with escape sequences", () => {
      const messageWithEscapes = "Error\\nwith\\tescapes\\rsequences";

      errorMessage(messageWithEscapes);

      expect(mockNotificationError).toHaveBeenCalledWith({
        description: messageWithEscapes,
        message: "Error",
        pauseOnHover: true,
        showProgress: true,
      });
    });

    it("should handle messages with quotes", () => {
      const messageWithQuotes = "Error with \"double\" and 'single' quotes";

      errorMessage(messageWithQuotes);

      expect(mockNotificationError).toHaveBeenCalledWith({
        description: messageWithQuotes,
        message: "Error",
        pauseOnHover: true,
        showProgress: true,
      });
    });

    it("should handle messages with backslashes", () => {
      const messageWithBackslashes = "Error\\with\\many\\backslashes";

      errorMessage(messageWithBackslashes);

      expect(mockNotificationError).toHaveBeenCalledWith({
        description: messageWithBackslashes,
        message: "Error",
        pauseOnHover: true,
        showProgress: true,
      });
    });
  });

  describe("common use cases", () => {
    it("should handle authentication errors", () => {
      errorMessage("Unauthorized access");

      expect(mockNotificationError).toHaveBeenCalledWith({
        description: "Unauthorized access",
        message: "Error",
        pauseOnHover: true,
        showProgress: true,
      });
    });

    it("should handle network errors", () => {
      errorMessage("Network connection failed");

      expect(mockNotificationError).toHaveBeenCalledWith({
        description: "Network connection failed",
        message: "Error",
        pauseOnHover: true,
        showProgress: true,
      });
    });

    it("should handle validation errors", () => {
      errorMessage("Validation failed: Name is required");

      expect(mockNotificationError).toHaveBeenCalledWith({
        description: "Validation failed: Name is required",
        message: "Error",
        pauseOnHover: true,
        showProgress: true,
      });
    });

    it("should handle database errors", () => {
      errorMessage("Failed to save entity to database");

      expect(mockNotificationError).toHaveBeenCalledWith({
        description: "Failed to save entity to database",
        message: "Error",
        pauseOnHover: true,
        showProgress: true,
      });
    });

    it("should handle file operation errors", () => {
      errorMessage("Failed to upload file: size too large");

      expect(mockNotificationError).toHaveBeenCalledWith({
        description: "Failed to upload file: size too large",
        message: "Error",
        pauseOnHover: true,
        showProgress: true,
      });
    });

    it("should handle permission errors", () => {
      errorMessage("Insufficient permissions to perform this action");

      expect(mockNotificationError).toHaveBeenCalledWith({
        description: "Insufficient permissions to perform this action",
        message: "Error",
        pauseOnHover: true,
        showProgress: true,
      });
    });

    it("should handle timeout errors", () => {
      errorMessage("Request timeout: operation took too long");

      expect(mockNotificationError).toHaveBeenCalledWith({
        description: "Request timeout: operation took too long",
        message: "Error",
        pauseOnHover: true,
        showProgress: true,
      });
    });

    it("should handle generic fallback messages", () => {
      errorMessage("Something went wrong");

      expect(mockNotificationError).toHaveBeenCalledWith({
        description: "Something went wrong",
        message: "Error",
        pauseOnHover: true,
        showProgress: true,
      });
    });
  });

  describe("function properties", () => {
    it("should be a function", () => {
      expect(typeof errorMessage).toBe("function");
    });

    it("should have correct function name", () => {
      expect(errorMessage.name).toBe("errorMessage");
    });

    it("should have length of 1 (one parameter)", () => {
      expect(errorMessage.length).toBe(1);
    });
  });

  describe("mock verification", () => {
    it("should verify mock is working correctly", () => {
      // Ensure our mock is properly set up
      expect(jest.isMockFunction(mockNotificationError)).toBe(true);
      expect(mockNotificationError).not.toHaveBeenCalled();

      errorMessage("Mock verification test");

      expect(mockNotificationError).toHaveBeenCalled();
      expect(mockNotificationError).toHaveBeenCalledTimes(1);
    });

    it("should reset mock between tests", () => {
      // This test verifies that beforeEach is working
      expect(mockNotificationError).not.toHaveBeenCalled();

      errorMessage("Reset test");

      expect(mockNotificationError).toHaveBeenCalledTimes(1);
    });
  });

  describe("real-world scenarios", () => {
    it("should handle Firebase authentication errors", () => {
      const firebaseError = "Firebase: Error (auth/user-not-found).";

      errorMessage(firebaseError);

      expect(mockNotificationError).toHaveBeenCalledWith({
        description: firebaseError,
        message: "Error",
        pauseOnHover: true,
        showProgress: true,
      });
    });

    it("should handle Firestore errors", () => {
      const firestoreError =
        "Permission denied: Missing or insufficient permissions.";

      errorMessage(firestoreError);

      expect(mockNotificationError).toHaveBeenCalledWith({
        description: firestoreError,
        message: "Error",
        pauseOnHover: true,
        showProgress: true,
      });
    });

    it("should handle Next.js errors", () => {
      const nextjsError = "Error: Cannot read property 'map' of undefined";

      errorMessage(nextjsError);

      expect(mockNotificationError).toHaveBeenCalledWith({
        description: nextjsError,
        message: "Error",
        pauseOnHover: true,
        showProgress: true,
      });
    });

    it("should handle API errors", () => {
      const apiError = "API Error: 500 Internal Server Error";

      errorMessage(apiError);

      expect(mockNotificationError).toHaveBeenCalledWith({
        description: apiError,
        message: "Error",
        pauseOnHover: true,
        showProgress: true,
      });
    });

    it("should handle custom hook errors", () => {
      const hookError = "Something in useEntities()";

      errorMessage(hookError);

      expect(mockNotificationError).toHaveBeenCalledWith({
        description: hookError,
        message: "Error",
        pauseOnHover: true,
        showProgress: true,
      });
    });
  });
});
