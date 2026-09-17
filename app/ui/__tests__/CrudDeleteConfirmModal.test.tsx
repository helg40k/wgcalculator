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
    PencilSquareIcon: createIcon("pencil-square-icon"),
    TrashIcon: createIcon("trash-icon"),
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

  return { Button, Collapse, Modal, Spin, Tooltip, theme };
});

const mockRemoveIncomingReferences = jest.fn();
jest.mock("@/app/lib/hooks/usePlayableReferences", () => ({
  __esModule: true,
  default: () => ({
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
});
