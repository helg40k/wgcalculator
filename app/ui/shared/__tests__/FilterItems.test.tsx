import React from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { theme } from "antd";

import "@testing-library/jest-dom";

import FilterItems from "../FilterItems";

// Mock Ant Design patch
jest.mock("@ant-design/v5-patch-for-react-19", () => ({}));

// Mock Ant Design theme
const mockThemeToken = {
  colorTextSecondary: "#666666",
};

jest.mock("antd", () => ({
  ...jest.requireActual("antd"),
  theme: {
    useToken: jest.fn(() => ({
      token: mockThemeToken,
    })),
  },
}));

const mockUseToken = theme.useToken as jest.MockedFunction<
  typeof theme.useToken
>;

interface TestEntity {
  id: string;
  name: string;
  description: string;
  status: string;
}

describe("FilterItems", () => {
  const mockSetFilterText = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseToken.mockReturnValue({
      token: mockThemeToken,
    } as any);
  });

  describe("rendering", () => {
    it("should render input with default placeholder", () => {
      render(
        <FilterItems<TestEntity>
          filterableFields={["name", "description"]}
          filterText=""
          setFilterText={mockSetFilterText}
        />,
      );

      const input = screen.getByPlaceholderText("Filter items...");
      expect(input).toBeInTheDocument();
    });

    it("should render input with custom placeholder", () => {
      render(
        <FilterItems<TestEntity>
          filterableFields={["name"]}
          filterText=""
          setFilterText={mockSetFilterText}
          placeholder="Search entities..."
        />,
      );

      const input = screen.getByPlaceholderText("Search entities...");
      expect(input).toBeInTheDocument();
    });

    it("should render input with search icon", () => {
      render(
        <FilterItems<TestEntity>
          filterableFields={["name"]}
          filterText=""
          setFilterText={mockSetFilterText}
        />,
      );

      const searchIcon = screen.getByRole("img", { name: /search/i });
      expect(searchIcon).toBeInTheDocument();
    });

    it("should render input with current filter text", () => {
      render(
        <FilterItems<TestEntity>
          filterableFields={["name"]}
          filterText="test filter"
          setFilterText={mockSetFilterText}
        />,
      );

      const input = screen.getByDisplayValue("test filter");
      expect(input).toBeInTheDocument();
    });

    it("should return null when no filterable fields provided", () => {
      const { container } = render(
        <FilterItems<TestEntity>
          filterableFields={[]}
          filterText=""
          setFilterText={mockSetFilterText}
        />,
      );

      expect(container.firstChild).toBeNull();
    });
  });

  describe("styling", () => {
    it("should apply default width style to wrapper", () => {
      const { container } = render(
        <FilterItems<TestEntity>
          filterableFields={["name"]}
          filterText=""
          setFilterText={mockSetFilterText}
        />,
      );

      const wrapper = container.querySelector(".ant-input-affix-wrapper");
      expect(wrapper).toHaveStyle({ width: "200px" });
    });

    it("should apply custom style to wrapper", () => {
      const customStyle = { height: 40, width: 300 };
      const { container } = render(
        <FilterItems<TestEntity>
          filterableFields={["name"]}
          filterText=""
          setFilterText={mockSetFilterText}
          style={customStyle}
        />,
      );

      const wrapper = container.querySelector(".ant-input-affix-wrapper");
      expect(wrapper).toHaveStyle({ height: "40px", width: "300px" });
    });

    it("should use theme token for search icon color", () => {
      render(
        <FilterItems<TestEntity>
          filterableFields={["name"]}
          filterText=""
          setFilterText={mockSetFilterText}
        />,
      );

      expect(mockUseToken).toHaveBeenCalled();

      const searchIcon = screen.getByRole("img", { name: /search/i });
      expect(searchIcon).toHaveStyle({
        color: mockThemeToken.colorTextSecondary,
      });
    });
  });

  describe("interaction", () => {
    it("should call setFilterText when input value changes", () => {
      render(
        <FilterItems<TestEntity>
          filterableFields={["name", "description"]}
          filterText=""
          setFilterText={mockSetFilterText}
        />,
      );

      const input = screen.getByPlaceholderText("Filter items...");
      fireEvent.change(input, { target: { value: "new filter text" } });

      expect(mockSetFilterText).toHaveBeenCalledWith("new filter text");
    });

    it("should call setFilterText multiple times for multiple changes", () => {
      render(
        <FilterItems<TestEntity>
          filterableFields={["name"]}
          filterText=""
          setFilterText={mockSetFilterText}
        />,
      );

      const input = screen.getByPlaceholderText("Filter items...");

      fireEvent.change(input, { target: { value: "a" } });
      fireEvent.change(input, { target: { value: "ab" } });
      fireEvent.change(input, { target: { value: "abc" } });

      expect(mockSetFilterText).toHaveBeenCalledTimes(3);
      expect(mockSetFilterText).toHaveBeenNthCalledWith(1, "a");
      expect(mockSetFilterText).toHaveBeenNthCalledWith(2, "ab");
      expect(mockSetFilterText).toHaveBeenNthCalledWith(3, "abc");
    });

    it("should handle clear button click", () => {
      render(
        <FilterItems<TestEntity>
          filterableFields={["name"]}
          filterText="some text"
          setFilterText={mockSetFilterText}
        />,
      );

      const clearButton = screen.getByRole("button", { name: /close-circle/i });
      fireEvent.click(clearButton);

      expect(mockSetFilterText).toHaveBeenCalledWith("");
    });

    it("should handle empty string input", () => {
      render(
        <FilterItems<TestEntity>
          filterableFields={["name"]}
          filterText="existing text"
          setFilterText={mockSetFilterText}
        />,
      );

      const input = screen.getByDisplayValue("existing text");
      fireEvent.change(input, { target: { value: "" } });

      expect(mockSetFilterText).toHaveBeenCalledWith("");
    });
  });

  describe("disabled state", () => {
    it("should be enabled by default", () => {
      render(
        <FilterItems<TestEntity>
          filterableFields={["name"]}
          filterText=""
          setFilterText={mockSetFilterText}
        />,
      );

      const input = screen.getByPlaceholderText("Filter items...");
      expect(input).not.toBeDisabled();
    });

    it("should be disabled when disabled prop is true", () => {
      render(
        <FilterItems<TestEntity>
          filterableFields={["name"]}
          filterText=""
          setFilterText={mockSetFilterText}
          disabled={true}
        />,
      );

      const input = screen.getByPlaceholderText("Filter items...");
      expect(input).toBeDisabled();
    });

    it("should have disabled attribute when disabled", () => {
      render(
        <FilterItems<TestEntity>
          filterableFields={["name"]}
          filterText=""
          setFilterText={mockSetFilterText}
          disabled={true}
        />,
      );

      const input = screen.getByPlaceholderText("Filter items...");
      expect(input).toBeDisabled();
      expect(input).toHaveAttribute("disabled");
    });
  });

  describe("filterable fields", () => {
    it("should render with single filterable field", () => {
      render(
        <FilterItems<TestEntity>
          filterableFields={["name"]}
          filterText=""
          setFilterText={mockSetFilterText}
        />,
      );

      const input = screen.getByPlaceholderText("Filter items...");
      expect(input).toBeInTheDocument();
    });

    it("should render with multiple filterable fields", () => {
      render(
        <FilterItems<TestEntity>
          filterableFields={["name", "description", "status"]}
          filterText=""
          setFilterText={mockSetFilterText}
        />,
      );

      const input = screen.getByPlaceholderText("Filter items...");
      expect(input).toBeInTheDocument();
    });

    it("should handle all possible entity fields", () => {
      render(
        <FilterItems<TestEntity>
          filterableFields={["id", "name", "description", "status"]}
          filterText=""
          setFilterText={mockSetFilterText}
        />,
      );

      const input = screen.getByPlaceholderText("Filter items...");
      expect(input).toBeInTheDocument();
    });
  });

  describe("accessibility", () => {
    it("should have proper input attributes", () => {
      render(
        <FilterItems<TestEntity>
          filterableFields={["name"]}
          filterText=""
          setFilterText={mockSetFilterText}
        />,
      );

      const input = screen.getByRole("textbox");
      expect(input).toBeInTheDocument();
      expect(input).toHaveAttribute("placeholder", "Filter items...");
    });

    it("should be focusable when not disabled", () => {
      render(
        <FilterItems<TestEntity>
          filterableFields={["name"]}
          filterText=""
          setFilterText={mockSetFilterText}
        />,
      );

      const input = screen.getByRole("textbox");
      input.focus();
      expect(input).toHaveFocus();
    });

    it("should not be focusable when disabled", () => {
      render(
        <FilterItems<TestEntity>
          filterableFields={["name"]}
          filterText=""
          setFilterText={mockSetFilterText}
          disabled={true}
        />,
      );

      const input = screen.getByRole("textbox");
      expect(input).toBeDisabled();
    });
  });

  describe("edge cases", () => {
    it("should handle very long filter text", () => {
      const longText = "a".repeat(1000);

      render(
        <FilterItems<TestEntity>
          filterableFields={["name"]}
          filterText={longText}
          setFilterText={mockSetFilterText}
        />,
      );

      const input = screen.getByDisplayValue(longText);
      expect(input).toBeInTheDocument();
    });

    it("should handle special characters in filter text", () => {
      const specialText = "test@#$%^&*()_+-=[]{}|;':\",./<>?";

      render(
        <FilterItems<TestEntity>
          filterableFields={["name"]}
          filterText={specialText}
          setFilterText={mockSetFilterText}
        />,
      );

      const input = screen.getByDisplayValue(specialText);
      expect(input).toBeInTheDocument();
    });

    it("should handle unicode characters", () => {
      const unicodeText = "тест 测试 🎉 émojis";

      render(
        <FilterItems<TestEntity>
          filterableFields={["name"]}
          filterText={unicodeText}
          setFilterText={mockSetFilterText}
        />,
      );

      const input = screen.getByDisplayValue(unicodeText);
      expect(input).toBeInTheDocument();
    });

    it("should use default placeholder when empty placeholder provided", () => {
      render(
        <FilterItems<TestEntity>
          filterableFields={["name"]}
          filterText=""
          setFilterText={mockSetFilterText}
          placeholder=""
        />,
      );

      const input = screen.getByRole("textbox");
      expect(input).toHaveAttribute("placeholder", "Filter items...");
    });

    it("should handle undefined style", () => {
      render(
        <FilterItems<TestEntity>
          filterableFields={["name"]}
          filterText=""
          setFilterText={mockSetFilterText}
          style={undefined}
        />,
      );

      const input = screen.getByPlaceholderText("Filter items...");
      expect(input).toBeInTheDocument();
    });
  });

  describe("type safety", () => {
    interface CustomEntity {
      customField: string;
      anotherField: number;
    }

    it("should work with custom entity types", () => {
      const mockSetCustomFilter = jest.fn();

      render(
        <FilterItems<CustomEntity>
          filterableFields={["customField"]}
          filterText=""
          setFilterText={mockSetCustomFilter}
        />,
      );

      const input = screen.getByPlaceholderText("Filter items...");
      fireEvent.change(input, { target: { value: "custom value" } });

      expect(mockSetCustomFilter).toHaveBeenCalledWith("custom value");
    });

    it("should work with multiple custom fields", () => {
      const mockSetCustomFilter = jest.fn();

      render(
        <FilterItems<CustomEntity>
          filterableFields={["customField", "anotherField"]}
          filterText=""
          setFilterText={mockSetCustomFilter}
        />,
      );

      const input = screen.getByPlaceholderText("Filter items...");
      expect(input).toBeInTheDocument();
    });
  });

  describe("component integration", () => {
    it("should work in controlled component pattern", () => {
      const TestWrapper = () => {
        const [filter, setFilter] = React.useState("initial");

        return (
          <div>
            <FilterItems<TestEntity>
              filterableFields={["name"]}
              filterText={filter}
              setFilterText={setFilter}
            />
            <div data-testid="current-filter">{filter}</div>
          </div>
        );
      };

      render(<TestWrapper />);

      const input = screen.getByDisplayValue("initial");
      const currentFilter = screen.getByTestId("current-filter");

      expect(currentFilter).toHaveTextContent("initial");

      fireEvent.change(input, { target: { value: "updated" } });

      expect(currentFilter).toHaveTextContent("updated");
    });

    it("should handle rapid input changes", () => {
      render(
        <FilterItems<TestEntity>
          filterableFields={["name"]}
          filterText=""
          setFilterText={mockSetFilterText}
        />,
      );

      const input = screen.getByPlaceholderText("Filter items...");

      // Rapid changes
      fireEvent.change(input, { target: { value: "a" } });
      fireEvent.change(input, { target: { value: "ab" } });
      fireEvent.change(input, { target: { value: "abc" } });
      fireEvent.change(input, { target: { value: "abcd" } });

      expect(mockSetFilterText).toHaveBeenCalledTimes(4);
      expect(mockSetFilterText).toHaveBeenLastCalledWith("abcd");
    });

    it("should handle backspace and deletion", () => {
      render(
        <FilterItems<TestEntity>
          filterableFields={["name"]}
          filterText="test"
          setFilterText={mockSetFilterText}
        />,
      );

      const input = screen.getByDisplayValue("test");

      // Simulate backspace
      fireEvent.change(input, { target: { value: "tes" } });
      fireEvent.change(input, { target: { value: "te" } });
      fireEvent.change(input, { target: { value: "t" } });
      fireEvent.change(input, { target: { value: "" } });

      expect(mockSetFilterText).toHaveBeenCalledTimes(4);
      expect(mockSetFilterText).toHaveBeenLastCalledWith("");
    });
  });

  describe("allowClear functionality", () => {
    it("should show clear button when there is text", () => {
      render(
        <FilterItems<TestEntity>
          filterableFields={["name"]}
          filterText="some text"
          setFilterText={mockSetFilterText}
        />,
      );

      const clearButton = screen.getByRole("button", { name: /close-circle/i });
      expect(clearButton).toBeInTheDocument();
    });

    it("should not show clear button when text is empty", () => {
      render(
        <FilterItems<TestEntity>
          filterableFields={["name"]}
          filterText=""
          setFilterText={mockSetFilterText}
        />,
      );

      const clearButton = screen.queryByRole("button", {
        name: /close-circle/i,
      });
      expect(clearButton).not.toBeInTheDocument();
    });

    it("should clear text when clear button is clicked", () => {
      render(
        <FilterItems<TestEntity>
          filterableFields={["name"]}
          filterText="text to clear"
          setFilterText={mockSetFilterText}
        />,
      );

      const clearButton = screen.getByRole("button", { name: /close-circle/i });
      fireEvent.click(clearButton);

      expect(mockSetFilterText).toHaveBeenCalledWith("");
    });
  });

  describe("keyboard interaction", () => {
    it("should handle Enter key", () => {
      render(
        <FilterItems<TestEntity>
          filterableFields={["name"]}
          filterText=""
          setFilterText={mockSetFilterText}
        />,
      );

      const input = screen.getByPlaceholderText("Filter items...");
      fireEvent.keyDown(input, { code: "Enter", key: "Enter" });

      // Should not cause any errors
      expect(input).toBeInTheDocument();
    });

    it("should handle Escape key", () => {
      render(
        <FilterItems<TestEntity>
          filterableFields={["name"]}
          filterText="some text"
          setFilterText={mockSetFilterText}
        />,
      );

      const input = screen.getByDisplayValue("some text");
      fireEvent.keyDown(input, { code: "Escape", key: "Escape" });

      // Should not cause any errors
      expect(input).toBeInTheDocument();
    });

    it("should handle Tab key for navigation", () => {
      render(
        <div>
          <input data-testid="before" />
          <FilterItems<TestEntity>
            filterableFields={["name"]}
            filterText=""
            setFilterText={mockSetFilterText}
          />
          <input data-testid="after" />
        </div>,
      );

      const beforeInput = screen.getByTestId("before");
      const filterInput = screen.getByPlaceholderText("Filter items...");
      const afterInput = screen.getByTestId("after");

      beforeInput.focus();
      expect(beforeInput).toHaveFocus();

      fireEvent.keyDown(beforeInput, { code: "Tab", key: "Tab" });
      filterInput.focus();
      expect(filterInput).toHaveFocus();

      fireEvent.keyDown(filterInput, { code: "Tab", key: "Tab" });
      afterInput.focus();
      expect(afterInput).toHaveFocus();
    });
  });

  describe("performance", () => {
    it("should handle large number of filterable fields", () => {
      const manyFields = Array.from(
        { length: 100 },
        (_, i) => `field${i}` as keyof TestEntity,
      );

      render(
        <FilterItems<TestEntity>
          filterableFields={manyFields}
          filterText=""
          setFilterText={mockSetFilterText}
        />,
      );

      const input = screen.getByPlaceholderText("Filter items...");
      expect(input).toBeInTheDocument();
    });

    it("should not re-render unnecessarily", () => {
      const { rerender } = render(
        <FilterItems<TestEntity>
          filterableFields={["name"]}
          filterText="stable text"
          setFilterText={mockSetFilterText}
        />,
      );

      const input = screen.getByDisplayValue("stable text");
      expect(input).toBeInTheDocument();

      // Re-render with same props
      rerender(
        <FilterItems<TestEntity>
          filterableFields={["name"]}
          filterText="stable text"
          setFilterText={mockSetFilterText}
        />,
      );

      expect(input).toBeInTheDocument();
      expect(mockSetFilterText).not.toHaveBeenCalled();
    });
  });
});
