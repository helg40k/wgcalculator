import React from "react";
import { fireEvent, render, screen, within } from "@testing-library/react";

import { EntityStatusRegistry, Playable } from "@/app/lib/definitions";

import "@testing-library/jest-dom";

jest.mock("@heroicons/react/24/outline", () => {
  const createIcon = (testId: string) => {
    const Icon = (props: { className?: string }) =>
      React.createElement("div", { ...props, "data-testid": testId });
    Icon.displayName = `HeroIcon(${testId})`;
    return Icon;
  };

  return {
    CheckIcon: createIcon("check-icon"),
    XMarkIcon: createIcon("x-mark-icon"),
  };
});

jest.mock("antd", () => {
  const Button = ({ children, onClick, disabled, icon, ...props }: any) =>
    React.createElement(
      "button",
      {
        "data-testid": "ant-button",
        disabled,
        onClick,
        ...props,
      },
      icon || children,
    );
  Button.displayName = "Button";

  const Input = ({
    placeholder,
    value,
    onChange,
    allowClear,
    onMouseDown,
    onKeyDown,
    ...props
  }: any) =>
    React.createElement(
      "span",
      { "data-testid": "ant-input-wrapper" },
      React.createElement("input", {
        "data-testid": "ant-input",
        onChange,
        onKeyDown,
        onMouseDown,
        placeholder,
        value,
        ...props,
      }),
      allowClear && value
        ? React.createElement("button", {
            "data-testid": "ant-input-clear",
            onClick: () => onChange?.({ target: { value: "" } }),
          })
        : null,
    );
  Input.displayName = "Input";

  const Select = ({
    options,
    placeholder,
    onChange,
    value,
    optionRender,
    labelRender,
  }: any) =>
    React.createElement(
      "div",
      { "data-testid": "ant-select-wrap" },
      React.createElement(
        "select",
        {
          "data-testid": "ant-select",
          onChange: (e: any) => onChange?.(e.target.value),
          value: value ?? "",
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
      options?.map((option: any) =>
        React.createElement(
          "div",
          {
            "data-testid": `option-render-${option.value}`,
            key: `option-render-${option.value}`,
          },
          optionRender?.(option),
        ),
      ),
      labelRender
        ? React.createElement(
            "div",
            { "data-testid": "label-render" },
            labelRender({
              label: options?.find((option: any) => option.value === value)
                ?.label,
              value,
            }),
          )
        : null,
    );
  Select.displayName = "Select";

  const Tooltip = ({ children, title }: any) =>
    React.createElement(
      "div",
      { "data-testid": "ant-tooltip", title },
      title
        ? React.createElement("div", { "data-testid": "tooltip-title" }, title)
        : null,
      children,
    );
  Tooltip.displayName = "Tooltip";

  return { Button, Input, Select, Tooltip };
});

jest.mock("../../EntityStatusUI", () => ({
  __esModule: true,
  default: {
    Tag: ({ entityId, status, editable }: any) =>
      React.createElement("span", {
        "data-editable": String(editable),
        "data-entity-id": entityId,
        "data-status": status,
        "data-testid": "entity-status-tag",
      }),
  },
}));

import CrudReferenceSelectRow from "..";

const timestamp = {
  nanoseconds: 0,
  seconds: 1234567890,
} as Playable["_createdAt"];

const makeEntity = (
  overrides: Pick<Playable, "_id" | "name" | "status">,
): Playable => ({
  _createdAt: timestamp,
  _createdBy: "test",
  _isUpdated: false,
  _updatedAt: timestamp,
  _updatedBy: "test",
  systemId: "sys",
  ...overrides,
});

const activeEntity = makeEntity({
  _id: "ent-active",
  name: "Active Entity",
  status: EntityStatusRegistry.ACTIVE,
});

const draftEntity = makeEntity({
  _id: "ent-draft",
  name: "Draft Entity",
  status: EntityStatusRegistry.DISABLED,
});

const defaultProps = {
  availableEntities: [activeEntity, draftEntity],
  className: undefined as string | undefined,
  linkInput: "",
  onCancel: jest.fn(),
  onConfirm: jest.fn(),
  onLinkChange: jest.fn(),
  onSelect: jest.fn(),
  placeholder: "Select a new reference...",
  selectOptions: [
    { label: "Active Entity", value: "ent-active" },
    { label: "Draft Entity", value: "ent-draft" },
  ],
  selectedEntityId: null as string | null,
};

const renderRow = (override: Partial<typeof defaultProps> = {}) =>
  render(<CrudReferenceSelectRow {...defaultProps} {...override} />);

describe("CrudReferenceSelectRow", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("Rendering", () => {
    it("should render the select with placeholder and options", () => {
      renderRow();

      const select = screen.getByTestId("ant-select");
      expect(select).toHaveValue("");
      expect(
        within(select).getByRole("option", {
          name: "Select a new reference...",
        }),
      ).toBeInTheDocument();
      expect(
        within(select).getByRole("option", { name: "Active Entity" }),
      ).toBeInTheDocument();
      expect(
        within(select).getByRole("option", { name: "Draft Entity" }),
      ).toBeInTheDocument();
    });

    it("should render the selected entity id on the select", () => {
      renderRow({ selectedEntityId: "ent-active" });

      expect(screen.getByTestId("ant-select")).toHaveValue("ent-active");
    });

    it("should render the link input with the given value", () => {
      renderRow({ linkInput: "p.12" });

      const input = screen.getByTestId("ant-input");
      expect(input).toHaveAttribute("placeholder", "Ref...");
      expect(input).toHaveValue("p.12");
    });

    it("should show a clear button when the link input has a value", () => {
      renderRow({ linkInput: "p.12" });

      expect(screen.getByTestId("ant-input-clear")).toBeInTheDocument();
    });

    it("should apply a custom className to the row", () => {
      renderRow({ className: "bg-red-200" });

      expect(screen.getByTestId("crud-reference-select-row")).toHaveClass(
        "bg-red-200",
      );
    });

    it("should not apply a repair background by default", () => {
      renderRow();

      expect(screen.getByTestId("crud-reference-select-row")).not.toHaveClass(
        "bg-red-200",
      );
    });

    it("should hide the clear button when the link input is empty", () => {
      renderRow({ linkInput: "" });

      expect(screen.queryByTestId("ant-input-clear")).not.toBeInTheDocument();
    });
  });

  describe("Confirm button", () => {
    it("should disable confirm when no entity is selected", () => {
      renderRow({ selectedEntityId: null });

      expect(screen.getByTestId("check-icon").closest("button")).toBeDisabled();
    });

    it("should disable confirm when the selected id is empty", () => {
      renderRow({ selectedEntityId: "" });

      expect(screen.getByTestId("check-icon").closest("button")).toBeDisabled();
    });

    it("should enable confirm when an entity is selected", () => {
      renderRow({ selectedEntityId: "ent-active" });

      expect(
        screen.getByTestId("check-icon").closest("button"),
      ).not.toBeDisabled();
    });

    it("should call onConfirm when confirm is clicked", () => {
      const onConfirm = jest.fn();
      renderRow({ onConfirm, selectedEntityId: "ent-active" });

      fireEvent.click(screen.getByTestId("check-icon").closest("button")!);

      expect(onConfirm).toHaveBeenCalledTimes(1);
    });

    it("should not call onConfirm when confirm is disabled", () => {
      const onConfirm = jest.fn();
      renderRow({ onConfirm, selectedEntityId: null });

      fireEvent.click(screen.getByTestId("check-icon").closest("button")!);

      expect(onConfirm).not.toHaveBeenCalled();
    });
  });

  describe("Cancel button", () => {
    it("should call onCancel when cancel is clicked", () => {
      const onCancel = jest.fn();
      renderRow({ onCancel });

      fireEvent.click(screen.getByTestId("x-mark-icon").closest("button")!);

      expect(onCancel).toHaveBeenCalledTimes(1);
    });
  });

  describe("Select and link callbacks", () => {
    it("should call onSelect with the chosen entity id", () => {
      const onSelect = jest.fn();
      renderRow({ onSelect });

      fireEvent.change(screen.getByTestId("ant-select"), {
        target: { value: "ent-draft" },
      });

      expect(onSelect).toHaveBeenCalledWith("ent-draft");
    });

    it("should call onLinkChange when the link is typed", () => {
      const onLinkChange = jest.fn();
      renderRow({ onLinkChange });

      fireEvent.change(screen.getByTestId("ant-input"), {
        target: { value: "p.3" },
      });

      expect(onLinkChange).toHaveBeenCalledWith("p.3");
    });

    it("should call onLinkChange with an empty string when the link is cleared", () => {
      const onLinkChange = jest.fn();
      renderRow({ linkInput: "p.12", onLinkChange });

      fireEvent.click(screen.getByTestId("ant-input-clear"));

      expect(onLinkChange).toHaveBeenCalledWith("");
    });

    it("should stop mouse and keyboard events from bubbling on the link input", () => {
      renderRow();

      const mouseDown = new MouseEvent("mousedown", { bubbles: true });
      const keyDown = new KeyboardEvent("keydown", {
        bubbles: true,
        key: "Enter",
      });
      const stopMouse = jest.spyOn(mouseDown, "stopPropagation");
      const stopKey = jest.spyOn(keyDown, "stopPropagation");

      screen.getByTestId("ant-input").dispatchEvent(mouseDown);
      screen.getByTestId("ant-input").dispatchEvent(keyDown);

      expect(stopMouse).toHaveBeenCalled();
      expect(stopKey).toHaveBeenCalled();
    });
  });

  describe("Tooltips", () => {
    it("should show help text for the link input", () => {
      renderRow();

      expect(
        screen.getByText(
          "If you have a precise link (page, paragraph, etc.), type it here",
        ),
      ).toBeInTheDocument();
    });

    it("should show confirm and cancel tooltip titles", () => {
      renderRow();

      expect(screen.getByText("Confirm selection")).toBeInTheDocument();
      expect(screen.getByText("Cancel selection")).toBeInTheDocument();
    });
  });

  describe("Entity status labels", () => {
    it("should show a status tag for a non-active option", () => {
      renderRow();

      const option = screen.getByTestId("option-render-ent-draft");
      const tag = within(option).getByTestId("entity-status-tag");
      expect(tag).toHaveAttribute("data-entity-id", "ent-draft");
      expect(tag).toHaveAttribute("data-status", EntityStatusRegistry.DISABLED);
      expect(tag).toHaveAttribute("data-editable", "false");
    });

    it("should omit the status tag for an active option", () => {
      renderRow();

      expect(
        within(screen.getByTestId("option-render-ent-active")).queryByTestId(
          "entity-status-tag",
        ),
      ).not.toBeInTheDocument();
    });

    it("should show a truncated selected label with a status tag", () => {
      renderRow({ selectedEntityId: "ent-draft" });

      const label = screen.getByTestId("label-render");
      expect(label.querySelector(".truncate")).toBeInTheDocument();
      expect(within(label).getByTestId("entity-status-tag")).toHaveAttribute(
        "data-entity-id",
        "ent-draft",
      );
    });

    it("should omit the selected status tag for an active entity", () => {
      renderRow({ selectedEntityId: "ent-active" });

      expect(
        within(screen.getByTestId("label-render")).queryByTestId(
          "entity-status-tag",
        ),
      ).not.toBeInTheDocument();
    });

    it("should look up an entity when the select value is a number", () => {
      renderRow({
        availableEntities: [{ ...draftEntity, _id: "42" }],
        selectOptions: [{ label: "Draft Entity", value: "42" }],
        selectedEntityId: 42 as unknown as string,
      });

      expect(
        within(screen.getByTestId("label-render")).getByTestId(
          "entity-status-tag",
        ),
      ).toHaveAttribute("data-entity-id", "42");
    });
  });
});
