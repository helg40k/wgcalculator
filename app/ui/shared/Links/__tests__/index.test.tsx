import React from "react";

import "@testing-library/jest-dom";

import Links from "../index";
import LinksEdit from "../LinksEdit";
import LinksView from "../LinksView";

// Mock the individual components
jest.mock("../LinksEdit", () => {
  const MockLinksEdit = (props: any) => (
    <div data-testid="links-edit" {...props} />
  );
  MockLinksEdit.displayName = "MockLinksEdit";
  return MockLinksEdit;
});

jest.mock("../LinksView", () => {
  const MockLinksView = (props: any) => (
    <div data-testid="links-view" {...props} />
  );
  MockLinksView.displayName = "MockLinksView";
  return MockLinksView;
});

describe("Links", () => {
  it("should export Edit component", () => {
    expect(Links.Edit).toBeDefined();
    expect(Links.Edit).toBe(LinksEdit);
  });

  it("should export View component", () => {
    expect(Links.View).toBeDefined();
    expect(Links.View).toBe(LinksView);
  });

  it("should have correct structure", () => {
    expect(Links).toEqual({
      Edit: LinksEdit,
      View: LinksView,
    });
  });

  it("should be an object with Edit and View properties", () => {
    expect(typeof Links).toBe("object");
    expect(Links).toHaveProperty("Edit");
    expect(Links).toHaveProperty("View");
    expect(Object.keys(Links)).toEqual(["Edit", "View"]);
  });

  it("should export components that can be used", () => {
    // Verify that the components are functions/constructors
    expect(typeof Links.Edit).toBe("function");
    expect(typeof Links.View).toBe("function");
  });

  it("should maintain component references", () => {
    // Verify that the same reference is maintained
    const EditComponent = Links.Edit;
    const ViewComponent = Links.View;

    expect(EditComponent).toBe(Links.Edit);
    expect(ViewComponent).toBe(Links.View);
    expect(EditComponent).toBe(LinksEdit);
    expect(ViewComponent).toBe(LinksView);
  });
});
