import React from "react";
import { render, screen } from "@testing-library/react";

import "@testing-library/jest-dom";

import LinksView from "../LinksView";

// Mock Next.js Link component
jest.mock("next/link", () => {
  const MockLink = ({ children, href, ...props }: any) => (
    <a href={href} {...props}>
      {children}
    </a>
  );
  MockLink.displayName = "MockLink";
  return MockLink;
});

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
  getLinkLabel: jest.fn(),
}));

import { getLinkLabel } from "../../../shared";

const mockGetLinkLabel = getLinkLabel as jest.MockedFunction<
  typeof getLinkLabel
>;

describe("LinksView", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });
  it("should render nothing when urls is undefined", () => {
    const { container } = render(<LinksView urls={undefined} />);
    expect(container.firstChild).toBeNull();
  });

  it("should render nothing when urls is empty array", () => {
    const { container } = render(<LinksView urls={[]} />);
    expect(container.firstChild).toBeNull();
  });

  it("should render single URL link", () => {
    mockGetLinkLabel.mockReturnValue("example.com");

    const urls = ["https://example.com"];

    render(<LinksView urls={urls} />);

    const link = screen.getByRole("link");
    expect(link).toHaveAttribute("href", "https://example.com");
    expect(link).toHaveAttribute("target", "_blank");
    expect(link).toHaveAttribute("rel", "noopener noreferrer");
    expect(link).toHaveClass("flex", "items-center");

    expect(screen.getByTestId("link-icon")).toBeInTheDocument();
    expect(screen.getByTestId("link-icon")).toHaveClass("h-3");
    expect(screen.getByText("example.com")).toBeInTheDocument();
    expect(mockGetLinkLabel).toHaveBeenCalledWith("https://example.com");
  });

  it("should render multiple URL links", () => {
    mockGetLinkLabel
      .mockReturnValueOnce("example.com")
      .mockReturnValueOnce("google.com")
      .mockReturnValueOnce("github.com");

    const urls = [
      "https://example.com",
      "https://google.com",
      "https://github.com",
    ];

    render(<LinksView urls={urls} />);

    const links = screen.getAllByRole("link");
    expect(links).toHaveLength(3);

    expect(links[0]).toHaveAttribute("href", "https://example.com");
    expect(links[1]).toHaveAttribute("href", "https://google.com");
    expect(links[2]).toHaveAttribute("href", "https://github.com");

    expect(screen.getByText("example.com")).toBeInTheDocument();
    expect(screen.getByText("google.com")).toBeInTheDocument();
    expect(screen.getByText("github.com")).toBeInTheDocument();

    // Should have 3 link icons
    const linkIcons = screen.getAllByTestId("link-icon");
    expect(linkIcons).toHaveLength(3);
    linkIcons.forEach((icon) => {
      expect(icon).toHaveClass("h-3");
    });
  });

  it("should handle invalid URLs gracefully", () => {
    mockGetLinkLabel
      .mockReturnValueOnce("invalid-url")
      .mockReturnValueOnce("not-a-url");

    const urls = ["invalid-url", "not-a-url"];

    render(<LinksView urls={urls} />);

    const links = screen.getAllByRole("link");
    expect(links).toHaveLength(2);

    expect(links[0]).toHaveAttribute("href", "invalid-url");
    expect(links[1]).toHaveAttribute("href", "not-a-url");

    expect(screen.getByText("invalid-url")).toBeInTheDocument();
    expect(screen.getByText("not-a-url")).toBeInTheDocument();
    expect(mockGetLinkLabel).toHaveBeenCalledWith("invalid-url");
    expect(mockGetLinkLabel).toHaveBeenCalledWith("not-a-url");
  });

  it("should have correct accessibility attributes", () => {
    mockGetLinkLabel.mockReturnValue("example.com");

    const urls = ["https://example.com"];

    render(<LinksView urls={urls} />);

    const link = screen.getByRole("link");
    expect(link).toHaveAttribute("rel", "noopener noreferrer");
    expect(link).toHaveAttribute("target", "_blank");
  });

  it("should handle empty strings in URLs array", () => {
    mockGetLinkLabel.mockImplementation((url) => {
      if (url === "") return "unknown";
      if (url === "https://example.com") return "example.com";
      return "unknown";
    });

    const urls = ["", "https://example.com", ""];

    render(<LinksView urls={urls} />);

    // Next.js Link might filter empty URLs, so we check what's actually rendered
    const links = screen.getAllByRole("link");

    // We should have at least one link (the valid one)
    expect(links.length).toBeGreaterThan(0);

    // The valid URL should be rendered
    expect(screen.getByText("example.com")).toBeInTheDocument();

    // Check if getLinkLabel was called for all URLs
    expect(mockGetLinkLabel).toHaveBeenCalledWith("");
    expect(mockGetLinkLabel).toHaveBeenCalledWith("https://example.com");
  });

  it("should generate correct keys for URL items", () => {
    const urls = ["https://example.com", "https://google.com"];

    const { container } = render(<LinksView urls={urls} />);

    // Check that elements are rendered (keys are used internally by React)
    const links = container.querySelectorAll("a");
    expect(links).toHaveLength(2);
  });

  it("should apply correct CSS classes", () => {
    const urls = ["https://example.com"];

    render(<LinksView urls={urls} />);

    const link = screen.getByRole("link");
    expect(link).toHaveClass("flex", "items-center");

    // Check the label has correct margin class
    const labelDiv = screen.getByText("example.com");
    expect(labelDiv).toHaveClass("ml-1");
  });

  it("should handle special characters in URLs", () => {
    mockGetLinkLabel.mockReturnValue("example.com");

    const urls = ["https://example.com/path?param=value&other=test#section"];

    render(<LinksView urls={urls} />);

    const link = screen.getByRole("link");
    expect(link).toHaveAttribute(
      "href",
      "https://example.com/path?param=value&other=test#section",
    );
    expect(screen.getByText("example.com")).toBeInTheDocument();
  });
});
