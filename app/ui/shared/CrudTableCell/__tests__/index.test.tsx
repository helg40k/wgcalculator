import React from "react";
import { render } from "@testing-library/react";

import "@testing-library/jest-dom";

import CrudTableCell from "../index";

// Mock Ant Design patch
jest.mock("@ant-design/v5-patch-for-react-19", () => ({}));

describe("CrudTableCell Index", () => {
  it("should export Edit component", () => {
    expect(CrudTableCell.Edit).toBeDefined();
    expect(typeof CrudTableCell.Edit).toBe("function");
  });

  it("should export View component", () => {
    expect(CrudTableCell.View).toBeDefined();
    expect(typeof CrudTableCell.View).toBe("function");
  });

  it("should have correct structure", () => {
    expect(Object.keys(CrudTableCell)).toEqual(["Edit", "View"]);
  });

  it("should export components that can be rendered", () => {
    const mockEntity = {
      _createdAt: { nanoseconds: 0, seconds: 1234567890 } as any,
      _createdBy: "test@example.com",
      _id: "test-id",
      _isUpdated: false,
      _updatedAt: { nanoseconds: 0, seconds: 1234567890 } as any,
      _updatedBy: "test@example.com",
      name: "Test Entity",
      status: "active" as const,
      systemId: "test-system",
    };

    // Test that Edit component can be rendered
    expect(() => {
      render(
        <CrudTableCell.Edit
          entity={mockEntity}
          field="name"
          value="Test Value"
        />,
      );
    }).not.toThrow();

    // Test that View component can be rendered
    expect(() => {
      render(
        <CrudTableCell.View
          entity={mockEntity}
          field="name"
          value="Test Value"
        />,
      );
    }).not.toThrow();
  });
});
