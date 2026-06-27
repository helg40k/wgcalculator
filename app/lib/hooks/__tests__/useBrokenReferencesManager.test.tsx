import { ReactNode } from "react";
import { act, renderHook, waitFor } from "@testing-library/react";

import { BrokenReferencesManagerValue } from "../../contexts/BrokenReferencesContext";
import { GameSystemContext } from "../../contexts/GameSystemContext";
import { CollectionRegistry, GameSystem, Playable } from "../../definitions";
import getCollectionData from "../../services/firebase/helpers/getCollectionData";
import getDocumentsByIds from "../../services/firebase/helpers/getDocumentsByIds";
import useBrokenReferencesManager from "../useBrokenReferencesManager";

jest.mock("@ant-design/v5-patch-for-react-19", () => ({}));

jest.mock("next-auth/react", () => ({
  useSession: jest.fn(() => ({
    data: {
      user: { email: "test@example.com", name: "Test User" },
    },
    status: "authenticated",
  })),
}));

jest.mock("../../services/firebase/utils/firestore", () => ({
  __esModule: true,
  default: "mock-firestore-instance",
}));

jest.mock("../../services/firebase/utils/app", () => ({
  __esModule: true,
  default: "mock-app-instance",
}));

jest.mock("../../services/firebase/helpers/getDocumentsByIds");
jest.mock("../../services/firebase/helpers/getCollectionData");

const mockGetDocumentsByIds = getDocumentsByIds as jest.MockedFunction<
  typeof getDocumentsByIds
>;
const mockGetCollectionData = getCollectionData as jest.MockedFunction<
  typeof getCollectionData
>;

const mockGameSystem = {
  _createdAt: { nanoseconds: 0, seconds: 0 },
  _createdBy: "test@test.com",
  _id: "sys1",
  _isUpdated: false,
  _updatedAt: { nanoseconds: 0, seconds: 0 },
  _updatedBy: "test@test.com",
  additional: [],
  key: "test-system",
  name: "Test System",
  owner: "test@test.com",
  status: "active" as const,
  systemId: "sys1",
} as unknown as GameSystem;

const COLLECTIONS = [
  CollectionRegistry.Source,
  CollectionRegistry.Keyword,
] as const;

const createEntity = (
  id: string,
  references?: Record<string, { name: string }>,
): Playable => ({
  _createdAt: { nanoseconds: 0, seconds: 1234567890 } as any,
  _createdBy: "creator@example.com",
  _id: id,
  _isUpdated: false,
  _updatedAt: { nanoseconds: 0, seconds: 1234567890 } as any,
  _updatedBy: "updater@example.com",
  name: `Entity ${id}`,
  references: references as any,
  status: "active",
  systemId: "sys1",
});

describe("useBrokenReferencesManager", () => {
  let manager: BrokenReferencesManagerValue;

  beforeEach(() => {
    jest.clearAllMocks();
    manager = {
      getBrokenIds: jest.fn().mockReturnValue(new Set()),
      getCounts: jest.fn().mockReturnValue({}),
      setBrokenIds: jest.fn(),
    };
    mockGetCollectionData.mockResolvedValue([]);
    mockGetDocumentsByIds.mockResolvedValue([]);
  });

  const wrapper = ({ children }: { children: ReactNode }) => (
    <GameSystemContext.Provider
      value={[
        mockGameSystem,
        { canBeMentionedBy: () => [], getAllowedToRefer: () => [] },
      ]}
    >
      {children}
    </GameSystemContext.Provider>
  );

  it("should validate all collections on mount", async () => {
    const sources = [createEntity("s1", { ref1: { name: "keywords" } })];
    const keywords = [createEntity("k1")];

    mockGetCollectionData.mockImplementation(async (collName) => {
      if (collName === CollectionRegistry.Source) return sources;
      if (collName === CollectionRegistry.Keyword) return keywords;
      return [];
    });

    mockGetDocumentsByIds.mockResolvedValue([{ _id: "ref1", name: "K1" }]);

    renderHook(() => useBrokenReferencesManager(COLLECTIONS, manager), {
      wrapper,
    });

    await waitFor(() => {
      expect(manager.setBrokenIds).toHaveBeenCalledTimes(2);
    });

    expect(manager.setBrokenIds).toHaveBeenCalledWith(
      CollectionRegistry.Source,
      expect.any(Set),
    );
    expect(manager.setBrokenIds).toHaveBeenCalledWith(
      CollectionRegistry.Keyword,
      expect.any(Set),
    );
  });

  it("should detect broken references during validation", async () => {
    const sources = [
      createEntity("s1", { "broken-ref": { name: "keywords" } }),
    ];

    mockGetCollectionData.mockImplementation(async (collName) => {
      if (collName === CollectionRegistry.Source) return sources;
      return [];
    });

    mockGetDocumentsByIds.mockResolvedValue([]);

    renderHook(() => useBrokenReferencesManager(COLLECTIONS, manager), {
      wrapper,
    });

    await waitFor(() => {
      expect(manager.setBrokenIds).toHaveBeenCalledWith(
        CollectionRegistry.Source,
        new Set(["s1"]),
      );
    });
  });

  it("should not validate when gameSystem is not available", async () => {
    const noSystemWrapper = ({ children }: { children: ReactNode }) => (
      <GameSystemContext.Provider
        value={[
          undefined,
          { canBeMentionedBy: () => [], getAllowedToRefer: () => [] },
        ]}
      >
        {children}
      </GameSystemContext.Provider>
    );

    renderHook(() => useBrokenReferencesManager(COLLECTIONS, manager), {
      wrapper: noSystemWrapper,
    });

    await act(async () => {
      await new Promise((r) => setTimeout(r, 50));
    });

    expect(manager.setBrokenIds).not.toHaveBeenCalled();
  });
});
