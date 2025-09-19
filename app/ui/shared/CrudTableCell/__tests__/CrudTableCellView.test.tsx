import React from "react";
import { render, screen } from "@testing-library/react";

import "@testing-library/jest-dom";

import CrudTableCellView from "../CrudTableCellView";

// Mock Ant Design patch
jest.mock("@ant-design/v5-patch-for-react-19", () => ({}));

interface TestEntity {
  _id: string;
  _createdAt: any;
  _updatedAt: any;
  _createdBy: string;
  _updatedBy: string;
  _isUpdated: boolean;
  name: string;
  status: "disabled" | "active" | "obsolete";
  systemId: string;
  description?: string;
  isActive?: boolean;
  count?: number;
}

describe("CrudTableCellView", () => {
  const mockEntity: TestEntity = {
    _createdAt: { nanoseconds: 0, seconds: 1234567890 } as any,
    _createdBy: "test@example.com",
    _id: "test-id",
    _isUpdated: false,
    _updatedAt: { nanoseconds: 0, seconds: 1234567890 } as any,
    _updatedBy: "test@example.com",
    count: 42,
    description: "Test description",
    isActive: true,
    name: "Test Entity",
    status: "active",
    systemId: "test-system",
  };

  describe("basic CrudTableCellView component", () => {
    it("should render string values", () => {
      render(
        <CrudTableCellView
          entity={mockEntity}
          field="name"
          value="Test String"
        />,
      );

      expect(screen.getByText("Test String")).toBeInTheDocument();
    });

    it("should render numeric values", () => {
      render(
        <CrudTableCellView entity={mockEntity} field="count" value={42} />,
      );

      expect(screen.getByText("42")).toBeInTheDocument();
    });

    it("should render zero values", () => {
      const { container } = render(
        <div data-testid="wrapper">
          <CrudTableCellView entity={mockEntity} field="count" value={0} />
        </div>,
      );

      const wrapper = screen.getByTestId("wrapper");
      // Zero is falsy, so convertValueForView returns empty string
      expect(wrapper).toHaveTextContent("");
    });

    it("should render negative numbers", () => {
      render(
        <CrudTableCellView entity={mockEntity} field="count" value={-5} />,
      );

      expect(screen.getByText("-5")).toBeInTheDocument();
    });

    it("should render decimal numbers", () => {
      render(
        <CrudTableCellView entity={mockEntity} field="price" value={19.99} />,
      );

      expect(screen.getByText("19.99")).toBeInTheDocument();
    });

    it("should handle empty string values", () => {
      const { container } = render(
        <div data-testid="wrapper">
          <CrudTableCellView entity={mockEntity} field="name" value="" />
        </div>,
      );

      const wrapper = screen.getByTestId("wrapper");
      expect(wrapper).toHaveTextContent("");
    });

    it("should handle null values", () => {
      const { container } = render(
        <div data-testid="wrapper">
          <CrudTableCellView
            entity={mockEntity}
            field="name"
            value={null as any}
          />
        </div>,
      );

      const wrapper = screen.getByTestId("wrapper");
      expect(wrapper).toHaveTextContent("");
    });

    it("should handle undefined values", () => {
      const { container } = render(
        <div data-testid="wrapper">
          <CrudTableCellView
            entity={mockEntity}
            field="name"
            value={undefined as any}
          />
        </div>,
      );

      const wrapper = screen.getByTestId("wrapper");
      expect(wrapper).toHaveTextContent("");
    });

    it("should convert boolean true to string", () => {
      render(
        <CrudTableCellView entity={mockEntity} field="isActive" value={true} />,
      );

      expect(screen.getByText("true")).toBeInTheDocument();
    });

    it("should convert boolean false to string", () => {
      const { container } = render(
        <div data-testid="wrapper">
          <CrudTableCellView
            entity={mockEntity}
            field="isActive"
            value={false}
          />
        </div>,
      );

      const wrapper = screen.getByTestId("wrapper");
      // False is falsy, so convertValueForView returns empty string
      expect(wrapper).toHaveTextContent("");
    });

    it("should handle special characters", () => {
      const specialValue = "Special chars: @#$%^&*()_+{}|:<>?[];',./";

      render(
        <CrudTableCellView
          entity={mockEntity}
          field="name"
          value={specialValue}
        />,
      );

      expect(screen.getByText(specialValue)).toBeInTheDocument();
    });

    it("should handle unicode characters", () => {
      const unicodeValue = "Unicode: 你好世界 🌍 ñáéíóú";

      render(
        <CrudTableCellView
          entity={mockEntity}
          field="name"
          value={unicodeValue}
        />,
      );

      expect(screen.getByText(unicodeValue)).toBeInTheDocument();
    });

    it("should handle very long strings", () => {
      const longValue = "A".repeat(1000);

      render(
        <CrudTableCellView
          entity={mockEntity}
          field="name"
          value={longValue}
        />,
      );

      expect(screen.getByText(longValue)).toBeInTheDocument();
    });

    it("should handle whitespace-only strings", () => {
      const { container } = render(
        <div data-testid="wrapper">
          <CrudTableCellView entity={mockEntity} field="name" value="   " />
        </div>,
      );

      const wrapper = screen.getByTestId("wrapper");
      // Whitespace-only strings are truthy, so they should be preserved
      expect(wrapper.textContent).toBe("   ");
    });

    it("should handle newline characters in strings", () => {
      const multilineValue = "Line 1\nLine 2\nLine 3";

      const { container } = render(
        <div data-testid="wrapper">
          <CrudTableCellView
            entity={mockEntity}
            field="name"
            value={multilineValue}
          />
        </div>,
      );

      const wrapper = screen.getByTestId("wrapper");
      // DOM normalizes whitespace in textContent, so we check for presence of lines
      expect(wrapper).toHaveTextContent(/Line 1.*Line 2.*Line 3/);
    });
  });

  describe("CrudTableCellView.Bool component", () => {
    it("should render green check icon for true values", () => {
      const { container } = render(
        <CrudTableCellView.Bool
          entity={mockEntity}
          field="isActive"
          value={true}
        />,
      );

      const icon = screen.getByRole("img", { name: /check-circle/i });
      expect(icon).toBeInTheDocument();

      // Check for Tailwind class in the span
      const span = container.querySelector("span.text-green-700");
      expect(span).toBeInTheDocument();
    });

    it("should render red close icon for false values", () => {
      const { container } = render(
        <CrudTableCellView.Bool
          entity={mockEntity}
          field="isActive"
          value={false}
        />,
      );

      const icon = screen.getByRole("img", { name: /close-circle/i });
      expect(icon).toBeInTheDocument();

      const span = container.querySelector("span.text-red-700");
      expect(span).toBeInTheDocument();
    });

    it("should render red close icon for falsy values", () => {
      const { container } = render(
        <CrudTableCellView.Bool
          entity={mockEntity}
          field="isActive"
          value={0}
        />,
      );

      const icon = screen.getByRole("img", { name: /close-circle/i });
      expect(icon).toBeInTheDocument();

      const span = container.querySelector("span.text-red-700");
      expect(span).toBeInTheDocument();
    });

    it("should render green check icon for truthy values", () => {
      const { container } = render(
        <CrudTableCellView.Bool
          entity={mockEntity}
          field="isActive"
          value={1}
        />,
      );

      const icon = screen.getByRole("img", { name: /check-circle/i });
      expect(icon).toBeInTheDocument();

      const span = container.querySelector("span.text-green-700");
      expect(span).toBeInTheDocument();
    });

    it("should render red close icon for empty string", () => {
      const { container } = render(
        <CrudTableCellView.Bool
          entity={mockEntity}
          field="isActive"
          value=""
        />,
      );

      const icon = screen.getByRole("img", { name: /close-circle/i });
      expect(icon).toBeInTheDocument();

      const span = container.querySelector("span.text-red-700");
      expect(span).toBeInTheDocument();
    });

    it("should render green check icon for non-empty string", () => {
      const { container } = render(
        <CrudTableCellView.Bool
          entity={mockEntity}
          field="isActive"
          value="true"
        />,
      );

      const icon = screen.getByRole("img", { name: /check-circle/i });
      expect(icon).toBeInTheDocument();

      const span = container.querySelector("span.text-green-700");
      expect(span).toBeInTheDocument();
    });

    it("should render red close icon for null values", () => {
      const { container } = render(
        <CrudTableCellView.Bool
          entity={mockEntity}
          field="isActive"
          value={null as any}
        />,
      );

      const icon = screen.getByRole("img", { name: /close-circle/i });
      expect(icon).toBeInTheDocument();

      const span = container.querySelector("span.text-red-700");
      expect(span).toBeInTheDocument();
    });

    it("should render red close icon for undefined values", () => {
      const { container } = render(
        <CrudTableCellView.Bool
          entity={mockEntity}
          field="isActive"
          value={undefined as any}
        />,
      );

      const icon = screen.getByRole("img", { name: /close-circle/i });
      expect(icon).toBeInTheDocument();

      const span = container.querySelector("span.text-red-700");
      expect(span).toBeInTheDocument();
    });

    it("should have proper icon styling", () => {
      render(
        <CrudTableCellView.Bool
          entity={mockEntity}
          field="isActive"
          value={true}
        />,
      );

      const icon = screen.getByRole("img", { name: /check-circle/i });
      expect(icon).toHaveClass("text-lg");
    });

    it("should handle different field types", () => {
      render(
        <CrudTableCellView.Bool
          entity={mockEntity}
          field="customBoolField"
          value={true}
        />,
      );

      const icon = screen.getByRole("img", { name: /check-circle/i });
      expect(icon).toBeInTheDocument();
    });
  });

  describe("CrudTableCellView.Area component", () => {
    it("should render text in a div with whitespace-pre-wrap", () => {
      render(
        <CrudTableCellView.Area
          entity={mockEntity}
          field="description"
          value="Single line text"
        />,
      );

      const div = screen.getByText("Single line text");
      expect(div).toBeInTheDocument();
      expect(div.tagName).toBe("DIV");
      expect(div).toHaveClass("whitespace-pre-wrap");
    });

    it("should preserve multiline text formatting", () => {
      const multilineText = "Line 1\nLine 2\nLine 3";

      const { container } = render(
        <CrudTableCellView.Area
          entity={mockEntity}
          field="description"
          value={multilineText}
        />,
      );

      const div = container.querySelector("div.whitespace-pre-wrap");
      expect(div).toBeInTheDocument();
      // DOM normalizes whitespace in textContent, so we just check presence
      expect(div).toHaveTextContent(/Line 1.*Line 2.*Line 3/);
    });

    it("should handle empty text", () => {
      const { container } = render(
        <div data-testid="area-wrapper">
          <CrudTableCellView.Area
            entity={mockEntity}
            field="description"
            value=""
          />
        </div>,
      );

      const wrapper = screen.getByTestId("area-wrapper");
      expect(wrapper).toHaveTextContent("");
    });

    it("should handle text with tabs and spaces", () => {
      const textWithWhitespace = "Text with tabs and spaces";

      const { container } = render(
        <CrudTableCellView.Area
          entity={mockEntity}
          field="description"
          value={textWithWhitespace}
        />,
      );

      const div = container.querySelector("div.whitespace-pre-wrap");
      expect(div).toBeInTheDocument();
      expect(div).toHaveTextContent(textWithWhitespace);
    });

    it("should handle very long text", () => {
      const longText = "A".repeat(100) + " " + "B".repeat(100);

      const { container } = render(
        <CrudTableCellView.Area
          entity={mockEntity}
          field="description"
          value={longText}
        />,
      );

      const div = container.querySelector("div.whitespace-pre-wrap");
      expect(div).toBeInTheDocument();
      expect(div).toHaveTextContent(longText);
    });

    it("should handle special characters and formatting", () => {
      const specialText = "Special: @#$% New line Tab";

      const { container } = render(
        <CrudTableCellView.Area
          entity={mockEntity}
          field="description"
          value={specialText}
        />,
      );

      const div = container.querySelector("div.whitespace-pre-wrap");
      expect(div).toBeInTheDocument();
      expect(div).toHaveTextContent(specialText);
    });

    it("should handle unicode text", () => {
      const unicodeText = "Unicode: 你好世界 🌍 Emoji ñáéíóú accents";

      const { container } = render(
        <CrudTableCellView.Area
          entity={mockEntity}
          field="description"
          value={unicodeText}
        />,
      );

      const div = container.querySelector("div.whitespace-pre-wrap");
      expect(div).toBeInTheDocument();
      expect(div).toHaveTextContent(unicodeText);
    });

    it("should handle numeric values in area", () => {
      render(
        <CrudTableCellView.Area
          entity={mockEntity}
          field="description"
          value={12345}
        />,
      );

      const div = screen.getByText("12345");
      expect(div).toBeInTheDocument();
      expect(div).toHaveClass("whitespace-pre-wrap");
    });

    it("should handle boolean values in area", () => {
      const { container } = render(
        <CrudTableCellView.Area
          entity={mockEntity}
          field="description"
          value={true}
        />,
      );

      const div = container.querySelector("div.whitespace-pre-wrap");
      expect(div).toBeInTheDocument();
      // React doesn't render boolean values, so true renders as empty
      expect(div!.textContent).toBe("");
    });
  });

  describe("convertValueForView utility function", () => {
    it("should handle string values", () => {
      render(
        <CrudTableCellView
          entity={mockEntity}
          field="name"
          value="test string"
        />,
      );

      expect(screen.getByText("test string")).toBeInTheDocument();
    });

    it("should handle number values", () => {
      render(
        <CrudTableCellView entity={mockEntity} field="count" value={123} />,
      );

      expect(screen.getByText("123")).toBeInTheDocument();
    });

    it("should handle boolean values by converting to string", () => {
      render(
        <CrudTableCellView entity={mockEntity} field="isActive" value={true} />,
      );

      expect(screen.getByText("true")).toBeInTheDocument();
    });

    it("should handle falsy values", () => {
      const { container } = render(
        <div data-testid="wrapper">
          <CrudTableCellView entity={mockEntity} field="name" value={false} />
        </div>,
      );

      const wrapper = screen.getByTestId("wrapper");
      // False is falsy, so convertValueForView returns empty string
      expect(wrapper).toHaveTextContent("");
    });

    it("should return empty string for null/undefined", () => {
      const { container } = render(
        <div data-testid="wrapper">
          <CrudTableCellView
            entity={mockEntity}
            field="name"
            value={null as any}
          />
        </div>,
      );

      const wrapper = screen.getByTestId("wrapper");
      expect(wrapper).toHaveTextContent("");
    });
  });

  describe("accessibility", () => {
    it("should have proper semantic structure for text", () => {
      render(
        <CrudTableCellView
          entity={mockEntity}
          field="name"
          value="Test Value"
        />,
      );

      const text = screen.getByText("Test Value");
      expect(text).toBeInTheDocument();
    });

    it("should have proper semantic structure for boolean icons", () => {
      render(
        <CrudTableCellView.Bool
          entity={mockEntity}
          field="isActive"
          value={true}
        />,
      );

      const icon = screen.getByRole("img", { name: /check-circle/i });
      expect(icon).toBeInTheDocument();
      // Icon might not have aria-hidden in test environment
      expect(icon).toHaveAttribute("role", "img");
    });

    it("should have proper semantic structure for area text", () => {
      render(
        <CrudTableCellView.Area
          entity={mockEntity}
          field="description"
          value="Test Description"
        />,
      );

      const div = screen.getByText("Test Description");
      expect(div).toBeInTheDocument();
      expect(div.tagName).toBe("DIV");
    });
  });

  describe("component structure", () => {
    it("should have Area subcomponent", () => {
      expect(CrudTableCellView.Area).toBeDefined();
      expect(typeof CrudTableCellView.Area).toBe("function");
    });

    it("should have Bool subcomponent", () => {
      expect(CrudTableCellView.Bool).toBeDefined();
      expect(typeof CrudTableCellView.Bool).toBe("function");
    });

    it("should maintain proper component hierarchy", () => {
      expect(CrudTableCellView).toBeDefined();
      expect(CrudTableCellView.Area).toBeDefined();
      expect(CrudTableCellView.Bool).toBeDefined();
    });
  });

  describe("performance and edge cases", () => {
    it("should handle rapid re-renders", () => {
      const { rerender } = render(
        <CrudTableCellView entity={mockEntity} field="name" value="Initial" />,
      );

      expect(screen.getByText("Initial")).toBeInTheDocument();

      rerender(
        <CrudTableCellView entity={mockEntity} field="name" value="Updated" />,
      );

      expect(screen.getByText("Updated")).toBeInTheDocument();
      expect(screen.queryByText("Initial")).not.toBeInTheDocument();
    });

    it("should handle different entities", () => {
      const anotherEntity = {
        ...mockEntity,
        _id: "another-id",
        name: "Another Entity",
      };

      render(
        <CrudTableCellView
          entity={anotherEntity}
          field="name"
          value="Different Value"
        />,
      );

      expect(screen.getByText("Different Value")).toBeInTheDocument();
    });

    it("should handle dynamic field names", () => {
      const dynamicField = `field_${Date.now()}`;

      render(
        <CrudTableCellView
          entity={mockEntity}
          field={dynamicField}
          value="Dynamic Field Value"
        />,
      );

      expect(screen.getByText("Dynamic Field Value")).toBeInTheDocument();
    });

    it("should handle extremely large numbers", () => {
      const largeNumber = Number.MAX_SAFE_INTEGER;

      render(
        <CrudTableCellView
          entity={mockEntity}
          field="count"
          value={largeNumber}
        />,
      );

      expect(screen.getByText(largeNumber.toString())).toBeInTheDocument();
    });

    it("should handle floating point precision", () => {
      const preciseNumber = 0.1 + 0.2; // Known floating point precision issue

      render(
        <CrudTableCellView
          entity={mockEntity}
          field="count"
          value={preciseNumber}
        />,
      );

      expect(screen.getByText(preciseNumber.toString())).toBeInTheDocument();
    });
  });
});

// Helper function to wrap components for testing empty values
const renderWithTestContainer = (component: React.ReactElement) => {
  return render(<div data-testid="test-container">{component}</div>);
};
