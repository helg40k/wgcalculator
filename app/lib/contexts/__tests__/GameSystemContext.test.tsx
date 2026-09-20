import React, { useContext } from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { usePathname } from "next/navigation";

import {
  GameSystemContext,
  GameSystemProvider,
} from "@/app/lib/contexts/GameSystemContext";
import {
  CollectionName,
  Edition,
  EntityStatusRegistry,
  GameSystem,
} from "@/app/lib/definitions";
import { getSelectedEditionStorageKey } from "@/app/lib/selectedEditionStorage";

import "@testing-library/jest-dom";

jest.mock("@ant-design/v5-patch-for-react-19", () => ({}));

jest.mock("@/app/lib/services/firebase/utils/firestore", () => ({
  __esModule: true,
  default: "mock-firestore-instance",
}));

jest.mock("@/app/lib/services/firebase/utils/app", () => ({
  __esModule: true,
  default: "mock-app-instance",
}));

jest.mock("next/navigation");

jest.mock("@/app/lib/errorMessage", () => ({
  __esModule: true,
  default: jest.fn(),
}));

const mockUsePathname = usePathname as jest.MockedFunction<typeof usePathname>;
const mockGetDocuments = jest.fn().mockResolvedValue([]);
jest.mock("@/app/lib/services/firebase/helpers/getDocuments", () => ({
  __esModule: true,
  default: (...args: unknown[]) => mockGetDocuments(...args),
}));

const mockGetDocumentsByIds = jest.fn().mockResolvedValue([]);
jest.mock("@/app/lib/services/firebase/helpers/getDocumentsByIds", () => ({
  __esModule: true,
  default: (...args: unknown[]) => mockGetDocumentsByIds(...args),
}));

const mockGameSystem: GameSystem = {
  _createdAt: { nanoseconds: 0, seconds: 0 } as any,
  _createdBy: "test@example.com",
  _id: "sys-1",
  _isUpdated: false,
  _updatedAt: { nanoseconds: 0, seconds: 0 } as any,
  _updatedBy: "test@example.com",
  additional: [],
  editions: {},
  key: "testgame",
  name: "Test Game",
  owner: "test-owner",
  referenceHierarchy: {
    keywords: [],
    sources: ["keywords"],
  } as any,
  status: "active",
};

const createEdition = (id: string, name: string, order: number): Edition => ({
  _createdAt: { nanoseconds: 0, seconds: 0 } as never,
  _createdBy: "test@example.com",
  _id: id,
  _isUpdated: false,
  _updatedAt: { nanoseconds: 0, seconds: 0 } as never,
  _updatedBy: "test@example.com",
  name,
  order,
  status: EntityStatusRegistry.ACTIVE,
});

const ContextConsumer = () => {
  const [gameSystem, selectedEdition, utils] = useContext(GameSystemContext);
  const canBeMentionedBy = gameSystem
    ? utils.canBeMentionedBy("keywords" as CollectionName)
    : [];
  const allowedToRefer = gameSystem
    ? utils.getAllowedToRefer("sources" as CollectionName)
    : [];

  return (
    <div>
      <span data-testid="system-name">{gameSystem?.name ?? "none"}</span>
      <span data-testid="edition-name">{selectedEdition?.name ?? "none"}</span>
      <span data-testid="mentioned-by">{canBeMentionedBy.join(",")}</span>
      <span data-testid="allowed-to-refer">{allowedToRefer.join(",")}</span>
    </div>
  );
};

