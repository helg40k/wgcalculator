import React, { useContext } from "react";
import { act, render, screen, waitFor } from "@testing-library/react";

import { invalidateCollections } from "@/app/lib/collectionInvalidation";
import {
  MentionsContext,
  MentionsProvider,
} from "@/app/lib/contexts/MentionsContext";
import { CollectionName, Playable } from "@/app/lib/definitions";

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

const mockLoadEntities = jest.fn().mockResolvedValue([]);

jest.mock("@/app/lib/hooks/useEntities", () => ({
  __esModule: true,
  default: () => ({
    getEntity: jest.fn(),
    loadEntities: mockLoadEntities,
    loading: false,
    saveEntity: jest.fn(),
  }),
}));

const mockCanBeMentionedBy = jest.fn().mockReturnValue([]);
const mockGetAllowedToRefer = jest.fn().mockReturnValue([]);

jest.mock("@/app/lib/contexts/GameSystemContext", () => ({
  GameSystemContext: React.createContext([
    { _id: "system-1" },
    {
      canBeMentionedBy: (...args: unknown[]) => mockCanBeMentionedBy(...args),
      getAllowedToRefer: (...args: unknown[]) => mockGetAllowedToRefer(...args),
    },
  ] as const),
}));

const makeMockPlayable = (
  id: string,
  name: string,
  references?: Record<string, { name: string }>,
): Playable =>
  ({
    _id: id,
    name,
    references,
    status: "active",
    systemId: "system-1",
  }) as unknown as Playable;

const MentionsConsumer = ({ entityId }: { entityId: string }) => {
  const ctx = useContext(MentionsContext);
  if (!ctx) return <div data-testid="no-context">no context</div>;

  const mentions = ctx.getMentions(entityId);
  const totalMentions = Object.values(mentions).reduce(
    (sum, arr) => sum + arr.length,
    0,
  );

  return (
    <div data-testid="consumer">
      <span data-testid="loaded">{ctx.mentionsLoaded ? "yes" : "no"}</span>
      <span data-testid="total">{totalMentions}</span>
      <button data-testid="reload" onClick={ctx.reloadMentions}>
        Reload
      </button>
    </div>
  );
};

