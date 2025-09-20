import React from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { theme } from "antd";

import "@testing-library/jest-dom";

import LinksEdit from "../LinksEdit";

// Mock Ant Design components
jest.mock("antd", () => ({
  ...jest.requireActual("antd"),
  Button: ({ children, onClick, className, size }: any) => (
    <button onClick={onClick} className={className} data-size={size}>
      {children}
    </button>
  ),
  Input: ({ value, onChange, placeholder, prefix, size }: any) => (
    <div>
      {prefix}
      <input
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        data-size={size}
      />
    </div>
  ),
  theme: {
    useToken: jest.fn(() => ({
      token: {
        colorErrorText: "#ff4d4f",
      },
    })),
  },
}));

// Mock Heroicons
jest.mock("@heroicons/react/24/outline", () => ({
  LinkIcon: ({ className }: { className?: string }) => (
    <svg className={className} data-testid="link-icon">
      <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.72a10 10 0 0 1 1.71 2.75 5.5 5.5 0 0 1 2.83-2.83l.71-.71a3 3 0 0 1 4.24 4.24l-3 3a3 3 0 0 1-4.24 0 5 5 0 0 0-1.05 3.37z" />
    </svg>
  ),
}));

// Mock the shared module
jest.mock("../../../shared", () => ({
  isUrlValid: jest.fn(),
}));

import { isUrlValid } from "../../../shared";

const mockIsUrlValid = isUrlValid as jest.MockedFunction<typeof isUrlValid>;
const mockThemeUseToken = theme.useToken as jest.MockedFunction<
  typeof theme.useToken
>;

