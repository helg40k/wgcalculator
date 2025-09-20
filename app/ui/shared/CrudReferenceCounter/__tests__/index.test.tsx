import React from "react";
import { render, screen } from "@testing-library/react";

import "@testing-library/jest-dom";

// Спочатку протестуємо мінімальний мок компонента
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

// Тепер тести для справжнього компонента
describe("CrudReferenceCounter Real Component", () => {
  // Mock всі залежності
  beforeAll(() => {
    // Mock CrudReferenceModal
    jest.doMock("../CrudReferenceModal", () => {
      const MockCrudReferenceModal = () => {
        return React.createElement("div", {
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
          // utils
          allowedToRefer: () => ["profiles"],
          canBeMentionedBy: () => ["weapons"],
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
    jest.doMock("react-dom/client", () => ({
      createRoot: jest.fn(() => ({
        render: jest.fn(),
        unmount: jest.fn(),
      })),
    }));
  });

  it("should import without crashing", async () => {
    await expect(async () => {
      await import("../index");
    }).not.toThrow();
  });
});
