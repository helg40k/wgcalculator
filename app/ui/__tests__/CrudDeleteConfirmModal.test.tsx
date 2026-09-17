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
import CrudDeleteConfirmModal from "@/app/ui/CrudDeleteConfirmModal";

import "@testing-library/jest-dom";

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
    width,
  }: any) =>
    open
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
          React.createElement(
            "button",
            {
              "data-testid": "modal-ok-button",
              disabled: okButtonProps?.disabled,
              onClick: onOk,
            },
            okText ?? "OK",
          ),
          React.createElement(
            "button",
            {
              "data-testid": "modal-cancel-button",
              disabled: cancelButtonProps?.disabled,
              onClick: onCancel,
            },
            "Cancel",
          ),
          React.createElement("button", {
            "data-testid": "modal-mask",
            onClick: maskClosable === false ? undefined : onCancel,
          }),
        )
      : null;
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

  const theme = {
    useToken: () => ({
      token: {
        colorError: "#ff4d4f",
        colorTextSecondary: "#666666",
        colorWarning: "#faad14",
      },
    }),
  };

  return { Button, Collapse, Input, Modal, Select, Spin, Tooltip, theme };
});

const mockRemoveIncomingReferences = jest.fn();
const mockLoadEntitiesForReferences = jest.fn();
jest.mock("@/app/lib/hooks/usePlayableReferences", () => ({
  __esModule: true,
  default: () => ({
    loadEntitiesForReferences: mockLoadEntitiesForReferences,
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
    mockLoadEntities.mockResolvedValue([]);
    mockLoadEntitiesForReferences.mockResolvedValue([
      { _id: "kw-1", name: "Actions", status: "active" },
      { _id: "kw-3", name: "Charge", status: "active" },
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

    expect(
      screen.queryByText(/mention is found|mentions are found/),
    ).not.toBeInTheDocument();
    expect(screen.queryByTestId("ant-collapse")).not.toBeInTheDocument();
  });

  it("should show Mentions header and entity name when mentions exist", () => {
    renderWithMentions(mentionsWithEntity);

    expect(screen.getByText("1 mention is found")).toBeInTheDocument();
    expect(screen.getByText("Core Rulebook")).toBeInTheDocument();
    expect(screen.getByTestId("pencil-square-icon")).toBeInTheDocument();
    expect(
      screen.getByTestId("collapse-item-mention-sources"),
    ).toBeInTheDocument();
  });

  it("should use plural copy when more than one mention exists", () => {
    renderWithMentions(mentionsWithTwoEntities);

    expect(screen.getByText("2 mentions are found")).toBeInTheDocument();
    expect(screen.queryByText("1 mention is found")).not.toBeInTheDocument();
  });

  it("should mark a mention removed and cancel the action", () => {
    renderWithMentions(mentionsWithEntity);

    fireEvent.click(screen.getByTestId("trash-icon").closest("button")!);

    expect(
      screen.getByText("1 mention is found (1 removed)"),
    ).toBeInTheDocument();
    expect(screen.getByTestId("arrow-path-icon")).toBeInTheDocument();
    expect(screen.queryByTestId("trash-icon")).not.toBeInTheDocument();
    expect(screen.queryByTestId("pencil-square-icon")).not.toBeInTheDocument();

    fireEvent.click(screen.getByTestId("arrow-path-icon").closest("button")!);

    expect(screen.getByText("1 mention is found")).toBeInTheDocument();
    expect(screen.getByTestId("trash-icon")).toBeInTheDocument();
    expect(screen.getByTestId("pencil-square-icon")).toBeInTheDocument();
    expect(screen.queryByTestId("arrow-path-icon")).not.toBeInTheDocument();
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
    const mentionsHeader = screen.getByText("1 mention is found (1 removed)");
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

    expect(
      screen.queryByText(/mention is found|mentions are found/),
    ).not.toBeInTheDocument();
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

  it("should restore the mention row when Cancel selection is clicked", async () => {
    renderWithMentions(mentionsWithEntity);

    await act(async () => {
      fireEvent.click(
        screen.getByTestId("pencil-square-icon").closest("button")!,
      );
    });
    await screen.findByTestId("crud-reference-select-row");

    fireEvent.click(screen.getByTestId("x-mark-icon").closest("button")!);

    expect(
      screen.queryByTestId("crud-reference-select-row"),
    ).not.toBeInTheDocument();
    expect(screen.getByText("Core Rulebook")).toBeInTheDocument();
    expect(screen.getByTestId("pencil-square-icon")).toBeInTheDocument();
    expect(screen.getByTestId("trash-icon")).toBeInTheDocument();
  });

  it("should not call onOk or removeIncomingReferences when Confirm selection is clicked", async () => {
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
    expect(screen.getByTestId("crud-reference-select-row")).toBeInTheDocument();
  });

  it("should lock footer, other mention actions, and collapse while the selector is open", async () => {
    const onOk = jest.fn();
    const onCancel = jest.fn();
    renderWithMentions(mentionsWithTwoEntities, { onCancel, onOk });

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
    expect(
      screen.getByTestId("x-mark-icon").closest("button"),
    ).not.toBeDisabled();

    fireEvent.click(screen.getByTestId("modal-ok-button"));
    fireEvent.click(screen.getByTestId("modal-cancel-button"));
    expect(onOk).not.toHaveBeenCalled();
    expect(onCancel).not.toHaveBeenCalled();

    fireEvent.click(screen.getByTestId("x-mark-icon").closest("button")!);

    expect(screen.getByTestId("modal-ok-button")).not.toBeDisabled();
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
  });
});
