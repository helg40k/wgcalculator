import React from "react";
import { act, fireEvent, render, screen } from "@testing-library/react";

import "@testing-library/jest-dom";

// First test the minimal mock component
const MockReferenceCounter = ({ entity, collectionName }: any) => {
  const refCount = entity?.references
    ? Object.values(entity.references).flat().length
    : 0;

  return (
    <div data-testid="reference-counter">
      <div data-testid="paperclip-icon">📎</div>
      <span>{refCount === 1 ? "1 reference" : `${refCount} references`}</span>
    </div>
  );
};

describe("CrudReferenceCounter Mock Tests", () => {
  const mockEntity = {
    _id: "test-id",
    name: "Test Entity",
    references: {
      profiles: ["p1", "p2"],
      weapons: ["w1"],
    },
  };

  it("should render and display reference count", () => {
    render(
      <MockReferenceCounter entity={mockEntity} collectionName="profiles" />,
    );

    expect(screen.getByTestId("reference-counter")).toBeInTheDocument();
    expect(screen.getByTestId("paperclip-icon")).toBeInTheDocument();
    expect(screen.getByText("3 references")).toBeInTheDocument();
  });

  it("should display singular reference message", () => {
    const entityWithOneRef = {
      ...mockEntity,
      references: { profiles: ["p1"] },
    };

    render(
      <MockReferenceCounter
        entity={entityWithOneRef}
        collectionName="profiles"
      />,
    );

    expect(screen.getByText("1 reference")).toBeInTheDocument();
  });

  it("should handle zero references", () => {
    const entityWithNoRefs = {
      ...mockEntity,
      references: {},
    };

    render(
      <MockReferenceCounter
        entity={entityWithNoRefs}
        collectionName="profiles"
      />,
    );

    expect(screen.getByText("0 references")).toBeInTheDocument();
  });

  it("should handle undefined references", () => {
    const entityWithUndefinedRefs = {
      ...mockEntity,
      references: undefined,
    };

    render(
      <MockReferenceCounter
        entity={entityWithUndefinedRefs}
        collectionName="profiles"
      />,
    );

    expect(screen.getByText("0 references")).toBeInTheDocument();
  });
});

// Mocks for collections
const mockCollectionName = {
  ARMORS: "ARMORS",
  PROFILES: "PROFILES",
  WEAPONS: "WEAPONS",
};

