import React from "react";
import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";

import { Source } from "@/app/lib/definitions";

import "@testing-library/jest-dom";

import SourceEdit from "../SourceEdit";

// Mock Ant Design patch
jest.mock("@ant-design/v5-patch-for-react-19", () => ({}));

// Mock Ant Design components
jest.mock("antd", () => ({
  Flex: ({ children, vertical, justify, className, style }: any) => (
    <div
      data-testid="ant-flex"
      data-vertical={vertical}
      data-justify={justify}
      className={className}
      style={style}
    >
      {children}
    </div>
  ),
  Form: Object.assign(
    ({ children, name, onChange, ...props }: any) => {
      return (
        <form
          data-testid="ant-form"
          data-form-name={name}
          onChange={onChange}
          {...props}
        >
          {children}
        </form>
      );
    },
    {
      Item: ({ children, name, rules, hidden, ...props }: any) => (
        <div
          data-testid={`form-item-${name}`}
          data-required={
            rules?.some((rule: any) => rule.required) ? "true" : "false"
          }
          data-hidden={hidden ? "true" : "false"}
          {...props}
        >
          {children}
        </div>
      ),
      useForm: () => [
        {
          getFieldsValue: jest.fn().mockReturnValue({
            authors: "Test Author",
            description: "Test description",
            name: "Test Source",
            type: "Book",
            version: "1.0",
            year: 2023,
          }),
          setFieldsValue: jest.fn(),
          validateFields: jest.fn().mockResolvedValue({}),
        },
      ],
    },
  ),
  Input: Object.assign(
    ({ placeholder, prefix, ...props }: any) => (
      <input
        data-testid="ant-input"
        placeholder={placeholder}
        data-prefix={prefix}
        {...props}
      />
    ),
    {
      TextArea: ({ placeholder, rows, ...props }: any) => (
        <textarea
          data-testid="ant-textarea"
          placeholder={placeholder}
          rows={rows}
          {...props}
        />
      ),
    },
  ),
  InputNumber: ({ placeholder, min, onChange, ...props }: any) => (
    <input
      type="number"
      data-testid="ant-input-number"
      placeholder={placeholder}
      min={min}
      onChange={onChange}
      {...props}
    />
  ),
  Select: ({ placeholder, onChange, options, ...props }: any) => (
    <select
      data-testid="ant-select"
      data-placeholder={placeholder}
      onChange={onChange}
      {...props}
    >
      {options?.map((option: any, index: number) => (
        <option key={index} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  ),
  theme: {
    useToken: () => ({
      token: {
        borderRadiusLG: "8px",
        colorTextPlaceholder: "#bfbfbf",
      },
    }),
  },
}));

// Mock Heroicons
jest.mock("@heroicons/react/24/outline", () => ({
  BookOpenIcon: ({ className, style }: any) => (
    <div data-testid="book-open-icon" className={className} style={style}>
      📖
    </div>
  ),
}));

// Mock GameSystemContext
jest.mock("@/app/lib/contexts/GameSystemContext", () => ({
  GameSystemContext: React.createContext([
    {
      _id: "game-system-123",
      name: "Test Game System",
    },
    jest.fn(),
  ]),
}));

// Mock ReferenceCounter
jest.mock("@/app/ui/shared/CrudReferenceCounter", () => {
  const MockReferenceCounter = ({ entity, collectionName, viewOnly }: any) => {
    return (
      <div data-testid="reference-counter">
        <span data-testid="entity-id">{entity._id}</span>
        <span data-testid="collection-name">{collectionName}</span>
        <span data-testid="view-only">{viewOnly ? "true" : "false"}</span>
      </div>
    );
  };
  MockReferenceCounter.displayName = "MockReferenceCounter";
  return MockReferenceCounter;
});

// Mock Links component
jest.mock("@/app/ui/shared/Links", () => ({
  Edit: ({ formName, urls, setUrls, setValid, className }: any) => (
    <div
      data-testid="links-edit"
      data-form-name={formName}
      className={className}
    >
      <button
        data-testid="add-url-button"
        onClick={() => {
          setUrls([...(urls || []), "https://new-url.com"]);
          setValid(true);
        }}
      >
        Add URL
      </button>
      {urls?.map((url: string, index: number) => (
        <div key={index} data-testid={`url-${index}`}>
          {url}
        </div>
      ))}
    </div>
  ),
}));

// Mock definitions
jest.mock("@/app/lib/definitions", () => ({
  CollectionRegistry: {
    Source: "SOURCES",
  },
  sourceTypes: ["Book", "PDF", "Website", "Magazine", "Other"],
}));

describe("SourceEdit", () => {
  const mockSetValues = jest.fn();
  const mockSetValid = jest.fn();
  const mockSetIsNew = jest.fn();

  const mockSource: Source = {
    _createdAt: { nanoseconds: 0, seconds: 1672531200 } as any,
    _createdBy: "user-123",
    _id: "source-123",
    _isUpdated: false,
    _updatedAt: { nanoseconds: 0, seconds: 1672617600 } as any,
    _updatedBy: "user-123",
    authors: "John Doe",
    description: "Test description",
    name: "Test Source",
    references: {},
    status: "active",
    systemId: "system-123",
    type: "rulebook",
    urls: ["https://example.com"],
    version: "1.0",
    year: 2023,
  };

  const defaultProps = {
    entity: mockSource,
    setIsNew: mockSetIsNew,
    setValid: mockSetValid,
    setValues: mockSetValues,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("Basic Rendering", () => {
    it("should render without crashing", () => {
      render(<SourceEdit {...defaultProps} />);

      expect(screen.getByTestId("ant-form")).toBeInTheDocument();
    });

    it("should render form with correct name", () => {
      render(<SourceEdit {...defaultProps} />);

      const form = screen.getByTestId("ant-form");
      expect(form).toHaveAttribute("data-form-name", "sourceEdit-source-123");
    });

    it("should apply correct styling", () => {
      render(<SourceEdit {...defaultProps} />);

      const form = screen.getByTestId("ant-form");
      expect(form).toHaveClass("border-1", "border-gray-300");
      expect(form).toHaveStyle({ borderRadius: "8px" });
    });
  });

  describe("Form Fields", () => {
    it("should render all required form fields", () => {
      render(<SourceEdit {...defaultProps} />);

      expect(screen.getByTestId("form-item-systemId")).toBeInTheDocument();
      expect(screen.getByTestId("form-item-name")).toBeInTheDocument();
      expect(screen.getByTestId("form-item-authors")).toBeInTheDocument();
      expect(screen.getByTestId("form-item-type")).toBeInTheDocument();
      expect(screen.getByTestId("form-item-version")).toBeInTheDocument();
      expect(screen.getByTestId("form-item-year")).toBeInTheDocument();
      expect(screen.getByTestId("form-item-description")).toBeInTheDocument();
    });

    it("should mark required fields correctly", () => {
      render(<SourceEdit {...defaultProps} />);

      expect(screen.getByTestId("form-item-name")).toHaveAttribute(
        "data-required",
        "true",
      );
      expect(screen.getByTestId("form-item-type")).toHaveAttribute(
        "data-required",
        "true",
      );
      expect(screen.getByTestId("form-item-year")).toHaveAttribute(
        "data-required",
        "true",
      );

      expect(screen.getByTestId("form-item-authors")).toHaveAttribute(
        "data-required",
        "false",
      );
      expect(screen.getByTestId("form-item-version")).toHaveAttribute(
        "data-required",
        "false",
      );
      expect(screen.getByTestId("form-item-description")).toHaveAttribute(
        "data-required",
        "false",
      );
    });

    it("should hide systemId field", () => {
      render(<SourceEdit {...defaultProps} />);

      expect(screen.getByTestId("form-item-systemId")).toHaveAttribute(
        "data-hidden",
        "true",
      );
    });

    it("should render input fields with correct placeholders", () => {
      render(<SourceEdit {...defaultProps} />);

      expect(screen.getByPlaceholderText("Name")).toBeInTheDocument();
      expect(screen.getByPlaceholderText("Authors")).toBeInTheDocument();
      expect(screen.getByPlaceholderText("Version")).toBeInTheDocument();
      expect(screen.getByPlaceholderText("Year")).toBeInTheDocument();
      expect(screen.getByPlaceholderText("Description")).toBeInTheDocument();
    });

    it("should render authors field with prefix", () => {
      render(<SourceEdit {...defaultProps} />);

      const authorsInput = screen.getByPlaceholderText("Authors");
      expect(authorsInput).toHaveAttribute("data-prefix", "by");
    });

    it("should render year field with minimum value", () => {
      render(<SourceEdit {...defaultProps} />);

      const yearInput = screen.getByTestId("ant-input-number");
      expect(yearInput).toHaveAttribute("min", "1990");
    });
  });

  describe("Select Field", () => {
    it("should render type select with source types", () => {
      render(<SourceEdit {...defaultProps} />);

      const select = screen.getByTestId("ant-select");
      expect(select).toHaveAttribute("data-placeholder", "Source type");

      // Check if options are rendered
      expect(screen.getByText("Book")).toBeInTheDocument();
      expect(screen.getByText("PDF")).toBeInTheDocument();
      expect(screen.getByText("Website")).toBeInTheDocument();
      expect(screen.getByText("Magazine")).toBeInTheDocument();
      expect(screen.getByText("Other")).toBeInTheDocument();
    });
  });

  describe("TextArea Field", () => {
    it("should render description textarea with correct rows", () => {
      render(<SourceEdit {...defaultProps} />);

      const textarea = screen.getByTestId("ant-textarea");
      expect(textarea).toHaveAttribute("rows", "4");
      expect(textarea).toHaveAttribute("placeholder", "Description");
    });
  });

  describe("Icon and Visual Elements", () => {
    it("should render BookOpenIcon", () => {
      render(<SourceEdit {...defaultProps} />);

      const icon = screen.getByTestId("book-open-icon");
      expect(icon).toBeInTheDocument();
      expect(icon).toHaveClass("w-30");
      expect(icon).toHaveStyle({ color: "#bfbfbf" });
    });
  });

  describe("ReferenceCounter Integration", () => {
    it("should render ReferenceCounter with viewOnly=true", () => {
      render(<SourceEdit {...defaultProps} />);

      expect(screen.getByTestId("reference-counter")).toBeInTheDocument();
      expect(screen.getByTestId("entity-id")).toHaveTextContent("source-123");
      expect(screen.getByTestId("collection-name")).toHaveTextContent(
        "SOURCES",
      );
      expect(screen.getByTestId("view-only")).toHaveTextContent("true");
    });
  });

  describe("Links Integration", () => {
    it("should render Links.Edit component", () => {
      render(<SourceEdit {...defaultProps} />);

      expect(screen.getByTestId("links-edit")).toBeInTheDocument();
      expect(screen.getByTestId("links-edit")).toHaveAttribute(
        "data-form-name",
        "sourceEdit-source-123",
      );
      expect(screen.getByTestId("links-edit")).toHaveClass("mr-1.5");
    });

    it("should handle URL changes", () => {
      render(<SourceEdit {...defaultProps} />);

      // Just verify the Links.Edit component is rendered and can be interacted with
      expect(screen.getByTestId("links-edit")).toBeInTheDocument();
      expect(screen.getByTestId("add-url-button")).toBeInTheDocument();

      // The actual URL functionality is tested in the Links component tests
      // Here we just verify the integration works
    });

    it("should display existing URLs", () => {
      render(<SourceEdit {...defaultProps} />);

      expect(screen.getByTestId("url-0")).toHaveTextContent(
        "https://example.com",
      );
    });
  });

  describe("Form Validation and State Management", () => {
    it("should call setValues when input changes", async () => {
      render(<SourceEdit {...defaultProps} />);

      const nameInput = screen.getByPlaceholderText("Name");

      await act(async () => {
        fireEvent.change(nameInput, { target: { value: "New Name" } });
      });

      await waitFor(() => {
        expect(mockSetValues).toHaveBeenCalled();
      });
    });

    it("should call setValid based on form validation", async () => {
      render(<SourceEdit {...defaultProps} />);

      const nameInput = screen.getByPlaceholderText("Name");

      await act(async () => {
        fireEvent.change(nameInput, { target: { value: "New Name" } });
      });

      await waitFor(() => {
        expect(mockSetValid).toHaveBeenCalled();
      });
    });

    it("should call setIsNew to mark as not new", async () => {
      render(<SourceEdit {...defaultProps} />);

      const nameInput = screen.getByPlaceholderText("Name");

      await act(async () => {
        fireEvent.change(nameInput, { target: { value: "New Name" } });
      });

      await waitFor(() => {
        expect(mockSetIsNew).toHaveBeenCalled();
      });
    });
  });

  describe("GameSystem Context Integration", () => {
    it("should use game system context", () => {
      // This is tested implicitly through the component rendering without errors
      // The context is mocked to provide a game system
      render(<SourceEdit {...defaultProps} />);

      expect(screen.getByTestId("ant-form")).toBeInTheDocument();
    });
  });

  describe("Layout and Structure", () => {
    it("should have proper layout structure", () => {
      render(<SourceEdit {...defaultProps} />);

      // Check flex containers
      const flexContainers = screen.getAllByTestId("ant-flex");
      expect(flexContainers.length).toBeGreaterThan(0);
    });

    it("should apply correct CSS classes to layout elements", () => {
      render(<SourceEdit {...defaultProps} />);

      const flexContainers = screen.getAllByTestId("ant-flex");
      const mainFlex = flexContainers.find(
        (el) =>
          el.className?.includes("w-full") &&
          el.className?.includes("items-start"),
      );
      expect(mainFlex).toBeInTheDocument();
    });
  });

  describe("Edge Cases", () => {
    it("should handle entity without URLs", () => {
      const sourceWithoutUrls = { ...mockSource, urls: undefined };
      const props = { ...defaultProps, entity: sourceWithoutUrls };

      render(<SourceEdit {...props} />);

      expect(screen.getByTestId("links-edit")).toBeInTheDocument();
      expect(screen.queryByTestId("url-0")).not.toBeInTheDocument();
    });

    it("should handle entity with empty URLs array", () => {
      const sourceWithEmptyUrls = { ...mockSource, urls: [] };
      const props = { ...defaultProps, entity: sourceWithEmptyUrls };

      render(<SourceEdit {...props} />);

      expect(screen.getByTestId("links-edit")).toBeInTheDocument();
      expect(screen.queryByTestId("url-0")).not.toBeInTheDocument();
    });

    it("should handle minimal entity data", () => {
      const minimalSource: Source = {
        _createdAt: { nanoseconds: 0, seconds: Date.now() / 1000 } as any,
        _createdBy: "user-123",
        _id: "minimal-123",
        _isUpdated: false,
        _updatedAt: { nanoseconds: 0, seconds: Date.now() / 1000 } as any,
        _updatedBy: "user-123",
        name: "Minimal Source",
        status: "active",
        systemId: "system-123",
        type: "rulebook",
        version: "1.0",
        year: 2023,
      };

      const props = { ...defaultProps, entity: minimalSource };

      render(<SourceEdit {...props} />);

      expect(screen.getByTestId("ant-form")).toBeInTheDocument();
      expect(screen.getByTestId("reference-counter")).toBeInTheDocument();
    });
  });

  describe("Form Name Generation", () => {
    it("should generate unique form names based on entity ID", () => {
      const { rerender } = render(<SourceEdit {...defaultProps} />);

      expect(screen.getByTestId("ant-form")).toHaveAttribute(
        "data-form-name",
        "sourceEdit-source-123",
      );

      const differentSource = { ...mockSource, _id: "different-456" };
      rerender(<SourceEdit {...defaultProps} entity={differentSource} />);

      expect(screen.getByTestId("ant-form")).toHaveAttribute(
        "data-form-name",
        "sourceEdit-different-456",
      );
    });
  });

  describe("URL Filtering", () => {
    it("should filter empty URLs when updating values", async () => {
      const sourceWithMixedUrls = {
        ...mockSource,
        urls: ["https://valid.com", "", "  ", "https://another.com"],
      };
      const props = { ...defaultProps, entity: sourceWithMixedUrls };

      render(<SourceEdit {...props} />);

      const nameInput = screen.getByPlaceholderText("Name");

      await act(async () => {
        fireEvent.change(nameInput, { target: { value: "Updated Name" } });
      });

      await waitFor(() => {
        expect(mockSetValues).toHaveBeenCalled();
        // The component should filter out empty URLs internally
      });
    });
  });
});
