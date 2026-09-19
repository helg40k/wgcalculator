import React from "react";
import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";

import { MentionsContext } from "@/app/lib/contexts/MentionsContext";
import { CollectionRegistry, Mentions } from "@/app/lib/definitions";

import "@testing-library/jest-dom";

import CrudDeleteConfirmModal from "..";

jest.mock("@ant-design/icons", () => {
  const CaretRightOutlined = () =>
    React.createElement("span", { "data-testid": "caret-right" });
  CaretRightOutlined.displayName = "CaretRightOutlined";

  const ExclamationCircleFilled = () =>
    React.createElement("span", { "data-testid": "exclamation-circle-filled" });
  ExclamationCircleFilled.displayName = "ExclamationCircleFilled";

  return { CaretRightOutlined, ExclamationCircleFilled };
});

jest.mock("@heroicons/react/24/outline", () => {
  const createIcon = (testId: string) => {
    const Icon = (props: { className?: string }) =>
      React.createElement("span", { ...props, "data-testid": testId });
    Icon.displayName = `HeroIcon(${testId})`;
    return Icon;
  };
  return {
    ArrowPathIcon: createIcon("arrow-path-icon"),
    CheckIcon: createIcon("check-icon"),
    PencilSquareIcon: createIcon("pencil-square-icon"),
    TrashIcon: createIcon("trash-icon"),
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

  const Collapse = ({ items, onChange }: any) =>
    React.createElement(
      "div",
      { "data-testid": "ant-collapse" },
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
    );
  Collapse.displayName = "Collapse";

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

  const Modal = ({
    open,
    title,
    children,
    onOk,
    onCancel,
    okText,
    closable,
    maskClosable,
    keyboard,
    okButtonProps,
    cancelButtonProps,
    footer,
    width,
  }: any) => {
    const OkBtn = () =>
      React.createElement(
        "button",
        {
          "data-testid": "modal-ok-button",
          disabled: okButtonProps?.disabled,
          onClick: onOk,
        },
        okText ?? "OK",
      );
    OkBtn.displayName = "OkBtn";
    const CancelBtn = () =>
      React.createElement(
        "button",
        {
          "data-testid": "modal-cancel-button",
          disabled: cancelButtonProps?.disabled,
          onClick: onCancel,
        },
        "Cancel",
      );
    CancelBtn.displayName = "CancelBtn";
    const footerNode =
      typeof footer === "function"
        ? footer(null, { CancelBtn, OkBtn })
        : (footer ??
          React.createElement(
            React.Fragment,
            null,
            React.createElement(OkBtn),
            React.createElement(CancelBtn),
          ));
    return open
      ? React.createElement(
          "div",
          {
            "data-closable": String(closable),
            "data-keyboard": String(keyboard),
            "data-mask-closable": String(maskClosable),
            "data-testid": "ant-modal",
            "data-width": String(width),
          },
          title
            ? React.createElement(
                "div",
                { "data-testid": "modal-title" },
                title,
              )
            : null,
          children,
          footerNode,
          React.createElement("button", {
            "data-testid": "modal-mask",
            onClick: maskClosable === false ? undefined : onCancel,
          }),
        )
      : null;
  };
  Modal.displayName = "Modal";

  const Select = ({ options, placeholder, onChange, value }: any) =>
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
    );
  Select.displayName = "Select";

  const Spin = ({ spinning, children }: any) =>
    spinning
      ? React.createElement("div", { "data-testid": "ant-spin" }, "Loading...")
      : React.createElement("div", null, children);
  Spin.displayName = "Spin";

  const Tooltip = ({ children, title }: any) =>
    React.createElement(
      "div",
      { "data-testid": "ant-tooltip", title },
      children,
    );
  Tooltip.displayName = "Tooltip";

  const Checkbox = ({
    checked = false,
    children,
    disabled,
    indeterminate,
    onChange,
    ...props
  }: any) =>
    React.createElement(
      "label",
      null,
      React.createElement("input", {
        checked,
        "data-indeterminate": String(!!indeterminate),
        "data-testid": props["data-testid"] ?? "ant-checkbox",
        disabled,
        onChange: (e: any) =>
          onChange?.({ target: { checked: e.target.checked } }),
        type: "checkbox",
      }),
      children,
    );
  Checkbox.displayName = "Checkbox";

  const theme = {
    useToken: () => ({
      token: {
        colorError: "#ff4d4f",
        colorTextSecondary: "#666666",
        colorWarning: "#faad14",
      },
    }),
  };

  return {
    Button,
    Checkbox,
    Collapse,
    Input,
    Modal,
    Select,
    Spin,
    Tooltip,
    theme,
  };
});

const mockRemoveIncomingReferences = jest.fn();
const mockReassignIncomingReferences = jest.fn();
const mockLoadEntitiesForReferences = jest.fn();
jest.mock("@/app/lib/hooks/usePlayableReferences", () => ({
  __esModule: true,
  default: () => ({
    loadEntitiesForReferences: mockLoadEntitiesForReferences,
    reassignIncomingReferences: mockReassignIncomingReferences,
    removeIncomingReferences: mockRemoveIncomingReferences,
  }),
}));

const mockLoadEntities = jest.fn();
jest.mock("@/app/lib/hooks/useEntities", () => ({
  __esModule: true,
  default: () => ({
    loadEntities: mockLoadEntities,
  }),
}));

const mockInvalidateCollections = jest.fn();
jest.mock("@/app/lib/collectionInvalidation", () => ({
  invalidateCollections: (...args: unknown[]) =>
    mockInvalidateCollections(...args),
}));