describe("GameSystemContext", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
    mockUsePathname.mockReturnValue("/testgame/admin");
    mockGetDocuments.mockReset().mockResolvedValue([]);
    mockGetDocumentsByIds.mockReset().mockResolvedValue([]);
  });

  describe("default context value", () => {
    it("should provide undefined gameSystem and noop utils by default", () => {
      render(<ContextConsumer />);

      expect(screen.getByTestId("system-name").textContent).toBe("none");
      expect(screen.getByTestId("edition-name").textContent).toBe("none");
      expect(screen.getByTestId("mentioned-by").textContent).toBe("");
      expect(screen.getByTestId("allowed-to-refer").textContent).toBe("");
    });
  });

  describe("GameSystemProvider", () => {
    it("should provide loaded game system to consumers", async () => {
      mockGetDocuments.mockResolvedValueOnce([mockGameSystem]);

      render(
        <GameSystemProvider>
          <ContextConsumer />
        </GameSystemProvider>,
      );

      await waitFor(() => {
        expect(screen.getByTestId("system-name").textContent).toBe("Test Game");
      });
    });

    it("should provide functional utils from useGameSystem", async () => {
      mockGetDocuments.mockResolvedValueOnce([mockGameSystem]);

      render(
        <GameSystemProvider>
          <ContextConsumer />
        </GameSystemProvider>,
      );

      await waitFor(() => {
        expect(screen.getByTestId("system-name").textContent).toBe("Test Game");
      });

      expect(screen.getByTestId("mentioned-by").textContent).toBe("sources");
      expect(screen.getByTestId("allowed-to-refer").textContent).toBe(
        "keywords",
      );
    });

    it("should provide undefined game system when none found", async () => {
      mockGetDocuments.mockResolvedValueOnce([]);

      render(
        <GameSystemProvider>
          <ContextConsumer />
        </GameSystemProvider>,
      );

      await waitFor(() => {
        expect(mockGetDocuments).toHaveBeenCalled();
      });

      expect(screen.getByTestId("system-name").textContent).toBe("none");
      expect(screen.getByTestId("edition-name").textContent).toBe("none");
    });

    it("should provide the only active edition", async () => {
      const only = createEdition("ed-1", "First Edition", 1);
      mockGetDocuments.mockResolvedValueOnce([
        { ...mockGameSystem, editions: { "ed-1": true } },
      ]);
      mockGetDocumentsByIds.mockResolvedValueOnce([only]);

      render(
        <GameSystemProvider>
          <ContextConsumer />
        </GameSystemProvider>,
      );

      await waitFor(() => {
        expect(screen.getByTestId("edition-name").textContent).toBe(
          "First Edition",
        );
      });
      expect(
        localStorage.getItem(getSelectedEditionStorageKey("testgame")),
      ).toBe(null);
    });

    it("should not write storage when defaulting among multiple editions", async () => {
      const high = createEdition("ed-high", "Third Edition", 3);
      const low = createEdition("ed-low", "First Edition", 1);
      mockGetDocuments.mockResolvedValueOnce([
        {
          ...mockGameSystem,
          editions: { "ed-high": true, "ed-low": true },
        },
      ]);
      mockGetDocumentsByIds.mockResolvedValueOnce([high, low]);

      render(
        <GameSystemProvider>
          <ContextConsumer />
        </GameSystemProvider>,
      );

      await waitFor(() => {
        expect(screen.getByTestId("edition-name").textContent).toBe(
          "Third Edition",
        );
      });
      expect(
        localStorage.getItem(getSelectedEditionStorageKey("testgame")),
      ).toBe(null);
    });

    it("should restore a stored edition when it is still active", async () => {
      const high = createEdition("ed-high", "Third Edition", 3);
      const low = createEdition("ed-low", "First Edition", 1);
      localStorage.setItem(getSelectedEditionStorageKey("testgame"), "ed-low");
      mockGetDocuments.mockResolvedValueOnce([
        {
          ...mockGameSystem,
          editions: { "ed-high": true, "ed-low": true },
        },
      ]);
      mockGetDocumentsByIds.mockResolvedValueOnce([high, low]);

      render(
        <GameSystemProvider>
          <ContextConsumer />
        </GameSystemProvider>,
      );

      await waitFor(() => {
        expect(screen.getByTestId("edition-name").textContent).toBe(
          "First Edition",
        );
      });
    });

    it("should fall back to the highest order when stored edition is stale", async () => {
      const high = createEdition("ed-high", "Third Edition", 3);
      const low = createEdition("ed-low", "First Edition", 1);
      localStorage.setItem(getSelectedEditionStorageKey("testgame"), "gone");
      mockGetDocuments.mockResolvedValueOnce([
        {
          ...mockGameSystem,
          editions: { "ed-high": true, "ed-low": true },
        },
      ]);
      mockGetDocumentsByIds.mockResolvedValueOnce([low, high]);

      render(
        <GameSystemProvider>
          <ContextConsumer />
        </GameSystemProvider>,
      );

      await waitFor(() => {
        expect(screen.getByTestId("edition-name").textContent).toBe(
          "Third Edition",
        );
      });
    });

    it("should persist the edition when setSelectedEdition is called", async () => {
      const high = createEdition("ed-high", "Third Edition", 3);
      const low = createEdition("ed-low", "First Edition", 1);
      mockGetDocuments.mockResolvedValueOnce([
        {
          ...mockGameSystem,
          editions: { "ed-high": true, "ed-low": true },
        },
      ]);
      mockGetDocumentsByIds.mockResolvedValueOnce([high, low]);

      const Setter = () => {
        const [, selectedEdition, utils] = useContext(GameSystemContext);
        return (
          <button
            type="button"
            onClick={() => utils.setSelectedEdition("ed-low")}
          >
            {selectedEdition?.name ?? "none"}
          </button>
        );
      };

      render(
        <GameSystemProvider>
          <Setter />
        </GameSystemProvider>,
      );

      await waitFor(() => {
        expect(screen.getByRole("button").textContent).toBe("Third Edition");
      });

      fireEvent.click(screen.getByRole("button"));

      await waitFor(() => {
        expect(screen.getByRole("button").textContent).toBe("First Edition");
      });
      expect(
        localStorage.getItem(getSelectedEditionStorageKey("testgame")),
      ).toBe("ed-low");
    });
  });

  describe("context value stability", () => {
    it("should memoize value so consumers don't re-render unnecessarily", async () => {
      mockGetDocuments.mockResolvedValue([mockGameSystem]);
      let renderCount = 0;

      const RenderCounter = () => {
        useContext(GameSystemContext);
        renderCount++;
        return <div data-testid="count">{renderCount}</div>;
      };

      const { rerender } = render(
        <GameSystemProvider>
          <RenderCounter />
        </GameSystemProvider>,
      );

      await waitFor(() => {
        expect(mockGetDocuments).toHaveBeenCalled();
      });

      const countAfterLoad = renderCount;

      rerender(
        <GameSystemProvider>
          <RenderCounter />
        </GameSystemProvider>,
      );

      // The count should only increase by 1 for the rerender itself,
      // not extra re-renders from unstable context value
      expect(renderCount).toBeLessThanOrEqual(countAfterLoad + 1);
    });
  });

  describe("readonly tuple type", () => {
    it("should expose a readonly tuple compatible with as const", () => {
      const TestComponent = () => {
        const value = useContext(GameSystemContext);
        const [gs, , utils] = value;
        return (
          <div>
            <span data-testid="has-gs">{gs !== undefined ? "yes" : "no"}</span>
            <span data-testid="has-utils">
              {typeof utils.canBeMentionedBy === "function" ? "yes" : "no"}
            </span>
          </div>
        );
      };

      render(<TestComponent />);

      expect(screen.getByTestId("has-gs").textContent).toBe("no");
      expect(screen.getByTestId("has-utils").textContent).toBe("yes");
    });
  });
});
