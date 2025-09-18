import { renderHook } from "@testing-library/react";
import { useSession } from "next-auth/react";

import useUser from "../useUser";

// Mock next-auth
jest.mock("next-auth/react");

const mockUseSession = useSession as jest.MockedFunction<typeof useSession>;

describe("useUser", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should return authenticated user data when session is active", () => {
    const mockSessionData = {
      user: {
        admin: true,
        email: "john@example.com",
        image: "https://example.com/avatar.jpg",
        name: "John Doe",
      },
    };

    mockUseSession.mockReturnValue({
      data: mockSessionData,
      status: "authenticated",
    } as any);

    const { result } = renderHook(() => useUser());

    expect(result.current).toEqual({
      email: "john@example.com",
      iconURL: "https://example.com/avatar.jpg",
      isAdmin: true,
      isAuthenticated: true,
      userName: "John Doe",
    });
  });

  it("should return anonymous data when session is unauthenticated", () => {
    mockUseSession.mockReturnValue({
      data: null,
      status: "unauthenticated",
    } as any);

    const { result } = renderHook(() => useUser());

    expect(result.current).toEqual({
      email: null,
      iconURL: undefined,
      isAdmin: false,
      isAuthenticated: false,
      userName: "anonymous",
    });
  });

  it("should return anonymous data when session is loading", () => {
    mockUseSession.mockReturnValue({
      data: null,
      status: "loading",
    } as any);

    const { result } = renderHook(() => useUser());

    expect(result.current).toEqual({
      email: null,
      iconURL: undefined,
      isAdmin: false,
      isAuthenticated: false,
      userName: "anonymous",
    });
  });

  it("should handle user without name", () => {
    const mockSessionData = {
      user: {
        email: "user@example.com",
        image: "https://example.com/avatar.jpg",
        // No name property
      },
    };

    mockUseSession.mockReturnValue({
      data: mockSessionData,
      status: "authenticated",
    } as any);

    const { result } = renderHook(() => useUser());

    expect(result.current.userName).toBe("anonymous");
    expect(result.current.isAuthenticated).toBe(true);
    expect(result.current.email).toBe("user@example.com");
  });

  it("should handle user without email", () => {
    const mockSessionData = {
      user: {
        image: "https://example.com/avatar.jpg",
        name: "John Doe",
        // No email property
      },
    };

    mockUseSession.mockReturnValue({
      data: mockSessionData,
      status: "authenticated",
    } as any);

    const { result } = renderHook(() => useUser());

    expect(result.current.email).toBe(null);
    expect(result.current.isAuthenticated).toBe(true);
    expect(result.current.userName).toBe("John Doe");
  });

  it("should handle user without image", () => {
    const mockSessionData = {
      user: {
        email: "john@example.com",
        name: "John Doe",
        // No image property
      },
    };

    mockUseSession.mockReturnValue({
      data: mockSessionData,
      status: "authenticated",
    } as any);

    const { result } = renderHook(() => useUser());

    expect(result.current.iconURL).toBe(undefined);
    expect(result.current.isAuthenticated).toBe(true);
    expect(result.current.userName).toBe("John Doe");
  });

  it("should handle user without admin flag", () => {
    const mockSessionData = {
      user: {
        email: "john@example.com",
        image: "https://example.com/avatar.jpg",
        name: "John Doe",
        // No admin property
      },
    };

    mockUseSession.mockReturnValue({
      data: mockSessionData,
      status: "authenticated",
    } as any);

    const { result } = renderHook(() => useUser());

    expect(result.current.isAdmin).toBe(false);
    expect(result.current.isAuthenticated).toBe(true);
  });

  it("should handle user with admin: false", () => {
    const mockSessionData = {
      user: {
        admin: false,
        email: "user@example.com",
        image: "https://example.com/avatar.jpg",
        name: "Regular User",
      },
    };

    mockUseSession.mockReturnValue({
      data: mockSessionData,
      status: "authenticated",
    } as any);

    const { result } = renderHook(() => useUser());

    expect(result.current.isAdmin).toBe(false);
    expect(result.current.isAuthenticated).toBe(true);
  });

  it("should handle empty string values", () => {
    const mockSessionData = {
      user: {
        admin: false,
        email: "",
        image: "",
        name: "",
      },
    };

    mockUseSession.mockReturnValue({
      data: mockSessionData,
      status: "authenticated",
    } as any);

    const { result } = renderHook(() => useUser());

    expect(result.current.userName).toBe("anonymous"); // Empty name -> anonymous
    expect(result.current.email).toBe(null); // Empty email -> null
    expect(result.current.iconURL).toBe(undefined); // Empty image -> undefined
    expect(result.current.isAuthenticated).toBe(true);
  });

  it("should handle null user object", () => {
    const mockSessionData = {
      user: null,
    };

    mockUseSession.mockReturnValue({
      data: mockSessionData,
      status: "authenticated",
    } as any);

    const { result } = renderHook(() => useUser());

    expect(result.current).toEqual({
      email: null,
      iconURL: undefined,
      isAdmin: false,
      isAuthenticated: true,
      userName: "anonymous",
    });
  });

  it("should handle undefined user object", () => {
    const mockSessionData = {
      user: undefined,
    };

    mockUseSession.mockReturnValue({
      data: mockSessionData,
      status: "authenticated",
    } as any);

    const { result } = renderHook(() => useUser());

    expect(result.current).toEqual({
      email: null,
      iconURL: undefined,
      isAdmin: false,
      isAuthenticated: true,
      userName: "anonymous",
    });
  });

  it("should handle session data without user property", () => {
    const mockSessionData = {
      // No user property
      expires: "2024-12-31",
    };

    mockUseSession.mockReturnValue({
      data: mockSessionData,
      status: "authenticated",
    } as any);

    const { result } = renderHook(() => useUser());

    expect(result.current).toEqual({
      email: null,
      iconURL: undefined,
      isAdmin: false,
      isAuthenticated: true,
      userName: "anonymous",
    });
  });

  it("should handle different admin value types", () => {
    const adminValues = [
      { admin: true, expected: true },
      { admin: false, expected: false },
      { admin: 1, expected: true },
      { admin: 0, expected: false },
      { admin: "true", expected: true },
      { admin: "", expected: false },
      { admin: null, expected: false },
      { admin: undefined, expected: false },
    ];

    for (const { admin, expected } of adminValues) {
      const mockSessionData = {
        user: {
          admin,
          email: "test@example.com",
          name: "Test User",
        },
      };

      mockUseSession.mockReturnValue({
        data: mockSessionData,
        status: "authenticated",
      } as any);

      const { result } = renderHook(() => useUser());

      expect(result.current.isAdmin).toBe(expected);
      expect(result.current.isAuthenticated).toBe(true);
    }
  });

  it("should handle different session statuses", () => {
    const statuses = ["authenticated", "unauthenticated", "loading"];

    for (const status of statuses) {
      const mockSessionData =
        status === "authenticated"
          ? {
              user: {
                email: "test@example.com",
                name: "Test User",
              },
            }
          : null;

      mockUseSession.mockReturnValue({
        data: mockSessionData,
        status,
      } as any);

      const { result } = renderHook(() => useUser());

      const expectedAuthenticated = status === "authenticated";
      expect(result.current.isAuthenticated).toBe(expectedAuthenticated);

      if (expectedAuthenticated) {
        expect(result.current.userName).toBe("Test User");
        expect(result.current.email).toBe("test@example.com");
      } else {
        expect(result.current.userName).toBe("anonymous");
        expect(result.current.email).toBe(null);
      }
    }
  });

  it("should handle complex user data", () => {
    const mockSessionData = {
      user: {
        admin: true,
        email: "complex@example.com",
        // Additional properties that shouldn't affect the hook
        id: "user123",

        image: "https://example.com/complex-avatar.jpg",

        metadata: {
          createdAt: "2023-01-01",
          lastLogin: "2023-12-01",
        },
        name: "Complex User",
        provider: "google",
      },
    };

    mockUseSession.mockReturnValue({
      data: mockSessionData,
      status: "authenticated",
    } as any);

    const { result } = renderHook(() => useUser());

    expect(result.current).toEqual({
      email: "complex@example.com",
      iconURL: "https://example.com/complex-avatar.jpg",
      isAdmin: true,
      isAuthenticated: true,
      userName: "Complex User",
    });
  });

  it("should handle session data changes", () => {
    // Initial unauthenticated state
    mockUseSession.mockReturnValue({
      data: null,
      status: "unauthenticated",
    } as any);

    const { result, rerender } = renderHook(() => useUser());

    expect(result.current.isAuthenticated).toBe(false);
    expect(result.current.userName).toBe("anonymous");

    // Change to authenticated state
    const mockSessionData = {
      user: {
        email: "auth@example.com",
        name: "Authenticated User",
      },
    };

    mockUseSession.mockReturnValue({
      data: mockSessionData,
      status: "authenticated",
    } as any);

    rerender();

    expect(result.current.isAuthenticated).toBe(true);
    expect(result.current.userName).toBe("Authenticated User");
    expect(result.current.email).toBe("auth@example.com");
  });

  it("should handle special characters in user data", () => {
    const mockSessionData = {
      user: {
        admin: true,
        email: "іван.петренко@example.com",
        image: "https://example.com/avatar-with-спеціальні-символи.jpg",
        name: "Іван Петренко (Україна) 🇺🇦",
      },
    };

    mockUseSession.mockReturnValue({
      data: mockSessionData,
      status: "authenticated",
    } as any);

    const { result } = renderHook(() => useUser());

    expect(result.current.userName).toBe("Іван Петренко (Україна) 🇺🇦");
    expect(result.current.email).toBe("іван.петренко@example.com");
    expect(result.current.iconURL).toBe(
      "https://example.com/avatar-with-спеціальні-символи.jpg",
    );
  });

  it("should handle very long user data", () => {
    const longName = "Very ".repeat(100) + "Long Name";
    const longEmail =
      "very.long.email.address.with.many.dots@very-long-domain-name.example.com";
    const longImageUrl =
      "https://very-long-domain-name.example.com/path/to/very/long/image/url/with/many/segments/" +
      "segment/".repeat(50) +
      "image.jpg";

    const mockSessionData = {
      user: {
        admin: false,
        email: longEmail,
        image: longImageUrl,
        name: longName,
      },
    };

    mockUseSession.mockReturnValue({
      data: mockSessionData,
      status: "authenticated",
    } as any);

    const { result } = renderHook(() => useUser());

    expect(result.current.userName).toBe(longName);
    expect(result.current.email).toBe(longEmail);
    expect(result.current.iconURL).toBe(longImageUrl);
  });

  it("should handle numeric and boolean values in user data", () => {
    const mockSessionData = {
      user: {
        // Boolean image (invalid but should be handled)
        admin: "yes",

        // Numeric name
        email: true,
        // Boolean email (invalid but should be handled)
        image: false,

        name: 12345, // String admin value
      },
    };

    mockUseSession.mockReturnValue({
      data: mockSessionData,
      status: "authenticated",
    } as any);

    const { result } = renderHook(() => useUser());

    expect(result.current.userName).toBe(12345);
    expect(result.current.email).toBe(true);
    expect(result.current.iconURL).toBe(undefined); // false is falsy, so becomes undefined
    expect(result.current.isAdmin).toBe(true); // Truthy string
  });

  it("should handle null values in user data", () => {
    const mockSessionData = {
      user: {
        admin: null,
        email: null,
        image: null,
        name: null,
      },
    };

    mockUseSession.mockReturnValue({
      data: mockSessionData,
      status: "authenticated",
    } as any);

    const { result } = renderHook(() => useUser());

    expect(result.current.userName).toBe("anonymous");
    expect(result.current.email).toBe(null);
    expect(result.current.iconURL).toBe(undefined);
    expect(result.current.isAdmin).toBe(false);
  });

  it("should handle undefined values in user data", () => {
    const mockSessionData = {
      user: {
        admin: undefined,
        email: undefined,
        image: undefined,
        name: undefined,
      },
    };

    mockUseSession.mockReturnValue({
      data: mockSessionData,
      status: "authenticated",
    } as any);

    const { result } = renderHook(() => useUser());

    expect(result.current.userName).toBe("anonymous");
    expect(result.current.email).toBe(null);
    expect(result.current.iconURL).toBe(undefined);
    expect(result.current.isAdmin).toBe(false);
  });

  it("should return consistent object structure", () => {
    const testCases = [
      { data: null, status: "unauthenticated" },
      { data: null, status: "loading" },
      {
        data: { user: { email: "test@example.com", name: "Test" } },
        status: "authenticated",
      },
    ];

    for (const testCase of testCases) {
      mockUseSession.mockReturnValue(testCase as any);

      const { result } = renderHook(() => useUser());

      // Check that all expected properties exist
      expect(result.current).toHaveProperty("email");
      expect(result.current).toHaveProperty("iconURL");
      expect(result.current).toHaveProperty("isAdmin");
      expect(result.current).toHaveProperty("isAuthenticated");
      expect(result.current).toHaveProperty("userName");

      // Check that there are exactly 5 properties
      expect(Object.keys(result.current)).toHaveLength(5);
    }
  });

  it("should handle session data with extra properties", () => {
    const mockSessionData = {
      accessToken: "session-token",

      customSessionField: "session value",
      // Extra session properties
      expires: "2024-12-31",
      user: {
        accessToken: "token123",
        admin: true,

        customField: "custom value",

        email: "extra@example.com",

        // Extra properties
        id: "user123",
        image: "https://example.com/avatar.jpg",
        name: "User With Extra Props",
        provider: "google",
        refreshToken: "refresh123",
      },
    };

    mockUseSession.mockReturnValue({
      data: mockSessionData,
      status: "authenticated",
    } as any);

    const { result } = renderHook(() => useUser());

    // Should only return the 5 expected properties
    expect(result.current).toEqual({
      email: "extra@example.com",
      iconURL: "https://example.com/avatar.jpg",
      isAdmin: true,
      isAuthenticated: true,
      userName: "User With Extra Props",
    });
  });

  it("should handle useSession errors gracefully", () => {
    mockUseSession.mockImplementation(() => {
      throw new Error("Session error");
    });

    expect(() => {
      renderHook(() => useUser());
    }).toThrow("Session error");
  });

  it("should handle malformed session data", () => {
    const malformedData = "invalid-session-data";

    mockUseSession.mockReturnValue({
      data: malformedData,
      status: "authenticated",
    } as any);

    const { result } = renderHook(() => useUser());

    expect(result.current).toEqual({
      email: null,
      iconURL: undefined,
      isAdmin: false,
      isAuthenticated: true,
      userName: "anonymous",
    });
  });

  it("should handle session with array user data", () => {
    const arrayUserData = ["user1", "user2"];

    mockUseSession.mockReturnValue({
      data: { user: arrayUserData },
      status: "authenticated",
    } as any);

    const { result } = renderHook(() => useUser());

    expect(result.current).toEqual({
      email: null,
      iconURL: undefined,
      isAdmin: false,
      isAuthenticated: true,
      userName: "anonymous",
    });
  });

  it("should handle session with primitive user data", () => {
    const primitiveUserData = "just-a-string";

    mockUseSession.mockReturnValue({
      data: { user: primitiveUserData },
      status: "authenticated",
    } as any);

    const { result } = renderHook(() => useUser());

    expect(result.current).toEqual({
      email: null,
      iconURL: undefined,
      isAdmin: false,
      isAuthenticated: true,
      userName: "anonymous",
    });
  });
});
