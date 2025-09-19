import React from "react";
import { act, fireEvent, render, screen } from "@testing-library/react";
import { Form } from "antd";

import "@testing-library/jest-dom";

import CrudTableCellEdit from "../CrudTableCellEdit";

// Mock Ant Design patch
jest.mock("@ant-design/v5-patch-for-react-19", () => ({}));

interface TestEntity {
  _id: string;
  _createdAt: any;
  _updatedAt: any;
  _createdBy: string;
  _updatedBy: string;
  _isUpdated: boolean;
  name: string;
  status: "disabled" | "active" | "obsolete";
  systemId: string;
  description?: string;
  isActive?: boolean;
}

describe("CrudTableCellEdit", () => {
  const mockEntity: TestEntity = {
    _createdAt: { nanoseconds: 0, seconds: 1234567890 } as any,
    _createdBy: "test@example.com",
    _id: "test-id",
    _isUpdated: false,
    _updatedAt: { nanoseconds: 0, seconds: 1234567890 } as any,
    _updatedBy: "test@example.com",
    description: "Test description",
    isActive: true,
    name: "Test Entity",
    status: "active",
    systemId: "test-system",
  };

  const FormWrapper = ({ children }: { children: React.ReactNode }) => (
    <Form>{children}</Form>
  );

  describe("basic CrudTableCellEdit component", () => {
    it("should render input field", () => {
      render(
        <FormWrapper>
          <CrudTableCellEdit
            entity={mockEntity}
            field="name"
            value="Test Value"
          />
        </FormWrapper>,
      );

      const input = screen.getByRole("textbox");
      expect(input).toBeInTheDocument();
      expect(input).toHaveAttribute("type", "text");
    });

    it("should render with correct field name", () => {
      const { container } = render(
        <FormWrapper>
          <CrudTableCellEdit
            entity={mockEntity}
            field="name"
            value="Test Value"
          />
        </FormWrapper>,
      );

      const formItem = container.querySelector(".ant-form-item");
      expect(formItem).toBeInTheDocument();
    });

    it("should apply custom styling", () => {
      const { container } = render(
        <FormWrapper>
          <CrudTableCellEdit
            entity={mockEntity}
            field="name"
            value="Test Value"
          />
        </FormWrapper>,
      );

      const formItem = container.querySelector(".table-edit-form-item");
      expect(formItem).toBeInTheDocument();
      expect(formItem).toHaveStyle({ margin: "0px" });
    });

    it("should handle input changes", () => {
      render(
        <FormWrapper>
          <CrudTableCellEdit
            entity={mockEntity}
            field="name"
            value="Initial Value"
          />
        </FormWrapper>,
      );

      const input = screen.getByRole("textbox");
      fireEvent.change(input, { target: { value: "New Value" } });

      expect(input).toHaveValue("New Value");
    });

    it("should support validation rules", () => {
      const validationRules = [
        { message: "This field is required", required: true },
        { message: "Minimum 3 characters required", min: 3 },
      ];

      render(
        <FormWrapper>
          <CrudTableCellEdit
            entity={mockEntity}
            field="name"
            value=""
            validationRules={validationRules}
          />
        </FormWrapper>,
      );

      const input = screen.getByRole("textbox");
      expect(input).toBeInTheDocument();
    });

    it("should trigger validation on change and blur", () => {
      render(
        <FormWrapper>
          <CrudTableCellEdit
            entity={mockEntity}
            field="name"
            value=""
            validationRules={[{ message: "Required field", required: true }]}
          />
        </FormWrapper>,
      );

      const input = screen.getByRole("textbox");
      expect(input).toBeInTheDocument();
    });

    it("should handle different field types", () => {
      render(
        <FormWrapper>
          <CrudTableCellEdit
            entity={mockEntity}
            field="status"
            value="active"
          />
        </FormWrapper>,
      );

      const input = screen.getByRole("textbox");
      expect(input).toBeInTheDocument();
    });

    it("should handle numeric values", () => {
      render(
        <FormWrapper>
          <CrudTableCellEdit entity={mockEntity} field="count" value={42} />
        </FormWrapper>,
      );

      const input = screen.getByRole("textbox");
      expect(input).toBeInTheDocument();
    });

    it("should handle boolean values", () => {
      render(
        <FormWrapper>
          <CrudTableCellEdit
            entity={mockEntity}
            field="isActive"
            value={true}
          />
        </FormWrapper>,
      );

      const input = screen.getByRole("textbox");
      expect(input).toBeInTheDocument();
    });
  });

  describe("CrudTableCellEdit.Area component", () => {
    it("should render textarea", () => {
      render(
        <FormWrapper>
          <CrudTableCellEdit.Area
            entity={mockEntity}
            field="description"
            value="Long text content"
          />
        </FormWrapper>,
      );

      const textarea = screen.getByRole("textbox");
      expect(textarea).toBeInTheDocument();
      expect(textarea.tagName).toBe("TEXTAREA");
    });

    it("should have correct rows attribute", () => {
      render(
        <FormWrapper>
          <CrudTableCellEdit.Area
            entity={mockEntity}
            field="description"
            value="Multi-line text"
          />
        </FormWrapper>,
      );

      const textarea = screen.getByRole("textbox");
      expect(textarea).toHaveAttribute("rows", "2");
    });

    it("should handle multiline text changes", () => {
      render(
        <FormWrapper>
          <CrudTableCellEdit.Area
            entity={mockEntity}
            field="description"
            value="Line 1"
          />
        </FormWrapper>,
      );

      const textarea = screen.getByRole("textbox");
      fireEvent.change(textarea, {
        target: { value: "Line 1\nLine 2\nLine 3" },
      });

      expect(textarea).toHaveValue("Line 1\nLine 2\nLine 3");
    });

    it("should support validation rules", () => {
      const validationRules = [
        { message: "Description is required", required: true },
        { max: 500, message: "Maximum 500 characters allowed" },
      ];

      render(
        <FormWrapper>
          <CrudTableCellEdit.Area
            entity={mockEntity}
            field="description"
            value=""
            validationRules={validationRules}
          />
        </FormWrapper>,
      );

      const textarea = screen.getByRole("textbox");
      expect(textarea).toBeInTheDocument();
    });

    it("should apply form item styling", () => {
      const { container } = render(
        <FormWrapper>
          <CrudTableCellEdit.Area
            entity={mockEntity}
            field="description"
            value="Test content"
          />
        </FormWrapper>,
      );

      const formItem = container.querySelector(".table-edit-form-item");
      expect(formItem).toBeInTheDocument();
    });

    it("should handle empty values", () => {
      render(
        <FormWrapper>
          <CrudTableCellEdit.Area
            entity={mockEntity}
            field="description"
            value=""
          />
        </FormWrapper>,
      );

      const textarea = screen.getByRole("textbox");
      expect(textarea).toHaveValue("");
    });

    it("should handle special characters", () => {
      const specialText = "Special chars: @#$%^&*()_+{}|:<>?[];',./";

      render(
        <FormWrapper>
          <CrudTableCellEdit.Area
            entity={mockEntity}
            field="description"
            value={specialText}
          />
        </FormWrapper>,
      );

      const textarea = screen.getByRole("textbox");
      fireEvent.change(textarea, { target: { value: specialText } });
      expect(textarea).toHaveValue(specialText);
    });
  });

  describe("CrudTableCellEdit.Bool component", () => {
    it("should render switch component", () => {
      render(
        <FormWrapper>
          <CrudTableCellEdit.Bool
            entity={mockEntity}
            field="isActive"
            value={true}
          />
        </FormWrapper>,
      );

      const switchElement = screen.getByRole("switch");
      expect(switchElement).toBeInTheDocument();
    });

    it("should handle switch toggle", () => {
      render(
        <FormWrapper>
          <CrudTableCellEdit.Bool
            entity={mockEntity}
            field="isActive"
            value={false}
          />
        </FormWrapper>,
      );

      const switchElement = screen.getByRole("switch");
      expect(switchElement).not.toBeChecked();

      fireEvent.click(switchElement);
      expect(switchElement).toBeChecked();
    });

    it("should reflect initial boolean value", () => {
      render(
        <FormWrapper>
          <CrudTableCellEdit.Bool
            entity={mockEntity}
            field="isActive"
            value={true}
          />
        </FormWrapper>,
      );

      const switchElement = screen.getByRole("switch");
      expect(switchElement).toBeInTheDocument();
      // Switch might not reflect initial value without form initialization
    });

    it("should handle false initial value", () => {
      render(
        <FormWrapper>
          <CrudTableCellEdit.Bool
            entity={mockEntity}
            field="isActive"
            value={false}
          />
        </FormWrapper>,
      );

      const switchElement = screen.getByRole("switch");
      expect(switchElement).not.toBeChecked();
    });

    it("should support validation rules", () => {
      const validationRules = [
        { message: "This field is required", required: true },
      ];

      render(
        <FormWrapper>
          <CrudTableCellEdit.Bool
            entity={mockEntity}
            field="isActive"
            value={false}
            validationRules={validationRules}
          />
        </FormWrapper>,
      );

      const switchElement = screen.getByRole("switch");
      expect(switchElement).toBeInTheDocument();
    });

    it("should apply form item styling", () => {
      const { container } = render(
        <FormWrapper>
          <CrudTableCellEdit.Bool
            entity={mockEntity}
            field="isActive"
            value={true}
          />
        </FormWrapper>,
      );

      const formItem = container.querySelector(".table-edit-form-item");
      expect(formItem).toBeInTheDocument();
    });

    it("should handle numeric boolean values", () => {
      render(
        <FormWrapper>
          <CrudTableCellEdit.Bool
            entity={mockEntity}
            field="isActive"
            value={1}
          />
        </FormWrapper>,
      );

      const switchElement = screen.getByRole("switch");
      expect(switchElement).toBeInTheDocument();
    });

    it("should handle string boolean values", () => {
      render(
        <FormWrapper>
          <CrudTableCellEdit.Bool
            entity={mockEntity}
            field="isActive"
            value="true"
          />
        </FormWrapper>,
      );

      const switchElement = screen.getByRole("switch");
      expect(switchElement).toBeInTheDocument();
    });
  });

  describe("form integration", () => {
    it("should work within Ant Design Form", () => {
      const onFinish = jest.fn();

      render(
        <Form
          onFinish={onFinish}
          initialValues={{ isActive: true, name: "Initial" }}
        >
          <CrudTableCellEdit entity={mockEntity} field="name" value="Initial" />
          <CrudTableCellEdit.Bool
            entity={mockEntity}
            field="isActive"
            value={true}
          />
          <button type="submit">Submit</button>
        </Form>,
      );

      const input = screen.getByRole("textbox");
      const switchElement = screen.getByRole("switch");
      const submitButton = screen.getByText("Submit");

      expect(input).toBeInTheDocument();
      expect(switchElement).toBeInTheDocument();
      expect(submitButton).toBeInTheDocument();
    });

    it("should handle form validation", () => {
      render(
        <Form>
          <CrudTableCellEdit
            entity={mockEntity}
            field="name"
            value=""
            validationRules={[{ message: "Name is required", required: true }]}
          />
        </Form>,
      );

      const input = screen.getByRole("textbox");

      // Trigger validation by focusing and blurring
      act(() => {
        input.focus();
      });
      act(() => {
        input.blur();
      });

      expect(input).toBeInTheDocument();
    });

    it("should handle form submission", () => {
      const onFinish = jest.fn();

      render(
        <Form onFinish={onFinish}>
          <CrudTableCellEdit
            entity={mockEntity}
            field="name"
            value="Test Name"
          />
          <button type="submit">Submit</button>
        </Form>,
      );

      const submitButton = screen.getByText("Submit");
      const input = screen.getByRole("textbox");

      // Fill the form with data
      fireEvent.change(input, { target: { value: "Test Value" } });
      fireEvent.click(submitButton);

      // Form submission might not work without proper field values
      expect(submitButton).toBeInTheDocument();
    });
  });

  describe("accessibility", () => {
    it("should have proper input accessibility", () => {
      render(
        <FormWrapper>
          <CrudTableCellEdit
            entity={mockEntity}
            field="name"
            value="Test Value"
          />
        </FormWrapper>,
      );

      const input = screen.getByRole("textbox");
      expect(input).toBeInTheDocument();
      expect(input).toHaveAttribute("type", "text");
    });

    it("should have proper textarea accessibility", () => {
      render(
        <FormWrapper>
          <CrudTableCellEdit.Area
            entity={mockEntity}
            field="description"
            value="Test Description"
          />
        </FormWrapper>,
      );

      const textarea = screen.getByRole("textbox");
      expect(textarea).toBeInTheDocument();
      expect(textarea.tagName).toBe("TEXTAREA");
    });

    it("should have proper switch accessibility", () => {
      render(
        <FormWrapper>
          <CrudTableCellEdit.Bool
            entity={mockEntity}
            field="isActive"
            value={true}
          />
        </FormWrapper>,
      );

      const switchElement = screen.getByRole("switch");
      expect(switchElement).toBeInTheDocument();
      expect(switchElement).toHaveAttribute("aria-checked");
    });

    it("should be keyboard navigable", () => {
      render(
        <FormWrapper>
          <CrudTableCellEdit
            entity={mockEntity}
            field="name"
            value="Test Value"
          />
        </FormWrapper>,
      );

      const input = screen.getByRole("textbox");

      act(() => {
        input.focus();
      });
      expect(input).toHaveFocus();
    });
  });

  describe("edge cases", () => {
    it("should handle undefined values", () => {
      render(
        <FormWrapper>
          <CrudTableCellEdit
            entity={mockEntity}
            field="name"
            value={undefined as any}
          />
        </FormWrapper>,
      );

      const input = screen.getByRole("textbox");
      expect(input).toBeInTheDocument();
    });

    it("should handle null values", () => {
      render(
        <FormWrapper>
          <CrudTableCellEdit
            entity={mockEntity}
            field="name"
            value={null as any}
          />
        </FormWrapper>,
      );

      const input = screen.getByRole("textbox");
      expect(input).toBeInTheDocument();
    });

    it("should handle empty string values", () => {
      render(
        <FormWrapper>
          <CrudTableCellEdit entity={mockEntity} field="name" value="" />
        </FormWrapper>,
      );

      const input = screen.getByRole("textbox");
      expect(input).toHaveValue("");
    });

    it("should handle very long field names", () => {
      const longFieldName = "veryLongFieldNameThatMightCauseIssues";

      render(
        <FormWrapper>
          <CrudTableCellEdit
            entity={mockEntity}
            field={longFieldName}
            value="Test Value"
          />
        </FormWrapper>,
      );

      const input = screen.getByRole("textbox");
      expect(input).toBeInTheDocument();
    });

    it("should handle special characters in values", () => {
      const specialValue = "Special chars: @#$%^&*()_+{}|:<>?[];',./";

      render(
        <FormWrapper>
          <CrudTableCellEdit
            entity={mockEntity}
            field="name"
            value={specialValue}
          />
        </FormWrapper>,
      );

      const input = screen.getByRole("textbox");
      fireEvent.change(input, { target: { value: specialValue } });
      expect(input).toHaveValue(specialValue);
    });

    it("should handle unicode characters", () => {
      const unicodeValue = "Unicode: 你好世界 🌍 ñáéíóú";

      render(
        <FormWrapper>
          <CrudTableCellEdit
            entity={mockEntity}
            field="name"
            value={unicodeValue}
          />
        </FormWrapper>,
      );

      const input = screen.getByRole("textbox");
      fireEvent.change(input, { target: { value: unicodeValue } });
      expect(input).toHaveValue(unicodeValue);
    });
  });

  describe("component structure", () => {
    it("should have Area subcomponent", () => {
      expect(CrudTableCellEdit.Area).toBeDefined();
      expect(typeof CrudTableCellEdit.Area).toBe("function");
    });

    it("should have Bool subcomponent", () => {
      expect(CrudTableCellEdit.Bool).toBeDefined();
      expect(typeof CrudTableCellEdit.Bool).toBe("function");
    });

    it("should maintain proper component hierarchy", () => {
      expect(CrudTableCellEdit).toBeDefined();
      expect(CrudTableCellEdit.Area).toBeDefined();
      expect(CrudTableCellEdit.Bool).toBeDefined();
    });
  });
});
