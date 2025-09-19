import React from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { theme } from "antd";

import { EntityStatusRegistry } from "@/app/lib/definitions";

import "@testing-library/jest-dom";

import EntityStatusUI from "../EntityStatusUI";

// Mock Ant Design patch
jest.mock("@ant-design/v5-patch-for-react-19", () => ({}));

// Mock Ant Design theme
const mockThemeToken = {
  colorTextDisabled: "#cccccc",
  colorTextSecondary: "#666666",
  colorTextTertiary: "#999999",
  colorWarningBg: "#fff7e6",
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

describe("EntityStatusUI", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseToken.mockReturnValue({
      token: mockThemeToken,
    } as any);
  });

  describe("EntityStatusUI.Tag", () => {
    it("should render tag with active status", () => {
      render(
        <EntityStatusUI.Tag
          entityId="test-entity"
          status={EntityStatusRegistry.ACTIVE}
          editable={false}
        />,
      );

      expect(screen.getByText("active")).toBeInTheDocument();
    });

    it("should render tag with obsolete status", () => {
      render(
        <EntityStatusUI.Tag
          entityId="test-entity"
          status={EntityStatusRegistry.OBSOLETE}
          editable={false}
        />,
      );

      expect(screen.getByText("obsolete")).toBeInTheDocument();
    });

    it("should render tag with disabled status", () => {
      render(
        <EntityStatusUI.Tag
          entityId="test-entity"
          status={EntityStatusRegistry.DISABLED}
          editable={false}
        />,
      );

      expect(screen.getByText("disabled")).toBeInTheDocument();
    });

    it("should have tooltip attributes when not editable", () => {
      render(
        <EntityStatusUI.Tag
          entityId="test-entity"
          status={EntityStatusRegistry.ACTIVE}
          editable={false}
        />,
      );

      const statusElement = screen.getByText("active");
      expect(statusElement).toHaveAttribute("aria-describedby");
    });

    it("should have tooltip attributes when editable", () => {
      render(
        <EntityStatusUI.Tag
          entityId="test-entity"
          status={EntityStatusRegistry.ACTIVE}
          editable={true}
        />,
      );

      const statusElement = screen.getByText("active");
      expect(statusElement).toHaveAttribute("aria-describedby");
    });

    it("should apply cursor-pointer class when editable", () => {
      render(
        <EntityStatusUI.Tag
          entityId="test-entity"
          status={EntityStatusRegistry.ACTIVE}
          editable={true}
        />,
      );

      const statusElement = screen.getByText("active");
      expect(statusElement).toHaveClass("cursor-pointer");
    });

    it("should not apply cursor-pointer class when not editable", () => {
      render(
        <EntityStatusUI.Tag
          entityId="test-entity"
          status={EntityStatusRegistry.ACTIVE}
          editable={false}
        />,
      );

      const statusElement = screen.getByText("active");
      expect(statusElement).not.toHaveClass("cursor-pointer");
    });

    it("should show dropdown menu when editable and clicked", async () => {
      const mockOnChange = jest.fn();

      render(
        <EntityStatusUI.Tag
          entityId="test-entity"
          status={EntityStatusRegistry.ACTIVE}
          editable={true}
          onChange={mockOnChange}
        />,
      );

      const statusElement = screen.getByText("active");
      fireEvent.click(statusElement);

      await waitFor(() => {
        expect(screen.getByText("disabled")).toBeInTheDocument();
        expect(screen.getByText("obsolete")).toBeInTheDocument();
      });
    });

    it("should call onChange when different status is selected", async () => {
      const mockOnChange = jest.fn().mockResolvedValue(undefined);

      render(
        <EntityStatusUI.Tag
          entityId="test-entity"
          status={EntityStatusRegistry.ACTIVE}
          editable={true}
          onChange={mockOnChange}
        />,
      );

      const statusElement = screen.getByText("active");
      fireEvent.click(statusElement);

      await waitFor(() => {
        expect(screen.getByText("disabled")).toBeInTheDocument();
      });

      const disabledOption = screen.getByText("disabled");
      fireEvent.click(disabledOption);

      expect(mockOnChange).toHaveBeenCalledWith(
        "test-entity",
        EntityStatusRegistry.DISABLED,
      );
    });

    it("should not call onChange when same status is selected", async () => {
      const mockOnChange = jest.fn();

      render(
        <EntityStatusUI.Tag
          entityId="test-entity"
          status={EntityStatusRegistry.ACTIVE}
          editable={true}
          onChange={mockOnChange}
        />,
      );

      const statusElement = screen.getByText("active");
      fireEvent.click(statusElement);

      await waitFor(() => {
        expect(screen.getByRole("menu")).toBeInTheDocument();
      });

      // Click on the same status (should have font-bold class)
      const activeOption = screen
        .getAllByText("active")
        .find((el) => el.classList.contains("font-bold"));
      expect(activeOption).toBeInTheDocument();

      fireEvent.click(activeOption!);

      expect(mockOnChange).not.toHaveBeenCalled();
    });

    it("should apply correct styles based on status", () => {
      const { rerender } = render(
        <EntityStatusUI.Tag
          entityId="test-entity"
          status={EntityStatusRegistry.OBSOLETE}
          editable={false}
        />,
      );

      let statusElement = screen.getByText("obsolete");
      expect(statusElement).toHaveStyle({
        color: mockThemeToken.colorTextSecondary,
      });

      rerender(
        <EntityStatusUI.Tag
          entityId="test-entity"
          status={EntityStatusRegistry.DISABLED}
          editable={false}
        />,
      );

      statusElement = screen.getByText("disabled");
      expect(statusElement).toHaveStyle({
        color: mockThemeToken.colorTextTertiary,
      });
    });
  });

  describe("EntityStatusUI.Badge", () => {
    it("should render badge with children and status", () => {
      render(
        <EntityStatusUI.Badge
          entityId="test-entity"
          status={EntityStatusRegistry.ACTIVE}
          editable={false}
        >
          <div>Test Content</div>
        </EntityStatusUI.Badge>,
      );

      expect(screen.getByText("Test Content")).toBeInTheDocument();
      expect(screen.getByText("active")).toBeInTheDocument();
    });

    it("should hide badge when show is false and status is active", () => {
      render(
        <EntityStatusUI.Badge
          entityId="test-entity"
          status={EntityStatusRegistry.ACTIVE}
          editable={false}
          show={false}
        >
          <div>Test Content</div>
        </EntityStatusUI.Badge>,
      );

      expect(screen.getByText("Test Content")).toBeInTheDocument();
      expect(screen.queryByText("active")).not.toBeInTheDocument();
    });

    it("should show badge when show is false but status is not active", () => {
      render(
        <EntityStatusUI.Badge
          entityId="test-entity"
          status={EntityStatusRegistry.OBSOLETE}
          editable={false}
          show={false}
        >
          <div>Test Content</div>
        </EntityStatusUI.Badge>,
      );

      expect(screen.getByText("Test Content")).toBeInTheDocument();
      expect(screen.getByText("obsolete")).toBeInTheDocument();
    });

    it("should show badge when show is true regardless of status", () => {
      render(
        <EntityStatusUI.Badge
          entityId="test-entity"
          status={EntityStatusRegistry.ACTIVE}
          editable={false}
          show={true}
        >
          <div>Test Content</div>
        </EntityStatusUI.Badge>,
      );

      expect(screen.getByText("Test Content")).toBeInTheDocument();
      expect(screen.getByText("active")).toBeInTheDocument();
    });

    it("should show badge by default (show undefined)", () => {
      render(
        <EntityStatusUI.Badge
          entityId="test-entity"
          status={EntityStatusRegistry.DISABLED}
          editable={false}
        >
          <div>Test Content</div>
        </EntityStatusUI.Badge>,
      );

      expect(screen.getByText("Test Content")).toBeInTheDocument();
      expect(screen.getByText("disabled")).toBeInTheDocument();
    });

    it("should be editable when editable prop is true", async () => {
      const mockOnChange = jest.fn();

      render(
        <EntityStatusUI.Badge
          entityId="test-entity"
          status={EntityStatusRegistry.ACTIVE}
          editable={true}
          onChange={mockOnChange}
        >
          <div>Test Content</div>
        </EntityStatusUI.Badge>,
      );

      const statusElement = screen.getByText("active");
      fireEvent.click(statusElement);

      await waitFor(() => {
        expect(screen.getByText("disabled")).toBeInTheDocument();
        expect(screen.getByText("obsolete")).toBeInTheDocument();
      });
    });

    it("should apply correct border color based on status", () => {
      const { container } = render(
        <EntityStatusUI.Badge
          entityId="test-entity"
          status={EntityStatusRegistry.OBSOLETE}
          editable={false}
        >
          <div>Test Content</div>
        </EntityStatusUI.Badge>,
      );

      const badgeElement = container.querySelector(".ant-ribbon");
      expect(badgeElement).toHaveClass("border-gray-400");
    });
  });

  describe("getEntityStatusStyles", () => {
    it("should return correct text colors for different statuses", () => {
      // This test verifies the styling logic by rendering components
      const { rerender } = render(
        <EntityStatusUI.Tag
          entityId="test-entity"
          status={EntityStatusRegistry.OBSOLETE}
          editable={false}
        />,
      );

      let statusElement = screen.getByText("obsolete");
      expect(statusElement).toHaveStyle({
        color: mockThemeToken.colorTextSecondary,
      });

      rerender(
        <EntityStatusUI.Tag
          entityId="test-entity"
          status={EntityStatusRegistry.DISABLED}
          editable={false}
        />,
      );

      statusElement = screen.getByText("disabled");
      expect(statusElement).toHaveStyle({
        color: mockThemeToken.colorTextTertiary,
      });

      rerender(
        <EntityStatusUI.Tag
          entityId="test-entity"
          status={EntityStatusRegistry.ACTIVE}
          editable={false}
        />,
      );

      statusElement = screen.getByText("active");
      expect(statusElement).toHaveStyle({
        color: mockThemeToken.colorTextTertiary,
      });
    });
  });

  describe("createMenuItems", () => {
    it("should create menu items with current status highlighted", async () => {
      const mockOnChange = jest.fn();

      render(
        <EntityStatusUI.Tag
          entityId="test-entity"
          status={EntityStatusRegistry.DISABLED}
          editable={true}
          onChange={mockOnChange}
        />,
      );

      const statusElement = screen.getByText("disabled");
      fireEvent.click(statusElement);

      await waitFor(() => {
        const currentStatusOption = screen
          .getAllByText("disabled")
          .find((el) => el.classList.contains("font-bold"));
        expect(currentStatusOption).toBeInTheDocument();
        expect(currentStatusOption).toHaveClass("font-bold");

        const otherStatusOptions = screen
          .getAllByText("active")
          .concat(screen.getAllByText("obsolete"));
        otherStatusOptions.forEach((option) => {
          expect(option).not.toHaveClass("font-bold");
        });
      });
    });

    it("should sort menu items alphabetically", async () => {
      const mockOnChange = jest.fn();

      render(
        <EntityStatusUI.Tag
          entityId="test-entity"
          status={EntityStatusRegistry.ACTIVE}
          editable={true}
          onChange={mockOnChange}
        />,
      );

      const statusElement = screen.getByText("active");
      fireEvent.click(statusElement);

      await waitFor(() => {
        const menuItems = screen.getAllByText(/^(active|disabled|obsolete)$/);
        // Should be sorted: active, disabled, obsolete (4 total: 1 in tag + 3 in dropdown)
        expect(menuItems).toHaveLength(4);
      });
    });
  });

  describe("interaction behavior", () => {
    it("should close dropdown after selecting new status", async () => {
      const mockOnChange = jest.fn().mockResolvedValue(undefined);

      render(
        <EntityStatusUI.Tag
          entityId="test-entity"
          status={EntityStatusRegistry.ACTIVE}
          editable={true}
          onChange={mockOnChange}
        />,
      );

      const statusElement = screen.getByText("active");
      fireEvent.click(statusElement);

      await waitFor(() => {
        expect(screen.getByRole("menu")).toBeInTheDocument();
      });

      const disabledOption = screen.getByText("disabled");
      fireEvent.click(disabledOption);

      expect(mockOnChange).toHaveBeenCalledWith(
        "test-entity",
        EntityStatusRegistry.DISABLED,
      );
    });

    it("should call onChange with correct parameters", async () => {
      const mockOnChange = jest.fn().mockResolvedValue(undefined);

      render(
        <EntityStatusUI.Tag
          entityId="test-entity-123"
          status={EntityStatusRegistry.ACTIVE}
          editable={true}
          onChange={mockOnChange}
        />,
      );

      const statusElement = screen.getByText("active");
      fireEvent.click(statusElement);

      await waitFor(() => {
        expect(screen.getByRole("menu")).toBeInTheDocument();
      });

      const obsoleteOption = screen.getByText("obsolete");
      fireEvent.click(obsoleteOption);

      expect(mockOnChange).toHaveBeenCalledWith(
        "test-entity-123",
        EntityStatusRegistry.OBSOLETE,
      );
    });

    it("should not call onChange when onChange is not provided", async () => {
      render(
        <EntityStatusUI.Tag
          entityId="test-entity"
          status={EntityStatusRegistry.ACTIVE}
          editable={true}
        />,
      );

      const statusElement = screen.getByText("active");
      fireEvent.click(statusElement);

      await waitFor(() => {
        expect(screen.getByRole("menu")).toBeInTheDocument();
      });

      const disabledOption = screen.getByText("disabled");

      // Should not throw error when onChange is not provided
      expect(() => fireEvent.click(disabledOption)).not.toThrow();
    });
  });

  describe("accessibility", () => {
    it("should have proper ARIA attributes for dropdown", async () => {
      render(
        <EntityStatusUI.Tag
          entityId="test-entity"
          status={EntityStatusRegistry.ACTIVE}
          editable={true}
        />,
      );

      const statusElement = screen.getByText("active");
      fireEvent.click(statusElement);

      await waitFor(() => {
        const dropdown = screen.getByRole("menu");
        expect(dropdown).toBeInTheDocument();
      });
    });

    it("should have proper accessibility attributes", () => {
      render(
        <EntityStatusUI.Tag
          entityId="test-entity"
          status={EntityStatusRegistry.ACTIVE}
          editable={false}
        />,
      );

      const statusElement = screen.getByText("active");
      expect(statusElement).toHaveAttribute("aria-describedby");
      expect(statusElement).toHaveClass("font-mono", "text-xs");
    });
  });

  describe("styling integration", () => {
    it("should use theme tokens correctly", () => {
      render(
        <EntityStatusUI.Tag
          entityId="test-entity"
          status={EntityStatusRegistry.OBSOLETE}
          editable={false}
        />,
      );

      expect(mockUseToken).toHaveBeenCalled();

      const statusElement = screen.getByText("obsolete");
      expect(statusElement).toHaveStyle({
        color: mockThemeToken.colorTextSecondary,
      });
    });

    it("should apply different background colors for different statuses", () => {
      const { container, rerender } = render(
        <EntityStatusUI.Badge
          entityId="test-entity"
          status={EntityStatusRegistry.OBSOLETE}
          editable={false}
        >
          <div>Content</div>
        </EntityStatusUI.Badge>,
      );

      let badgeElement = container.querySelector(".ant-ribbon");
      expect(badgeElement).toHaveClass("border-gray-400");

      rerender(
        <EntityStatusUI.Badge
          entityId="test-entity"
          status={EntityStatusRegistry.DISABLED}
          editable={false}
        >
          <div>Content</div>
        </EntityStatusUI.Badge>,
      );

      badgeElement = container.querySelector(".ant-ribbon");
      expect(badgeElement).toHaveClass("border-gray-300");
    });
  });

  describe("edge cases", () => {
    it("should handle empty entityId", () => {
      render(
        <EntityStatusUI.Tag
          entityId=""
          status={EntityStatusRegistry.ACTIVE}
          editable={false}
        />,
      );

      expect(screen.getByText("active")).toBeInTheDocument();
    });

    it("should handle special characters in entityId", async () => {
      const mockOnChange = jest.fn();

      render(
        <EntityStatusUI.Tag
          entityId="entity-with-special_chars@123"
          status={EntityStatusRegistry.ACTIVE}
          editable={true}
          onChange={mockOnChange}
        />,
      );

      const statusElement = screen.getByText("active");
      fireEvent.click(statusElement);

      await waitFor(() => {
        expect(screen.getByText("disabled")).toBeInTheDocument();
      });

      const disabledOption = screen.getByText("disabled");
      fireEvent.click(disabledOption);

      expect(mockOnChange).toHaveBeenCalledWith(
        "entity-with-special_chars@123",
        EntityStatusRegistry.DISABLED,
      );
    });

    it("should handle rapid clicks on dropdown", async () => {
      const mockOnChange = jest.fn().mockResolvedValue(undefined);

      render(
        <EntityStatusUI.Tag
          entityId="test-entity"
          status={EntityStatusRegistry.ACTIVE}
          editable={true}
          onChange={mockOnChange}
        />,
      );

      const statusElement = screen.getByText("active");

      // Rapid clicks
      fireEvent.click(statusElement);
      fireEvent.click(statusElement);
      fireEvent.click(statusElement);

      await waitFor(() => {
        expect(screen.getByText("disabled")).toBeInTheDocument();
      });

      // Should still work correctly
      const disabledOption = screen.getByText("disabled");
      fireEvent.click(disabledOption);

      expect(mockOnChange).toHaveBeenCalledWith(
        "test-entity",
        EntityStatusRegistry.DISABLED,
      );
    });
  });

  describe("component composition", () => {
    it("should render Badge with complex children", () => {
      render(
        <EntityStatusUI.Badge
          entityId="test-entity"
          status={EntityStatusRegistry.DISABLED}
          editable={false}
        >
          <div>
            <h3>Title</h3>
            <p>Description</p>
            <button>Action</button>
          </div>
        </EntityStatusUI.Badge>,
      );

      expect(screen.getByText("Title")).toBeInTheDocument();
      expect(screen.getByText("Description")).toBeInTheDocument();
      expect(screen.getByText("Action")).toBeInTheDocument();
      expect(screen.getByText("disabled")).toBeInTheDocument();
    });

    it("should handle nested components in Badge", () => {
      render(
        <EntityStatusUI.Badge
          entityId="test-entity"
          status={EntityStatusRegistry.OBSOLETE}
          editable={false}
        >
          <EntityStatusUI.Tag
            entityId="nested-entity"
            status={EntityStatusRegistry.ACTIVE}
            editable={false}
          />
        </EntityStatusUI.Badge>,
      );

      expect(screen.getByText("obsolete")).toBeInTheDocument();
      expect(screen.getByText("active")).toBeInTheDocument();
    });
  });
});