// Now tests for the real component
describe("CrudReferenceCounter Real Component", () => {
  let ReferenceCounter: any;
  let createRoot: jest.Mock;
  let mockRender: jest.Mock;
  let mockUnmount: jest.Mock;

  // Mock all dependencies
  beforeAll(() => {
    // Mock definitions
    jest.doMock("../../../../lib/definitions", () => ({
      CollectionName: mockCollectionName,
    }));

    // Mock CrudReferenceModal
    jest.doMock("../CrudReferenceModal", () => {
      const MockCrudReferenceModal = (props: any) => {
        return React.createElement("div", {
          "data-props": JSON.stringify({
            collectionName: props.collectionName,
            entityId: props.entityId,
            entityName: props.entityName,
          }),
          "data-testid": "crud-reference-modal",
        });
      };
      return MockCrudReferenceModal;
    });

    // Mock GameSystemContext
    jest.doMock("../../../../lib/contexts/GameSystemContext", () => ({
      GameSystemContext: React.createContext([
        {}, // gameSystem
        {
          allowedToRefer: () => ["profiles"],
          canBeMentionedBy: () => ["weapons"],
          getAllowedToRefer: () => ["PROFILES"],
        },
      ]),
    }));

    // Mock useEntities
    jest.doMock("../../../../lib/hooks/useEntities", () => ({
      __esModule: true,
      default: () => ({
        getEntity: jest.fn(),
        loadEntities: jest.fn().mockResolvedValue([]),
        loading: false,
        saveEntity: jest.fn(),
      }),
    }));

    // Mock next-auth/react
    jest.doMock("next-auth/react", () => ({
      SessionProvider: ({ children }: any) => children,
      useSession: () => ({
        data: {
          user: { email: "test@example.com", name: "Test User" },
        },
        status: "authenticated",
      }),
    }));

    // Mock antd
    jest.doMock("antd", () => ({
      Tooltip: ({ children }: any) =>
        React.createElement("div", { "data-testid": "tooltip" }, children),
      theme: {
        useToken: () => ({
          token: {
            colorText: "#000000",
            colorTextDisabled: "#cccccc",
            colorTextSecondary: "#666666",
            colorTextTertiary: "#999999",
          },
        }),
      },
    }));

    // Mock heroicons
    jest.doMock("@heroicons/react/24/outline", () => ({
      ArrowUturnRightIcon: () =>
        React.createElement("div", { "data-testid": "arrow-return-icon" }),
      PaperClipIcon: () =>
        React.createElement("div", { "data-testid": "paperclip-icon" }),
    }));

    // Mock react-dom/client
    mockRender = jest.fn();
    mockUnmount = jest.fn();
    createRoot = jest.fn(() => ({
      render: mockRender,
      unmount: mockUnmount,
    }));

    jest.doMock("react-dom/client", () => ({
      createRoot,
    }));
  });

  beforeAll(async () => {
    // Import the component after all mocks
    const componentModule = await import("../index");
    ReferenceCounter = componentModule.default;
  });

  it("should import without crashing", async () => {
    await expect(async () => {
      await import("../index");
    }).not.toThrow();
  });

  describe("ViewOnly Mode", () => {
    beforeEach(() => {
      jest.clearAllMocks();
    });

    it("should not open modal when viewOnly is true", () => {
      const TestReferenceCounter = () => {
        const mockEntity = {
          _id: "test-id",
          name: "Test Entity",
          references: { ref1: "PROFILES" },
        };

        return React.createElement(ReferenceCounter, {
          collectionName: mockCollectionName.PROFILES,
          entity: mockEntity,
          viewOnly: true,
        });
      };

      render(React.createElement(TestReferenceCounter));

      const component = screen
        .getByText("1 reference")
        .closest('div[class*="cursor-"]');
      fireEvent.click(component!);

      expect(createRoot).not.toHaveBeenCalled();
    });

    it("should apply default cursor when viewOnly is true", () => {
      const TestReferenceCounter = () => {
        const mockEntity = {
          _id: "test-id",
          name: "Test Entity",
          references: {},
        };

        return React.createElement(ReferenceCounter, {
          collectionName: mockCollectionName.PROFILES,
          entity: mockEntity,
          viewOnly: true,
        });
      };

      render(React.createElement(TestReferenceCounter));

      const component = screen
        .getByText("0 references")
        .closest('div[class*="cursor-"]');
      expect(component).toHaveClass("cursor-default");
      expect(component).not.toHaveClass("cursor-pointer");
    });

    it("should apply pointer cursor when viewOnly is false", () => {
      const TestReferenceCounter = () => {
        const mockEntity = {
          _id: "test-id",
          name: "Test Entity",
          references: {},
        };

        return React.createElement(ReferenceCounter, {
          collectionName: mockCollectionName.PROFILES,
          entity: mockEntity,
          viewOnly: false,
        });
      };

      render(React.createElement(TestReferenceCounter));

      const component = screen
        .getByText("0 references")
        .closest('div[class*="cursor-"]');
      expect(component).toHaveClass("cursor-pointer");
      expect(component).not.toHaveClass("cursor-default");
    });
  });

  describe("Reference Count Display", () => {
    beforeEach(() => {
      jest.clearAllMocks();
    });

    it("should use currentReferences for display count", () => {
      const TestReferenceCounter = () => {
        const mockEntity = {
          _id: "test-id",
          name: "Test Entity",
          references: { ref1: "PROFILES", ref2: "WEAPONS" },
        };

        return React.createElement(ReferenceCounter, {
          collectionName: mockCollectionName.PROFILES,
          entity: mockEntity,
          viewOnly: false,
        });
      };

      render(React.createElement(TestReferenceCounter));
      expect(screen.getByText("2 references")).toBeInTheDocument();
    });

    it("should handle entity with undefined references", () => {
      const TestReferenceCounter = () => {
        const mockEntity = {
          _id: "test-id",
          name: "Test Entity",
          references: undefined,
        };

        return React.createElement(ReferenceCounter, {
          collectionName: mockCollectionName.PROFILES,
          entity: mockEntity,
          viewOnly: false,
        });
      };

      render(React.createElement(TestReferenceCounter));
      expect(screen.getByText("0 references")).toBeInTheDocument();
    });
  });

  describe("Modal Opening", () => {
    beforeEach(() => {
      jest.clearAllMocks();
    });

    it("should open modal with correct props when clicked", () => {
      const TestReferenceCounter = () => {
        const mockEntity = {
          _id: "test-id",
          name: "Test Entity",
          references: { ref1: "PROFILES" },
        };

        return React.createElement(ReferenceCounter, {
          collectionName: mockCollectionName.PROFILES,
          entity: mockEntity,
          viewOnly: false,
        });
      };

      render(React.createElement(TestReferenceCounter));

      const component = screen
        .getByText("1 reference")
        .closest('div[class*="cursor-"]');
      fireEvent.click(component!);

      expect(createRoot).toHaveBeenCalled();
      expect(mockRender).toHaveBeenCalled();

      const renderedElement = mockRender.mock.calls[0][0];
      const modalElement = renderedElement.props.children;
      expect(modalElement.props.entityId).toBe("test-id");
      expect(modalElement.props.entityName).toBe("Test Entity");
      expect(modalElement.props.showModal).toBe(true);
      expect(modalElement.props.references).toEqual({ ref1: "PROFILES" });
      expect(modalElement.props.collectionName).toBe(
        mockCollectionName.PROFILES,
      );
    });

    it("should wrap modal with SessionProvider", () => {
      const TestReferenceCounter = () => {
        const mockEntity = {
          _id: "test-id",
          name: "Test Entity",
          references: {},
        };

        return React.createElement(ReferenceCounter, {
          collectionName: mockCollectionName.PROFILES,
          entity: mockEntity,
          viewOnly: false,
        });
      };

      render(React.createElement(TestReferenceCounter));

      const component = screen
        .getByText("0 references")
        .closest('div[class*="cursor-"]');
      fireEvent.click(component!);

      const renderedElement = mockRender.mock.calls[0][0];
      // The SessionProvider mock just renders children, so we check the tree structure
      expect(renderedElement.props.session).toBeDefined();
    });

    it("should pass currentReferences to modal", () => {
      const TestReferenceCounter = () => {
        const mockEntity = {
          _id: "test-id",
          name: "Test Entity",
          references: { ref1: "PROFILES", ref2: "WEAPONS" },
        };

        return React.createElement(ReferenceCounter, {
          collectionName: mockCollectionName.PROFILES,
          entity: mockEntity,
          viewOnly: false,
        });
      };

      render(React.createElement(TestReferenceCounter));

      const component = screen
        .getByText("2 references")
        .closest('div[class*="cursor-"]');
      fireEvent.click(component!);

      const renderedElement = mockRender.mock.calls[0][0];
      const modalElement = renderedElement.props.children;
      expect(modalElement.props.references).toEqual({
        ref1: "PROFILES",
        ref2: "WEAPONS",
      });
    });
  });

  describe("State Update After Save", () => {
    beforeEach(() => {
      jest.clearAllMocks();
    });

    it("should update reference count after modal save", () => {
      const TestReferenceCounter = () => {
        const mockEntity = {
          _id: "test-id",
          name: "Test Entity",
          references: { ref1: "PROFILES" },
        };

        return React.createElement(ReferenceCounter, {
          collectionName: mockCollectionName.PROFILES,
          entity: mockEntity,
          viewOnly: false,
        });
      };

      render(React.createElement(TestReferenceCounter));

      expect(screen.getByText("1 reference")).toBeInTheDocument();

      // Click to open modal
      const component = screen
        .getByText("1 reference")
        .closest('div[class*="cursor-"]');
      fireEvent.click(component!);

      // Get the onOk (handleSaved) callback passed to the modal
      const renderedElement = mockRender.mock.calls[0][0];
      const modalElement = renderedElement.props.children;
      const handleSaved = modalElement.props.onOk;

      // Simulate saving with new references
      act(() => {
        handleSaved({
          ref1: "PROFILES",
          ref2: "WEAPONS",
          ref3: "ARMORS",
        });
      });

      // The display should update to reflect the new count
      expect(screen.getByText("3 references")).toBeInTheDocument();
    });

    it("should unmount modal after save", () => {
      const TestReferenceCounter = () => {
        const mockEntity = {
          _id: "test-id",
          name: "Test Entity",
          references: { ref1: "PROFILES" },
        };

        return React.createElement(ReferenceCounter, {
          collectionName: mockCollectionName.PROFILES,
          entity: mockEntity,
          viewOnly: false,
        });
      };

      render(React.createElement(TestReferenceCounter));

      const component = screen
        .getByText("1 reference")
        .closest('div[class*="cursor-"]');
      fireEvent.click(component!);

      const renderedElement = mockRender.mock.calls[0][0];
      const modalElement = renderedElement.props.children;
      const handleSaved = modalElement.props.onOk;

      act(() => {
        handleSaved({ ref1: "PROFILES" });
      });

      expect(mockUnmount).toHaveBeenCalled();
    });

    it("should pass updated references to modal on second open", () => {
      const TestReferenceCounter = () => {
        const mockEntity = {
          _id: "test-id",
          name: "Test Entity",
          references: { ref1: "PROFILES" },
        };

        return React.createElement(ReferenceCounter, {
          collectionName: mockCollectionName.PROFILES,
          entity: mockEntity,
          viewOnly: false,
        });
      };

      render(React.createElement(TestReferenceCounter));

      // Open modal first time
      const component = screen
        .getByText("1 reference")
        .closest('div[class*="cursor-"]');
      fireEvent.click(component!);

      // Save with new references
      const renderedElement1 = mockRender.mock.calls[0][0];
      const modalElement1 = renderedElement1.props.children;
      const handleSaved = modalElement1.props.onOk;

      const newRefs = { ref1: "PROFILES", ref2: "WEAPONS" };
      act(() => {
        handleSaved(newRefs);
      });

      // Open modal second time
      const updatedComponent = screen
        .getByText("2 references")
        .closest('div[class*="cursor-"]');
      fireEvent.click(updatedComponent!);

      // Check that second render passes the updated references
      const renderedElement2 = mockRender.mock.calls[1][0];
      const modalElement2 = renderedElement2.props.children;
      expect(modalElement2.props.references).toEqual(newRefs);
    });

    it("should update to 0 references when all are removed", () => {
      const TestReferenceCounter = () => {
        const mockEntity = {
          _id: "test-id",
          name: "Test Entity",
          references: { ref1: "PROFILES", ref2: "WEAPONS" },
        };

        return React.createElement(ReferenceCounter, {
          collectionName: mockCollectionName.PROFILES,
          entity: mockEntity,
          viewOnly: false,
        });
      };

      render(React.createElement(TestReferenceCounter));

      expect(screen.getByText("2 references")).toBeInTheDocument();

      const component = screen
        .getByText("2 references")
        .closest('div[class*="cursor-"]');
      fireEvent.click(component!);

      const renderedElement = mockRender.mock.calls[0][0];
      const modalElement = renderedElement.props.children;
      const handleSaved = modalElement.props.onOk;

      act(() => {
        handleSaved({});
      });

      expect(screen.getByText("0 references")).toBeInTheDocument();
    });
  });

  describe("Cancel Modal", () => {
    beforeEach(() => {
      jest.clearAllMocks();
    });

    it("should unmount modal on cancel without updating references", () => {
      const TestReferenceCounter = () => {
        const mockEntity = {
          _id: "test-id",
          name: "Test Entity",
          references: { ref1: "PROFILES" },
        };

        return React.createElement(ReferenceCounter, {
          collectionName: mockCollectionName.PROFILES,
          entity: mockEntity,
          viewOnly: false,
        });
      };

      render(React.createElement(TestReferenceCounter));

      const component = screen
        .getByText("1 reference")
        .closest('div[class*="cursor-"]');
      fireEvent.click(component!);

      const renderedElement = mockRender.mock.calls[0][0];
      const modalElement = renderedElement.props.children;
      const onCancel = modalElement.props.onCancel;

      act(() => {
        onCancel();
      });

      expect(mockUnmount).toHaveBeenCalled();
      expect(screen.getByText("1 reference")).toBeInTheDocument();
    });
  });
});
