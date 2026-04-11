import React from "react";
import { render, screen } from "@testing-library/react";

import { Source } from "@/app/lib/definitions";

import "@testing-library/jest-dom";

import SourceView from "../SourceView";

// Mock Ant Design patch
jest.mock("@ant-design/v5-patch-for-react-19", () => ({}));

// Mock Ant Design components
jest.mock("antd", () => ({
  Flex: ({ children, vertical, justify, className, style }: any) => (
    <div
      data-testid="ant-flex"
      data-vertical={vertical}
      data-justify={justify}
      className={className}
      style={style}
    >
      {children}
    </div>
  ),
  Row: ({ children, style }: any) => (
    <div data-testid="ant-row" style={style}>
      {children}
    </div>
  ),
  Typography: {
    Title: ({ children, level, ...props }: any) => (
      <div data-testid={`ant-title-${level}`} {...props}>
        {children}
      </div>
    ),
  },
  theme: {
    useToken: () => ({
      token: {
        borderRadiusLG: "8px",
        colorTextPlaceholder: "#bfbfbf",
        colorTextSecondary: "#666666",
        colorTextTertiary: "#999999",
      },
    }),
  },
}));

// Mock Heroicons
jest.mock("@heroicons/react/24/outline", () => ({
  BookOpenIcon: ({ className, style }: any) => (
    <div data-testid="book-open-icon" className={className} style={style}>
      📖
    </div>
  ),
}));

// Mock ReferenceCounter
jest.mock("@/app/ui/shared/CrudReferenceCounter", () => {
  const MockReferenceCounter = ({ entity, collectionName, viewOnly }: any) => {
    return (
      <div data-testid="reference-counter">
        <span data-testid="entity-id">{entity._id}</span>
        <span data-testid="collection-name">{collectionName}</span>
        <span data-testid="view-only">{viewOnly ? "true" : "false"}</span>
        <span data-testid="reference-count">
          {Object.keys(entity.references || {}).length} references
        </span>
      </div>
    );
  };
  MockReferenceCounter.displayName = "MockReferenceCounter";
  return MockReferenceCounter;
});

// Mock Links component
jest.mock("@/app/ui/shared/Links", () => ({
  View: ({ urls }: any) => (
    <div data-testid="links-view">
      {urls?.map((url: string, index: number) => (
        <a key={index} href={url} data-testid={`link-${index}`}>
          {url}
        </a>
      ))}
    </div>
  ),
}));

// Mock definitions
jest.mock("@/app/lib/definitions", () => ({
  CollectionRegistry: {
    Source: "SOURCES",
  },
}));

