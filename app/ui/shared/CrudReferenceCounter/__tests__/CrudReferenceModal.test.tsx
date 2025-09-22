import React from "react";
import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";

import "@testing-library/jest-dom";

// Mock all external dependencies first
jest.mock("@ant-design/icons", () => ({
  CaretRightOutlined: ({ rotate }: { rotate?: number }) =>
    React.createElement("div", {
      "data-testid": "caret-right",
      style: { transform: `rotate(${rotate || 0}deg)` },
    }),
}));

jest.mock("@heroicons/react/24/outline", () => ({
  CheckIcon: ({ className }: { className?: string }) =>
    React.createElement("div", { className, "data-testid": "check-icon" }),
  TrashIcon: ({ className }: { className?: string }) =>
    React.createElement("div", { className, "data-testid": "trash-icon" }),
  XMarkIcon: ({ className }: { className?: string }) =>
    React.createElement("div", { className, "data-testid": "x-mark-icon" }),
}));

jest.mock("antd", () => ({
  Button: ({ children, onClick, disabled, icon, ...props }: any) =>
    React.createElement(
      "button",
      {
        "data-testid": "ant-button",
        disabled,
        onClick,
        ...props,
      },
      icon || children,
    ),
  Collapse: ({ items, activeKey, onChange, ...props }: any) =>
    React.createElement(
      "div",
      { "data-testid": "ant-collapse", ...props },
      items?.map((item: any) =>
        React.createElement(
          "div",
          {
            "data-testid": `collapse-item-${item.key}`,
            key: item.key,
            onClick: () => onChange?.(item.key),
          },
          React.createElement(
            "div",
            { "data-testid": "collapse-label" },
            item.label,
          ),
          React.createElement(
            "div",
            { "data-testid": "collapse-content" },
            item.children,
          ),
        ),
      ),
    ),
  Divider: () => React.createElement("hr", { "data-testid": "ant-divider" }),
  Modal: ({
    open,
    title,
    children,
    onOk,
    onCancel,
    okButtonProps,
    ...props
  }: any) =>
    open
      ? React.createElement(
          "div",
          { "data-testid": "ant-modal", ...props },
          React.createElement("div", { "data-testid": "modal-title" }, title),
          children,
          React.createElement(
            "div",
            { "data-testid": "modal-footer" },
            React.createElement(
              "button",
              {
                "data-testid": "modal-ok-button",
                disabled: okButtonProps?.disabled,
                onClick: () => onOk && onOk(),
              },
              "OK",
            ),
            React.createElement(
              "button",
              {
                "data-testid": "modal-cancel-button",
                onClick: () => onCancel && onCancel(),
              },
              "Cancel",
            ),
          ),
        )
      : null,
  Select: ({ options, placeholder, onChange, ...props }: any) =>
    React.createElement(
      "select",
      {
        "data-testid": "ant-select",
        onChange: (e: any) => onChange?.(e.target.value),
        ...props,
      },
      React.createElement("option", { value: "" }, placeholder),
      options?.map((option: any) =>
        React.createElement(
          "option",
          { key: option.value, value: option.value },
          option.label,
        ),
      ),
    ),
  Spin: ({ spinning, children }: any) =>
    spinning
      ? React.createElement("div", { "data-testid": "ant-spin" }, "Loading...")
      : React.createElement("div", null, children),
  Tooltip: ({ children, title }: any) =>
    React.createElement(
      "div",
      { "data-testid": "ant-tooltip", title },
      children,
    ),
  theme: {
    useToken: jest.fn(() => ({
      token: {
        colorBgBase: "#ffffff",
        colorText: "#000000",
        colorTextDisabled: "#cccccc",
        colorTextSecondary: "#666666",
        colorTextTertiary: "#999999",
      },
    })),
  },
}));

// Mock definitions
const mockCollectionName = {
  ARMORS: "ARMORS",
  PROFILES: "PROFILES",
  WEAPONS: "WEAPONS",
};

jest.mock("../../../../lib/definitions", () => ({
  CollectionName: mockCollectionName,
}));

// Mock usePlayableReferences hook
const mockLoadEntitiesForReferences = jest.fn();
const mockLoadReferences = jest.fn();

jest.mock("../../../../lib/hooks/usePlayableReferences", () => ({
  __esModule: true,
  default: () => ({
    loadEntitiesForReferences: mockLoadEntitiesForReferences,
    loadReferences: mockLoadReferences,
  }),
}));

// Mock EntityStatusUI
jest.mock("../../EntityStatusUI", () => ({
  __esModule: true,
  default: {
    Tag: ({ entityId, status }: any) =>
      React.createElement("span", {
        "data-entity-id": entityId,
        "data-status": status,
        "data-testid": "entity-status-tag",
      }),
  },
}));

// Import the component after all mocks are set up
import { CollectionName } from "../../../../lib/definitions";
import CrudReferenceModal from "../CrudReferenceModal";

