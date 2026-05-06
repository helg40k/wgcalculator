import React from "react";
import { act, fireEvent, render, screen } from "@testing-library/react";

import CrudReferenceLink from "@/app/ui/shared/CrudReferenceCounter/CrudReferenceLink";

import "@testing-library/jest-dom";

jest.mock("antd", () => ({
  Input: ({
    placeholder,
    value,
    onChange,
    onClear,
    allowClear,
    className,
    onBlur,
    onKeyDown,
    onMouseDown,
    ...props
  }: any) =>
    React.createElement(
      "span",
      { className, "data-testid": "ant-input-wrapper" },
      React.createElement("input", {
        "data-testid": "ant-input",
        onBlur,
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
            onClick: () => {
              if (onClear) onClear();
              if (onChange) onChange({ target: { value: "" } });
            },
          })
        : null,
    ),
  Tag: ({ children, onClick, color, style, ...props }: any) =>
    React.createElement(
      "span",
      {
        "data-color": color,
        "data-testid": "ant-tag",
        onClick,
        style,
        ...props,
      },
      children,
    ),
}));

describe("CrudReferenceLink.View", () => {
  it("renders trimmed link text when link is provided", () => {
    render(<CrudReferenceLink.View link="  p.42  " />);
    expect(screen.getByTestId("ant-tag")).toHaveTextContent("p.42");
  });

  it("renders ellipsis when link is empty", () => {
    render(<CrudReferenceLink.View />);
    expect(screen.getByTestId("ant-tag")).toHaveTextContent("...");
  });

  it("renders ellipsis when link is whitespace only", () => {
    render(<CrudReferenceLink.View link="   " />);
    expect(screen.getByTestId("ant-tag")).toHaveTextContent("...");
  });

  it("uses volcano color when highlighted", () => {
    render(<CrudReferenceLink.View highlighted link="p.1" />);
    expect(screen.getByTestId("ant-tag")).toHaveAttribute(
      "data-color",
      "volcano",
    );
  });

  it("does not pass volcano color when not highlighted", () => {
    render(<CrudReferenceLink.View link="p.1" />);
    expect(screen.getByTestId("ant-tag")).not.toHaveAttribute(
      "data-color",
      "volcano",
    );
  });

  it("calls onClick when tag is clicked", () => {
    const onClick = jest.fn();
    render(<CrudReferenceLink.View link="x" onClick={onClick} />);
    fireEvent.click(screen.getByTestId("ant-tag"));
    expect(onClick).toHaveBeenCalledTimes(1);
  });
});

describe("CrudReferenceLink.Edit", () => {
  it("initializes input from link prop", () => {
    render(<CrudReferenceLink.Edit link="p.5" onDone={jest.fn()} />);
    expect(screen.getByDisplayValue("p.5")).toBeInTheDocument();
  });

  it("shows placeholder", () => {
    render(<CrudReferenceLink.Edit onDone={jest.fn()} />);
    expect(screen.getByPlaceholderText("Ref...")).toBeInTheDocument();
  });

  it("calls onDone with trimmed value on Enter", async () => {
    const onDone = jest.fn();
    render(<CrudReferenceLink.Edit link="  a  " onDone={onDone} />);
    const input = screen.getByTestId("ant-input");
    await act(async () => {
      fireEvent.change(input, { target: { value: "  b  " } });
    });
    await act(async () => {
      fireEvent.keyDown(input, { key: "Enter" });
    });
    expect(onDone).toHaveBeenCalledWith("b");
  });

  it("calls onDone with undefined on Escape", async () => {
    const onDone = jest.fn();
    render(<CrudReferenceLink.Edit link="x" onDone={onDone} />);
    await act(async () => {
      fireEvent.keyDown(screen.getByTestId("ant-input"), { key: "Escape" });
    });
    expect(onDone).toHaveBeenCalledWith(undefined);
  });

  it("calls onDone with trimmed value on blur", async () => {
    const onDone = jest.fn();
    render(<CrudReferenceLink.Edit onDone={onDone} />);
    const input = screen.getByTestId("ant-input");
    await act(async () => {
      fireEvent.change(input, { target: { value: "  ok  " } });
    });
    await act(async () => {
      fireEvent.blur(input);
    });
    expect(onDone).toHaveBeenCalledWith("ok");
  });

  it("calls onDone with undefined on blur when empty after trim", async () => {
    const onDone = jest.fn();
    render(<CrudReferenceLink.Edit onDone={onDone} />);
    const input = screen.getByTestId("ant-input");
    await act(async () => {
      fireEvent.change(input, { target: { value: "   " } });
    });
    await act(async () => {
      fireEvent.blur(input);
    });
    expect(onDone).toHaveBeenCalledWith(undefined);
  });

  it("calls onDone with empty string when clear icon is clicked", async () => {
    const onDone = jest.fn();
    render(<CrudReferenceLink.Edit link="keep" onDone={onDone} />);
    await act(async () => {
      fireEvent.click(screen.getByTestId("ant-input-clear"));
    });
    expect(onDone).toHaveBeenCalledWith("");
  });

  it("stops propagation on mouseDown to avoid parent handlers", () => {
    const parentMouseDown = jest.fn();
    render(
      <div onMouseDown={parentMouseDown}>
        <CrudReferenceLink.Edit onDone={jest.fn()} />
      </div>,
    );
    fireEvent.mouseDown(screen.getByTestId("ant-input"));
    expect(parentMouseDown).not.toHaveBeenCalled();
  });

  it("stops propagation on keyDown", () => {
    const parentKeyDown = jest.fn();
    render(
      <div onKeyDown={parentKeyDown} role="presentation">
        <CrudReferenceLink.Edit onDone={jest.fn()} />
      </div>,
    );
    const input = screen.getByTestId("ant-input");
    fireEvent.keyDown(input, { key: "a" });
    expect(parentKeyDown).not.toHaveBeenCalled();
  });
});

describe("CrudReferenceLink export", () => {
  it("exposes View and Edit", () => {
    expect(CrudReferenceLink.View).toBeDefined();
    expect(CrudReferenceLink.Edit).toBeDefined();
  });
});
