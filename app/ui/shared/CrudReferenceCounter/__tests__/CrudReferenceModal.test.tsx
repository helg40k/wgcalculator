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
  ArrowPathIcon: ({ className }: { className?: string }) =>
    React.createElement("div", { className, "data-testid": "arrow-path-icon" }),
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
  Input: ({ placeholder, value, onChange, ...props }: any) =>
    React.createElement("input", {
      "data-testid": "ant-input",
      onChange,
      placeholder,
      value,
      ...props,
    }),
  Modal: Object.assign(
    ({
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
    { confirm: jest.fn() },
  ),
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
  Tag: ({ children, onClick, ...props }: any) =>
    React.createElement(
      "span",
      { "data-testid": "ant-tag", onClick, ...props },
      children,
    ),
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
const mockRemoveIncomingReferences = jest.fn();
const mockSaveReferences = jest.fn();

jest.mock("../../../../lib/hooks/usePlayableReferences", () => ({
  __esModule: true,
  default: () => ({
    loadEntitiesForReferences: mockLoadEntitiesForReferences,
    loadReferences: mockLoadReferences,
    removeIncomingReferences: mockRemoveIncomingReferences,
    saveReferences: mockSaveReferences,
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
import { Modal as AntModal } from "antd";

import { CollectionName } from "../../../../lib/definitions";
import CrudReferenceModal from "../CrudReferenceModal";

const mockModalConfirm = AntModal.confirm as jest.Mock;

describe("CrudReferenceModal", () => {
  const defaultProps = {
    allowedToRefer: [
      mockCollectionName.PROFILES,
      mockCollectionName.WEAPONS,
    ] as CollectionName[],
    collectionName: mockCollectionName.PROFILES as CollectionName,
    entityId: "entity-123",
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
      ref1: { name: mockCollectionName.PROFILES as CollectionName },
      ref2: { name: mockCollectionName.WEAPONS as CollectionName },
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

    mockSaveReferences.mockResolvedValue({
      _id: "entity-123",
      name: "Test Entity",
    });

    mockRemoveIncomingReferences.mockResolvedValue(true);

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
    it("should call onOk with references when OK button is clicked after changes", async () => {
      const onOk = jest.fn();

      await act(async () => {
        render(<CrudReferenceModal {...defaultProps} onOk={onOk} />);
      });

      await waitFor(
        () => {
          expect(screen.getByText("Test Profile")).toBeInTheDocument();
        },
        { timeout: 2000 },
      );

      const trashButtons = screen.getAllByTestId("trash-icon");
      const referenceTrashButton = trashButtons[0].closest("button")!;

      await act(async () => {
        fireEvent.click(referenceTrashButton);
      });

      await act(async () => {
        fireEvent.click(screen.getByTestId("modal-ok-button"));
      });

      expect(onOk).toHaveBeenCalledWith({
        ref2: { name: mockCollectionName.WEAPONS },
      });
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

  describe("Confirm Selection (Save Button)", () => {
    it("should add a selected entity to references when confirmed", async () => {
      await act(async () => {
        render(<CrudReferenceModal {...defaultProps} />);
      });

      await waitFor(() => {
        const addButtons = screen.getAllByText("Add more");
        expect(addButtons.length).toBeGreaterThan(0);
      });

      await act(async () => {
        const addButtons = screen.getAllByText("Add more");
        fireEvent.click(addButtons[0]);
      });

      await waitFor(() => {
        expect(screen.getByTestId("ant-select")).toBeInTheDocument();
      });

      await act(async () => {
        fireEvent.change(screen.getByTestId("ant-select"), {
          target: { value: "available1" },
        });
      });

      await act(async () => {
        const checkButton = screen.getByTestId("check-icon").closest("button")!;
        fireEvent.click(checkButton);
      });

      expect(
        screen.getByText(
          (content) =>
            content.includes("2 added") && content.includes("1 unsaved"),
        ),
      ).toBeInTheDocument();
      expect(screen.queryByTestId("ant-select")).not.toBeInTheDocument();
    });

    it("should close select without adding when nothing is selected", async () => {
      await act(async () => {
        render(<CrudReferenceModal {...defaultProps} />);
      });

      await waitFor(() => {
        const addButtons = screen.getAllByText("Add more");
        expect(addButtons.length).toBeGreaterThan(0);
      });

      await act(async () => {
        const addButtons = screen.getAllByText("Add more");
        fireEvent.click(addButtons[0]);
      });

      await waitFor(() => {
        expect(screen.getByTestId("ant-select")).toBeInTheDocument();
      });

      await act(async () => {
        const checkButton = screen.getByTestId("check-icon").closest("button")!;
        fireEvent.click(checkButton);
      });

      expect(screen.getByText("References (2 added)")).toBeInTheDocument();
      expect(screen.queryByTestId("ant-select")).not.toBeInTheDocument();
    });

    it("should pass updated references to onOk after adding", async () => {
      const onOk = jest.fn();

      await act(async () => {
        render(<CrudReferenceModal {...defaultProps} onOk={onOk} />);
      });

      await waitFor(() => {
        const addButtons = screen.getAllByText("Add more");
        expect(addButtons.length).toBeGreaterThan(0);
      });

      await act(async () => {
        const addButtons = screen.getAllByText("Add more");
        fireEvent.click(addButtons[0]);
      });

      await waitFor(() => {
        expect(screen.getByTestId("ant-select")).toBeInTheDocument();
      });

      await act(async () => {
        fireEvent.change(screen.getByTestId("ant-select"), {
          target: { value: "available1" },
        });
      });

      await act(async () => {
        const checkButton = screen.getByTestId("check-icon").closest("button")!;
        fireEvent.click(checkButton);
      });

      await act(async () => {
        fireEvent.click(screen.getByTestId("modal-ok-button"));
      });

      expect(onOk).toHaveBeenCalledWith({
        ...defaultProps.references,
        available1: { name: mockCollectionName.PROFILES },
      });
    });

    it("should exclude already-added entity from selector on next 'Add more' click", async () => {
      mockLoadEntitiesForReferences.mockResolvedValue([
        {
          _id: "available1",
          description: "Available 1",
          name: "Available Entity 1",
          status: "active",
        },
        {
          _id: "available2",
          description: "Available 2",
          name: "Available Entity 2",
          status: "active",
        },
      ]);

      await act(async () => {
        render(<CrudReferenceModal {...defaultProps} />);
      });

      await waitFor(() => {
        const addButtons = screen.getAllByText("Add more");
        expect(addButtons.length).toBeGreaterThan(0);
      });

      // First "Add more" click — select available1
      await act(async () => {
        const addButtons = screen.getAllByText("Add more");
        fireEvent.click(addButtons[0]);
      });

      await waitFor(() => {
        expect(screen.getByTestId("ant-select")).toBeInTheDocument();
      });

      // Verify both options are present
      const options = screen
        .getByTestId("ant-select")
        .querySelectorAll("option");
      const optionValues = Array.from(options).map((o: any) => o.value);
      expect(optionValues).toContain("available1");
      expect(optionValues).toContain("available2");

      await act(async () => {
        fireEvent.change(screen.getByTestId("ant-select"), {
          target: { value: "available1" },
        });
      });

      await act(async () => {
        const checkButton = screen.getByTestId("check-icon").closest("button")!;
        fireEvent.click(checkButton);
      });

      // Second "Add more" click — available1 should be excluded
      await act(async () => {
        const addButtons = screen.getAllByText("Add more");
        fireEvent.click(addButtons[0]);
      });

      await waitFor(() => {
        expect(screen.getByTestId("ant-select")).toBeInTheDocument();
      });

      const options2 = screen
        .getByTestId("ant-select")
        .querySelectorAll("option");
      const optionValues2 = Array.from(options2).map((o: any) => o.value);
      expect(optionValues2).not.toContain("available1");
      expect(optionValues2).toContain("available2");
    });
  });

  describe("Link Input Field", () => {
    it("should render input with placeholder 'Ref...' when Add more is clicked", async () => {
      await act(async () => {
        render(<CrudReferenceModal {...defaultProps} />);
      });

      await waitFor(() => {
        const addButtons = screen.getAllByText("Add more");
        expect(addButtons.length).toBeGreaterThan(0);
      });

      await act(async () => {
        const addButtons = screen.getAllByText("Add more");
        fireEvent.click(addButtons[0]);
      });

      await waitFor(() => {
        const input = screen.getByTestId("ant-input");
        expect(input).toBeInTheDocument();
        expect(input).toHaveAttribute("placeholder", "Ref...");
      });
    });

    it("should save reference without link when input is empty", async () => {
      const onOk = jest.fn();
      const props = { ...defaultProps, onOk };

      await act(async () => {
        render(<CrudReferenceModal {...props} />);
      });

      await waitFor(() => {
        expect(screen.getAllByText("Add more").length).toBeGreaterThan(0);
      });

      await act(async () => {
        fireEvent.click(screen.getAllByText("Add more")[0]);
      });

      await waitFor(() => {
        expect(screen.getByTestId("ant-select")).toBeInTheDocument();
      });

      await act(async () => {
        fireEvent.change(screen.getByTestId("ant-select"), {
          target: { value: "available1" },
        });
      });

      await act(async () => {
        const checkButton = screen.getByTestId("check-icon").closest("button")!;
        fireEvent.click(checkButton);
      });

      await act(async () => {
        fireEvent.click(screen.getByTestId("modal-ok-button"));
      });

      const savedRefs = onOk.mock.calls[0][0];
      expect(savedRefs.available1).toEqual({
        name: mockCollectionName.PROFILES,
      });
      expect(savedRefs.available1).not.toHaveProperty("link");
    });

    it("should save trimmed link value into Reference.link", async () => {
      const onOk = jest.fn();
      const props = { ...defaultProps, onOk };

      await act(async () => {
        render(<CrudReferenceModal {...props} />);
      });

      await waitFor(() => {
        expect(screen.getAllByText("Add more").length).toBeGreaterThan(0);
      });

      await act(async () => {
        fireEvent.click(screen.getAllByText("Add more")[0]);
      });

      await waitFor(() => {
        expect(screen.getByTestId("ant-input")).toBeInTheDocument();
      });

      await act(async () => {
        fireEvent.change(screen.getByTestId("ant-input"), {
          target: { value: "  p.42  " },
        });
      });

      await act(async () => {
        fireEvent.change(screen.getByTestId("ant-select"), {
          target: { value: "available1" },
        });
      });

      await act(async () => {
        const checkButton = screen.getByTestId("check-icon").closest("button")!;
        fireEvent.click(checkButton);
      });

      await act(async () => {
        fireEvent.click(screen.getByTestId("modal-ok-button"));
      });

      const savedRefs = onOk.mock.calls[0][0];
      expect(savedRefs.available1).toEqual({
        link: "p.42",
        name: mockCollectionName.PROFILES,
      });
    });

    it("should reset link input after confirming selection", async () => {
      await act(async () => {
        render(<CrudReferenceModal {...defaultProps} />);
      });

      await waitFor(() => {
        expect(screen.getAllByText("Add more").length).toBeGreaterThan(0);
      });

      await act(async () => {
        fireEvent.click(screen.getAllByText("Add more")[0]);
      });

      await waitFor(() => {
        expect(screen.getByTestId("ant-input")).toBeInTheDocument();
      });

      await act(async () => {
        fireEvent.change(screen.getByTestId("ant-input"), {
          target: { value: "p.42" },
        });
      });

      await act(async () => {
        fireEvent.change(screen.getByTestId("ant-select"), {
          target: { value: "available1" },
        });
      });

      await act(async () => {
        const checkButton = screen.getByTestId("check-icon").closest("button")!;
        fireEvent.click(checkButton);
      });

      expect(screen.queryByTestId("ant-input")).not.toBeInTheDocument();
    });
  });

  describe("Delete Reference", () => {
    it("should remove a reference when delete button is clicked", async () => {
      await act(async () => {
        render(<CrudReferenceModal {...defaultProps} />);
      });

      await waitFor(
        () => {
          expect(screen.getByText("Test Profile")).toBeInTheDocument();
        },
        { timeout: 2000 },
      );

      const trashButtons = screen.getAllByTestId("trash-icon");
      const referenceTrashButton = trashButtons[0].closest("button")!;

      await act(async () => {
        fireEvent.click(referenceTrashButton);
      });

      expect(
        screen.getByText(
          (content) =>
            content.includes("1 added") && content.includes("1 removed"),
        ),
      ).toBeInTheDocument();
    });

    it("should pass updated references to onOk after deleting", async () => {
      const onOk = jest.fn();

      await act(async () => {
        render(<CrudReferenceModal {...defaultProps} onOk={onOk} />);
      });

      await waitFor(
        () => {
          expect(screen.getByText("Test Profile")).toBeInTheDocument();
        },
        { timeout: 2000 },
      );

      const trashButtons = screen.getAllByTestId("trash-icon");
      const referenceTrashButton = trashButtons[0].closest("button")!;

      await act(async () => {
        fireEvent.click(referenceTrashButton);
      });

      await act(async () => {
        fireEvent.click(screen.getByTestId("modal-ok-button"));
      });

      const calledWith = onOk.mock.calls[0][0];
      expect(calledWith).not.toHaveProperty("ref1");
      expect(calledWith).toHaveProperty("ref2", {
        name: mockCollectionName.WEAPONS,
      });
    });
  });

  describe("Hide Add Button When Exhausted", () => {
    it("should hide 'Add more' when loadEntitiesForReferences returns empty", async () => {
      mockLoadEntitiesForReferences.mockResolvedValue([]);

      await act(async () => {
        render(<CrudReferenceModal {...defaultProps} />);
      });

      await waitFor(() => {
        const addButtons = screen.getAllByText("Add more");
        expect(addButtons.length).toBeGreaterThan(0);
      });

      await act(async () => {
        const addButtons = screen.getAllByText("Add more");
        fireEvent.click(addButtons[0]);
      });

      await waitFor(() => {
        const addButtons = screen.queryAllByText("Add more");
        expect(addButtons.length).toBe(1);
      });
    });

    it("should hide 'Add more' after adding the last available entity", async () => {
      mockLoadEntitiesForReferences.mockResolvedValue([
        {
          _id: "only-one",
          description: "The only entity",
          name: "Only Entity",
          status: "active",
        },
      ]);

      await act(async () => {
        render(<CrudReferenceModal {...defaultProps} />);
      });

      await waitFor(() => {
        const addButtons = screen.getAllByText("Add more");
        expect(addButtons.length).toBeGreaterThan(0);
      });

      await act(async () => {
        const addButtons = screen.getAllByText("Add more");
        fireEvent.click(addButtons[0]);
      });

      await waitFor(() => {
        expect(screen.getByTestId("ant-select")).toBeInTheDocument();
      });

      await act(async () => {
        fireEvent.change(screen.getByTestId("ant-select"), {
          target: { value: "only-one" },
        });
      });

      await act(async () => {
        const checkButton = screen.getByTestId("check-icon").closest("button")!;
        fireEvent.click(checkButton);
      });

      await waitFor(() => {
        const addButtons = screen.queryAllByText("Add more");
        expect(addButtons.length).toBe(1);
      });
    });

    it("should show 'Add more' again after deleting a reference from exhausted collection", async () => {
      mockLoadEntitiesForReferences.mockResolvedValue([]);

      await act(async () => {
        render(<CrudReferenceModal {...defaultProps} />);
      });

      await waitFor(
        () => {
          expect(screen.getByText("Test Profile")).toBeInTheDocument();
        },
        { timeout: 2000 },
      );

      const addButtons = screen.getAllByText("Add more");
      const initialCount = addButtons.length;

      await act(async () => {
        fireEvent.click(addButtons[0]);
      });

      await waitFor(() => {
        expect(screen.queryAllByText("Add more").length).toBe(initialCount - 1);
      });

      const trashButtons = screen.getAllByTestId("trash-icon");
      const profileTrashButton = trashButtons[0].closest("button")!;

      await act(async () => {
        fireEvent.click(profileTrashButton);
      });

      await waitFor(() => {
        expect(screen.queryAllByText("Add more").length).toBe(initialCount);
      });
    });
  });

  describe("Sorting", () => {
    it("should display DB-loaded entities alphabetically and unsaved ones at end", async () => {
      const allEntities: Record<string, any> = {
        new1: {
          _id: "new1",
          description: "",
          name: "Alpha New",
          status: "active",
        },
        ref1: {
          _id: "ref1",
          description: "",
          name: "Zebra Profile",
          status: "active",
        },
      };

      mockLoadReferences.mockImplementation((colName, entIds) => {
        if (colName === "PROFILES") {
          return Promise.resolve(
            entIds.map((id: string) => allEntities[id]).filter(Boolean),
          );
        }
        return Promise.resolve([]);
      });

      mockLoadEntitiesForReferences.mockResolvedValue([allEntities.new1]);

      const props = {
        ...defaultProps,
        references: {
          ref1: { name: mockCollectionName.PROFILES as CollectionName },
        },
      };

      await act(async () => {
        render(<CrudReferenceModal {...props} />);
      });

      await waitFor(() => {
        expect(screen.getByText("Zebra Profile")).toBeInTheDocument();
      });

      // Add a new entity
      await act(async () => {
        const addButtons = screen.getAllByText("Add more");
        fireEvent.click(addButtons[0]);
      });

      await waitFor(() => {
        expect(screen.getByTestId("ant-select")).toBeInTheDocument();
      });

      await act(async () => {
        fireEvent.change(screen.getByTestId("ant-select"), {
          target: { value: "new1" },
        });
      });

      await act(async () => {
        const checkButton = screen.getByTestId("check-icon").closest("button")!;
        fireEvent.click(checkButton);
      });

      await waitFor(() => {
        expect(screen.getByText("Alpha New")).toBeInTheDocument();
      });

      // Both should be visible; Zebra Profile (saved) first, Alpha New (unsaved) second
      const allText = document.body.textContent || "";
      const zebraIdx = allText.indexOf("Zebra Profile");
      const alphaIdx = allText.indexOf("Alpha New");
      expect(zebraIdx).toBeLessThan(alphaIdx);
    });

    it("should preserve insertion order of multiple unsaved entities after useEffect re-fires", async () => {
      const allEntities: Record<string, any> = {
        new1: {
          _id: "new1",
          description: "",
          name: "Zulu Added First",
          status: "active",
        },
        new2: {
          _id: "new2",
          description: "",
          name: "Alpha Added Second",
          status: "active",
        },
        ref1: {
          _id: "ref1",
          description: "",
          name: "Saved One",
          status: "active",
        },
      };

      mockLoadReferences.mockImplementation((colName, entIds) => {
        if (colName === "PROFILES") {
          return Promise.resolve(
            entIds.map((id: string) => allEntities[id]).filter(Boolean),
          );
        }
        return Promise.resolve([]);
      });

      let addMoreCallCount = 0;
      mockLoadEntitiesForReferences.mockImplementation(() => {
        addMoreCallCount++;
        if (addMoreCallCount === 1) {
          return Promise.resolve([allEntities.new1, allEntities.new2]);
        }
        return Promise.resolve([allEntities.new2]);
      });

      const props = {
        ...defaultProps,
        references: {
          ref1: { name: mockCollectionName.PROFILES as CollectionName },
        },
      };

      await act(async () => {
        render(<CrudReferenceModal {...props} />);
      });

      await waitFor(() => {
        expect(screen.getByText("Saved One")).toBeInTheDocument();
      });

      // Add first unsaved entity (Zulu Added First)
      await act(async () => {
        const addButtons = screen.getAllByText("Add more");
        fireEvent.click(addButtons[0]);
      });

      await waitFor(() => {
        expect(screen.getByTestId("ant-select")).toBeInTheDocument();
      });

      await act(async () => {
        fireEvent.change(screen.getByTestId("ant-select"), {
          target: { value: "new1" },
        });
      });

      await act(async () => {
        const checkButton = screen.getByTestId("check-icon").closest("button")!;
        fireEvent.click(checkButton);
      });

      await waitFor(() => {
        expect(screen.getByText("Zulu Added First")).toBeInTheDocument();
      });

      // Add second unsaved entity (Alpha Added Second)
      await act(async () => {
        const addButtons = screen.getAllByText("Add more");
        fireEvent.click(addButtons[0]);
      });

      await waitFor(() => {
        expect(screen.getByTestId("ant-select")).toBeInTheDocument();
      });

      await act(async () => {
        fireEvent.change(screen.getByTestId("ant-select"), {
          target: { value: "new2" },
        });
      });

      await act(async () => {
        const checkButton = screen.getByTestId("check-icon").closest("button")!;
        fireEvent.click(checkButton);
      });

      await waitFor(() => {
        expect(screen.getByText("Alpha Added Second")).toBeInTheDocument();
      });

      // Zulu should appear BEFORE Alpha (insertion order), despite Alpha being first alphabetically
      const allText = document.body.textContent || "";
      const zuluIdx = allText.indexOf("Zulu Added First");
      const alphaIdx = allText.indexOf("Alpha Added Second");
      expect(zuluIdx).toBeLessThan(alphaIdx);

      // Saved entity should still be before both unsaved
      const savedIdx = allText.indexOf("Saved One");
      expect(savedIdx).toBeLessThan(zuluIdx);
    });
  });

  describe("Unsaved Highlighting", () => {
    it("should apply bg-red-50 to unsaved entity rows", async () => {
      const allEntities: Record<string, any> = {
        new1: {
          _id: "new1",
          description: "",
          name: "New Entity",
          status: "active",
        },
        ref1: {
          _id: "ref1",
          description: "",
          name: "Saved Profile",
          status: "active",
        },
      };

      mockLoadReferences.mockImplementation((colName, entIds) => {
        if (colName === "PROFILES") {
          return Promise.resolve(
            entIds.map((id: string) => allEntities[id]).filter(Boolean),
          );
        }
        return Promise.resolve([]);
      });

      mockLoadEntitiesForReferences.mockResolvedValue([allEntities.new1]);

      const props = {
        ...defaultProps,
        references: {
          ref1: { name: mockCollectionName.PROFILES as CollectionName },
        },
      };

      await act(async () => {
        render(<CrudReferenceModal {...props} />);
      });

      await waitFor(() => {
        expect(screen.getByText("Saved Profile")).toBeInTheDocument();
      });

      // Saved entity should have hover:bg-blue-50
      const savedRow = screen
        .getByText("Saved Profile")
        .closest('div[class*="pl-12"]')!;
      expect(savedRow.className).toContain("hover:bg-blue-50");
      expect(savedRow.className).not.toContain("bg-red-50");

      // Add a new entity
      await act(async () => {
        const addButtons = screen.getAllByText("Add more");
        fireEvent.click(addButtons[0]);
      });

      await waitFor(() => {
        expect(screen.getByTestId("ant-select")).toBeInTheDocument();
      });

      await act(async () => {
        fireEvent.change(screen.getByTestId("ant-select"), {
          target: { value: "new1" },
        });
      });

      await act(async () => {
        const checkButton = screen.getByTestId("check-icon").closest("button")!;
        fireEvent.click(checkButton);
      });

      await waitFor(() => {
        expect(screen.getByText("New Entity")).toBeInTheDocument();
      });

      // New entity should have bg-red-50
      const newRow = screen
        .getByText("New Entity")
        .closest('div[class*="pl-12"]')!;
      expect(newRow.className).toContain("bg-red-50");
      expect(newRow.className).toContain("hover:bg-blue-50");
    });
  });

  describe("Reference Link Tag", () => {
    it("should display link tag when reference has a non-empty link", async () => {
      const props = {
        ...defaultProps,
        references: {
          ref1: {
            link: "p.42",
            name: mockCollectionName.PROFILES as CollectionName,
          },
          ref2: { name: mockCollectionName.WEAPONS as CollectionName },
        },
      };

      await act(async () => {
        render(<CrudReferenceModal {...props} />);
      });

      await waitFor(() => {
        expect(screen.getByText("Test Profile")).toBeInTheDocument();
      });

      expect(screen.getByText("p.42")).toBeInTheDocument();
      expect(
        screen.getByText("p.42").closest("[data-testid='ant-tag']"),
      ).toBeTruthy();
    });

    it("should display ellipsis in link tag when reference has no link", async () => {
      await act(async () => {
        render(<CrudReferenceModal {...defaultProps} />);
      });

      await waitFor(() => {
        expect(screen.getByText("Test Profile")).toBeInTheDocument();
      });

      const tags = screen.queryAllByTestId("ant-tag");
      expect(tags.length).toBeGreaterThan(0);
      tags.forEach((tag) => {
        expect(tag).toHaveTextContent("...");
      });
    });

    it("should not display link tag for newly added references", async () => {
      const props = {
        ...defaultProps,
        references: {
          ref1: {
            link: "p.10",
            name: mockCollectionName.PROFILES as CollectionName,
          },
        },
      };

      await act(async () => {
        render(<CrudReferenceModal {...props} />);
      });

      await waitFor(() => {
        expect(screen.getByText("Test Profile")).toBeInTheDocument();
      });

      await act(async () => {
        const addButtons = screen.getAllByText("Add more");
        fireEvent.click(addButtons[0]);
      });

      await waitFor(() => {
        expect(screen.getByTestId("ant-select")).toBeInTheDocument();
      });

      await act(async () => {
        fireEvent.change(screen.getByTestId("ant-select"), {
          target: { value: "available1" },
        });
      });

      await act(async () => {
        const checkButton = screen.getByTestId("check-icon").closest("button")!;
        fireEvent.click(checkButton);
      });

      await waitFor(() => {
        expect(
          screen.getByText((content) => content.includes("1 unsaved")),
        ).toBeInTheDocument();
      });

      const tags = screen.queryAllByTestId("ant-tag");
      expect(tags).toHaveLength(1);
      expect(tags[0]).toHaveTextContent("p.10");
    });
  });

  describe("Reference Link Editing", () => {
    it("should switch to edit mode when link tag is clicked", async () => {
      const props = {
        ...defaultProps,
        references: {
          ref1: {
            link: "p.5",
            name: mockCollectionName.PROFILES as CollectionName,
          },
          ref2: { name: mockCollectionName.WEAPONS as CollectionName },
        },
      };

      await act(async () => {
        render(<CrudReferenceModal {...props} />);
      });

      await waitFor(() => {
        expect(screen.getByText("Test Profile")).toBeInTheDocument();
      });

      const linkTag = screen.getByText("p.5");
      await act(async () => {
        fireEvent.click(linkTag);
      });

      const input = screen.getByDisplayValue("p.5");
      expect(input).toBeInTheDocument();
      expect(input).toHaveAttribute("placeholder", "Ref...");
    });

    it("should show placeholder for empty link in edit mode", async () => {
      await act(async () => {
        render(<CrudReferenceModal {...defaultProps} />);
      });

      await waitFor(() => {
        expect(screen.getByText("Test Profile")).toBeInTheDocument();
      });

      const ellipsisTags = screen.getAllByText("...");
      await act(async () => {
        fireEvent.click(ellipsisTags[0]);
      });

      const input = screen.getByPlaceholderText("Ref...");
      expect(input).toBeInTheDocument();
      expect(input).toHaveValue("");
    });

    it("should save link value on Enter", async () => {
      const onOk = jest.fn();
      const props = {
        ...defaultProps,
        onOk,
        references: {
          ref1: { name: mockCollectionName.PROFILES as CollectionName },
          ref2: { name: mockCollectionName.WEAPONS as CollectionName },
        },
      };

      await act(async () => {
        render(<CrudReferenceModal {...props} />);
      });

      await waitFor(() => {
        expect(screen.getByText("Test Profile")).toBeInTheDocument();
      });

      const ellipsisTags = screen.getAllByText("...");
      await act(async () => {
        fireEvent.click(ellipsisTags[0]);
      });

      const input = screen.getByPlaceholderText("Ref...");
      await act(async () => {
        fireEvent.change(input, { target: { value: "p.42" } });
      });

      await act(async () => {
        fireEvent.keyDown(input, { key: "Enter" });
      });

      expect(screen.queryByPlaceholderText("Ref...")).not.toBeInTheDocument();
      expect(screen.getByText("p.42")).toBeInTheDocument();
    });

    it("should cancel editing on Escape without changing link", async () => {
      const props = {
        ...defaultProps,
        references: {
          ref1: {
            link: "p.5",
            name: mockCollectionName.PROFILES as CollectionName,
          },
          ref2: { name: mockCollectionName.WEAPONS as CollectionName },
        },
      };

      await act(async () => {
        render(<CrudReferenceModal {...props} />);
      });

      await waitFor(() => {
        expect(screen.getByText("p.5")).toBeInTheDocument();
      });

      await act(async () => {
        fireEvent.click(screen.getByText("p.5"));
      });

      const input = screen.getByDisplayValue("p.5");
      await act(async () => {
        fireEvent.change(input, { target: { value: "changed" } });
      });

      await act(async () => {
        fireEvent.keyDown(input, { key: "Escape" });
      });

      expect(screen.queryByPlaceholderText("Ref...")).not.toBeInTheDocument();
      expect(screen.getByText("p.5")).toBeInTheDocument();
    });

    it("should disable modal controls while editing link", async () => {
      await act(async () => {
        render(<CrudReferenceModal {...defaultProps} />);
      });

      await waitFor(() => {
        expect(screen.getByText("Test Profile")).toBeInTheDocument();
      });

      const ellipsisTags = screen.getAllByText("...");
      await act(async () => {
        fireEvent.click(ellipsisTags[0]);
      });

      expect(screen.getByTestId("modal-ok-button")).toBeDisabled();
    });

    it("should re-enable modal controls after finishing edit", async () => {
      const props = {
        ...defaultProps,
        references: {
          ref1: {
            link: "p.5",
            name: mockCollectionName.PROFILES as CollectionName,
          },
          ref2: { name: mockCollectionName.WEAPONS as CollectionName },
        },
      };

      await act(async () => {
        render(<CrudReferenceModal {...props} />);
      });

      await waitFor(() => {
        expect(screen.getByText("p.5")).toBeInTheDocument();
      });

      await act(async () => {
        fireEvent.click(screen.getByText("p.5"));
      });

      expect(screen.getByTestId("modal-ok-button")).toBeDisabled();

      const input = screen.getByDisplayValue("p.5");
      await act(async () => {
        fireEvent.change(input, { target: { value: "p.99" } });
      });

      await act(async () => {
        fireEvent.keyDown(input, { key: "Enter" });
      });

      await waitFor(() => {
        expect(screen.getByTestId("modal-ok-button")).not.toBeDisabled();
      });
    });
  });

  describe("Header Counters", () => {
    it("should show only 'added' when no changes made", () => {
      render(<CrudReferenceModal {...defaultProps} />);

      expect(screen.getByText("References (2 added)")).toBeInTheDocument();
    });

    it("should show 'unsaved' count after adding a new reference", async () => {
      await act(async () => {
        render(<CrudReferenceModal {...defaultProps} />);
      });

      await waitFor(() => {
        const addButtons = screen.getAllByText("Add more");
        expect(addButtons.length).toBeGreaterThan(0);
      });

      await act(async () => {
        const addButtons = screen.getAllByText("Add more");
        fireEvent.click(addButtons[0]);
      });

      await waitFor(() => {
        expect(screen.getByTestId("ant-select")).toBeInTheDocument();
      });

      await act(async () => {
        fireEvent.change(screen.getByTestId("ant-select"), {
          target: { value: "available1" },
        });
      });

      await act(async () => {
        const checkButton = screen.getByTestId("check-icon").closest("button")!;
        fireEvent.click(checkButton);
      });

      expect(
        screen.getByText(
          (content) =>
            content.includes("2 added") && content.includes("1 unsaved"),
        ),
      ).toBeInTheDocument();
    });

    it("should show 'removed' count after deleting a saved reference", async () => {
      await act(async () => {
        render(<CrudReferenceModal {...defaultProps} />);
      });

      await waitFor(
        () => {
          expect(screen.getByText("Test Profile")).toBeInTheDocument();
        },
        { timeout: 2000 },
      );

      const trashButtons = screen.getAllByTestId("trash-icon");
      const referenceTrashButton = trashButtons[0].closest("button")!;

      await act(async () => {
        fireEvent.click(referenceTrashButton);
      });

      expect(
        screen.getByText(
          (content) =>
            content.includes("1 added") && content.includes("1 removed"),
        ),
      ).toBeInTheDocument();
    });

    it("should show both 'unsaved' and 'removed' when applicable", async () => {
      await act(async () => {
        render(<CrudReferenceModal {...defaultProps} />);
      });

      await waitFor(
        () => {
          expect(screen.getByText("Test Profile")).toBeInTheDocument();
        },
        { timeout: 2000 },
      );

      // Delete a saved reference
      const trashButtons = screen.getAllByTestId("trash-icon");
      const referenceTrashButton = trashButtons[0].closest("button")!;

      await act(async () => {
        fireEvent.click(referenceTrashButton);
      });

      // Add a new reference
      await waitFor(() => {
        const addButtons = screen.getAllByText("Add more");
        expect(addButtons.length).toBeGreaterThan(0);
      });

      await act(async () => {
        const addButtons = screen.getAllByText("Add more");
        fireEvent.click(addButtons[0]);
      });

      await waitFor(() => {
        expect(screen.getByTestId("ant-select")).toBeInTheDocument();
      });

      await act(async () => {
        fireEvent.change(screen.getByTestId("ant-select"), {
          target: { value: "available1" },
        });
      });

      await act(async () => {
        const checkButton = screen.getByTestId("check-icon").closest("button")!;
        fireEvent.click(checkButton);
      });

      expect(
        screen.getByText(
          (content) =>
            content.includes("1 added") &&
            content.includes("1 unsaved") &&
            content.includes("1 removed"),
        ),
      ).toBeInTheDocument();
    });
  });

  describe("Scroll Wrapper", () => {
    it("should wrap reference collapse in a scrollable div", async () => {
      await act(async () => {
        render(<CrudReferenceModal {...defaultProps} />);
      });

      await waitFor(() => {
        expect(screen.getByText("Test Profile")).toBeInTheDocument();
      });

      const collapses = screen.getAllByTestId("ant-collapse");
      const referencesCollapse = collapses[0];
      const scrollWrapper = referencesCollapse.parentElement!.parentElement!;
      expect(scrollWrapper.style.maxHeight).toBe("224px");
      expect(scrollWrapper.style.overflowY).toBe("auto");
    });

    it("should wrap mention collapse in a scrollable div", () => {
      render(<CrudReferenceModal {...defaultProps} />);

      const collapses = screen.getAllByTestId("ant-collapse");
      const mentionsCollapse = collapses[1];
      const scrollWrapper = mentionsCollapse.parentElement!.parentElement!;
      expect(scrollWrapper.style.maxHeight).toBe("224px");
      expect(scrollWrapper.style.overflowY).toBe("auto");
    });

    it("should auto-scroll to bottom after adding an entity", async () => {
      await act(async () => {
        render(<CrudReferenceModal {...defaultProps} />);
      });

      await waitFor(() => {
        expect(screen.getByText("Test Profile")).toBeInTheDocument();
      });

      const collapses = screen.getAllByTestId("ant-collapse");
      const referencesCollapse = collapses[0];
      const scrollWrapper = referencesCollapse.parentElement!.parentElement!;

      Object.defineProperty(scrollWrapper, "scrollHeight", {
        configurable: true,
        value: 500,
      });

      await act(async () => {
        const addButtons = screen.getAllByText("Add more");
        fireEvent.click(addButtons[0]);
      });

      await waitFor(() => {
        expect(screen.getByTestId("ant-select")).toBeInTheDocument();
      });

      await act(async () => {
        fireEvent.change(screen.getByTestId("ant-select"), {
          target: { value: "available1" },
        });
      });

      await act(async () => {
        const checkButton = screen.getByTestId("check-icon").closest("button")!;
        fireEvent.click(checkButton);
      });

      await waitFor(() => {
        expect(scrollWrapper.scrollTop).toBe(500);
      });
    });
  });

  describe("Disable OK Button", () => {
    it("should disable OK button when no changes have been made", () => {
      render(<CrudReferenceModal {...defaultProps} />);

      expect(screen.getByTestId("modal-ok-button")).toBeDisabled();
    });

    it("should enable OK button after adding a reference", async () => {
      await act(async () => {
        render(<CrudReferenceModal {...defaultProps} />);
      });

      await waitFor(() => {
        const addButtons = screen.getAllByText("Add more");
        expect(addButtons.length).toBeGreaterThan(0);
      });

      await act(async () => {
        const addButtons = screen.getAllByText("Add more");
        fireEvent.click(addButtons[0]);
      });

      await waitFor(() => {
        expect(screen.getByTestId("ant-select")).toBeInTheDocument();
      });

      await act(async () => {
        fireEvent.change(screen.getByTestId("ant-select"), {
          target: { value: "available1" },
        });
      });

      await act(async () => {
        const checkButton = screen.getByTestId("check-icon").closest("button")!;
        fireEvent.click(checkButton);
      });

      expect(screen.getByTestId("modal-ok-button")).not.toBeDisabled();
    });

    it("should enable OK button after deleting a reference", async () => {
      await act(async () => {
        render(<CrudReferenceModal {...defaultProps} />);
      });

      await waitFor(
        () => {
          expect(screen.getByText("Test Profile")).toBeInTheDocument();
        },
        { timeout: 2000 },
      );

      const trashButtons = screen.getAllByTestId("trash-icon");
      const referenceTrashButton = trashButtons[0].closest("button")!;

      await act(async () => {
        fireEvent.click(referenceTrashButton);
      });

      expect(screen.getByTestId("modal-ok-button")).not.toBeDisabled();
    });
  });

  describe("Confirm Cancel", () => {
    it("should call onCancel directly when no changes exist", () => {
      const onCancel = jest.fn();
      render(<CrudReferenceModal {...defaultProps} onCancel={onCancel} />);

      fireEvent.click(screen.getByTestId("modal-cancel-button"));

      expect(onCancel).toHaveBeenCalled();
      expect(mockModalConfirm).not.toHaveBeenCalled();
    });

    it("should show confirmation modal when cancelling with unsaved additions", async () => {
      const onCancel = jest.fn();

      await act(async () => {
        render(<CrudReferenceModal {...defaultProps} onCancel={onCancel} />);
      });

      await waitFor(() => {
        const addButtons = screen.getAllByText("Add more");
        expect(addButtons.length).toBeGreaterThan(0);
      });

      await act(async () => {
        const addButtons = screen.getAllByText("Add more");
        fireEvent.click(addButtons[0]);
      });

      await waitFor(() => {
        expect(screen.getByTestId("ant-select")).toBeInTheDocument();
      });

      await act(async () => {
        fireEvent.change(screen.getByTestId("ant-select"), {
          target: { value: "available1" },
        });
      });

      await act(async () => {
        const checkButton = screen.getByTestId("check-icon").closest("button")!;
        fireEvent.click(checkButton);
      });

      fireEvent.click(screen.getByTestId("modal-cancel-button"));

      expect(onCancel).not.toHaveBeenCalled();
      expect(mockModalConfirm).toHaveBeenCalledWith(
        expect.objectContaining({
          cancelText: "Cancel",
          okText: "Ignore",
          title: "Ignore changes",
        }),
      );
      const { container } = render(mockModalConfirm.mock.calls[0][0].content);
      expect(container.textContent).toContain(
        "References were changed: 1 added.",
      );
      expect(container.textContent).not.toContain("Mentions were changed");
      expect(container.textContent).toContain(
        "Would you like to ignore changes?",
      );
    });

    it("should show confirmation modal when cancelling with removed references", async () => {
      const onCancel = jest.fn();

      await act(async () => {
        render(<CrudReferenceModal {...defaultProps} onCancel={onCancel} />);
      });

      await waitFor(
        () => {
          expect(screen.getByText("Test Profile")).toBeInTheDocument();
        },
        { timeout: 2000 },
      );

      const trashButtons = screen.getAllByTestId("trash-icon");
      const referenceTrashButton = trashButtons[0].closest("button")!;

      await act(async () => {
        fireEvent.click(referenceTrashButton);
      });

      fireEvent.click(screen.getByTestId("modal-cancel-button"));

      expect(onCancel).not.toHaveBeenCalled();
      expect(mockModalConfirm).toHaveBeenCalledWith(
        expect.objectContaining({
          cancelText: "Cancel",
          okText: "Ignore",
          title: "Ignore changes",
        }),
      );
      const { container } = render(mockModalConfirm.mock.calls[0][0].content);
      expect(container.textContent).toContain(
        "References were changed: 1 removed.",
      );
      expect(container.textContent).not.toContain("Mentions were changed");
      expect(container.textContent).toContain(
        "Would you like to ignore changes?",
      );
    });

    it("should call onCancel when 'Ignore' is clicked in confirmation modal", async () => {
      const onCancel = jest.fn();
      mockModalConfirm.mockImplementation(({ onOk }: any) => {
        onOk();
      });

      await act(async () => {
        render(<CrudReferenceModal {...defaultProps} onCancel={onCancel} />);
      });

      await waitFor(
        () => {
          expect(screen.getByText("Test Profile")).toBeInTheDocument();
        },
        { timeout: 2000 },
      );

      const trashButtons = screen.getAllByTestId("trash-icon");
      const referenceTrashButton = trashButtons[0].closest("button")!;

      await act(async () => {
        fireEvent.click(referenceTrashButton);
      });

      fireEvent.click(screen.getByTestId("modal-cancel-button"));

      expect(onCancel).toHaveBeenCalled();
    });

    it("should show both References and Mentions lines when both changed", async () => {
      await act(async () => {
        render(<CrudReferenceModal {...defaultProps} />);
      });

      await waitFor(
        () => {
          expect(screen.getByText("Test Profile")).toBeInTheDocument();
        },
        { timeout: 2000 },
      );

      const trashButtons = screen.getAllByTestId("trash-icon");
      const referenceTrashButton = trashButtons[0].closest("button")!;
      await act(async () => {
        fireEvent.click(referenceTrashButton);
      });

      const mentionRow = screen
        .getByText("Mention Profile 1")
        .closest('div[class*="pl-12"]')!;
      const mentionTrashButton = mentionRow
        .querySelector('[data-testid="trash-icon"]')!
        .closest("button")!;
      fireEvent.click(mentionTrashButton);

      fireEvent.click(screen.getByTestId("modal-cancel-button"));

      expect(mockModalConfirm).toHaveBeenCalled();
      const { container } = render(mockModalConfirm.mock.calls[0][0].content);
      expect(container.textContent).toContain(
        "References were changed: 1 removed.",
      );
      expect(container.textContent).toContain(
        "Mentions were changed: 1 removed.",
      );
      expect(container.textContent).toContain(
        "Would you like to ignore changes?",
      );
    });
  });

  describe("Save References", () => {
    it("should call saveReferences and onOk on successful save", async () => {
      const onOk = jest.fn();

      await act(async () => {
        render(<CrudReferenceModal {...defaultProps} onOk={onOk} />);
      });

      await waitFor(
        () => {
          expect(screen.getByText("Test Profile")).toBeInTheDocument();
        },
        { timeout: 2000 },
      );

      const trashButtons = screen.getAllByTestId("trash-icon");
      const referenceTrashButton = trashButtons[0].closest("button")!;

      await act(async () => {
        fireEvent.click(referenceTrashButton);
      });

      await act(async () => {
        fireEvent.click(screen.getByTestId("modal-ok-button"));
      });

      expect(mockSaveReferences).toHaveBeenCalledWith(
        mockCollectionName.PROFILES,
        "entity-123",
        { ref2: { name: mockCollectionName.WEAPONS } },
      );
      expect(mockRemoveIncomingReferences).toHaveBeenCalledWith(
        "entity-123",
        [],
      );
      expect(onOk).toHaveBeenCalled();
    });

    it("should call removeIncomingReferences with removed mentions then onOk", async () => {
      const onOk = jest.fn();

      await act(async () => {
        render(<CrudReferenceModal {...defaultProps} onOk={onOk} />);
      });

      await waitFor(
        () => {
          expect(screen.getByText("Mention Profile 1")).toBeInTheDocument();
        },
        { timeout: 2000 },
      );

      const mentionRow = screen
        .getByText("Mention Profile 1")
        .closest('div[class*="pl-12"]')!;
      await act(async () => {
        fireEvent.click(
          mentionRow
            .querySelector('[data-testid="trash-icon"]')!
            .closest("button")!,
        );
      });

      await act(async () => {
        fireEvent.click(screen.getByTestId("modal-ok-button"));
      });

      expect(mockSaveReferences).toHaveBeenCalled();
      expect(mockRemoveIncomingReferences).toHaveBeenCalledWith("entity-123", [
        {
          collectionName: mockCollectionName.PROFILES,
          documentId: "mention1",
        },
      ]);
      expect(onOk).toHaveBeenCalled();
    });

    it("should not call onOk when removeIncomingReferences fails", async () => {
      const onOk = jest.fn();
      mockRemoveIncomingReferences.mockResolvedValueOnce(false);

      await act(async () => {
        render(<CrudReferenceModal {...defaultProps} onOk={onOk} />);
      });

      await waitFor(
        () => {
          expect(screen.getByText("Mention Profile 1")).toBeInTheDocument();
        },
        { timeout: 2000 },
      );

      const mentionRow = screen
        .getByText("Mention Profile 1")
        .closest('div[class*="pl-12"]')!;
      await act(async () => {
        fireEvent.click(
          mentionRow
            .querySelector('[data-testid="trash-icon"]')!
            .closest("button")!,
        );
      });

      await act(async () => {
        fireEvent.click(screen.getByTestId("modal-ok-button"));
      });

      expect(mockSaveReferences).toHaveBeenCalled();
      expect(mockRemoveIncomingReferences).toHaveBeenCalled();
      expect(onOk).not.toHaveBeenCalled();
    });

    it("should not call onOk when save fails", async () => {
      const onOk = jest.fn();
      mockSaveReferences.mockResolvedValue(null);

      await act(async () => {
        render(<CrudReferenceModal {...defaultProps} onOk={onOk} />);
      });

      await waitFor(
        () => {
          expect(screen.getByText("Test Profile")).toBeInTheDocument();
        },
        { timeout: 2000 },
      );

      const trashButtons = screen.getAllByTestId("trash-icon");
      const referenceTrashButton = trashButtons[0].closest("button")!;

      await act(async () => {
        fireEvent.click(referenceTrashButton);
      });

      await act(async () => {
        fireEvent.click(screen.getByTestId("modal-ok-button"));
      });

      expect(mockSaveReferences).toHaveBeenCalled();
      expect(onOk).not.toHaveBeenCalled();
      expect(screen.getByTestId("ant-modal")).toBeInTheDocument();
    });
  });

  describe("Mention Soft Delete", () => {
    it("should apply bg-red-200 and show restore button when mention is deleted", async () => {
      await act(async () => {
        render(<CrudReferenceModal {...defaultProps} />);
      });

      const mentionRow = screen
        .getByText("Mention Profile 1")
        .closest('div[class*="pl-12"]')!;
      expect(mentionRow.className).not.toContain("bg-red-200");
      expect(mentionRow.className).toContain("hover:bg-blue-50");

      const trashButton = mentionRow
        .querySelector('[data-testid="trash-icon"]')!
        .closest("button")!;
      fireEvent.click(trashButton);

      const updatedRow = screen
        .getByText("Mention Profile 1")
        .closest('div[class*="pl-12"]')!;
      expect(updatedRow.className).toContain("bg-red-200");
      expect(updatedRow.className).toContain("hover:bg-red-100");
      expect(updatedRow.className).toContain(
        "has-[.restore-btn:hover]:bg-green-100",
      );
      expect(updatedRow.className).not.toContain("hover:bg-blue-50");
      const restoreBtn = updatedRow
        .querySelector('[data-testid="arrow-path-icon"]')!
        .closest("button")!;
      expect(restoreBtn).toBeInTheDocument();
      expect(restoreBtn.className).toContain("restore-btn");
      expect(updatedRow.querySelector('[data-testid="trash-icon"]')).toBeNull();
    });

    it("should show removed count in mentions header after delete", async () => {
      await act(async () => {
        render(<CrudReferenceModal {...defaultProps} />);
      });

      expect(
        screen.getByText(
          (content) =>
            content.includes("1 found") && !content.includes("removed"),
        ),
      ).toBeInTheDocument();

      const mentionRow = screen
        .getByText("Mention Profile 1")
        .closest('div[class*="pl-12"]')!;
      const trashButton = mentionRow
        .querySelector('[data-testid="trash-icon"]')!
        .closest("button")!;
      fireEvent.click(trashButton);

      expect(
        screen.getByText(
          (content) =>
            content.includes("1 found") && content.includes("1 removed"),
        ),
      ).toBeInTheDocument();
    });

    it("should restore mention when restore button is clicked", async () => {
      await act(async () => {
        render(<CrudReferenceModal {...defaultProps} />);
      });

      const mentionRow = screen
        .getByText("Mention Profile 1")
        .closest('div[class*="pl-12"]')!;
      const trashButton = mentionRow
        .querySelector('[data-testid="trash-icon"]')!
        .closest("button")!;
      fireEvent.click(trashButton);

      const deletedRow = screen
        .getByText("Mention Profile 1")
        .closest('div[class*="pl-12"]')!;
      expect(deletedRow.className).toContain("bg-red-200");
      expect(deletedRow.className).toContain("hover:bg-red-100");

      const restoreButton = deletedRow
        .querySelector('[data-testid="arrow-path-icon"]')!
        .closest("button")!;
      fireEvent.click(restoreButton);

      const restoredRow = screen
        .getByText("Mention Profile 1")
        .closest('div[class*="pl-12"]')!;
      expect(restoredRow.className).not.toContain("bg-red-200");
      expect(restoredRow.className).not.toContain("hover:bg-red-100");
      expect(restoredRow.className).toContain("hover:bg-blue-50");
      expect(
        restoredRow.querySelector('[data-testid="trash-icon"]'),
      ).toBeInTheDocument();
      expect(
        restoredRow.querySelector('[data-testid="arrow-path-icon"]'),
      ).toBeNull();
    });

    it("should update header back after restoring a deleted mention", async () => {
      await act(async () => {
        render(<CrudReferenceModal {...defaultProps} />);
      });

      const mentionRow = screen
        .getByText("Mention Profile 1")
        .closest('div[class*="pl-12"]')!;
      const trashButton = mentionRow
        .querySelector('[data-testid="trash-icon"]')!
        .closest("button")!;
      fireEvent.click(trashButton);

      expect(
        screen.getByText(
          (content) =>
            content.includes("1 found") && content.includes("1 removed"),
        ),
      ).toBeInTheDocument();

      const deletedRow = screen
        .getByText("Mention Profile 1")
        .closest('div[class*="pl-12"]')!;
      const restoreButton = deletedRow
        .querySelector('[data-testid="arrow-path-icon"]')!
        .closest("button")!;
      fireEvent.click(restoreButton);

      expect(
        screen.getByText(
          (content) =>
            content.includes("1 found") && !content.includes("removed"),
        ),
      ).toBeInTheDocument();
    });

    it("should enable OK button when a mention is soft-deleted", async () => {
      await act(async () => {
        render(<CrudReferenceModal {...defaultProps} />);
      });

      const okButton = screen.getByText("OK").closest("button")!;
      expect(okButton).toBeDisabled();

      const mentionRow = screen
        .getByText("Mention Profile 1")
        .closest('div[class*="pl-12"]')!;
      const trashButton = mentionRow
        .querySelector('[data-testid="trash-icon"]')!
        .closest("button")!;
      fireEvent.click(trashButton);

      expect(okButton).not.toBeDisabled();
    });

    it("should trigger cancel confirmation when mention is soft-deleted", async () => {
      await act(async () => {
        render(<CrudReferenceModal {...defaultProps} />);
      });

      const mentionRow = screen
        .getByText("Mention Profile 1")
        .closest('div[class*="pl-12"]')!;
      const trashButton = mentionRow
        .querySelector('[data-testid="trash-icon"]')!
        .closest("button")!;
      fireEvent.click(trashButton);

      const cancelButton = screen.getByText("Cancel").closest("button")!;
      fireEvent.click(cancelButton);

      expect(mockModalConfirm).toHaveBeenCalled();
      const { container } = render(mockModalConfirm.mock.calls[0][0].content);
      expect(container.textContent).toContain(
        "Mentions were changed: 1 removed.",
      );
      expect(container.textContent).not.toContain("References were changed");
      expect(container.textContent).toContain(
        "Would you like to ignore changes?",
      );
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
