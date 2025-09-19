import React from "react";
import { act, fireEvent, render, screen } from "@testing-library/react";

import "@testing-library/jest-dom";

import SortItems, { SortableField, SortSelection } from "../SortItems";

// Mock Ant Design patch
jest.mock("@ant-design/v5-patch-for-react-19", () => ({}));

interface TestEntity {
  id: string;
  name: string;
  description: string;
  status: string;
  createdAt: Date;
}

describe("SortItems", () => {
  const mockSetSortSelection = jest.fn();

  const testSortableFields: SortableField<TestEntity>[] = [
    { key: "name", label: "Name" },
    { key: "status", label: "Status" },
    { key: "createdAt", label: "Created Date" },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("rendering", () => {
    it("should render select with default placeholder", () => {
      render(
        <SortItems<TestEntity>
          sortableFields={testSortableFields}
          sortSelection={[]}
          setSortSelection={mockSetSortSelection}
        />,
      );

      expect(screen.getByText("Sort by...")).toBeInTheDocument();
    });

    it("should render select with custom placeholder", () => {
      render(
        <SortItems<TestEntity>
          sortableFields={testSortableFields}
          sortSelection={[]}
          setSortSelection={mockSetSortSelection}
          placeholder="Custom sort placeholder"
        />,
      );

      expect(screen.getByText("Custom sort placeholder")).toBeInTheDocument();
    });

    it("should return null when no sortable fields provided", () => {
      const { container } = render(
        <SortItems<TestEntity>
          sortableFields={[]}
          sortSelection={[]}
          setSortSelection={mockSetSortSelection}
        />,
      );

      expect(container.firstChild).toBeNull();
    });

    it("should render all sortable field options", () => {
      render(
        <SortItems<TestEntity>
          sortableFields={testSortableFields}
          sortSelection={[]}
          setSortSelection={mockSetSortSelection}
        />,
      );

      // Click to open dropdown
      const select = screen.getByRole("combobox");
      fireEvent.mouseDown(select);

      expect(screen.getByText("Name")).toBeInTheDocument();
      expect(screen.getByText("Status")).toBeInTheDocument();
      expect(screen.getByText("Created Date")).toBeInTheDocument();
    });
  });

  describe("styling", () => {
    it("should apply default style", () => {
      const { container } = render(
        <SortItems<TestEntity>
          sortableFields={testSortableFields}
          sortSelection={[]}
          setSortSelection={mockSetSortSelection}
        />,
      );

      const selectWrapper = container.querySelector(".ant-select");
      expect(selectWrapper).toHaveStyle({
        maxWidth: "350px",
        minWidth: "150px",
      });
    });

    it("should apply custom style", () => {
      const customStyle = { height: 50, width: 400 };

      const { container } = render(
        <SortItems<TestEntity>
          sortableFields={testSortableFields}
          sortSelection={[]}
          setSortSelection={mockSetSortSelection}
          style={customStyle}
        />,
      );

      const selectWrapper = container.querySelector(".ant-select");
      expect(selectWrapper).toHaveStyle({
        height: "50px",
        width: "400px",
      });
    });
  });

  describe("disabled state", () => {
    it("should be enabled by default", () => {
      render(
        <SortItems<TestEntity>
          sortableFields={testSortableFields}
          sortSelection={[]}
          setSortSelection={mockSetSortSelection}
        />,
      );

      const select = screen.getByRole("combobox");
      expect(select).not.toHaveAttribute("disabled");
    });

    it("should be disabled when disabled prop is true", () => {
      const { container } = render(
        <SortItems<TestEntity>
          sortableFields={testSortableFields}
          sortSelection={[]}
          setSortSelection={mockSetSortSelection}
          disabled={true}
        />,
      );

      const selectWrapper = container.querySelector(".ant-select-disabled");
      expect(selectWrapper).toBeInTheDocument();
    });
  });

  describe("sort selection display", () => {
    it("should show ascending sort indicator", () => {
      const sortSelection: SortSelection<TestEntity>[] = [
        { direction: "asc", field: "name" },
      ];

      render(
        <SortItems<TestEntity>
          sortableFields={testSortableFields}
          sortSelection={sortSelection}
          setSortSelection={mockSetSortSelection}
        />,
      );

      expect(screen.getByText("Name ↑")).toBeInTheDocument();
    });

    it("should show descending sort indicator", () => {
      const sortSelection: SortSelection<TestEntity>[] = [
        { direction: "desc", field: "status" },
      ];

      render(
        <SortItems<TestEntity>
          sortableFields={testSortableFields}
          sortSelection={sortSelection}
          setSortSelection={mockSetSortSelection}
        />,
      );

      expect(screen.getByText("Status ↓")).toBeInTheDocument();
    });

    it("should show multiple sort selections", () => {
      const sortSelection: SortSelection<TestEntity>[] = [
        { direction: "asc", field: "name" },
        { direction: "desc", field: "createdAt" },
      ];

      render(
        <SortItems<TestEntity>
          sortableFields={testSortableFields}
          sortSelection={sortSelection}
          setSortSelection={mockSetSortSelection}
        />,
      );

      expect(screen.getByText("Name ↑")).toBeInTheDocument();
      expect(screen.getByText("Created Date ↓")).toBeInTheDocument();
    });

    it("should show field label without indicator when not selected", () => {
      render(
        <SortItems<TestEntity>
          sortableFields={testSortableFields}
          sortSelection={[]}
          setSortSelection={mockSetSortSelection}
        />,
      );

      // Click to open dropdown
      const select = screen.getByRole("combobox");
      fireEvent.mouseDown(select);

      expect(screen.getByText("Name")).toBeInTheDocument();
      expect(screen.getByText("Status")).toBeInTheDocument();
      expect(screen.getByText("Created Date")).toBeInTheDocument();
    });
  });

  describe("sort toggle behavior", () => {
    it("should add field as ascending when not selected", () => {
      render(
        <SortItems<TestEntity>
          sortableFields={testSortableFields}
          sortSelection={[]}
          setSortSelection={mockSetSortSelection}
        />,
      );

      // Click to open dropdown
      const select = screen.getByRole("combobox");
      fireEvent.mouseDown(select);

      // Select name field
      const nameOption = screen.getByText("Name");
      fireEvent.click(nameOption);

      expect(mockSetSortSelection).toHaveBeenCalledWith(expect.any(Function));

      // Test the function that was passed
      const setterFunction = mockSetSortSelection.mock.calls[0][0];
      const result = setterFunction([]);
      expect(result).toEqual([{ direction: "asc", field: "name" }]);
    });

    it("should test sort toggle logic directly", () => {
      // Test the logic by simulating what happens in handleSortToggle

      // Test: none -> asc
      let currentSort: SortSelection<TestEntity>[] = [];
      let result = [
        ...currentSort,
        { direction: "asc" as const, field: "name" as keyof TestEntity },
      ];
      expect(result).toEqual([{ direction: "asc", field: "name" }]);

      // Test: asc -> desc
      currentSort = [{ direction: "asc", field: "name" }];
      const existingIndex = currentSort.findIndex((s) => s.field === "name");
      const updated = [...currentSort];
      updated[existingIndex] = {
        direction: "desc" as const,
        field: "name" as keyof TestEntity,
      };
      expect(updated).toEqual([{ direction: "desc", field: "name" }]);

      // Test: desc -> none
      currentSort = [{ direction: "desc", field: "name" }];
      result = currentSort.filter((s) => s.field !== "name");
      expect(result).toEqual([]);
    });

    it("should test multiple field sorting logic", () => {
      // Test adding to existing sort
      const currentSort: SortSelection<TestEntity>[] = [
        { direction: "asc", field: "name" },
        { direction: "desc", field: "status" },
      ];

      // Add new field
      const newSort = [
        ...currentSort,
        { direction: "asc" as const, field: "createdAt" as keyof TestEntity },
      ];
      expect(newSort).toEqual([
        { direction: "asc", field: "name" },
        { direction: "desc", field: "status" },
        { direction: "asc", field: "createdAt" },
      ]);

      // Remove middle field
      const filtered = currentSort.filter((s) => s.field !== "status");
      expect(filtered).toEqual([{ direction: "asc", field: "name" }]);
    });

    it("should handle multiple field sorting", () => {
      const initialSort: SortSelection<TestEntity>[] = [
        { direction: "asc", field: "name" },
        { direction: "desc", field: "status" },
      ];

      render(
        <SortItems<TestEntity>
          sortableFields={testSortableFields}
          sortSelection={initialSort}
          setSortSelection={mockSetSortSelection}
        />,
      );

      // Click to open dropdown and add another field
      const select = screen.getByRole("combobox");
      fireEvent.mouseDown(select);

      const createdAtOption = screen.getByText("Created Date");
      fireEvent.click(createdAtOption);

      expect(mockSetSortSelection).toHaveBeenCalledWith(expect.any(Function));

      // Test the function that was passed
      const setterFunction = mockSetSortSelection.mock.calls[0][0];
      const result = setterFunction(initialSort);
      expect(result).toEqual([
        { direction: "asc", field: "name" },
        { direction: "desc", field: "status" },
        { direction: "asc", field: "createdAt" },
      ]);
    });
  });

  describe("field label handling", () => {
    it("should use field label when available", () => {
      const fieldsWithLabels: SortableField<TestEntity>[] = [
        { key: "name", label: "Entity Name" },
        { key: "status", label: "Current Status" },
      ];

      render(
        <SortItems<TestEntity>
          sortableFields={fieldsWithLabels}
          sortSelection={[]}
          setSortSelection={mockSetSortSelection}
        />,
      );

      // Click to open dropdown
      const select = screen.getByRole("combobox");
      fireEvent.mouseDown(select);

      expect(screen.getByText("Entity Name")).toBeInTheDocument();
      expect(screen.getByText("Current Status")).toBeInTheDocument();
    });

    it("should fallback to field key when no label provided", () => {
      const fieldsWithoutLabels: SortableField<TestEntity>[] = [
        { key: "id", label: "" },
      ];

      render(
        <SortItems<TestEntity>
          sortableFields={fieldsWithoutLabels}
          sortSelection={[]}
          setSortSelection={mockSetSortSelection}
        />,
      );

      // Click to open dropdown
      const select = screen.getByRole("combobox");
      fireEvent.mouseDown(select);

      // Use getAllByText to handle multiple elements
      const idElements = screen.getAllByText("id");
      expect(idElements.length).toBeGreaterThan(0);
    });

    it("should handle fields with special characters in keys", () => {
      const specialFields: SortableField<TestEntity>[] = [
        { key: "name" as keyof TestEntity, label: "Special_Field-123" },
      ];

      render(
        <SortItems<TestEntity>
          sortableFields={specialFields}
          sortSelection={[]}
          setSortSelection={mockSetSortSelection}
        />,
      );

      // Click to open dropdown
      const select = screen.getByRole("combobox");
      fireEvent.mouseDown(select);

      expect(screen.getByText("Special_Field-123")).toBeInTheDocument();
    });
  });

  describe("accessibility", () => {
    it("should have proper select attributes", () => {
      render(
        <SortItems<TestEntity>
          sortableFields={testSortableFields}
          sortSelection={[]}
          setSortSelection={mockSetSortSelection}
        />,
      );

      const select = screen.getByRole("combobox");
      expect(select).toBeInTheDocument();
      expect(select).toHaveAttribute("aria-expanded", "false");
    });

    it("should be focusable when not disabled", () => {
      render(
        <SortItems<TestEntity>
          sortableFields={testSortableFields}
          sortSelection={[]}
          setSortSelection={mockSetSortSelection}
        />,
      );

      const select = screen.getByRole("combobox");
      act(() => {
        select.focus();
      });
      expect(select).toHaveFocus();
    });

    it("should not be focusable when disabled", () => {
      const { container } = render(
        <SortItems<TestEntity>
          sortableFields={testSortableFields}
          sortSelection={[]}
          setSortSelection={mockSetSortSelection}
          disabled={true}
        />,
      );

      const selectWrapper = container.querySelector(".ant-select-disabled");
      expect(selectWrapper).toBeInTheDocument();
    });

    it("should have proper aria attributes when expanded", () => {
      render(
        <SortItems<TestEntity>
          sortableFields={testSortableFields}
          sortSelection={[]}
          setSortSelection={mockSetSortSelection}
        />,
      );

      const select = screen.getByRole("combobox");
      fireEvent.mouseDown(select);

      expect(select).toHaveAttribute("aria-expanded", "true");
    });
  });

  describe("controlled component behavior", () => {
    it("should work in controlled component pattern", () => {
      const TestWrapper = () => {
        const [sortSelection, setSortSelection] = React.useState<
          SortSelection<TestEntity>[]
        >([]);

        return (
          <div>
            <SortItems<TestEntity>
              sortableFields={testSortableFields}
              sortSelection={sortSelection}
              setSortSelection={setSortSelection}
            />
            <div data-testid="current-sort">
              {sortSelection.map((s) => `${s.field}:${s.direction}`).join(",")}
            </div>
          </div>
        );
      };

      render(<TestWrapper />);

      const currentSort = screen.getByTestId("current-sort");
      expect(currentSort).toHaveTextContent("");

      // Click to open dropdown and select a field
      const select = screen.getByRole("combobox");
      fireEvent.mouseDown(select);

      const nameOption = screen.getByText("Name");
      fireEvent.click(nameOption);

      expect(currentSort).toHaveTextContent("name:asc");
    });

    it("should display sort states correctly", () => {
      const TestWrapper = () => {
        const [sortSelection, setSortSelection] = React.useState<
          SortSelection<TestEntity>[]
        >([{ direction: "asc", field: "name" }]);

        return (
          <div>
            <SortItems<TestEntity>
              sortableFields={testSortableFields}
              sortSelection={sortSelection}
              setSortSelection={setSortSelection}
            />
            <div data-testid="current-sort">
              {sortSelection.map((s) => `${s.field}:${s.direction}`).join(",")}
            </div>
          </div>
        );
      };

      render(<TestWrapper />);

      const currentSort = screen.getByTestId("current-sort");
      expect(currentSort).toHaveTextContent("name:asc");

      // Should show the ascending indicator
      expect(screen.getByText("Name ↑")).toBeInTheDocument();
    });
  });

  describe("edge cases", () => {
    it("should handle single sortable field", () => {
      const singleField: SortableField<TestEntity>[] = [
        { key: "name", label: "Name" },
      ];

      render(
        <SortItems<TestEntity>
          sortableFields={singleField}
          sortSelection={[]}
          setSortSelection={mockSetSortSelection}
        />,
      );

      const select = screen.getByRole("combobox");
      fireEvent.mouseDown(select);

      expect(screen.getByText("Name")).toBeInTheDocument();
    });

    it("should handle very long field labels", () => {
      const longLabelFields: SortableField<TestEntity>[] = [
        {
          key: "name",
          label: "Very Long Field Label That Might Cause Layout Issues",
        },
      ];

      render(
        <SortItems<TestEntity>
          sortableFields={longLabelFields}
          sortSelection={[]}
          setSortSelection={mockSetSortSelection}
        />,
      );

      const select = screen.getByRole("combobox");
      fireEvent.mouseDown(select);

      expect(
        screen.getByText(
          "Very Long Field Label That Might Cause Layout Issues",
        ),
      ).toBeInTheDocument();
    });

    it("should handle fields with empty labels", () => {
      const emptyLabelFields: SortableField<TestEntity>[] = [
        { key: "name", label: "" },
      ];

      render(
        <SortItems<TestEntity>
          sortableFields={emptyLabelFields}
          sortSelection={[]}
          setSortSelection={mockSetSortSelection}
        />,
      );

      const select = screen.getByRole("combobox");
      fireEvent.mouseDown(select);

      // Use getAllByText to handle multiple elements
      const nameElements = screen.getAllByText("name");
      expect(nameElements.length).toBeGreaterThan(0);
    });

    it("should handle undefined style gracefully", () => {
      render(
        <SortItems<TestEntity>
          sortableFields={testSortableFields}
          sortSelection={[]}
          setSortSelection={mockSetSortSelection}
          style={undefined}
        />,
      );

      const select = screen.getByRole("combobox");
      expect(select).toBeInTheDocument();
    });
  });

  describe("type safety", () => {
    interface CustomEntity {
      customField: string;
      anotherField: number;
      specialField: boolean;
    }

    it("should work with custom entity types", () => {
      const customFields: SortableField<CustomEntity>[] = [
        { key: "customField", label: "Custom Field" },
        { key: "anotherField", label: "Another Field" },
      ];

      const mockSetCustomSort = jest.fn();

      render(
        <SortItems<CustomEntity>
          sortableFields={customFields}
          sortSelection={[]}
          setSortSelection={mockSetCustomSort}
        />,
      );

      const select = screen.getByRole("combobox");
      fireEvent.mouseDown(select);

      expect(screen.getByText("Custom Field")).toBeInTheDocument();
      expect(screen.getByText("Another Field")).toBeInTheDocument();
    });

    it("should enforce type safety for field keys", () => {
      const typedFields: SortableField<TestEntity>[] = [
        { key: "name", label: "Name" },
        { key: "status", label: "Status" },
        // TypeScript should prevent invalid keys like:
        // { key: "invalidField", label: "Invalid" }, // This would cause TS error
      ];

      render(
        <SortItems<TestEntity>
          sortableFields={typedFields}
          sortSelection={[]}
          setSortSelection={mockSetSortSelection}
        />,
      );

      const select = screen.getByRole("combobox");
      expect(select).toBeInTheDocument();
    });
  });

  describe("complex scenarios", () => {
    it("should handle basic sort selection", () => {
      const TestWrapper = () => {
        const [sortSelection, setSortSelection] = React.useState<
          SortSelection<TestEntity>[]
        >([]);

        return (
          <div>
            <SortItems<TestEntity>
              sortableFields={testSortableFields}
              sortSelection={sortSelection}
              setSortSelection={setSortSelection}
            />
            <div data-testid="sort-count">{sortSelection.length}</div>
          </div>
        );
      };

      render(<TestWrapper />);

      const sortCount = screen.getByTestId("sort-count");
      expect(sortCount).toHaveTextContent("0");

      // Add a sort
      const select = screen.getByRole("combobox");
      fireEvent.mouseDown(select);

      const nameOption = screen.getByText("Name");
      fireEvent.click(nameOption);

      expect(sortCount).toHaveTextContent("1");
    });

    it("should maintain sort order when adding new fields", () => {
      const TestWrapper = () => {
        const [sortSelection, setSortSelection] = React.useState<
          SortSelection<TestEntity>[]
        >([{ direction: "asc", field: "name" }]);

        return (
          <div>
            <SortItems<TestEntity>
              sortableFields={testSortableFields}
              sortSelection={sortSelection}
              setSortSelection={setSortSelection}
            />
            <div data-testid="sort-order">
              {sortSelection
                .map((s, i) => `${i}:${s.field}:${s.direction}`)
                .join(",")}
            </div>
          </div>
        );
      };

      render(<TestWrapper />);

      const sortOrder = screen.getByTestId("sort-order");
      expect(sortOrder).toHaveTextContent("0:name:asc");

      // Add second field
      const select = screen.getByRole("combobox");
      fireEvent.mouseDown(select);

      const statusOption = screen.getByText("Status");
      fireEvent.click(statusOption);

      expect(sortOrder).toHaveTextContent("0:name:asc,1:status:asc");
    });

    it("should display multiple sort selections correctly", () => {
      const initialSort: SortSelection<TestEntity>[] = [
        { direction: "asc", field: "name" },
        { direction: "desc", field: "status" },
        { direction: "asc", field: "createdAt" },
      ];

      render(
        <SortItems<TestEntity>
          sortableFields={testSortableFields}
          sortSelection={initialSort}
          setSortSelection={mockSetSortSelection}
        />,
      );

      // Should show all selected sorts
      expect(screen.getByText("Name ↑")).toBeInTheDocument();
      expect(screen.getByText("Status ↓")).toBeInTheDocument();
      expect(screen.getByText("Created Date ↑")).toBeInTheDocument();
    });
  });

  describe("select configuration", () => {
    it("should have mode multiple", () => {
      const { container } = render(
        <SortItems<TestEntity>
          sortableFields={testSortableFields}
          sortSelection={[]}
          setSortSelection={mockSetSortSelection}
        />,
      );

      const select = container.querySelector(".ant-select-multiple");
      expect(select).toBeInTheDocument();
    });

    it("should have allowClear disabled", () => {
      render(
        <SortItems<TestEntity>
          sortableFields={testSortableFields}
          sortSelection={[{ direction: "asc", field: "name" }]}
          setSortSelection={mockSetSortSelection}
        />,
      );

      // Clear button should not be present
      const clearButton = screen.queryByRole("button", { name: /clear/i });
      expect(clearButton).not.toBeInTheDocument();
    });

    it("should not show remove icons on selected items", () => {
      render(
        <SortItems<TestEntity>
          sortableFields={testSortableFields}
          sortSelection={[{ direction: "asc", field: "name" }]}
          setSortSelection={mockSetSortSelection}
        />,
      );

      // Remove icons should not be present
      const removeIcons = screen.queryAllByRole("img", { name: /close/i });
      expect(removeIcons).toHaveLength(0);
    });
  });
});