describe("SourceView", () => {
  const mockSource: Source = {
    _createdAt: { nanoseconds: 0, seconds: 1672531200 } as any,
    _createdBy: "user-123",
    _id: "source-123",
    _isUpdated: false,
    _updatedAt: { nanoseconds: 0, seconds: 1672617600 } as any,
    _updatedBy: "user-123",
    authors: "John Doe, Jane Smith",
    description: "A comprehensive test source for unit testing",
    name: "Test Source",
    references: {
      "ref-1": { name: "PROFILES" } as any,
      "ref-2": { name: "WEAPONS" } as any,
    },
    status: "active",
    systemId: "system-123",
    type: "rulebook",
    urls: ["https://example.com", "https://test.com"],
    version: "2.0",
    year: 2023,
  };

  describe("Basic Rendering", () => {
    it("should render without crashing", () => {
      render(<SourceView entity={mockSource} />);

      expect(screen.getByTestId("ant-row")).toBeInTheDocument();
    });

    it("should display source name", () => {
      render(<SourceView entity={mockSource} />);

      expect(screen.getByTestId("ant-title-3")).toHaveTextContent(
        "Test Source",
      );
    });

    it("should display authors when provided", () => {
      render(<SourceView entity={mockSource} />);

      expect(screen.getByText("by John Doe, Jane Smith")).toBeInTheDocument();
    });

    it("should not display authors section when authors is undefined", () => {
      const sourceWithoutAuthors = { ...mockSource, authors: undefined };
      render(<SourceView entity={sourceWithoutAuthors} />);

      expect(screen.queryByText(/^by /)).not.toBeInTheDocument();
    });

    it("should display source type, version, and year", () => {
      render(<SourceView entity={mockSource} />);

      expect(screen.getByText("rulebook")).toBeInTheDocument();
      expect(screen.getByText("v2.0")).toBeInTheDocument();
      expect(screen.getByText("2023")).toBeInTheDocument();
    });

    it("should display description when provided", () => {
      render(<SourceView entity={mockSource} />);

      expect(
        screen.getByText("A comprehensive test source for unit testing"),
      ).toBeInTheDocument();
    });

    it("should not display description section when description is undefined", () => {
      const sourceWithoutDescription = {
        ...mockSource,
        description: undefined,
      };
      render(<SourceView entity={sourceWithoutDescription} />);

      expect(
        screen.queryByText("A comprehensive test source for unit testing"),
      ).not.toBeInTheDocument();
    });
  });

  describe("Icon and Visual Elements", () => {
    it("should render BookOpenIcon", () => {
      render(<SourceView entity={mockSource} />);

      const icon = screen.getByTestId("book-open-icon");
      expect(icon).toBeInTheDocument();
      expect(icon).toHaveClass("w-30");
    });

    it("should apply correct styling to icon", () => {
      render(<SourceView entity={mockSource} />);

      const icon = screen.getByTestId("book-open-icon");
      expect(icon).toHaveStyle({ color: "#bfbfbf" });
    });
  });

  describe("ReferenceCounter Integration", () => {
    it("should render ReferenceCounter with correct props", () => {
      render(<SourceView entity={mockSource} />);

      expect(screen.getByTestId("reference-counter")).toBeInTheDocument();
      expect(screen.getByTestId("entity-id")).toHaveTextContent("source-123");
      expect(screen.getByTestId("collection-name")).toHaveTextContent(
        "SOURCES",
      );
      expect(screen.getByTestId("reference-count")).toHaveTextContent(
        "2 references",
      );
    });

    it("should pass viewOnly=false by default (editMode=false)", () => {
      render(<SourceView entity={mockSource} />);

      expect(screen.getByTestId("view-only")).toHaveTextContent("false");
    });

    it("should pass viewOnly=true when editMode=true", () => {
      render(<SourceView entity={mockSource} editMode={true} />);

      expect(screen.getByTestId("view-only")).toHaveTextContent("true");
    });

    it("should handle entity without references", () => {
      const sourceWithoutReferences = { ...mockSource, references: undefined };
      render(<SourceView entity={sourceWithoutReferences} />);

      expect(screen.getByTestId("reference-count")).toHaveTextContent(
        "0 references",
      );
    });
  });

  describe("Links Integration", () => {
    it("should render Links.View component with URLs", () => {
      render(<SourceView entity={mockSource} />);

      expect(screen.getByTestId("links-view")).toBeInTheDocument();
      expect(screen.getByTestId("link-0")).toHaveAttribute(
        "href",
        "https://example.com",
      );
      expect(screen.getByTestId("link-1")).toHaveAttribute(
        "href",
        "https://test.com",
      );
    });

    it("should handle entity without URLs", () => {
      const sourceWithoutUrls = { ...mockSource, urls: undefined };
      render(<SourceView entity={sourceWithoutUrls} />);

      expect(screen.getByTestId("links-view")).toBeInTheDocument();
      expect(screen.queryByTestId("link-0")).not.toBeInTheDocument();
    });

    it("should handle empty URLs array", () => {
      const sourceWithEmptyUrls = { ...mockSource, urls: [] };
      render(<SourceView entity={sourceWithEmptyUrls} />);

      expect(screen.getByTestId("links-view")).toBeInTheDocument();
      expect(screen.queryByTestId("link-0")).not.toBeInTheDocument();
    });
  });

  describe("EditMode Functionality", () => {
    it("should default editMode to false", () => {
      render(<SourceView entity={mockSource} />);

      expect(screen.getByTestId("view-only")).toHaveTextContent("false");
    });

    it("should accept editMode=false explicitly", () => {
      render(<SourceView entity={mockSource} editMode={false} />);

      expect(screen.getByTestId("view-only")).toHaveTextContent("false");
    });

    it("should accept editMode=true", () => {
      render(<SourceView entity={mockSource} editMode={true} />);

      expect(screen.getByTestId("view-only")).toHaveTextContent("true");
    });
  });

  describe("Layout and Structure", () => {
    it("should have proper layout structure", () => {
      render(<SourceView entity={mockSource} />);

      // Check main container
      expect(screen.getByTestId("ant-row")).toBeInTheDocument();

      // Check flex containers
      const flexContainers = screen.getAllByTestId("ant-flex");
      expect(flexContainers.length).toBeGreaterThan(0);
    });

    it("should apply correct CSS classes", () => {
      render(<SourceView entity={mockSource} />);

      const flexContainers = screen.getAllByTestId("ant-flex");
      const mainFlex = flexContainers.find((el) =>
        el.className?.includes("w-full"),
      );
      expect(mainFlex).toBeInTheDocument();
    });
  });

  describe("Memoization", () => {
    it("should be memoized component", () => {
      expect(SourceView.displayName).toBeUndefined();
      expect(typeof SourceView).toBe("object");
    });

    it("should render updated content when props change", () => {
      const { rerender } = render(<SourceView entity={mockSource} />);

      expect(screen.getByTestId("ant-title-3")).toHaveTextContent(
        "Test Source",
      );

      const updatedSource = {
        ...mockSource,
        _id: "different-id",
        name: "Updated Name",
      };
      rerender(<SourceView entity={updatedSource} />);

      expect(screen.getByTestId("ant-title-3")).toHaveTextContent(
        "Updated Name",
      );
    });

    it("should re-render when entity.references changes with same _id", () => {
      const sourceWithOneRef = {
        ...mockSource,
        references: { "ref-1": { name: "PROFILES" } as any },
      };

      const { rerender } = render(<SourceView entity={sourceWithOneRef} />);

      expect(screen.getByTestId("reference-count")).toHaveTextContent(
        "1 references",
      );

      const sourceWithTwoRefs = {
        ...mockSource,
        references: {
          "ref-1": { name: "PROFILES" } as any,
          "ref-2": { name: "WEAPONS" } as any,
        },
      };
      rerender(<SourceView entity={sourceWithTwoRefs} />);

      expect(screen.getByTestId("reference-count")).toHaveTextContent(
        "2 references",
      );
    });

    it("should not re-render when only name changes with same _id and references", () => {
      const entity1 = { ...mockSource, name: "Original Name" };

      const { rerender } = render(<SourceView entity={entity1} />);

      expect(screen.getByTestId("ant-title-3")).toHaveTextContent(
        "Original Name",
      );

      const entity2 = { ...mockSource, name: "Changed Name" };
      rerender(<SourceView entity={entity2} />);

      expect(screen.getByTestId("ant-title-3")).toHaveTextContent(
        "Original Name",
      );
    });
  });

  describe("Edge Cases", () => {
    it("should handle minimal source data", () => {
      const minimalSource: Source = {
        _createdAt: { nanoseconds: 0, seconds: Date.now() / 1000 } as any,
        _createdBy: "user-123",
        _id: "minimal-123",
        _isUpdated: false,
        _updatedAt: { nanoseconds: 0, seconds: Date.now() / 1000 } as any,
        _updatedBy: "user-123",
        name: "Minimal Source",
        status: "active",
        systemId: "system-123",
        type: "rulebook",
        version: "1.0",
        year: 2023,
      };

      render(<SourceView entity={minimalSource} />);

      expect(screen.getByTestId("ant-title-3")).toHaveTextContent(
        "Minimal Source",
      );
      expect(screen.getByText("rulebook")).toBeInTheDocument();
      expect(screen.getByText("2023")).toBeInTheDocument();
    });

    it("should handle empty strings gracefully", () => {
      const sourceWithEmptyStrings = {
        ...mockSource,
        authors: "",
        description: "",
        version: "",
      };

      render(<SourceView entity={sourceWithEmptyStrings} />);

      expect(screen.getByTestId("ant-title-3")).toHaveTextContent(
        "Test Source",
      );
      expect(screen.queryByText(/^by /)).not.toBeInTheDocument();
    });

    it("should handle very long text content", () => {
      const longDescription = "A".repeat(1000);
      const sourceWithLongContent = {
        ...mockSource,
        description: longDescription,
        name: "Very Long Source Name That Exceeds Normal Length",
      };

      render(<SourceView entity={sourceWithLongContent} />);

      expect(screen.getByText(longDescription)).toBeInTheDocument();
      expect(screen.getByTestId("ant-title-3")).toHaveTextContent(
        "Very Long Source Name That Exceeds Normal Length",
      );
    });
  });

  describe("Accessibility", () => {
    it("should have proper semantic structure", () => {
      render(<SourceView entity={mockSource} />);

      // Check that title is rendered with proper heading level
      expect(screen.getByTestId("ant-title-3")).toBeInTheDocument();
    });

    it("should have accessible links", () => {
      render(<SourceView entity={mockSource} />);

      const links = screen.getAllByRole("link");
      links.forEach((link) => {
        expect(link).toHaveAttribute("href");
      });
    });
  });
});
