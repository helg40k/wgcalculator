import React, { useContext } from "react";
import { render, screen, waitFor } from "@testing-library/react";

import {
  GameSystemContext,
  GameSystemProvider,
} from "@/app/lib/contexts/GameSystemContext";
import { CollectionName, GameSystem } from "@/app/lib/definitions";

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

jest.mock("next/navigation", () => ({ usePathname: () => "/testgame/admin" }));

jest.mock("@/app/lib/errorMessage", () => ({
  __esModule: true,
  default: jest.fn(),
}));

const mockGetDocuments = jest.fn().mockResolvedValue([]);
jest.mock("@/app/lib/services/firebase/helpers/getDocuments", () => ({
  __esModule: true,
  default: (...args: unknown[]) => mockGetDocuments(...args),
}));

const mockGameSystem: GameSystem = {
  _createdAt: { nanoseconds: 0, seconds: 0 } as any,
  _createdBy: "test@example.com",
  _id: "sys-1",
  _isUpdated: false,
  _updatedAt: { nanoseconds: 0, seconds: 0 } as any,
  _updatedBy: "test@example.com",
  additional: [],
  key: "testgame",
  name: "Test Game",
  owner: "test-owner",
  referenceHierarchy: {
    keywords: [],
    sources: ["keywords"],
  } as any,
  status: "active",
};

const ContextConsumer = () => {
  const [gameSystem, utils] = useContext(GameSystemContext);
  const canBeMentionedBy = gameSystem
    ? utils.canBeMentionedBy("keywords" as CollectionName)
    : [];
  const allowedToRefer = gameSystem
    ? utils.getAllowedToRefer("sources" as CollectionName)
    : [];

  return (
    <div>
      <span data-testid="system-name">{gameSystem?.name ?? "none"}</span>
      <span data-testid="mentioned-by">{canBeMentionedBy.join(",")}</span>
      <span data-testid="allowed-to-refer">{allowedToRefer.join(",")}</span>
    </div>
  );
};

describe("GameSystemContext", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetDocuments.mockReset().mockResolvedValue([]);
  });

  describe("default context value", () => {
    it("should provide undefined gameSystem and noop utils by default", () => {
      render(<ContextConsumer />);

      expect(screen.getByTestId("system-name").textContent).toBe("none");
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
        const [gs, utils] = value;
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
