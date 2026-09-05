import React from "react";
import { fireEvent, render, screen } from "@testing-library/react";

import CrudDeleteConfirmModal from "@/app/ui/CrudDeleteConfirmModal";

import "@testing-library/jest-dom";

jest.mock("@ant-design/icons", () => ({
  ExclamationCircleFilled: () =>
    React.createElement("span", { "data-testid": "exclamation-circle-filled" }),
}));

jest.mock("antd", () => {
  const Modal = ({
    open,
    title,
    children,
    onOk,
    onCancel,
    okText,
    closable,
  }: any) =>
    open
      ? React.createElement(
          "div",
          { "data-closable": String(closable), "data-testid": "ant-modal" },
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
            { "data-testid": "modal-ok-button", onClick: onOk },
            okText ?? "OK",
          ),
          React.createElement(
            "button",
            { "data-testid": "modal-cancel-button", onClick: onCancel },
            "Cancel",
          ),
          React.createElement("button", {
            "data-testid": "modal-mask",
            onClick: onCancel,
          }),
        )
      : null;
  Modal.displayName = "Modal";

  const theme = {
    useToken: () => ({
      token: { colorWarning: "#faad14" },
    }),
  };

  return { Modal, theme };
});

const defaultProps = {
  entityName: "Actions",
  onCancel: jest.fn(),
  onOk: jest.fn(),
  open: true,
  singleName: "keyword",
};

describe("CrudDeleteConfirmModal", () => {
  beforeEach(() => {
    jest.clearAllMocks();
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

  it("should call onOk when Delete is clicked", () => {
    const onOk = jest.fn();
    render(<CrudDeleteConfirmModal {...defaultProps} onOk={onOk} />);

    fireEvent.click(screen.getByTestId("modal-ok-button"));

    expect(onOk).toHaveBeenCalledTimes(1);
  });

  it("should call onCancel when Cancel is clicked", () => {
    const onCancel = jest.fn();
    render(<CrudDeleteConfirmModal {...defaultProps} onCancel={onCancel} />);

    fireEvent.click(screen.getByTestId("modal-cancel-button"));

    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it("should call onCancel when the mask is clicked", () => {
    const onCancel = jest.fn();
    render(<CrudDeleteConfirmModal {...defaultProps} onCancel={onCancel} />);

    fireEvent.click(screen.getByTestId("modal-mask"));

    expect(onCancel).toHaveBeenCalledTimes(1);
  });
});