describe("LinksEdit", () => {
  const defaultProps = {
    formName: "test-form",
    setUrls: jest.fn(),
    setValid: jest.fn(),
    urls: undefined,
  };

  beforeEach(() => {
    jest.clearAllMocks();

    mockThemeUseToken.mockReturnValue({
      token: {
        colorErrorText: "#ff4d4f",
      },
    } as any);
  });

  it("should render with empty input when urls is undefined", () => {
    render(<LinksEdit {...defaultProps} />);

    const inputs = screen.getAllByRole("textbox");
    expect(inputs).toHaveLength(1);
    expect(inputs[0]).toHaveValue("");
    expect(inputs[0]).toHaveAttribute("placeholder", "URL");

    expect(screen.getByTestId("link-icon")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Add new URL" }),
    ).toBeInTheDocument();
  });

  it("should render with existing URLs", () => {
    const urls = ["https://example.com", "https://google.com"];
    render(<LinksEdit {...defaultProps} urls={urls} />);

    const inputs = screen.getAllByRole("textbox");
    expect(inputs).toHaveLength(2);
    expect(inputs[0]).toHaveValue("https://example.com");
    expect(inputs[1]).toHaveValue("https://google.com");
  });

  it("should render with single empty input when urls is empty array", () => {
    render(<LinksEdit {...defaultProps} urls={[]} />);

    const inputs = screen.getAllByRole("textbox");
    expect(inputs).toHaveLength(1);
    expect(inputs[0]).toHaveValue("");
  });

  it("should call setUrls and setValid on mount with valid URLs", () => {
    mockIsUrlValid.mockReturnValue(true);

    const setUrls = jest.fn();
    const setValid = jest.fn();
    const urls = ["https://example.com"];

    render(
      <LinksEdit
        {...defaultProps}
        urls={urls}
        setUrls={setUrls}
        setValid={setValid}
      />,
    );

    expect(setUrls).toHaveBeenCalledWith(urls);
    expect(setValid).toHaveBeenCalledWith(true);
    expect(mockIsUrlValid).toHaveBeenCalledWith("https://example.com");
  });

  it("should call setUrls and setValid on mount with invalid URLs", () => {
    mockIsUrlValid.mockReturnValue(false);

    const setUrls = jest.fn();
    const setValid = jest.fn();
    const urls = ["invalid-url"];

    render(
      <LinksEdit
        {...defaultProps}
        urls={urls}
        setUrls={setUrls}
        setValid={setValid}
      />,
    );

    expect(setUrls).toHaveBeenCalledWith(urls);
    expect(setValid).toHaveBeenCalledWith(false);
    expect(mockIsUrlValid).toHaveBeenCalledWith("invalid-url");
  });

  it("should update input value when typing", async () => {
    const user = userEvent.setup();
    const setUrls = jest.fn();
    const setValid = jest.fn();

    render(
      <LinksEdit {...defaultProps} setUrls={setUrls} setValid={setValid} />,
    );

    const input = screen.getByRole("textbox");
    await user.type(input, "https://example.com");

    expect(input).toHaveValue("https://example.com");
  });

  it("should call setUrls and setValid when input changes", () => {
    mockIsUrlValid.mockReturnValue(true);

    const setUrls = jest.fn();
    const setValid = jest.fn();

    render(
      <LinksEdit {...defaultProps} setUrls={setUrls} setValid={setValid} />,
    );

    const input = screen.getByRole("textbox");
    fireEvent.change(input, { target: { value: "https://example.com" } });

    expect(setUrls).toHaveBeenCalledWith(["https://example.com"]);
    expect(setValid).toHaveBeenCalledWith(true);
    expect(mockIsUrlValid).toHaveBeenCalledWith("https://example.com");
  });

  it("should add new input when 'Add new URL' button is clicked", () => {
    render(<LinksEdit {...defaultProps} />);

    expect(screen.getAllByRole("textbox")).toHaveLength(1);

    const addButton = screen.getByRole("button", { name: "Add new URL" });
    fireEvent.click(addButton);

    expect(screen.getAllByRole("textbox")).toHaveLength(2);
    expect(screen.getAllByRole("textbox")[1]).toHaveValue("");
  });

  it("should show validation error for invalid URL", () => {
    mockIsUrlValid.mockReturnValue(false);

    render(<LinksEdit {...defaultProps} />);

    const input = screen.getByRole("textbox");
    fireEvent.change(input, { target: { value: "invalid-url" } });

    expect(screen.getByText("Invalid URL")).toBeInTheDocument();
    expect(mockIsUrlValid).toHaveBeenCalledWith("invalid-url");
  });

  it("should not show validation error for valid URL", () => {
    mockIsUrlValid.mockReturnValue(true);

    render(<LinksEdit {...defaultProps} />);

    const input = screen.getByRole("textbox");
    fireEvent.change(input, { target: { value: "https://example.com" } });

    expect(screen.queryByText("Invalid URL")).not.toBeInTheDocument();
    expect(mockIsUrlValid).toHaveBeenCalledWith("https://example.com");
  });

  it("should not show validation error for empty URL", () => {
    mockIsUrlValid.mockReturnValue(true);

    render(<LinksEdit {...defaultProps} />);

    const input = screen.getByRole("textbox");
    fireEvent.change(input, { target: { value: "" } });

    expect(screen.queryByText("Invalid URL")).not.toBeInTheDocument();
    expect(mockIsUrlValid).toHaveBeenCalledWith("");
  });

  it("should handle multiple URLs with mixed validity", () => {
    // Set up mock for each specific URL
    mockIsUrlValid.mockImplementation((url) => {
      if (url === "https://example.com") return true;
      if (url === "invalid-url") return false;
      if (!url) return true; // for empty values
      return true;
    });

    const setUrls = jest.fn();
    const setValid = jest.fn();

    render(
      <LinksEdit {...defaultProps} setUrls={setUrls} setValid={setValid} />,
    );

    // Add second input
    const addButton = screen.getByRole("button", { name: "Add new URL" });
    fireEvent.click(addButton);

    const inputs = screen.getAllByRole("textbox");

    // Set first URL as valid
    fireEvent.change(inputs[0], { target: { value: "https://example.com" } });
    // Set second URL as invalid
    fireEvent.change(inputs[1], { target: { value: "invalid-url" } });

    expect(screen.getAllByText("Invalid URL")).toHaveLength(1);
    expect(setValid).toHaveBeenLastCalledWith(false);
  });

  it("should apply custom className", () => {
    const { container } = render(
      <LinksEdit {...defaultProps} className="custom-class" />,
    );

    expect(container.firstChild).toHaveClass("custom-class");
  });

  it("should use theme token for error text color", () => {
    mockIsUrlValid.mockImplementation((url) => {
      if (url === "invalid") return false;
      return true;
    });

    const customErrorColor = "#red123";
    mockThemeUseToken.mockReturnValue({
      token: {
        colorErrorText: customErrorColor,
      },
    } as any);

    render(<LinksEdit {...defaultProps} />);

    const input = screen.getByRole("textbox");
    fireEvent.change(input, { target: { value: "invalid" } });

    // The error text should be present
    expect(screen.getByText("Invalid URL")).toBeInTheDocument();
  });

  it("should handle rapid input changes", () => {
    const setUrls = jest.fn();
    const setValid = jest.fn();

    render(
      <LinksEdit {...defaultProps} setUrls={setUrls} setValid={setValid} />,
    );

    const input = screen.getByRole("textbox");

    // Simulate rapid typing (including initial mount call)
    fireEvent.change(input, { target: { value: "h" } });
    fireEvent.change(input, { target: { value: "ht" } });
    fireEvent.change(input, { target: { value: "htt" } });
    fireEvent.change(input, { target: { value: "http" } });
    fireEvent.change(input, { target: { value: "https://example.com" } });

    expect(setUrls).toHaveBeenCalled();
    expect(setValid).toHaveBeenCalled();
    expect(setUrls).toHaveBeenLastCalledWith(["https://example.com"]);
  });

  it("should handle adding many URLs", () => {
    render(<LinksEdit {...defaultProps} />);

    const addButton = screen.getByRole("button", { name: "Add new URL" });

    // Add 5 more inputs (total 6)
    for (let i = 0; i < 5; i++) {
      fireEvent.click(addButton);
    }

    expect(screen.getAllByRole("textbox")).toHaveLength(6);
    expect(screen.getAllByTestId("link-icon")).toHaveLength(6);
  });

  it("should validate all URLs when one changes", () => {
    mockIsUrlValid.mockImplementation((url) => {
      if (url === "https://example.com") return true;
      if (url === "invalid") return false;
      if (!url) return true;
      return true;
    });

    const setValid = jest.fn();

    render(<LinksEdit {...defaultProps} setValid={setValid} />);

    // Add second input
    const addButton = screen.getByRole("button", { name: "Add new URL" });
    fireEvent.click(addButton);

    const inputs = screen.getAllByRole("textbox");

    // Set first URL as valid
    fireEvent.change(inputs[0], { target: { value: "https://example.com" } });
    expect(setValid).toHaveBeenLastCalledWith(true);

    // Set second URL as invalid - should make entire form invalid
    fireEvent.change(inputs[1], { target: { value: "invalid" } });
    expect(setValid).toHaveBeenLastCalledWith(false);
  });

  it("should handle empty input values correctly", () => {
    mockIsUrlValid.mockReturnValue(true);

    const setUrls = jest.fn();
    const setValid = jest.fn();

    render(
      <LinksEdit {...defaultProps} setUrls={setUrls} setValid={setValid} />,
    );

    const input = screen.getByRole("textbox");
    fireEvent.change(input, { target: { value: "" } });

    expect(setUrls).toHaveBeenCalledWith([""]);
    expect(setValid).toHaveBeenCalledWith(true);
    expect(mockIsUrlValid).toHaveBeenCalledWith("");
  });
});
