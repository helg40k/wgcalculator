import { act, ReactNode, useContext } from "react";
import { renderHook } from "@testing-library/react";

import { CollectionRegistry } from "../../definitions";
import {
  BrokenReferencesContext,
  BrokenReferencesProvider,
  useBrokenReferencesState,
} from "../BrokenReferencesContext";

jest.mock("@ant-design/v5-patch-for-react-19", () => ({}));

describe("BrokenReferencesContext", () => {
  describe("useBrokenReferencesState", () => {
    it("should return empty sets by default", () => {
      const { result } = renderHook(() => useBrokenReferencesState());

      expect(result.current.getBrokenIds(CollectionRegistry.Source).size).toBe(
        0,
      );
      expect(result.current.getBrokenIds(CollectionRegistry.Keyword).size).toBe(
        0,
      );
    });

    it("should return correct counts after setting broken IDs", () => {
      const { result } = renderHook(() => useBrokenReferencesState());

      act(() => {
        result.current.setBrokenIds(
          CollectionRegistry.Source,
          new Set(["s1", "s2"]),
        );
        result.current.setBrokenIds(
          CollectionRegistry.Keyword,
          new Set(["k1"]),
        );
      });

      expect(result.current.getBrokenIds(CollectionRegistry.Source).size).toBe(
        2,
      );
      expect(result.current.getBrokenIds(CollectionRegistry.Keyword).size).toBe(
        1,
      );
    });

    it("should return correct counts via getCounts()", () => {
      const { result } = renderHook(() => useBrokenReferencesState());

      act(() => {
        result.current.setBrokenIds(
          CollectionRegistry.Source,
          new Set(["s1", "s2", "s3"]),
        );
        result.current.setBrokenIds(
          CollectionRegistry.Keyword,
          new Set(["k1"]),
        );
      });

      const counts = result.current.getCounts();
      expect(counts[CollectionRegistry.Source]).toBe(3);
      expect(counts[CollectionRegistry.Keyword]).toBe(1);
    });

    it("should not include zero-count collections in getCounts()", () => {
      const { result } = renderHook(() => useBrokenReferencesState());

      act(() => {
        result.current.setBrokenIds(CollectionRegistry.Source, new Set(["s1"]));
        result.current.setBrokenIds(CollectionRegistry.Keyword, new Set());
      });

      const counts = result.current.getCounts();
      expect(counts[CollectionRegistry.Source]).toBe(1);
      expect(counts[CollectionRegistry.Keyword]).toBeUndefined();
    });

    it("should update broken IDs when setBrokenIds is called again", () => {
      const { result } = renderHook(() => useBrokenReferencesState());

      act(() => {
        result.current.setBrokenIds(
          CollectionRegistry.Source,
          new Set(["s1", "s2"]),
        );
      });

      expect(result.current.getBrokenIds(CollectionRegistry.Source).size).toBe(
        2,
      );

      act(() => {
        result.current.setBrokenIds(CollectionRegistry.Source, new Set(["s1"]));
      });

      expect(result.current.getBrokenIds(CollectionRegistry.Source).size).toBe(
        1,
      );
    });
  });

  describe("BrokenReferencesProvider", () => {
    it("should provide context value to children", () => {
      const mockValue = {
        getBrokenIds: jest.fn().mockReturnValue(new Set(["e1"])),
        getCounts: jest.fn().mockReturnValue({ sources: 1 }),
      };

      const wrapper = ({ children }: { children: ReactNode }) => (
        <BrokenReferencesProvider value={mockValue}>
          {children}
        </BrokenReferencesProvider>
      );

      const { result } = renderHook(() => useContext(BrokenReferencesContext), {
        wrapper,
      });

      expect(result.current).toBe(mockValue);
    });
  });
});
