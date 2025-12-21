// Mock Firebase dependencies first
jest.mock("firebase/firestore", () => ({
  collection: jest.fn(),
  doc: jest.fn(),
  getDoc: jest.fn(),
  getDocs: jest.fn(),
  getFirestore: jest.fn(),
  limit: jest.fn(),
  orderBy: jest.fn(),
  query: jest.fn(),
  where: jest.fn(),
}));

jest.mock("@/components/firebase/app", () => ({
  default: {},
}));

jest.mock("@/app/lib/services/firebase/utils/firestore", () => ({
  default: {},
}));

// Mock Ant Design patch
jest.mock("@ant-design/v5-patch-for-react-19", () => ({}));

import Source from "../index";
import SourceEdit from "../SourceEdit";
import SourceView from "../SourceView";

describe("Source index", () => {
  describe("exports", () => {
    it("should export Source object with Edit and View components", () => {
      expect(Source).toBeDefined();
      expect(typeof Source).toBe("object");
    });

    it("should export Edit component", () => {
      expect(Source.Edit).toBeDefined();
      expect(Source.Edit).toBe(SourceEdit);
    });

    it("should export View component", () => {
      expect(Source.View).toBeDefined();
      expect(Source.View).toBe(SourceView);
    });

    it("should have exactly two properties", () => {
      const keys = Object.keys(Source);
      expect(keys).toHaveLength(2);
      expect(keys).toContain("Edit");
      expect(keys).toContain("View");
    });
  });

  describe("component types", () => {
    it("should export Edit as a React component", () => {
      expect(typeof Source.Edit).toBe("function");
      expect(Source.Edit.name).toBe("SourceEdit");
    });

    it("should export View as a React component", () => {
      // memo components are objects, not functions
      expect(typeof Source.View).toBe("object");
      expect(Source.View.$$typeof.toString()).toContain("react.memo");
    });
  });

  describe("module structure", () => {
    it("should be importable without errors", async () => {
      const ImportedSource = await import("../index");
      expect(ImportedSource.default).toBeDefined();
    });

    it("should maintain consistent interface", () => {
      // Verify the structure matches expected interface
      const expectedStructure = {
        Edit: expect.any(Function),
        View: expect.any(Object), // memo components are objects
      };

      expect(Source).toMatchObject(expectedStructure);
    });
  });
});