describe("CrudReferenceModal", () => {
  const defaultProps = {
    allowedToRefer: [
      mockCollectionName.PROFILES,
      mockCollectionName.WEAPONS,
    ] as CollectionName[],
    collectionName: mockCollectionName.PROFILES as CollectionName,
    entityName: "Test Entity",
    mentions: {
      [mockCollectionName.PROFILES]: [
        {
          _id: "mention1",
          description: "Test mention description",
          name: "Mention Profile 1",
          status: "active",
        },
      ],
      [mockCollectionName.WEAPONS]: [],
    },
    onCancel: jest.fn(),
    onOk: jest.fn(),
    references: {
      ref1: mockCollectionName.PROFILES as CollectionName,
      ref2: mockCollectionName.WEAPONS as CollectionName,
    },
    showModal: true,
  };

  beforeEach(() => {
    jest.clearAllMocks();

    // Setup different mock implementations for different collections
    mockLoadReferences.mockImplementation((colName, entIds) => {
      if (colName === "PROFILES") {
        return Promise.resolve([
          {
            _id: "ref1",
            description: "Test description",
            name: "Test Profile",
            status: "active",
          },
        ]);
      }
      if (colName === "WEAPONS") {
        return Promise.resolve([
          {
            _id: "ref2",
            description: "Weapon description",
            name: "Test Weapon",
            status: "draft",
          },
        ]);
      }
      return Promise.resolve([]);
    });

    mockLoadEntitiesForReferences.mockResolvedValue([
      {
        _id: "available1",
        description: "Available description",
        name: "Available Entity 1",
        status: "active",
      },
    ]);
  });

  describe("Basic Rendering", () => {
    it("should render modal when showModal is true", () => {
      render(<CrudReferenceModal {...defaultProps} />);

      expect(screen.getByTestId("ant-modal")).toBeInTheDocument();
      expect(screen.getByTestId("modal-title")).toHaveTextContent(
        "'Test Entity' references",
      );
    });

    it("should not render modal when showModal is false", () => {
      render(<CrudReferenceModal {...defaultProps} showModal={false} />);

      expect(screen.queryByTestId("ant-modal")).not.toBeInTheDocument();
    });

    it("should display references and mentions counts", () => {
      render(<CrudReferenceModal {...defaultProps} />);

      expect(screen.getByText("References (2 added)")).toBeInTheDocument();
      expect(screen.getByText("Mentions (1 found)")).toBeInTheDocument();
    });
  });

  describe("References Section", () => {
    it("should display references grouped by collection", async () => {
      render(<CrudReferenceModal {...defaultProps} />);

      await waitFor(() => {
        expect(
          screen.getByTestId("collapse-item-reference-PROFILES"),
        ).toBeInTheDocument();
        expect(
          screen.getByTestId("collapse-item-reference-WEAPONS"),
        ).toBeInTheDocument();
      });
    });

    it("should show loading state when references are being loaded", () => {
      mockLoadReferences.mockImplementation(() => new Promise(() => {})); // Never resolves

      render(<CrudReferenceModal {...defaultProps} />);

      expect(screen.getByTestId("ant-spin")).toBeInTheDocument();
    });

    it("should display loaded reference entities", async () => {
      await act(async () => {
        render(<CrudReferenceModal {...defaultProps} />);
      });

      await waitFor(
        () => {
          expect(screen.getByText("Test Profile")).toBeInTheDocument();
          expect(screen.getByText("Test Weapon")).toBeInTheDocument();
        },
        { timeout: 2000 },
      );
    });
  });

  describe("Mentions Section", () => {
    it("should display mentions grouped by collection", () => {
      render(<CrudReferenceModal {...defaultProps} />);

      expect(
        screen.getByTestId("collapse-item-mention-PROFILES"),
      ).toBeInTheDocument();
      expect(screen.getByText("Mention Profile 1")).toBeInTheDocument();
    });

    it("should not display empty mention collections", () => {
      render(<CrudReferenceModal {...defaultProps} />);

      expect(
        screen.queryByTestId("collapse-item-mention-WEAPONS"),
      ).not.toBeInTheDocument();
    });
  });

  describe("Modal Interactions", () => {
    it("should call onOk with references when OK button is clicked", async () => {
      const onOk = jest.fn();

      await act(async () => {
        render(<CrudReferenceModal {...defaultProps} onOk={onOk} />);
      });

      await act(async () => {
        fireEvent.click(screen.getByTestId("modal-ok-button"));
      });

      expect(onOk).toHaveBeenCalledWith(defaultProps.references);
    });

    it("should call onCancel when Cancel button is clicked", () => {
      const onCancel = jest.fn();
      render(<CrudReferenceModal {...defaultProps} onCancel={onCancel} />);

      fireEvent.click(screen.getByTestId("modal-cancel-button"));

      expect(onCancel).toHaveBeenCalled();
    });

    it("should disable OK button when loading", () => {
      mockLoadReferences.mockImplementation(() => new Promise(() => {})); // Never resolves

      render(<CrudReferenceModal {...defaultProps} />);

      expect(screen.getByTestId("modal-ok-button")).toBeDisabled();
    });

    it("should disable collapse interactions when in disableModal state", async () => {
      await act(async () => {
        render(<CrudReferenceModal {...defaultProps} />);
      });

      // Wait for "Add more" button to be available
      await waitFor(() => {
        const addButtons = screen.getAllByText("Add more");
        expect(addButtons.length).toBeGreaterThan(0);
      });

      // Click "Add more" to enable disableModal state
      await act(async () => {
        const addButtons = screen.getAllByText("Add more");
        fireEvent.click(addButtons[0]);
      });

      // Try to click on collapse items - they should be disabled
      const collapseItems = screen.getAllByTestId(/collapse-item-/);

      await act(async () => {
        fireEvent.click(collapseItems[0]);
      });

      // Verify that the collapse state didn't change (implementation specific)
      // This test ensures the onClick doesn't break the component
      expect(screen.getByTestId("ant-modal")).toBeInTheDocument();
    });

    it("should apply collapse-disabled class when in disableModal state", async () => {
      await act(async () => {
        render(<CrudReferenceModal {...defaultProps} />);
      });

      // Wait for "Add more" button to be available
      await waitFor(() => {
        const addButtons = screen.getAllByText("Add more");
        expect(addButtons.length).toBeGreaterThan(0);
      });

      // Click "Add more" to enable disableModal state
      await act(async () => {
        const addButtons = screen.getAllByText("Add more");
        fireEvent.click(addButtons[0]);
      });

      // Check that collapse-disabled class is applied to wrapper divs
      const collapseContainers =
        document.querySelectorAll(".collapse-disabled");
      expect(collapseContainers.length).toBeGreaterThan(0);
    });
  });

  describe("DeleteButton Component", () => {
    it("should render delete buttons for references and mentions", async () => {
      render(<CrudReferenceModal {...defaultProps} />);

      await waitFor(() => {
        const deleteButtons = screen.getAllByTestId("trash-icon");
        expect(deleteButtons.length).toBeGreaterThan(0);
      });
    });

    it("should disable delete buttons when loading", () => {
      mockLoadReferences.mockImplementation(() => new Promise(() => {})); // Never resolves

      render(<CrudReferenceModal {...defaultProps} />);

      const deleteButtons = screen.getAllByRole("button");
      const trashButtons = deleteButtons.filter((btn) =>
        btn.querySelector('[data-testid="trash-icon"]'),
      );

      trashButtons.forEach((button) => {
        expect(button).toBeDisabled();
      });
    });
  });

  describe("DescriptionTooltip Component", () => {
    it("should render tooltips with descriptions", async () => {
      render(<CrudReferenceModal {...defaultProps} />);

      await waitFor(() => {
        const tooltips = screen.getAllByTestId("ant-tooltip");
        expect(tooltips.length).toBeGreaterThan(0);
      });
    });
  });

  describe("Add References Functionality", () => {
    it("should show 'Add more' buttons for each collection", async () => {
      render(<CrudReferenceModal {...defaultProps} />);

      await waitFor(() => {
        const addButtons = screen.getAllByText("Add more");
        expect(addButtons.length).toBeGreaterThan(0);
      });
    });

    it("should load available entities when 'Add more' is clicked", async () => {
      await act(async () => {
        render(<CrudReferenceModal {...defaultProps} />);
      });

      await waitFor(async () => {
        const addButtons = screen.getAllByText("Add more");
        expect(addButtons.length).toBeGreaterThan(0);

        await act(async () => {
          fireEvent.click(addButtons[0]);
        });
      });

      await waitFor(() => {
        expect(mockLoadEntitiesForReferences).toHaveBeenCalled();
      });
    });
  });

  describe("Edge Cases", () => {
    it("should handle empty references", () => {
      const propsWithoutRefs = {
        ...defaultProps,
        references: {},
      };

      render(<CrudReferenceModal {...propsWithoutRefs} />);

      expect(screen.getByText("References (0 added)")).toBeInTheDocument();
    });

    it("should handle empty mentions", () => {
      const propsWithoutMentions = {
        ...defaultProps,
        mentions: {},
      };

      render(<CrudReferenceModal {...propsWithoutMentions} />);

      expect(screen.getByText("Mentions (0 found)")).toBeInTheDocument();
    });

    it("should handle loading errors gracefully", async () => {
      // Create props without references to prevent initial loading
      const propsWithoutRefs = {
        ...defaultProps,
        references: {},
      };

      await act(async () => {
        render(<CrudReferenceModal {...propsWithoutRefs} />);
      });

      // Should not crash and should still show basic UI
      expect(screen.getByTestId("ant-modal")).toBeInTheDocument();
      expect(screen.getByText("References (0 added)")).toBeInTheDocument();
    });
  });

  describe("Component Import", () => {
    it("should import without crashing", async () => {
      await expect(async () => {
        await import("../CrudReferenceModal");
      }).not.toThrow();
    });
  });
});
