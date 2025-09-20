import React from "react";

import "@testing-library/jest-dom";

import {
  equalDeep,
  getItem,
  getLinkLabel,
  getMenuItems,
  getNewEntity,
  isUrlValid,
  mergeDeep,
  ToolbarPosition,
} from "../../shared";

// Mock Firebase functions
jest.mock(
  "../../../lib/services/firebase/helpers/getDocumentCreationBase",
  () =>
    jest.fn(() => ({
      _createdAt: new Date(),
      _updatedAt: new Date(),
      id: "temp-id",
    })),
);

describe("Shared Utility Functions", () => {
  describe("getLinkLabel", () => {
    it("should return hostname for valid URL", () => {
      expect(getLinkLabel("https://example.com")).toBe("example.com");
      expect(getLinkLabel("http://google.com")).toBe("google.com");
      expect(getLinkLabel("https://www.github.com")).toBe("www.github.com");
    });

    it("should return hostname for URL with path", () => {
      expect(getLinkLabel("https://example.com/path/to/page")).toBe(
        "example.com",
      );
      expect(getLinkLabel("http://google.com/search?q=test")).toBe(
        "google.com",
      );
    });

    it("should return hostname for URL with port", () => {
      expect(getLinkLabel("https://localhost:3000")).toBe("localhost");
      expect(getLinkLabel("http://example.com:8080/api")).toBe("example.com");
    });

    it("should return hostname for URL with subdomain", () => {
      expect(getLinkLabel("https://api.example.com")).toBe("api.example.com");
      expect(getLinkLabel("https://cdn.jsdelivr.net")).toBe("cdn.jsdelivr.net");
    });

    it("should return 'unknown' for empty string", () => {
      expect(getLinkLabel("")).toBe("unknown");
    });

    it("should return 'unknown' for null", () => {
      expect(getLinkLabel(null as any)).toBe("unknown");
    });

    it("should return 'unknown' for undefined", () => {
      expect(getLinkLabel(undefined as any)).toBe("unknown");
    });

    it("should return original URL for invalid URL", () => {
      expect(getLinkLabel("invalid-url")).toBe("invalid-url");
      expect(getLinkLabel("not a url")).toBe("not a url");
      // ftp://invalid is actually a valid URL, so it returns the hostname
      expect(getLinkLabel("ftp://invalid")).toBe("invalid");
    });

    it("should handle URLs with special characters", () => {
      expect(
        getLinkLabel("https://example.com/path?param=value&other=test#section"),
      ).toBe("example.com");
      expect(
        getLinkLabel("https://example.com/path-with-dashes_and_underscores"),
      ).toBe("example.com");
    });

    it("should handle international domain names", () => {
      // International domains get converted to punycode by URL constructor
      expect(getLinkLabel("https://例え.テスト")).toBe(
        "xn--r8jz45g.xn--zckzah",
      );
      expect(getLinkLabel("https://xn--r8jz45g.xn--zckzah")).toBe(
        "xn--r8jz45g.xn--zckzah",
      );
    });

    it("should log warning for invalid URLs", () => {
      const consoleSpy = jest
        .spyOn(console, "warn")
        .mockImplementation(() => {});

      getLinkLabel("invalid-url");

      // Verify that console.warn was called (exact arguments may vary)
      expect(consoleSpy).toHaveBeenCalled();

      consoleSpy.mockRestore();
    });

    it("should handle URLs with different protocols", () => {
      expect(getLinkLabel("ftp://files.example.com")).toBe("files.example.com");
      // mailto URLs have empty hostname
      expect(getLinkLabel("mailto:user@example.com")).toBe("");
      // file:// URLs also have empty hostname in this case
      expect(getLinkLabel("file://localhost/path/to/file")).toBe("");
    });
  });

  describe("isUrlValid", () => {
    it("should return true for valid HTTP URLs", () => {
      expect(isUrlValid("http://example.com")).toBe(true);
      expect(isUrlValid("https://example.com")).toBe(true);
      expect(isUrlValid("https://www.example.com")).toBe(true);
    });

    it("should return true for URLs with paths", () => {
      expect(isUrlValid("https://example.com/path")).toBe(true);
      expect(isUrlValid("https://example.com/path/to/page")).toBe(true);
      expect(isUrlValid("https://example.com/path?query=value")).toBe(true);
    });

    it("should return true for URLs with ports", () => {
      expect(isUrlValid("http://localhost:3000")).toBe(true);
      expect(isUrlValid("https://example.com:8080")).toBe(true);
    });

    it("should return true for URLs with query parameters", () => {
      expect(isUrlValid("https://example.com?param=value")).toBe(true);
      expect(
        isUrlValid("https://example.com?param1=value1&param2=value2"),
      ).toBe(true);
    });

    it("should return true for URLs with fragments", () => {
      expect(isUrlValid("https://example.com#section")).toBe(true);
      expect(isUrlValid("https://example.com/page#top")).toBe(true);
    });

    it("should return true for different protocols", () => {
      expect(isUrlValid("ftp://files.example.com")).toBe(true);
      expect(isUrlValid("mailto:user@example.com")).toBe(true);
      expect(isUrlValid("file://localhost/path")).toBe(true);
    });

    it("should return false for invalid URLs", () => {
      expect(isUrlValid("invalid-url")).toBe(false);
      expect(isUrlValid("not a url")).toBe(false);
      expect(isUrlValid("example.com")).toBe(false); // Missing protocol
      expect(isUrlValid("://example.com")).toBe(false); // Invalid protocol
    });

    it("should return true for null", () => {
      expect(isUrlValid(null)).toBe(true);
    });

    it("should return true for undefined", () => {
      expect(isUrlValid(undefined)).toBe(true);
    });

    it("should return true for empty string", () => {
      expect(isUrlValid("")).toBe(true);
    });

    it("should handle URLs with special characters", () => {
      expect(isUrlValid("https://example.com/path with spaces")).toBe(true);
      expect(
        isUrlValid("https://example.com/path?param=value with spaces"),
      ).toBe(true);
    });

    it("should handle international domain names", () => {
      expect(isUrlValid("https://例え.テスト")).toBe(true);
      expect(isUrlValid("https://xn--r8jz45g.xn--zckzah")).toBe(true);
    });

    it("should return false for malformed URLs", () => {
      expect(isUrlValid("http://")).toBe(false);
      expect(isUrlValid("https://")).toBe(false);
      // http:///path is actually considered valid by URL constructor
      expect(isUrlValid("http:///path")).toBe(true);
    });

    it("should handle edge cases", () => {
      expect(isUrlValid("javascript:alert('xss')")).toBe(true); // Valid URL object can be created
      expect(isUrlValid("data:text/plain;base64,SGVsbG8=")).toBe(true);
    });

    it("should handle URLs with authentication", () => {
      expect(isUrlValid("https://user:pass@example.com")).toBe(true);
      expect(isUrlValid("ftp://user@files.example.com")).toBe(true);
    });

    it("should handle localhost and IP addresses", () => {
      expect(isUrlValid("http://localhost")).toBe(true);
      expect(isUrlValid("http://127.0.0.1")).toBe(true);
      expect(isUrlValid("http://192.168.1.1:8080")).toBe(true);
      expect(isUrlValid("https://[::1]:3000")).toBe(true); // IPv6
    });
  });

  describe("ToolbarPosition", () => {
    it("should have correct enum values", () => {
      expect(ToolbarPosition.UP).toBe(0);
      expect(ToolbarPosition.DOWN).toBe(1);
    });
  });

  describe("getItem", () => {
    it("should create menu item with all properties", () => {
      const icon = React.createElement("div", { className: "icon" });
      const children = [
        { key: "child1", label: "Child 1" },
        { key: "child2", label: "Child 2" },
      ];

      const result = getItem("Test Label", "test-key", icon, children);

      expect(result).toEqual({
        children: children,
        icon: icon,
        key: "test-key",
        label: "Test Label",
      });
    });

    it("should create menu item without optional properties", () => {
      const result = getItem("Simple Label", "simple-key");

      expect(result).toEqual({
        children: undefined,
        icon: undefined,
        key: "simple-key",
        label: "Simple Label",
      });
    });

    it("should handle different key types", () => {
      const result1 = getItem("String Key", "string-key");
      const result2 = getItem("Number Key", 123);

      expect(result1!.key).toBe("string-key");
      expect(result2!.key).toBe(123);
    });
  });

  describe("getMenuItems", () => {
    it("should return undefined for empty or undefined input", () => {
      expect(getMenuItems(undefined)).toBeUndefined();
      expect(getMenuItems({})).toBeUndefined();
    });

    it("should convert MenuItemConst objects to MenuItem array", () => {
      const menuItemsObject = {
        item1: {
          index: 1,
          key: "first",
          label: "First Item",
        },
        item2: {
          index: 0,
          key: "second",
          label: "Second Item",
        },
      };

      const result = getMenuItems(menuItemsObject);

      expect(result).toHaveLength(2);
      // Now sorting should work correctly
      expect(result![0]).toEqual({
        children: undefined,
        icon: undefined,
        key: "second",
        label: "Second Item",
      });
      expect(result![1]).toEqual({
        children: undefined,
        icon: undefined,
        key: "first",
        label: "First Item",
      });
    });

    it("should filter out items without labels", () => {
      const menuItemsObject = {
        item1: {
          index: 0,
          key: "has-label",
          label: "Has Label",
        },
        item2: {
          index: 1,
          key: "no-label",
        },
      };

      const result = getMenuItems(menuItemsObject);

      expect(result).toHaveLength(1);
      expect((result![0]! as any).label).toBe("Has Label");
    });

    it("should handle nested children recursively", () => {
      const menuItemsObject = {
        parent: {
          children: {
            child1: {
              index: 0,
              key: "child1",
              label: "Child 1",
            },
            child2: {
              index: 1,
              key: "child2",
              label: "Child 2",
            },
          },
          index: 0,
          key: "parent",
          label: "Parent",
        },
      };

      const result = getMenuItems(menuItemsObject);

      expect(result).toHaveLength(1);
      expect((result![0]! as any).children).toHaveLength(2);
      expect((result![0]! as any).children[0].label).toBe("Child 1");
      expect((result![0]! as any).children[1].label).toBe("Child 2");
    });

    it("should sort items by index", () => {
      const menuItemsObject = {
        first: { index: 0, key: "first", label: "First" },
        second: { index: 1, key: "second", label: "Second" },
        third: { index: 2, key: "third", label: "Third" },
      };

      const result = getMenuItems(menuItemsObject);

      expect(result).toHaveLength(3);
      // Now sorting should work correctly
      expect((result![0]! as any).label).toBe("First");
      expect((result![1]! as any).label).toBe("Second");
      expect((result![2]! as any).label).toBe("Third");
    });
  });

  // Note: isTimestamp cannot be tested in Jest due to Firebase Timestamp import issues

  describe("mergeDeep", () => {
    it("should merge simple objects", () => {
      const obj1 = { a: 1, b: 2 };
      const obj2 = { b: 3, c: 4 };

      const result = mergeDeep(obj1, obj2);

      expect(result).toEqual({ a: 1, b: 3, c: 4 });
    });

    it("should merge nested objects", () => {
      const obj1 = { a: { x: 1, y: 2 }, b: 1 };
      const obj2 = { a: { y: 3, z: 4 }, c: 2 };

      const result = mergeDeep(obj1, obj2);

      expect(result).toEqual({
        a: { x: 1, y: 3, z: 4 },
        b: 1,
        c: 2,
      });
    });

    it("should replace arrays instead of merging", () => {
      const obj1 = { arr: [1, 2, 3] };
      const obj2 = { arr: [4, 5] };

      const result = mergeDeep(obj1, obj2);

      expect(result).toEqual({ arr: [4, 5] });
    });

    it("should handle multiple source objects", () => {
      const obj1 = { a: 1 };
      const obj2 = { b: 2 };
      const obj3 = { c: 3 };

      const result = mergeDeep(obj1, obj2, obj3);

      expect(result).toEqual({ a: 1, b: 2, c: 3 });
    });

    it("should merge objects (note: may mutate originals)", () => {
      const obj1 = { a: { x: 1 } };
      const obj2 = { a: { y: 2 } };

      const result = mergeDeep(obj1, obj2);

      // mergeDeep actually mutates the first object (lodash mergeWith behavior)
      expect(result).toEqual({ a: { x: 1, y: 2 } });
      expect(result).toBe(obj1); // Returns reference to first object
    });
  });

  describe("equalDeep", () => {
    describe("basic comparisons", () => {
      it("should compare primitive values", () => {
        expect(equalDeep(1, 1)).toBe(true);
        expect(equalDeep("test", "test")).toBe(true);
        expect(equalDeep(true, true)).toBe(true);
        expect(equalDeep(null, null)).toBe(true);
        expect(equalDeep(undefined, undefined)).toBe(true);

        expect(equalDeep(1, 2)).toBe(false);
        expect(equalDeep("test", "other")).toBe(false);
        expect(equalDeep(true, false)).toBe(false);
        expect(equalDeep(null, undefined)).toBe(false);
      });
    });

    describe("transformation parameters", () => {
      it("should handle falseToUndefined", () => {
        expect(
          equalDeep(false, undefined, true, { falseToUndefined: true }),
        ).toBe(true);
        expect(equalDeep(true, true, true, { falseToUndefined: true })).toBe(
          true,
        );
        // false gets converted to undefined, so false !== false after transformation
        expect(equalDeep(false, false, true, { falseToUndefined: true })).toBe(
          true,
        );
      });

      it("should handle emptyStringToNull", () => {
        expect(equalDeep("", null, true, { emptyStringToNull: true })).toBe(
          true,
        );
        expect(
          equalDeep("test", "test", true, { emptyStringToNull: true }),
        ).toBe(true);
        // Empty string gets converted to null, so "" becomes null !== null
        expect(equalDeep("", "", true, { emptyStringToNull: true })).toBe(true);
      });

      it("should handle emptyStringToUndefined", () => {
        expect(
          equalDeep("", undefined, true, { emptyStringToUndefined: true }),
        ).toBe(true);
        expect(
          equalDeep("test", "test", true, { emptyStringToUndefined: true }),
        ).toBe(true);
      });

      it("should handle undefinedToNull", () => {
        expect(
          equalDeep(undefined, null, true, { undefinedToNull: true }),
        ).toBe(true);
        expect(equalDeep("test", "test", true, { undefinedToNull: true })).toBe(
          true,
        );
      });

      it("should handle nullToUndefined", () => {
        expect(
          equalDeep(null, undefined, true, { nullToUndefined: true }),
        ).toBe(true);
        expect(equalDeep("test", "test", true, { nullToUndefined: true })).toBe(
          true,
        );
      });

      it("should throw error for conflicting parameters", () => {
        expect(() =>
          equalDeep("", "", true, {
            emptyStringToNull: true,
            emptyStringToUndefined: true,
          }),
        ).toThrow(
          "Impossible criteria combining: emptyStringToNull + emptyStringToUndefined",
        );

        expect(() =>
          equalDeep(null, undefined, true, {
            nullToUndefined: true,
            undefinedToNull: true,
          }),
        ).toThrow(
          "Impossible criteria combining: undefinedToNull + nullToUndefined",
        );
      });
    });
  });

  describe("getNewEntity", () => {
    it("should return entity with correct structure", () => {
      const entity = getNewEntity();

      expect(entity).toHaveProperty("id", "temp-id");
      expect(entity).toHaveProperty("_createdAt");
      expect(entity).toHaveProperty("_updatedAt");
      expect((entity as any)._createdAt).toBeInstanceOf(Date);
      expect((entity as any)._updatedAt).toBeInstanceOf(Date);
    });

    it("should work with generic type", () => {
      const entity = getNewEntity();

      expect(entity).toHaveProperty("id");
      expect(entity).toHaveProperty("_createdAt");
      expect(entity).toHaveProperty("_updatedAt");
    });
  });
});