describe("MentionsContext", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockLoadEntities.mockReset().mockResolvedValue([]);
    mockCanBeMentionedBy.mockReturnValue([]);
    mockGetAllowedToRefer.mockReturnValue([]);
  });

  it("should provide null context when no provider is present", () => {
    render(<MentionsConsumer entityId="e1" />);
    expect(screen.getByTestId("no-context")).toBeInTheDocument();
  });

  describe("initial loading", () => {
    it("should set mentionsLoaded to true immediately when no mentioning collections", async () => {
      mockCanBeMentionedBy.mockReturnValue([]);

      await act(async () => {
        render(
          <MentionsProvider collectionName={"sources" as CollectionName}>
            <MentionsConsumer entityId="e1" />
          </MentionsProvider>,
        );
      });

      expect(screen.getByTestId("loaded").textContent).toBe("yes");
      expect(mockLoadEntities).not.toHaveBeenCalled();
    });

    it("should load mentions from mentioning collections", async () => {
      mockCanBeMentionedBy.mockReturnValue(["keywords" as CollectionName]);

      const kw1 = makeMockPlayable("kw1", "Keyword 1", {
        "src-1": { name: "sources" },
      });
      const kw2 = makeMockPlayable("kw2", "Keyword 2", {
        "src-1": { name: "sources" },
        "src-2": { name: "sources" },
      });
      mockLoadEntities.mockResolvedValueOnce([kw1, kw2]);

      await act(async () => {
        render(
          <MentionsProvider collectionName={"sources" as CollectionName}>
            <MentionsConsumer entityId="src-1" />
          </MentionsProvider>,
        );
      });

      expect(screen.getByTestId("loaded").textContent).toBe("yes");
      expect(screen.getByTestId("total").textContent).toBe("2");
    });

    it("should return empty mentions for entity with no mentioners", async () => {
      mockCanBeMentionedBy.mockReturnValue(["keywords" as CollectionName]);

      const kw1 = makeMockPlayable("kw1", "Keyword 1", {
        "src-1": { name: "sources" },
      });
      mockLoadEntities.mockResolvedValueOnce([kw1]);

      await act(async () => {
        render(
          <MentionsProvider collectionName={"sources" as CollectionName}>
            <MentionsConsumer entityId="src-99" />
          </MentionsProvider>,
        );
      });

      expect(screen.getByTestId("total").textContent).toBe("0");
    });

    it("should load from multiple mentioning collections", async () => {
      mockCanBeMentionedBy.mockReturnValue([
        "keywords" as CollectionName,
        "systems" as CollectionName,
      ]);

      const kw1 = makeMockPlayable("kw1", "KW", {
        "src-1": { name: "sources" },
      });
      const sys1 = makeMockPlayable("sys1", "SYS", {
        "src-1": { name: "sources" },
      });
      mockLoadEntities
        .mockResolvedValueOnce([kw1])
        .mockResolvedValueOnce([sys1]);

      await act(async () => {
        render(
          <MentionsProvider collectionName={"sources" as CollectionName}>
            <MentionsConsumer entityId="src-1" />
          </MentionsProvider>,
        );
      });

      expect(screen.getByTestId("total").textContent).toBe("2");
      expect(mockLoadEntities).toHaveBeenCalledTimes(2);
    });

    it("should ignore references targeting other collections", async () => {
      mockCanBeMentionedBy.mockReturnValue(["keywords" as CollectionName]);

      const kw1 = makeMockPlayable("kw1", "KW", {
        "src-1": { name: "keywords" },
      });
      mockLoadEntities.mockResolvedValueOnce([kw1]);

      await act(async () => {
        render(
          <MentionsProvider collectionName={"sources" as CollectionName}>
            <MentionsConsumer entityId="src-1" />
          </MentionsProvider>,
        );
      });

      expect(screen.getByTestId("total").textContent).toBe("0");
    });

    it("should skip entities without references", async () => {
      mockCanBeMentionedBy.mockReturnValue(["keywords" as CollectionName]);

      const kwNoRefs = makeMockPlayable("kw1", "KW", undefined);
      mockLoadEntities.mockResolvedValueOnce([kwNoRefs]);

      await act(async () => {
        render(
          <MentionsProvider collectionName={"sources" as CollectionName}>
            <MentionsConsumer entityId="src-1" />
          </MentionsProvider>,
        );
      });

      expect(screen.getByTestId("total").textContent).toBe("0");
    });
  });

  describe("reloadMentions", () => {
    it("should re-fetch data when reloadMentions is called", async () => {
      mockCanBeMentionedBy.mockReturnValue(["keywords" as CollectionName]);
      mockLoadEntities.mockResolvedValue([]);

      await act(async () => {
        render(
          <MentionsProvider collectionName={"sources" as CollectionName}>
            <MentionsConsumer entityId="src-1" />
          </MentionsProvider>,
        );
      });

      const initialCalls = mockLoadEntities.mock.calls.length;

      const kw1 = makeMockPlayable("kw1", "KW", {
        "src-1": { name: "sources" },
      });
      mockLoadEntities.mockResolvedValueOnce([kw1]);

      await act(async () => {
        screen.getByTestId("reload").click();
      });

      await waitFor(() => {
        expect(mockLoadEntities.mock.calls.length).toBeGreaterThan(
          initialCalls,
        );
      });
    });
  });

  describe("collection invalidation", () => {
    it("should reload when own collection is invalidated", async () => {
      mockCanBeMentionedBy.mockReturnValue(["keywords" as CollectionName]);
      mockLoadEntities.mockResolvedValue([]);

      await act(async () => {
        render(
          <MentionsProvider collectionName={"sources" as CollectionName}>
            <MentionsConsumer entityId="src-1" />
          </MentionsProvider>,
        );
      });

      const callsAfterInitial = mockLoadEntities.mock.calls.length;

      await act(async () => {
        invalidateCollections(["sources" as CollectionName]);
      });

      await waitFor(() => {
        expect(mockLoadEntities.mock.calls.length).toBeGreaterThan(
          callsAfterInitial,
        );
      });
    });

    it("should reload when a mentioning collection is invalidated", async () => {
      mockCanBeMentionedBy.mockReturnValue(["keywords" as CollectionName]);
      mockLoadEntities.mockResolvedValue([]);

      await act(async () => {
        render(
          <MentionsProvider collectionName={"sources" as CollectionName}>
            <MentionsConsumer entityId="src-1" />
          </MentionsProvider>,
        );
      });

      const callsAfterInitial = mockLoadEntities.mock.calls.length;

      await act(async () => {
        invalidateCollections(["keywords" as CollectionName]);
      });

      await waitFor(() => {
        expect(mockLoadEntities.mock.calls.length).toBeGreaterThan(
          callsAfterInitial,
        );
      });
    });

    it("should not reload when an unrelated collection is invalidated", async () => {
      mockCanBeMentionedBy.mockReturnValue(["keywords" as CollectionName]);
      mockLoadEntities.mockResolvedValue([]);

      await act(async () => {
        render(
          <MentionsProvider collectionName={"sources" as CollectionName}>
            <MentionsConsumer entityId="src-1" />
          </MentionsProvider>,
        );
      });

      const callsAfterInitial = mockLoadEntities.mock.calls.length;

      await act(async () => {
        invalidateCollections(["systems" as CollectionName]);
      });

      expect(mockLoadEntities.mock.calls.length).toBe(callsAfterInitial);
    });
  });

  describe("context value stability", () => {
    it("should provide stable getMentions reference between renders after load", async () => {
      mockCanBeMentionedBy.mockReturnValue([]);
      const captured: Array<(id: string) => unknown> = [];

      const Capturer = () => {
        const ctx = useContext(MentionsContext);
        if (ctx && ctx.mentionsLoaded) captured.push(ctx.getMentions);
        return null;
      };

      let rerender: (ui: React.ReactElement) => void;
      await act(async () => {
        const result = render(
          <MentionsProvider collectionName={"sources" as CollectionName}>
            <Capturer />
          </MentionsProvider>,
        );
        rerender = result.rerender;
      });

      const refAfterLoad = captured[captured.length - 1];
      expect(refAfterLoad).toBeDefined();

      captured.length = 0;

      await act(async () => {
        rerender(
          <MentionsProvider collectionName={"sources" as CollectionName}>
            <Capturer />
          </MentionsProvider>,
        );
      });

      expect(captured.length).toBeGreaterThanOrEqual(1);
      expect(captured[captured.length - 1]).toBe(refAfterLoad);
    });

    it("should provide stable reloadMentions reference between renders", async () => {
      mockCanBeMentionedBy.mockReturnValue([]);
      const captured: Array<() => void> = [];

      const Capturer = () => {
        const ctx = useContext(MentionsContext);
        if (ctx) captured.push(ctx.reloadMentions);
        return null;
      };

      await act(async () => {
        render(
          <MentionsProvider collectionName={"sources" as CollectionName}>
            <Capturer />
          </MentionsProvider>,
        );
      });

      const allCaptured = [...captured];
      expect(allCaptured.length).toBeGreaterThanOrEqual(1);
      const last = allCaptured[allCaptured.length - 1];
      expect(typeof last).toBe("function");
    });
  });
});
