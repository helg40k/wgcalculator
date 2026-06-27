import React, { createContext } from "react";
import { act, fireEvent, render, screen } from "@testing-library/react";

import "@testing-library/jest-dom";

// First test the minimal mock component
const MockReferenceCounter = ({ entity }: any) => {
  const refCount = entity?.references
    ? Object.keys(entity.references).length
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
      p1: { name: "profiles" },
      p2: { name: "profiles" },
      w1: { name: "weapons" },
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
      references: { p1: { name: "profiles" } },
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

const mockLoadEntities = jest.fn().mockResolvedValue([]);
const mockInvalidateCollections = jest.fn();
const mockReloadMentions = jest.fn();
const mockGetMentions = jest.fn().mockReturnValue({});

// Shared mock context for EntitiesUpdateContext
const MockEntitiesUpdateContext = createContext<{
  updateEntity: (entityId: string, updates: any) => void;
  reloadEntities?: () => void;
  mentionsVersion: number;
} | null>(null);

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
      function MockCrudReferenceModal(props: any) {
        return React.createElement("div", {
          "data-props": JSON.stringify({
            collectionName: props.collectionName,
            entityId: props.entityId,
            entityName: props.entityName,
          }),
          "data-testid": "crud-reference-modal",
        });
      }
      return MockCrudReferenceModal;
    });

    // Mock GameSystemContext
    jest.doMock("../../../../lib/contexts/GameSystemContext", () => ({
      GameSystemContext: React.createContext([
        {}, // gameSystem
        {
          allowedToRefer: () => ["profiles"],
          canBeMentionedBy: () => ["WEAPONS", "ARMORS"],
          getAllowedToRefer: () => ["PROFILES"],
        },
      ]),
    }));

    // Mock useEntities
    jest.doMock("../../../../lib/hooks/useEntities", () => ({
      __esModule: true,
      default: () => ({
        getEntity: jest.fn(),
        loadEntities: mockLoadEntities,
        loading: false,
        saveEntity: jest.fn(),
      }),
    }));

    // Mock next-auth/react
    jest.doMock("next-auth/react", () => ({
      SessionProvider: function MockSessionProvider(props: {
        children?: React.ReactNode;
      }) {
        return props.children ?? null;
      },
      useSession: () => ({
        data: {
          user: { email: "test@example.com", name: "Test User" },
        },
        status: "authenticated",
      }),
    }));

    // Mock antd
    jest.doMock("antd", () => ({
      Tooltip: ({ children, title }: any) =>
        React.createElement(
          "div",
          { "data-testid": "tooltip" },
          React.createElement(
            "div",
            { "data-testid": "tooltip-content" },
            title,
          ),
          children,
        ),
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

    // Mock CrudMultiLineView to export the shared context
    jest.doMock("@/app/ui/CrudMultiLineView", () => ({
      EntitiesUpdateContext: MockEntitiesUpdateContext,
    }));

    // Mock collectionInvalidation
    jest.doMock("@/app/lib/collectionInvalidation", () => ({
      invalidateCollections: (...args: unknown[]) =>
        mockInvalidateCollections(...args),
    }));

    // Mock MentionsContext
    jest.doMock("../../../../lib/contexts/MentionsContext", () => ({
      MentionsContext: React.createContext(null),
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

    const heroiconsOutline = jest.requireMock(
      "@heroicons/react/24/outline",
    ) as {
      ArrowUturnRightIcon: unknown;
      PaperClipIcon: unknown;
    };
    expect(heroiconsOutline.ArrowUturnRightIcon).toBeDefined();
    expect(heroiconsOutline.PaperClipIcon).toBeDefined();
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
          references: { ref1: { name: "PROFILES" } },
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
          references: { ref1: { name: "PROFILES" }, ref2: { name: "WEAPONS" } },
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
          references: { ref1: { name: "PROFILES" } },
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

      const modalElement = mockRender.mock.calls[0][0];
      expect(modalElement.props.entityId).toBe("test-id");
      expect(modalElement.props.entityName).toBe("Test Entity");
      expect(modalElement.props.showModal).toBe(true);
      expect(modalElement.props.references).toEqual({
        ref1: { name: "PROFILES" },
      });
      expect(modalElement.props.collectionName).toBe(
        mockCollectionName.PROFILES,
      );
    });

    it("should render modal directly without SessionProvider wrapper", () => {
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

      const modalElement = mockRender.mock.calls[0][0];
      expect(modalElement.props.showModal).toBe(true);
      expect(modalElement.props.session).toBeUndefined();
    });

    it("should pass currentReferences to modal", () => {
      const TestReferenceCounter = () => {
        const mockEntity = {
          _id: "test-id",
          name: "Test Entity",
          references: { ref1: { name: "PROFILES" }, ref2: { name: "WEAPONS" } },
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

      const modalElement = mockRender.mock.calls[0][0];
      expect(modalElement.props.references).toEqual({
        ref1: { name: "PROFILES" },
        ref2: { name: "WEAPONS" },
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
          references: { ref1: { name: "PROFILES" } },
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
      const modalElement = mockRender.mock.calls[0][0];
      const handleSaved = modalElement.props.onOk;

      // Simulate saving with new references
      act(() => {
        handleSaved({
          ref1: { name: "PROFILES" },
          ref2: { name: "WEAPONS" },
          ref3: { name: "ARMORS" },
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
          references: { ref1: { name: "PROFILES" } },
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

      const modalElement = mockRender.mock.calls[0][0];
      const handleSaved = modalElement.props.onOk;

      act(() => {
        handleSaved({ ref1: { name: "PROFILES" } });
      });

      expect(mockUnmount).toHaveBeenCalled();
    });

    it("should pass updated references to modal on second open", () => {
      const TestReferenceCounter = () => {
        const mockEntity = {
          _id: "test-id",
          name: "Test Entity",
          references: { ref1: { name: "PROFILES" } },
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
      const modalElement1 = mockRender.mock.calls[0][0];
      const handleSaved = modalElement1.props.onOk;

      const newRefs = { ref1: { name: "PROFILES" }, ref2: { name: "WEAPONS" } };
      act(() => {
        handleSaved(newRefs);
      });

      // Open modal second time
      const updatedComponent = screen
        .getByText("2 references")
        .closest('div[class*="cursor-"]');
      fireEvent.click(updatedComponent!);

      // Check that second render passes the updated references
      const modalElement2 = mockRender.mock.calls[1][0];
      expect(modalElement2.props.references).toEqual(newRefs);
    });

    it("should update to 0 references when all are removed", () => {
      const TestReferenceCounter = () => {
        const mockEntity = {
          _id: "test-id",
          name: "Test Entity",
          references: { ref1: { name: "PROFILES" }, ref2: { name: "WEAPONS" } },
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

      const modalElement = mockRender.mock.calls[0][0];
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
          references: { ref1: { name: "PROFILES" } },
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

      const modalElement = mockRender.mock.calls[0][0];
      const onCancel = modalElement.props.onCancel;

      act(() => {
        onCancel();
      });

      expect(mockUnmount).toHaveBeenCalled();
      expect(screen.getByText("1 reference")).toBeInTheDocument();
    });
  });

  describe("EntitiesUpdateContext Integration", () => {
    beforeEach(() => {
      jest.clearAllMocks();
    });

    it("should call updateEntity from context after save", () => {
      const mockUpdateEntity = jest.fn();
      const mockReloadEntities = jest.fn();

      const TestReferenceCounter = () => {
        const mockEntity = {
          _id: "test-id",
          name: "Test Entity",
          references: { ref1: { name: "PROFILES" } },
        };

        return React.createElement(
          MockEntitiesUpdateContext.Provider,
          {
            value: {
              mentionsVersion: 0,
              reloadEntities: mockReloadEntities,
              updateEntity: mockUpdateEntity,
            },
          },
          React.createElement(ReferenceCounter, {
            collectionName: mockCollectionName.PROFILES,
            entity: mockEntity,
            viewOnly: false,
          }),
        );
      };

      render(React.createElement(TestReferenceCounter));

      const component = screen
        .getByText("1 reference")
        .closest('div[class*="cursor-"]');
      fireEvent.click(component!);

      const modalElement = mockRender.mock.calls[0][0];
      const handleSaved = modalElement.props.onOk;

      const newRefs = { ref1: { name: "PROFILES" }, ref2: { name: "WEAPONS" } };
      act(() => {
        handleSaved(newRefs);
      });

      expect(mockUpdateEntity).toHaveBeenCalledWith("test-id", {
        references: newRefs,
      });
      expect(mockReloadEntities).toHaveBeenCalled();
    });

    it("should not throw when context is not provided", () => {
      const TestReferenceCounter = () => {
        const mockEntity = {
          _id: "test-id",
          name: "Test Entity",
          references: { ref1: { name: "PROFILES" } },
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

      const modalElement = mockRender.mock.calls[0][0];
      const handleSaved = modalElement.props.onOk;

      expect(() => {
        act(() => {
          handleSaved({
            ref1: { name: "PROFILES" },
            ref2: { name: "WEAPONS" },
          });
        });
      }).not.toThrow();

      expect(screen.getByText("2 references")).toBeInTheDocument();
    });
  });

  describe("Prop Sync via useEffect", () => {
    beforeEach(() => {
      jest.clearAllMocks();
    });

    it("should sync currentReferences when entity.references prop changes", () => {
      const mockEntity = {
        _id: "test-id",
        name: "Test Entity",
        references: { ref1: { name: "PROFILES" } } as Record<
          string,
          { name: string }
        >,
      };

      const TestWrapper = ({
        refs,
      }: {
        refs: Record<string, { name: string }>;
      }) => {
        return React.createElement(ReferenceCounter, {
          collectionName: mockCollectionName.PROFILES,
          entity: { ...mockEntity, references: refs },
          viewOnly: false,
        });
      };

      const { rerender } = render(
        React.createElement(TestWrapper, {
          refs: { ref1: { name: "PROFILES" } },
        }),
      );

      expect(screen.getByText("1 reference")).toBeInTheDocument();

      rerender(
        React.createElement(TestWrapper, {
          refs: {
            ref1: { name: "PROFILES" },
            ref2: { name: "WEAPONS" },
            ref3: { name: "ARMORS" },
          },
        }),
      );

      expect(screen.getByText("3 references")).toBeInTheDocument();
    });
  });

  describe("Memo Comparison", () => {
    it("should re-render when entity.references changes", () => {
      const renderCount = { current: 0 };

      const TestWrapper = ({
        refs,
      }: {
        refs: Record<string, { name: string }>;
      }) => {
        const mockEntity = {
          _id: "test-id",
          name: "Test Entity",
          references: refs,
        };

        renderCount.current++;
        return React.createElement(ReferenceCounter, {
          collectionName: mockCollectionName.PROFILES,
          entity: mockEntity,
          viewOnly: false,
        });
      };

      const { rerender } = render(
        React.createElement(TestWrapper, {
          refs: { ref1: { name: "PROFILES" } },
        }),
      );

      expect(screen.getByText("1 reference")).toBeInTheDocument();

      rerender(
        React.createElement(TestWrapper, {
          refs: { ref1: { name: "PROFILES" }, ref2: { name: "WEAPONS" } },
        }),
      );

      expect(screen.getByText("2 references")).toBeInTheDocument();
    });

    it("should re-render when viewOnly changes", () => {
      const mockEntity = {
        _id: "test-id",
        name: "Test Entity",
        references: { ref1: { name: "PROFILES" } },
      };

      const TestWrapper = ({ viewOnly }: { viewOnly: boolean }) => {
        return React.createElement(ReferenceCounter, {
          collectionName: mockCollectionName.PROFILES,
          entity: mockEntity,
          viewOnly,
        });
      };

      const { rerender } = render(
        React.createElement(TestWrapper, { viewOnly: false }),
      );

      const componentBefore = screen
        .getByText("1 reference")
        .closest('div[class*="cursor-"]');
      expect(componentBefore).toHaveClass("cursor-pointer");

      rerender(React.createElement(TestWrapper, { viewOnly: true }));

      const componentAfter = screen
        .getByText("1 reference")
        .closest('div[class*="cursor-"]');
      expect(componentAfter).toHaveClass("cursor-default");
    });
  });

  describe("Tooltip Mentions Breakdown", () => {
    beforeEach(() => {
      jest.clearAllMocks();
      mockLoadEntities.mockReset().mockResolvedValue([]);
      localStorage.clear();
    });

    it("should show correct entity count per collection", async () => {
      mockLoadEntities.mockImplementation((collName: string) => {
        if (collName === "WEAPONS") {
          return Promise.resolve([
            { _id: "w1", name: "Weapon 1" },
            { _id: "w2", name: "Weapon 2" },
          ]);
        }
        return Promise.resolve([]);
      });

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

      await act(async () => {
        render(React.createElement(TestReferenceCounter));
      });

      const tooltipContent = screen.getByTestId("tooltip-content");
      expect(tooltipContent).toHaveTextContent("2 WEAPONS");
    });

    it("should exclude empty collections from tooltip breakdown", async () => {
      mockLoadEntities.mockImplementation((collName: string) => {
        if (collName === "WEAPONS") {
          return Promise.resolve([{ _id: "w1", name: "Weapon 1" }]);
        }
        return Promise.resolve([]);
      });

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

      await act(async () => {
        render(React.createElement(TestReferenceCounter));
      });

      const tooltipContent = screen.getByTestId("tooltip-content");
      expect(tooltipContent).toHaveTextContent("1 WEAPONS");
      expect(tooltipContent).not.toHaveTextContent("ARMORS");
    });

    it("should show correct counts for multiple collections with entities", async () => {
      mockLoadEntities.mockImplementation((collName: string) => {
        if (collName === "WEAPONS") {
          return Promise.resolve([
            { _id: "w1", name: "Weapon 1" },
            { _id: "w2", name: "Weapon 2" },
            { _id: "w3", name: "Weapon 3" },
          ]);
        }
        if (collName === "ARMORS") {
          return Promise.resolve([{ _id: "a1", name: "Armor 1" }]);
        }
        return Promise.resolve([]);
      });

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

      await act(async () => {
        render(React.createElement(TestReferenceCounter));
      });

      const tooltipContent = screen.getByTestId("tooltip-content");
      expect(tooltipContent).toHaveTextContent("1 ARMORS");
      expect(tooltipContent).toHaveTextContent("3 WEAPONS");
    });
  });

  describe("MentionsVersion Integration", () => {
    beforeEach(() => {
      jest.clearAllMocks();
      mockLoadEntities.mockReset().mockResolvedValue([]);
      localStorage.clear();
    });

    it("should re-run loadMentions when mentionsVersion changes", async () => {
      const mockUpdateEntity = jest.fn();

      const TestWrapper = ({ version }: { version: number }) => {
        const mockEntity = {
          _id: "test-id",
          name: "Test Entity",
          references: {},
        };
        return React.createElement(
          MockEntitiesUpdateContext.Provider,
          {
            value: {
              mentionsVersion: version,
              updateEntity: mockUpdateEntity,
            },
          },
          React.createElement(ReferenceCounter, {
            collectionName: mockCollectionName.PROFILES,
            entity: mockEntity,
            viewOnly: false,
          }),
        );
      };

      let result: any;
      await act(async () => {
        result = render(React.createElement(TestWrapper, { version: 0 }));
      });

      const initialCalls = mockLoadEntities.mock.calls.length;
      expect(initialCalls).toBeGreaterThan(0);

      await act(async () => {
        result.rerender(React.createElement(TestWrapper, { version: 1 }));
      });

      expect(mockLoadEntities.mock.calls.length).toBeGreaterThan(initialCalls);
    });

    it("should not re-run loadMentions when mentionsVersion stays the same", async () => {
      const mockUpdateEntity = jest.fn();

      const TestWrapper = ({ version }: { version: number }) => {
        const mockEntity = {
          _id: "test-id",
          name: "Test Entity",
          references: {},
        };
        return React.createElement(
          MockEntitiesUpdateContext.Provider,
          {
            value: {
              mentionsVersion: version,
              updateEntity: mockUpdateEntity,
            },
          },
          React.createElement(ReferenceCounter, {
            collectionName: mockCollectionName.PROFILES,
            entity: mockEntity,
            viewOnly: false,
          }),
        );
      };

      let result: any;
      await act(async () => {
        result = render(React.createElement(TestWrapper, { version: 0 }));
      });

      const initialCalls = mockLoadEntities.mock.calls.length;

      await act(async () => {
        result.rerender(React.createElement(TestWrapper, { version: 0 }));
      });

      expect(mockLoadEntities.mock.calls.length).toBe(initialCalls);
    });

    it("should use mentionsVersion 0 as default when context is not provided", async () => {
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

      await act(async () => {
        render(React.createElement(TestReferenceCounter));
      });

      expect(mockLoadEntities).toHaveBeenCalled();
    });
  });

  describe("MentionsLoaded and localStorage Cache", () => {
    beforeEach(() => {
      jest.clearAllMocks();
      mockLoadEntities.mockReset().mockResolvedValue([]);
      localStorage.clear();
    });

    it("should show cached localStorage value before mentions load", () => {
      localStorage.setItem("mentNumber_test-id_PROFILES", "3");

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

      expect(screen.getByText("3 outer mentions")).toBeInTheDocument();
    });

    it("should show real mentNumber after mentions load completes", async () => {
      localStorage.setItem("mentNumber_test-id_PROFILES", "5");

      mockLoadEntities.mockImplementation((collName: string) => {
        if (collName === "WEAPONS") {
          return Promise.resolve([
            { _id: "w1", name: "Weapon 1" },
            { _id: "w2", name: "Weapon 2" },
          ]);
        }
        return Promise.resolve([]);
      });

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

      await act(async () => {
        render(React.createElement(TestReferenceCounter));
      });

      expect(screen.getByText("2 outer mentions")).toBeInTheDocument();
    });

    it("should hide mention counter when loaded result is 0 despite localStorage cache", async () => {
      localStorage.setItem("mentNumber_test-id_PROFILES", "3");

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

      await act(async () => {
        render(React.createElement(TestReferenceCounter));
      });

      expect(screen.queryByTestId("arrow-return-icon")).not.toBeInTheDocument();
    });

    it("should clear localStorage when mentions load with 0", async () => {
      localStorage.setItem("mentNumber_test-id_PROFILES", "3");

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

      await act(async () => {
        render(React.createElement(TestReferenceCounter));
      });

      expect(localStorage.getItem("mentNumber_test-id_PROFILES")).toBe("0");
    });

    it("should update localStorage when mentions load with new count", async () => {
      localStorage.setItem("mentNumber_test-id_PROFILES", "1");

      mockLoadEntities.mockImplementation((collName: string) => {
        if (collName === "WEAPONS") {
          return Promise.resolve([
            { _id: "w1", name: "Weapon 1" },
            { _id: "w2", name: "Weapon 2" },
            { _id: "w3", name: "Weapon 3" },
          ]);
        }
        return Promise.resolve([]);
      });

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

      await act(async () => {
        render(React.createElement(TestReferenceCounter));
      });

      expect(localStorage.getItem("mentNumber_test-id_PROFILES")).toBe("3");
    });
  });

  describe("Collection Invalidation on Save", () => {
    beforeEach(() => {
      jest.clearAllMocks();
    });

    it("should call invalidateCollections with affected collection names after save", () => {
      const TestReferenceCounter = () => {
        const mockEntity = {
          _id: "test-id",
          name: "Test Entity",
          references: { ref1: { name: "PROFILES" } },
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

      const modalElement = mockRender.mock.calls[0][0];
      const handleSaved = modalElement.props.onOk;

      act(() => {
        handleSaved({
          ref1: { name: "PROFILES" },
          ref2: { name: "WEAPONS" },
        });
      });

      expect(mockInvalidateCollections).toHaveBeenCalledTimes(1);
      const calledWith = mockInvalidateCollections.mock.calls[0][0];
      expect(calledWith).toEqual(
        expect.arrayContaining(["PROFILES", "WEAPONS"]),
      );
    });

    it("should include both old and new collection names in invalidation", () => {
      const TestReferenceCounter = () => {
        const mockEntity = {
          _id: "test-id",
          name: "Test Entity",
          references: {
            ref1: { name: "PROFILES" },
            ref2: { name: "ARMORS" },
          },
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

      const modalElement = mockRender.mock.calls[0][0];
      const handleSaved = modalElement.props.onOk;

      act(() => {
        handleSaved({ ref3: { name: "WEAPONS" } });
      });

      expect(mockInvalidateCollections).toHaveBeenCalledTimes(1);
      const calledWith = mockInvalidateCollections.mock.calls[0][0];
      expect(calledWith).toEqual(
        expect.arrayContaining(["PROFILES", "ARMORS", "WEAPONS"]),
      );
    });

    it("should deduplicate collection names across old and new references", () => {
      const TestReferenceCounter = () => {
        const mockEntity = {
          _id: "test-id",
          name: "Test Entity",
          references: { ref1: { name: "PROFILES" } },
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

      const modalElement = mockRender.mock.calls[0][0];
      const handleSaved = modalElement.props.onOk;

      act(() => {
        handleSaved({
          ref1: { name: "PROFILES" },
          ref2: { name: "PROFILES" },
        });
      });

      expect(mockInvalidateCollections).toHaveBeenCalledTimes(1);
      const calledWith = mockInvalidateCollections.mock.calls[0][0] as string[];
      const unique = [...new Set(calledWith)];
      expect(unique).toEqual(["PROFILES"]);
    });

    it("should not call invalidateCollections when both old and new references are empty", () => {
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

      const modalElement = mockRender.mock.calls[0][0];
      const handleSaved = modalElement.props.onOk;

      act(() => {
        handleSaved({});
      });

      expect(mockInvalidateCollections).not.toHaveBeenCalled();
    });
  });

  describe("MentionsContext Integration", () => {
    let MockMentionsContextObj: React.Context<any>;

    beforeAll(async () => {
      const mentionsModule = jest.requireMock(
        "../../../../lib/contexts/MentionsContext",
      ) as { MentionsContext: React.Context<any> };
      MockMentionsContextObj = mentionsModule.MentionsContext;
    });

    beforeEach(() => {
      jest.clearAllMocks();
      mockLoadEntities.mockReset().mockResolvedValue([]);
      mockReloadMentions.mockReset();
      mockGetMentions.mockReset().mockReturnValue({});
    });

    it("should call mentionsCtx.reloadMentions on save when context is provided", () => {
      const TestReferenceCounter = () => {
        const mockEntity = {
          _id: "test-id",
          name: "Test Entity",
          references: { ref1: { name: "PROFILES" } },
        };

        return React.createElement(
          MockMentionsContextObj.Provider,
          {
            value: {
              getMentions: mockGetMentions,
              mentionsLoaded: true,
              reloadMentions: mockReloadMentions,
            },
          },
          React.createElement(ReferenceCounter, {
            collectionName: mockCollectionName.PROFILES,
            entity: mockEntity,
            viewOnly: false,
          }),
        );
      };

      render(React.createElement(TestReferenceCounter));

      const component = screen
        .getByText("1 reference")
        .closest('div[class*="cursor-"]');
      fireEvent.click(component!);

      const modalElement = mockRender.mock.calls[0][0];
      const handleSaved = modalElement.props.onOk;

      act(() => {
        handleSaved({ ref1: { name: "PROFILES" } });
      });

      expect(mockReloadMentions).toHaveBeenCalledTimes(1);
    });

    it("should use getMentions from context instead of loadEntities", async () => {
      mockGetMentions.mockReturnValue({
        WEAPONS: [
          { _id: "w1", name: "Weapon 1" },
          { _id: "w2", name: "Weapon 2" },
        ],
      });

      const TestReferenceCounter = () => {
        const mockEntity = {
          _id: "test-id",
          name: "Test Entity",
          references: {},
        };

        return React.createElement(
          MockMentionsContextObj.Provider,
          {
            value: {
              getMentions: mockGetMentions,
              mentionsLoaded: true,
              reloadMentions: mockReloadMentions,
            },
          },
          React.createElement(ReferenceCounter, {
            collectionName: mockCollectionName.PROFILES,
            entity: mockEntity,
            viewOnly: false,
          }),
        );
      };

      await act(async () => {
        render(React.createElement(TestReferenceCounter));
      });

      expect(mockGetMentions).toHaveBeenCalledWith("test-id");
      expect(screen.getByText("2 outer mentions")).toBeInTheDocument();
    });

    it("should fall back to loadEntities when MentionsContext is null", async () => {
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

      await act(async () => {
        render(React.createElement(TestReferenceCounter));
      });

      expect(mockLoadEntities).toHaveBeenCalled();
    });
  });
});