jest.mock("@/app/ui/shared/EntityStatusUI", () => ({
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

const mentionEntity = {
  _id: "src-1",
  description: "A source that mentions this keyword",
  name: "Core Rulebook",
  status: "active",
};

const mentionsWithEntity: Mentions = {
  [CollectionRegistry.Source]: [mentionEntity as any],
};

const mentionsWithTwoEntities: Mentions = {
  [CollectionRegistry.Source]: [
    mentionEntity as any,
    {
      ...mentionEntity,
      _id: "src-2",
      name: "Expansion Book",
    } as any,
  ],
};

const mentionsWithThreeEntities: Mentions = {
  [CollectionRegistry.Source]: [
    mentionEntity as any,
    {
      ...mentionEntity,
      _id: "src-2",
      name: "Expansion Book",
    } as any,
    {
      ...mentionEntity,
      _id: "src-3",
      name: "Army Book",
    } as any,
  ],
};

const defaultProps = {
  entityId: "kw-1",
  entityName: "Actions",
  onCancel: jest.fn(),
  onOk: jest.fn(),
  open: true,
  singleName: "keyword",
};

const renderWithMentions = (
  mentions: Mentions,
  props: Partial<React.ComponentProps<typeof CrudDeleteConfirmModal>> = {},
  mentionsLoaded = true,
) => {
  const mentionsValue = {
    getMentions: jest.fn().mockReturnValue(mentions),
    mentionsLoaded,
    reloadMentions: jest.fn(),
  };
  const merged = {
    ...defaultProps,
    collectionName: CollectionRegistry.Keyword,
    ...props,
  };
  const view = render(
    React.createElement(
      MentionsContext.Provider,
      { value: mentionsValue },
      React.createElement(CrudDeleteConfirmModal, merged),
    ),
  );
  return { ...view, mentionsValue };
};

describe("CrudDeleteConfirmModal", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockRemoveIncomingReferences.mockResolvedValue(true);
    mockReassignIncomingReferences.mockResolvedValue(true);
    mockLoadEntities.mockResolvedValue([]);
    mockLoadEntitiesForReferences.mockResolvedValue([
      { _id: "kw-1", name: "Actions", status: "active" },
      { _id: "kw-3", name: "Charge", status: "active" },
      { _id: "kw-4", name: "Retreat", status: "active" },
    ]);
  });

  it("should not render when closed", () => {
    render(<CrudDeleteConfirmModal {...defaultProps} open={false} />);

    expect(screen.queryByTestId("ant-modal")).not.toBeInTheDocument();
  });

  it("should render the title, bold entity name, and confirmation copy", () => {
    render(<CrudDeleteConfirmModal {...defaultProps} />);

    expect(screen.getByText("Delete keyword")).toBeInTheDocument();
    const boldName = screen.getByTestId("ant-modal").querySelector("b");
    expect(boldName).toHaveTextContent("'Actions'");
    expect(screen.getByTestId("ant-modal")).toHaveTextContent(
      "The item 'Actions' will be deleted.",
    );
    expect(screen.getByTestId("ant-modal")).toHaveTextContent("Are you sure?");
    expect(screen.getByTestId("modal-ok-button")).toHaveTextContent("Delete");
    expect(screen.getByTestId("modal-cancel-button")).toHaveTextContent(
      "Cancel",
    );
  });

  it("should render the warning icon and hide the close button", () => {
    render(<CrudDeleteConfirmModal {...defaultProps} />);

    expect(screen.getByTestId("exclamation-circle-filled")).toBeInTheDocument();
    expect(screen.getByTestId("ant-modal")).toHaveAttribute(
      "data-closable",
      "false",
    );
    expect(screen.queryByTestId("modal-title")).not.toBeInTheDocument();
  });

  it("should call onOk when Delete is clicked", async () => {
    const onOk = jest.fn();
    const onCancel = jest.fn();
    render(
      <CrudDeleteConfirmModal
        {...defaultProps}
        onCancel={onCancel}
        onOk={onOk}
      />,
    );

    await act(async () => {
      fireEvent.click(screen.getByTestId("modal-ok-button"));
    });

    await waitFor(() => expect(onOk).toHaveBeenCalledTimes(1));
    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it("should call onCancel when Cancel is clicked", () => {
    const onCancel = jest.fn();
    render(<CrudDeleteConfirmModal {...defaultProps} onCancel={onCancel} />);

    fireEvent.click(screen.getByTestId("modal-cancel-button"));

    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it("should not close when the mask is clicked", () => {
    const onCancel = jest.fn();
    render(<CrudDeleteConfirmModal {...defaultProps} onCancel={onCancel} />);

    expect(screen.getByTestId("ant-modal")).toHaveAttribute(
      "data-mask-closable",
      "false",
    );
    fireEvent.click(screen.getByTestId("modal-mask"));

    expect(onCancel).not.toHaveBeenCalled();
  });

  it("should not show Mentions when context returns empty", () => {
    renderWithMentions({});

    expect(screen.queryByText(/The item is mentioned/)).not.toBeInTheDocument();
    expect(screen.queryByText(/Unreviewed mention/)).not.toBeInTheDocument();
    expect(screen.queryByTestId("ant-collapse")).not.toBeInTheDocument();
  });

  it("should show Mentions header and entity name when mentions exist", () => {
    const onOk = jest.fn();
    renderWithMentions(mentionsWithEntity, { onOk });

    expect(screen.getByText("1 mention")).toBeInTheDocument();
    expect(screen.getByText("Unreviewed mention: 1")).toBeInTheDocument();
    expect(
      screen.getByText(/The item is mentioned 1 times/),
    ).toBeInTheDocument();
    expect(screen.getByText("Core Rulebook")).toBeInTheDocument();
    expect(screen.queryByTestId("mention-checkbox")).not.toBeInTheDocument();
    expect(screen.queryByTestId("mention-check-all")).not.toBeInTheDocument();
    expect(screen.queryByText("Check all")).not.toBeInTheDocument();
    expect(screen.queryByText("Delete all")).not.toBeInTheDocument();
    expect(screen.queryByText("Cancel all")).not.toBeInTheDocument();
    expect(screen.queryByText("Reassign all")).not.toBeInTheDocument();
    expect(screen.getByText("Core Rulebook").closest(".pl-12")).toBeTruthy();
    expect(screen.getByText("Core Rulebook").closest(".pl-6")).toBeNull();
    expect(screen.getByTestId("pencil-square-icon")).toBeInTheDocument();
    expect(
      screen.getByTestId("collapse-item-mention-sources"),
    ).toBeInTheDocument();
    expect(screen.getByTestId("modal-ok-button")).toBeDisabled();
    fireEvent.click(screen.getByTestId("modal-ok-button"));
    expect(onOk).not.toHaveBeenCalled();
  });

  it("should use plural copy when more than one mention exists", () => {
    renderWithMentions(mentionsWithTwoEntities);

    expect(screen.getByText("2 mentions")).toBeInTheDocument();
    expect(screen.getByText("Unreviewed mentions: 2")).toBeInTheDocument();
    expect(
      screen.getByText(/The item is mentioned 2 times/),
    ).toBeInTheDocument();
    expect(screen.queryByText("1 mention")).not.toBeInTheDocument();
    expect(screen.getByTestId("mention-check-all")).toBeInTheDocument();
    expect(screen.getByText("Check all")).toBeInTheDocument();
    expect(screen.getByText("Delete all")).toBeDisabled();
    expect(screen.getByText("Cancel all")).toBeDisabled();
    expect(screen.getByText("Reassign all")).toBeDisabled();
    expect(screen.queryByText("TEST")).not.toBeInTheDocument();
    expect(screen.getAllByTestId("mention-checkbox")).toHaveLength(2);
    expect(screen.getByText("Core Rulebook").closest(".pl-6")).toBeTruthy();
    expect(screen.getByText("Core Rulebook").closest(".pl-12")).toBeNull();
  });

  it("should select all mentions from the master checkbox and show indeterminate when partial", () => {
    renderWithMentions(mentionsWithTwoEntities);

    const master = () => screen.getByTestId("mention-check-all");
    const rows = () => screen.getAllByTestId("mention-checkbox");
    expect(master()).not.toBeChecked();
    expect(master()).toHaveAttribute("data-indeterminate", "false");
    rows().forEach((row) => expect(row).not.toBeChecked());

    fireEvent.click(master());
    expect(master()).toBeChecked();
    expect(master()).toHaveAttribute("data-indeterminate", "false");
    rows().forEach((row) => expect(row).toBeChecked());

    fireEvent.click(rows()[0]);
    expect(master()).not.toBeChecked();
    expect(master()).toHaveAttribute("data-indeterminate", "true");
    expect(rows()[0]).not.toBeChecked();
    expect(rows()[1]).toBeChecked();

    fireEvent.click(master());
    expect(master()).toBeChecked();
    rows().forEach((row) => expect(row).toBeChecked());

    fireEvent.click(master());
    expect(master()).not.toBeChecked();
    expect(master()).toHaveAttribute("data-indeterminate", "false");
    rows().forEach((row) => expect(row).not.toBeChecked());

    fireEvent.click(rows()[0]);
    fireEvent.click(rows()[1]);
    expect(master()).toBeChecked();
    expect(master()).toHaveAttribute("data-indeterminate", "false");
  });

  it("should enable Delete all when a mention is selected and Cancel all after it is removed", () => {
    renderWithMentions(mentionsWithTwoEntities);

    expect(screen.getByText("Delete all")).toBeDisabled();
    expect(screen.getByText("Cancel all")).toBeDisabled();
    expect(
      screen.queryByTitle("Remove all selected mentions"),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByTitle("Cancel for all selected mentions"),
    ).not.toBeInTheDocument();

    fireEvent.click(screen.getAllByTestId("mention-checkbox")[0]);
    expect(screen.getByText("Delete all")).not.toBeDisabled();
    expect(screen.getByText("Cancel all")).toBeDisabled();
    expect(
      screen.getByTitle("Remove all selected mentions"),
    ).toBeInTheDocument();
    expect(
      screen.queryByTitle("Cancel for all selected mentions"),
    ).not.toBeInTheDocument();

    fireEvent.click(screen.getByText("Delete all"));
    expect(screen.getByText("2 mentions (1 removed)")).toBeInTheDocument();
    expect(screen.getByText("Cancel all")).not.toBeDisabled();
    expect(screen.getByText("Delete all")).toBeDisabled();
    expect(
      screen.queryByTitle("Remove all selected mentions"),
    ).not.toBeInTheDocument();
    expect(
      screen.getByTitle("Cancel for all selected mentions"),
    ).toBeInTheDocument();
    expect(screen.getAllByTestId("mention-checkbox")[0]).toBeChecked();
    expect(screen.getByTitle("Cancel removing")).toBeInTheDocument();

    fireEvent.click(screen.getByText("Cancel all"));
    expect(screen.getByText("2 mentions")).toBeInTheDocument();
    expect(screen.queryByText(/removed/)).not.toBeInTheDocument();
    expect(screen.getByText("Cancel all")).toBeDisabled();
    expect(screen.getByText("Delete all")).not.toBeDisabled();
    expect(
      screen.getByTitle("Remove all selected mentions"),
    ).toBeInTheDocument();
    expect(
      screen.queryByTitle("Cancel for all selected mentions"),
    ).not.toBeInTheDocument();
    expect(screen.getAllByTestId("mention-checkbox")[0]).toBeChecked();
    expect(screen.getAllByTestId("trash-icon")).toHaveLength(2);
  });

  it("should mark a selected reassigned mention removed only when Delete all is clicked", async () => {
    renderWithMentions(mentionsWithTwoEntities);

    await act(async () => {
      fireEvent.click(
        screen.getAllByTestId("pencil-square-icon")[0].closest("button")!,
      );
    });
    await screen.findByTestId("crud-reference-select-row");
    fireEvent.change(screen.getByTestId("ant-select"), {
      target: { value: "kw-3" },
    });
    fireEvent.click(screen.getByTestId("check-icon").closest("button")!);

    const reassignedRow = screen
      .getByText("Core Rulebook (Charge)")
      .closest(".bg-green-200")!;
    fireEvent.click(
      reassignedRow.querySelector('[data-testid="mention-checkbox"]')!,
    );
    fireEvent.click(screen.getByText("Delete all"));

    expect(screen.getByText("2 mentions (1 removed)")).toBeInTheDocument();
    expect(screen.queryByText(/reassigned/)).not.toBeInTheDocument();
    expect(
      screen.queryByText("Core Rulebook (Charge)"),
    ).not.toBeInTheDocument();
    expect(
      screen.getByText("Core Rulebook").closest(".bg-red-200"),
    ).toBeInTheDocument();
  });

  it("should reset only selected non-default mentions when Cancel all is clicked", () => {
    renderWithMentions(mentionsWithThreeEntities);

    fireEvent.click(
      screen
        .getByText("Core Rulebook")
        .closest(".pl-6")!
        .querySelector('[data-testid="trash-icon"]')!
        .closest("button")!,
    );
    fireEvent.click(
      screen
        .getByText("Expansion Book")
        .closest(".pl-6")!
        .querySelector('[data-testid="trash-icon"]')!
        .closest("button")!,
    );

    fireEvent.click(
      screen
        .getByText("Expansion Book")
        .closest(".pl-6")!
        .querySelector('[data-testid="mention-checkbox"]')!,
    );
    fireEvent.click(
      screen
        .getByText("Army Book")
        .closest(".pl-6")!
        .querySelector('[data-testid="mention-checkbox"]')!,
    );
    fireEvent.click(screen.getByText("Cancel all"));

    expect(screen.getByText("3 mentions (1 removed)")).toBeInTheDocument();
    expect(
      screen.getByText("Core Rulebook").closest(".bg-red-200"),
    ).toBeInTheDocument();
    expect(
      screen.getByText("Expansion Book").closest(".bg-red-200"),
    ).toBeNull();
    expect(screen.getByText("Army Book").closest(".bg-red-200")).toBeNull();
  });

  it("should enable Reassign all when a mention is selected and lock controls while the bulk selector is open", async () => {
    const onOk = jest.fn();
    const onCancel = jest.fn();
    renderWithMentions(mentionsWithTwoEntities, { onCancel, onOk });

    expect(screen.getByText("Reassign all")).toBeDisabled();
    expect(
      screen.queryByTitle("Reassign all selected mentions"),
    ).not.toBeInTheDocument();

    fireEvent.click(screen.getAllByTestId("mention-checkbox")[0]);
    expect(screen.getByText("Reassign all")).not.toBeDisabled();
    expect(
      screen.getByTitle("Reassign all selected mentions"),
    ).toBeInTheDocument();

    await act(async () => {
      fireEvent.click(screen.getByText("Reassign all"));
    });
    const selector = await screen.findByTestId("crud-reference-select-row");
    expect(
      screen.getByText("Delete all").compareDocumentPosition(selector) &
        Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
    expect(
      selector.compareDocumentPosition(screen.getByTestId("ant-collapse")) &
        Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
    expect(mockLoadEntitiesForReferences).toHaveBeenCalledWith(
      CollectionRegistry.Keyword,
      ["kw-1"],
    );
    const values = Array.from(
      screen.getByTestId("ant-select").querySelectorAll("option"),
    ).map((option) => option.getAttribute("value"));
    expect(values).toContain("kw-3");
    expect(values).toContain("kw-4");
    expect(values).not.toContain("kw-1");
    expect(screen.getByTestId("ant-select")).toHaveValue("");
    expect(screen.getByTestId("mention-check-all")).toBeDisabled();
    expect(screen.getByText("Reassign all")).toBeDisabled();
    expect(screen.getByText("Delete all")).toBeDisabled();
    expect(screen.getByText("Cancel all")).toBeDisabled();
    expect(screen.getByTestId("modal-ok-button")).toBeDisabled();
    expect(screen.getByTestId("modal-cancel-button")).toBeDisabled();
    expect(document.querySelector(".collapse-disabled")).toBeInTheDocument();
    screen.getAllByTestId("trash-icon").forEach((icon) => {
      expect(icon.closest("button")).toBeDisabled();
    });

    fireEvent.click(screen.getByTestId("modal-ok-button"));
    fireEvent.click(screen.getByTestId("modal-cancel-button"));
    expect(onOk).not.toHaveBeenCalled();
    expect(onCancel).not.toHaveBeenCalled();

    fireEvent.click(screen.getByTestId("x-mark-icon").closest("button")!);
    expect(
      screen.queryByTestId("crud-reference-select-row"),
    ).not.toBeInTheDocument();
    expect(screen.getByText("Core Rulebook")).toBeInTheDocument();
    expect(screen.getByText("Expansion Book")).toBeInTheDocument();
    expect(screen.queryByText(/\(Charge/)).not.toBeInTheDocument();
    expect(screen.getByText("Reassign all")).not.toBeDisabled();
  });

  it("should reassign every selected eligible mention from the bulk selector", async () => {
    renderWithMentions(mentionsWithTwoEntities);

    fireEvent.click(screen.getByTestId("mention-check-all"));
    await act(async () => {
      fireEvent.click(screen.getByText("Reassign all"));
    });
    await screen.findByTestId("crud-reference-select-row");
    fireEvent.change(screen.getByTestId("ant-select"), {
      target: { value: "kw-3" },
    });
    fireEvent.change(screen.getByTestId("ant-input"), {
      target: { value: "p.12" },
    });
    fireEvent.click(screen.getByTestId("check-icon").closest("button")!);

    expect(
      screen.queryByTestId("crud-reference-select-row"),
    ).not.toBeInTheDocument();
    expect(
      screen.getByText("Core Rulebook (Charge, p.12)"),
    ).toBeInTheDocument();
    expect(
      screen.getByText("Expansion Book (Charge, p.12)"),
    ).toBeInTheDocument();
    expect(
      screen.getByText("Core Rulebook (Charge, p.12)").closest(".bg-green-200"),
    ).toBeInTheDocument();
    expect(screen.getByText("2 mentions (2 reassigned)")).toBeInTheDocument();
    expect(screen.getAllByTestId("mention-checkbox")[0]).toBeChecked();
  });

  it("should skip a self-referencing mention when confirming bulk reassign", async () => {
    renderWithMentions({
      [CollectionRegistry.Keyword]: [
        {
          ...mentionEntity,
          _id: "kw-3",
          name: "Charge",
        } as any,
      ],
      [CollectionRegistry.Source]: [mentionEntity as any],
    });

    fireEvent.click(screen.getByTestId("mention-check-all"));
    await act(async () => {
      fireEvent.click(screen.getByText("Reassign all"));
    });
    await screen.findByTestId("crud-reference-select-row");
    fireEvent.change(screen.getByTestId("ant-select"), {
      target: { value: "kw-3" },
    });
    fireEvent.click(screen.getByTestId("check-icon").closest("button")!);

    expect(screen.getByText("Charge")).toBeInTheDocument();
    expect(screen.queryByText("Charge (Charge)")).not.toBeInTheDocument();
    expect(screen.getByText("Core Rulebook (Charge)")).toBeInTheDocument();
    expect(screen.getByText("2 mentions (1 reassigned)")).toBeInTheDocument();
  });

  it("should skip mentions that already have the replacement saved and still apply the rest", async () => {
    renderWithMentions({
      [CollectionRegistry.Source]: [
        {
          ...mentionEntity,
          references: {
            "kw-1": { name: CollectionRegistry.Keyword },
            "kw-3": { name: CollectionRegistry.Keyword },
          },
        } as any,
        {
          ...mentionEntity,
          _id: "src-2",
          name: "Expansion Book",
        } as any,
      ],
    });

    fireEvent.click(screen.getByTestId("mention-check-all"));
    await act(async () => {
      fireEvent.click(screen.getByText("Reassign all"));
    });
    await screen.findByTestId("crud-reference-select-row");
    fireEvent.change(screen.getByTestId("ant-select"), {
      target: { value: "kw-3" },
    });
    fireEvent.click(screen.getByTestId("check-icon").closest("button")!);

    expect(screen.getByText("Core Rulebook")).toBeInTheDocument();
    expect(
      screen.queryByText("Core Rulebook (Charge)"),
    ).not.toBeInTheDocument();
    expect(screen.getByText("Expansion Book (Charge)")).toBeInTheDocument();
    expect(screen.getByText("2 mentions (1 reassigned)")).toBeInTheDocument();
  });

  it("should open an empty bulk selector again after a completed Reassign all", async () => {
    renderWithMentions(mentionsWithTwoEntities);

    fireEvent.click(screen.getAllByTestId("mention-checkbox")[0]);
    await act(async () => {
      fireEvent.click(screen.getByText("Reassign all"));
    });
    await screen.findByTestId("crud-reference-select-row");
    fireEvent.change(screen.getByTestId("ant-select"), {
      target: { value: "kw-3" },
    });
    fireEvent.click(screen.getByTestId("check-icon").closest("button")!);

    await act(async () => {
      fireEvent.click(screen.getByText("Reassign all"));
    });
    await screen.findByTestId("crud-reference-select-row");
    expect(screen.getByTestId("ant-select")).toHaveValue("");
    expect(screen.getByTestId("ant-input")).toHaveValue("");
  });

  it("should mark a mention removed and cancel the action", () => {
    renderWithMentions(mentionsWithEntity);

    fireEvent.click(screen.getByTestId("trash-icon").closest("button")!);

    expect(screen.getByText("1 mention (1 removed)")).toBeInTheDocument();
    expect(screen.queryByText(/Unreviewed mention/)).not.toBeInTheDocument();
    expect(screen.getByTestId("modal-ok-button")).not.toBeDisabled();
    expect(screen.getByTitle("Cancel removing")).toBeInTheDocument();
    expect(screen.queryByTestId("trash-icon")).not.toBeInTheDocument();
    expect(screen.queryByTestId("pencil-square-icon")).not.toBeInTheDocument();

    fireEvent.click(screen.getByTestId("arrow-path-icon").closest("button")!);

    expect(screen.getByText("1 mention")).toBeInTheDocument();
    expect(
      screen.getByText(/The item is mentioned 1 times/),
    ).toBeInTheDocument();
    expect(screen.getByTestId("trash-icon")).toBeInTheDocument();
    expect(screen.getByTestId("pencil-square-icon")).toBeInTheDocument();
    expect(screen.queryByTestId("arrow-path-icon")).not.toBeInTheDocument();
    expect(screen.getByTestId("modal-ok-button")).toBeDisabled();
  });

  it("should show removed and reassigned counts together in the header", async () => {
    renderWithMentions(mentionsWithTwoEntities);

    fireEvent.click(screen.getAllByTestId("trash-icon")[0].closest("button")!);

    await act(async () => {
      fireEvent.click(
        screen.getByTestId("pencil-square-icon").closest("button")!,
      );
    });
    await screen.findByTestId("crud-reference-select-row");
    fireEvent.change(screen.getByTestId("ant-select"), {
      target: { value: "kw-3" },
    });
    fireEvent.click(screen.getByTestId("check-icon").closest("button")!);

    expect(
      screen.getByText("2 mentions (1 removed, 1 reassigned)"),
    ).toBeInTheDocument();
    expect(screen.queryByText(/Unreviewed mention/)).not.toBeInTheDocument();
    expect(screen.getByTestId("modal-ok-button")).not.toBeDisabled();
  });

  it("should await mention removals then onOk, keeping controls disabled until both finish", async () => {
    let resolveRemove: (value: boolean) => void = () => {};
    let resolveOnOk: () => void = () => {};
    mockRemoveIncomingReferences.mockImplementation(
      () =>
        new Promise<boolean>((resolve) => {
          resolveRemove = resolve;
        }),
    );
    const onOk = jest.fn(
      () =>
        new Promise<void>((resolve) => {
          resolveOnOk = resolve;
        }),
    );
    const onCancel = jest.fn();
    renderWithMentions(mentionsWithEntity, { onCancel, onOk });

    fireEvent.click(screen.getByTestId("trash-icon").closest("button")!);

    await act(async () => {
      fireEvent.click(screen.getByTestId("modal-ok-button"));
    });

    expect(screen.getByTestId("ant-modal")).toBeInTheDocument();
    expect(screen.getByTestId("ant-spin")).toBeInTheDocument();
    expect(screen.getByTestId("modal-ok-button")).toBeDisabled();
    expect(screen.getByTestId("modal-cancel-button")).toBeDisabled();
    expect(
      screen.getByTestId("arrow-path-icon").closest("button"),
    ).toBeDisabled();
    expect(onOk).not.toHaveBeenCalled();
    expect(onCancel).not.toHaveBeenCalled();

    await act(async () => {
      resolveRemove(true);
    });

    await waitFor(() => expect(onOk).toHaveBeenCalledTimes(1));
    expect(mockRemoveIncomingReferences).toHaveBeenCalledWith("kw-1", [
      {
        collectionName: CollectionRegistry.Source,
        documentId: "src-1",
      },
    ]);
    expect(onCancel).not.toHaveBeenCalled();
    expect(screen.getByTestId("ant-modal")).toBeInTheDocument();
    expect(screen.getByTestId("modal-ok-button")).toBeDisabled();
    expect(screen.getByTestId("modal-cancel-button")).toBeDisabled();

    await act(async () => {
      resolveOnOk();
    });

    await waitFor(() => expect(onCancel).toHaveBeenCalledTimes(1));
  });

  it("should show a retry message above Mentions and skip onOk when mention removal fails", async () => {
    mockRemoveIncomingReferences.mockResolvedValueOnce(false);
    const onOk = jest.fn();
    const onCancel = jest.fn();
    renderWithMentions(mentionsWithEntity, { onCancel, onOk });

    fireEvent.click(screen.getByTestId("trash-icon").closest("button")!);

    await act(async () => {
      fireEvent.click(screen.getByTestId("modal-ok-button"));
    });

    const error = await screen.findByText(
      "Sorry, something went wrong. Please try again",
    );
    const mentionsHeader = screen.getByText("1 mention (1 removed)");
    expect(
      error.compareDocumentPosition(mentionsHeader) &
        Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
    expect(onOk).not.toHaveBeenCalled();
    expect(onCancel).not.toHaveBeenCalled();
    expect(screen.getByTestId("ant-modal")).toBeInTheDocument();
    expect(screen.getByTestId("modal-ok-button")).not.toBeDisabled();
  });

  it("should hide Mentions when open but collectionName is missing", () => {
    renderWithMentions(mentionsWithEntity, { collectionName: undefined });

    expect(screen.queryByText(/The item is mentioned/)).not.toBeInTheDocument();
    expect(screen.queryByText(/Unreviewed mention/)).not.toBeInTheDocument();
    expect(screen.queryByText("Core Rulebook")).not.toBeInTheDocument();
  });

  it("should replace the mention row with a selector that omits the deleted entity", async () => {
    renderWithMentions(mentionsWithEntity);

    await act(async () => {
      fireEvent.click(
        screen.getByTestId("pencil-square-icon").closest("button")!,
      );
    });

    expect(
      await screen.findByTestId("crud-reference-select-row"),
    ).toBeInTheDocument();
    expect(screen.queryByText("Core Rulebook")).not.toBeInTheDocument();
    expect(mockLoadEntitiesForReferences).toHaveBeenCalledWith(
      CollectionRegistry.Keyword,
      ["kw-1"],
    );
    const options = screen.getByTestId("ant-select").querySelectorAll("option");
    const values = Array.from(options).map((option) =>
      option.getAttribute("value"),
    );
    expect(values).toContain("kw-3");
    expect(values).not.toContain("kw-1");
  });

  it("should also omit the mention when it belongs to the deleted entity collection", async () => {
    renderWithMentions({
      [CollectionRegistry.Keyword]: [
        {
          ...mentionEntity,
          _id: "kw-2",
          name: "Other Keyword",
        } as any,
      ],
    });

    await act(async () => {
      fireEvent.click(
        screen.getByTestId("pencil-square-icon").closest("button")!,
      );
    });

    await screen.findByTestId("crud-reference-select-row");
    expect(mockLoadEntitiesForReferences).toHaveBeenCalledWith(
      CollectionRegistry.Keyword,
      ["kw-1", "kw-2"],
    );
    const values = Array.from(
      screen.getByTestId("ant-select").querySelectorAll("option"),
    ).map((option) => option.getAttribute("value"));
    expect(values).not.toContain("kw-2");
  });

  it("should omit entities the mentioner already references", async () => {
    renderWithMentions({
      [CollectionRegistry.Source]: [
        {
          ...mentionEntity,
          references: {
            "kw-1": { name: CollectionRegistry.Keyword },
            "kw-3": { name: CollectionRegistry.Keyword },
          },
        } as any,
      ],
    });

    await act(async () => {
      fireEvent.click(
        screen.getByTestId("pencil-square-icon").closest("button")!,
      );
    });

    await screen.findByTestId("crud-reference-select-row");
    expect(mockLoadEntitiesForReferences).toHaveBeenCalledWith(
      CollectionRegistry.Keyword,
      ["kw-1", "kw-3"],
    );
    const values = Array.from(
      screen.getByTestId("ant-select").querySelectorAll("option"),
    ).map((option) => option.getAttribute("value"));
    expect(values).toContain("kw-4");
    expect(values).not.toContain("kw-3");
    expect(values).not.toContain("kw-1");
  });

  it("should keep a pending Confirm choice in the selector when editing", async () => {
    renderWithMentions({
      [CollectionRegistry.Source]: [
        {
          ...mentionEntity,
          references: {
            "kw-1": { name: CollectionRegistry.Keyword },
            "kw-3": { name: CollectionRegistry.Keyword },
          },
        } as any,
      ],
    });

    await act(async () => {
      fireEvent.click(
        screen.getByTestId("pencil-square-icon").closest("button")!,
      );
    });
    await screen.findByTestId("crud-reference-select-row");
    fireEvent.change(screen.getByTestId("ant-select"), {
      target: { value: "kw-4" },
    });
    fireEvent.click(screen.getByTestId("check-icon").closest("button")!);

    await act(async () => {
      fireEvent.click(
        screen.getByTitle("Edit reassigned mention").querySelector("button")!,
      );
    });
    await screen.findByTestId("crud-reference-select-row");

    const values = Array.from(
      screen.getByTestId("ant-select").querySelectorAll("option"),
    ).map((option) => option.getAttribute("value"));
    expect(screen.getByTestId("ant-select")).toHaveValue("kw-4");
    expect(values).toContain("kw-4");
    expect(values).not.toContain("kw-3");
  });

  it("should restore the unmarked mention row when Cancel selection is clicked after filling", async () => {
    renderWithMentions(mentionsWithEntity);

    await act(async () => {
      fireEvent.click(
        screen.getByTestId("pencil-square-icon").closest("button")!,
      );
    });
    await screen.findByTestId("crud-reference-select-row");

    fireEvent.change(screen.getByTestId("ant-select"), {
      target: { value: "kw-3" },
    });
    fireEvent.change(screen.getByTestId("ant-input"), {
      target: { value: "p.12" },
    });
    fireEvent.click(screen.getByTestId("x-mark-icon").closest("button")!);

    expect(
      screen.queryByTestId("crud-reference-select-row"),
    ).not.toBeInTheDocument();
    expect(screen.getByText("Core Rulebook")).toBeInTheDocument();
    expect(
      screen.queryByText("Core Rulebook (Charge, p.12)"),
    ).not.toBeInTheDocument();
    expect(screen.getByTestId("pencil-square-icon")).toBeInTheDocument();
    expect(screen.getByTestId("trash-icon")).toBeInTheDocument();
    expect(screen.queryByTestId("arrow-path-icon")).not.toBeInTheDocument();
  });

  it("should mark a mention reassigned on Confirm without writing yet", async () => {
    const onOk = jest.fn();
    renderWithMentions(mentionsWithEntity, { onOk });

    await act(async () => {
      fireEvent.click(
        screen.getByTestId("pencil-square-icon").closest("button")!,
      );
    });
    await screen.findByTestId("crud-reference-select-row");

    fireEvent.change(screen.getByTestId("ant-select"), {
      target: { value: "kw-3" },
    });
    fireEvent.click(screen.getByTestId("check-icon").closest("button")!);

    expect(onOk).not.toHaveBeenCalled();
    expect(mockRemoveIncomingReferences).not.toHaveBeenCalled();
    expect(mockReassignIncomingReferences).not.toHaveBeenCalled();
    expect(
      screen.queryByTestId("crud-reference-select-row"),
    ).not.toBeInTheDocument();
    expect(screen.getByText("Core Rulebook (Charge)")).toBeInTheDocument();
    expect(
      screen.getByText("Core Rulebook (Charge)").closest(".bg-green-200"),
    ).toBeInTheDocument();
    expect(screen.getByTitle("Edit reassigned mention")).toBeInTheDocument();
    expect(screen.getByTitle("Cancel reassigning")).toBeInTheDocument();
    expect(screen.queryByTestId("trash-icon")).not.toBeInTheDocument();
    expect(screen.getByText("1 mention (1 reassigned)")).toBeInTheDocument();
    expect(screen.queryByText(/Unreviewed mention/)).not.toBeInTheDocument();
    expect(screen.getByTestId("modal-ok-button")).not.toBeDisabled();
  });

  it("should include the link in the reassigned mention label", async () => {
    renderWithMentions(mentionsWithEntity);

    await act(async () => {
      fireEvent.click(
        screen.getByTestId("pencil-square-icon").closest("button")!,
      );
    });
    await screen.findByTestId("crud-reference-select-row");

    fireEvent.change(screen.getByTestId("ant-select"), {
      target: { value: "kw-3" },
    });
    fireEvent.change(screen.getByTestId("ant-input"), {
      target: { value: "p.12" },
    });
    fireEvent.click(screen.getByTestId("check-icon").closest("button")!);

    expect(
      screen.getByText("Core Rulebook (Charge, p.12)"),
    ).toBeInTheDocument();
  });

  it("should restore the previous reassignment when Cancel selection is clicked while editing", async () => {
    renderWithMentions(mentionsWithEntity);

    await act(async () => {
      fireEvent.click(
        screen.getByTestId("pencil-square-icon").closest("button")!,
      );
    });
    await screen.findByTestId("crud-reference-select-row");
    fireEvent.change(screen.getByTestId("ant-select"), {
      target: { value: "kw-3" },
    });
    fireEvent.change(screen.getByTestId("ant-input"), {
      target: { value: "p.12" },
    });
    fireEvent.click(screen.getByTestId("check-icon").closest("button")!);

    await act(async () => {
      fireEvent.click(
        screen.getByTitle("Edit reassigned mention").querySelector("button")!,
      );
    });
    await screen.findByTestId("crud-reference-select-row");
    expect(screen.getByTestId("ant-select")).toHaveValue("kw-3");
    expect(screen.getByTestId("ant-input")).toHaveValue("p.12");

    fireEvent.change(screen.getByTestId("ant-select"), {
      target: { value: "kw-4" },
    });
    fireEvent.change(screen.getByTestId("ant-input"), {
      target: { value: "p.99" },
    });
    fireEvent.click(screen.getByTestId("x-mark-icon").closest("button")!);

    expect(
      screen.queryByTestId("crud-reference-select-row"),
    ).not.toBeInTheDocument();
    expect(
      screen.getByText("Core Rulebook (Charge, p.12)"),
    ).toBeInTheDocument();
    expect(
      screen.queryByText("Core Rulebook (Retreat, p.99)"),
    ).not.toBeInTheDocument();
  });

  it("should restore the unmarked mention row when CancelMentionActionButton is clicked on a reassigned mention", async () => {
    renderWithMentions(mentionsWithEntity);

    await act(async () => {
      fireEvent.click(
        screen.getByTestId("pencil-square-icon").closest("button")!,
      );
    });
    await screen.findByTestId("crud-reference-select-row");
    fireEvent.change(screen.getByTestId("ant-select"), {
      target: { value: "kw-3" },
    });
    fireEvent.click(screen.getByTestId("check-icon").closest("button")!);

    fireEvent.click(screen.getByTestId("arrow-path-icon").closest("button")!);

    expect(screen.getByText("Core Rulebook")).toBeInTheDocument();
    expect(
      screen.queryByText("Core Rulebook (Charge)"),
    ).not.toBeInTheDocument();
    expect(screen.getByTitle("Reassign mention")).toBeInTheDocument();
    expect(screen.getByTestId("trash-icon")).toBeInTheDocument();
    expect(screen.queryByTestId("arrow-path-icon")).not.toBeInTheDocument();
    expect(screen.getByText("1 mention")).toBeInTheDocument();
    expect(
      screen.queryByText("1 mention (1 reassigned)"),
    ).not.toBeInTheDocument();
    expect(screen.getByTestId("modal-ok-button")).toBeDisabled();
  });

  it("should apply reassignments then onOk when Delete is confirmed", async () => {
    const onOk = jest.fn();
    const onCancel = jest.fn();
    renderWithMentions(mentionsWithEntity, { onCancel, onOk });

    await act(async () => {
      fireEvent.click(
        screen.getByTestId("pencil-square-icon").closest("button")!,
      );
    });
    await screen.findByTestId("crud-reference-select-row");
    fireEvent.change(screen.getByTestId("ant-select"), {
      target: { value: "kw-3" },
    });
    fireEvent.change(screen.getByTestId("ant-input"), {
      target: { value: "p.12" },
    });
    fireEvent.click(screen.getByTestId("check-icon").closest("button")!);

    await act(async () => {
      fireEvent.click(screen.getByTestId("modal-ok-button"));
    });

    expect(mockRemoveIncomingReferences).not.toHaveBeenCalled();
    expect(mockReassignIncomingReferences).toHaveBeenCalledWith("kw-1", [
      {
        collectionName: CollectionRegistry.Source,
        documentId: "src-1",
        newReferencedId: "kw-3",
        reference: {
          link: "p.12",
          name: CollectionRegistry.Keyword,
          title: "Charge",
        },
      },
    ]);
    expect(onOk).toHaveBeenCalled();
    expect(onCancel).toHaveBeenCalled();
  });

  it("should show a retry message above Mentions and skip onOk when reassignment fails", async () => {
    mockReassignIncomingReferences.mockResolvedValueOnce(false);
    const onOk = jest.fn();
    const onCancel = jest.fn();
    renderWithMentions(mentionsWithEntity, { onCancel, onOk });

    await act(async () => {
      fireEvent.click(
        screen.getByTestId("pencil-square-icon").closest("button")!,
      );
    });
    await screen.findByTestId("crud-reference-select-row");
    fireEvent.change(screen.getByTestId("ant-select"), {
      target: { value: "kw-3" },
    });
    fireEvent.click(screen.getByTestId("check-icon").closest("button")!);

    await act(async () => {
      fireEvent.click(screen.getByTestId("modal-ok-button"));
    });

    const error = await screen.findByText(
      "Sorry, something went wrong. Please try again",
    );
    const mentionsHeader = screen.getByText("1 mention (1 reassigned)");
    expect(
      error.compareDocumentPosition(mentionsHeader) &
        Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
    expect(onOk).not.toHaveBeenCalled();
    expect(onCancel).not.toHaveBeenCalled();
    expect(screen.getByTestId("ant-modal")).toBeInTheDocument();
    expect(screen.getByTestId("modal-ok-button")).not.toBeDisabled();
  });

  it("should lock footer, other mention actions, and collapse while the selector is open", async () => {
    const onOk = jest.fn();
    const onCancel = jest.fn();
    renderWithMentions(mentionsWithTwoEntities, { onCancel, onOk });

    fireEvent.click(screen.getByTestId("mention-check-all"));
    expect(screen.getByText("Delete all")).not.toBeDisabled();
    expect(screen.getByText("Reassign all")).not.toBeDisabled();

    const pencils = screen.getAllByTestId("pencil-square-icon");
    await act(async () => {
      fireEvent.click(pencils[0].closest("button")!);
    });
    await screen.findByTestId("crud-reference-select-row");

    expect(screen.getByTestId("modal-ok-button")).toBeDisabled();
    expect(screen.getByTestId("modal-cancel-button")).toBeDisabled();
    expect(document.querySelector(".collapse-disabled")).toBeInTheDocument();
    expect(
      screen.getByTestId("pencil-square-icon").closest("button"),
    ).toBeDisabled();
    expect(screen.getByTestId("trash-icon").closest("button")).toBeDisabled();
    expect(screen.getByTestId("mention-check-all")).toBeDisabled();
    expect(screen.getByTestId("mention-checkbox")).toBeDisabled();
    expect(screen.getByText("Delete all")).toBeDisabled();
    expect(screen.getByText("Cancel all")).toBeDisabled();
    expect(screen.getByText("Reassign all")).toBeDisabled();
    expect(
      screen.getByTestId("x-mark-icon").closest("button"),
    ).not.toBeDisabled();

    fireEvent.click(screen.getByTestId("modal-ok-button"));
    fireEvent.click(screen.getByTestId("modal-cancel-button"));
    expect(onOk).not.toHaveBeenCalled();
    expect(onCancel).not.toHaveBeenCalled();

    fireEvent.click(screen.getByTestId("x-mark-icon").closest("button")!);

    expect(screen.getByTestId("modal-ok-button")).toBeDisabled();
    expect(screen.getByTestId("modal-cancel-button")).not.toBeDisabled();
    expect(
      document.querySelector(".collapse-disabled"),
    ).not.toBeInTheDocument();
    screen.getAllByTestId("pencil-square-icon").forEach((icon) => {
      expect(icon.closest("button")).not.toBeDisabled();
    });
    screen.getAllByTestId("trash-icon").forEach((icon) => {
      expect(icon.closest("button")).not.toBeDisabled();
    });
    expect(screen.getByTestId("mention-check-all")).not.toBeDisabled();
    screen.getAllByTestId("mention-checkbox").forEach((box) => {
      expect(box).not.toBeDisabled();
    });
    expect(screen.getByText("Delete all")).not.toBeDisabled();
    expect(screen.getByText("Cancel all")).toBeDisabled();
    expect(screen.getByText("Reassign all")).not.toBeDisabled();
  });
});
