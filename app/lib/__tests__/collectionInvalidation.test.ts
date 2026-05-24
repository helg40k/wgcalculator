import { act, renderHook } from "@testing-library/react";

import { CollectionName } from "@/app/lib/definitions";

import {
  invalidateCollections,
  useCollectionInvalidation,
  useMultiCollectionInvalidation,
} from "../collectionInvalidation";

describe("collectionInvalidation", () => {
  describe("invalidateCollections", () => {
    it("should dispatch events for each collection", () => {
      const callback = jest.fn();
      renderHook(() =>
        useCollectionInvalidation("keywords" as CollectionName, callback),
      );

      act(() => {
        invalidateCollections(["keywords" as CollectionName]);
      });

      expect(callback).toHaveBeenCalledTimes(1);
    });

    it("should deduplicate collections", () => {
      const callback = jest.fn();
      renderHook(() =>
        useCollectionInvalidation("keywords" as CollectionName, callback),
      );

      act(() => {
        invalidateCollections([
          "keywords" as CollectionName,
          "keywords" as CollectionName,
        ]);
      });

      expect(callback).toHaveBeenCalledTimes(1);
    });

    it("should not trigger unrelated collection listeners", () => {
      const keywordsCallback = jest.fn();
      const sourcesCallback = jest.fn();
      renderHook(() =>
        useCollectionInvalidation(
          "keywords" as CollectionName,
          keywordsCallback,
        ),
      );
      renderHook(() =>
        useCollectionInvalidation("sources" as CollectionName, sourcesCallback),
      );

      act(() => {
        invalidateCollections(["keywords" as CollectionName]);
      });

      expect(keywordsCallback).toHaveBeenCalledTimes(1);
      expect(sourcesCallback).not.toHaveBeenCalled();
    });

    it("should trigger multiple collection listeners", () => {
      const keywordsCallback = jest.fn();
      const sourcesCallback = jest.fn();
      renderHook(() =>
        useCollectionInvalidation(
          "keywords" as CollectionName,
          keywordsCallback,
        ),
      );
      renderHook(() =>
        useCollectionInvalidation("sources" as CollectionName, sourcesCallback),
      );

      act(() => {
        invalidateCollections([
          "keywords" as CollectionName,
          "sources" as CollectionName,
        ]);
      });

      expect(keywordsCallback).toHaveBeenCalledTimes(1);
      expect(sourcesCallback).toHaveBeenCalledTimes(1);
    });

    it("should do nothing for an empty array", () => {
      const callback = jest.fn();
      renderHook(() =>
        useCollectionInvalidation("keywords" as CollectionName, callback),
      );

      act(() => {
        invalidateCollections([]);
      });

      expect(callback).not.toHaveBeenCalled();
    });
  });

  describe("useCollectionInvalidation", () => {
    it("should unsubscribe on unmount", () => {
      const callback = jest.fn();
      const { unmount } = renderHook(() =>
        useCollectionInvalidation("keywords" as CollectionName, callback),
      );

      unmount();

      act(() => {
        invalidateCollections(["keywords" as CollectionName]);
      });

      expect(callback).not.toHaveBeenCalled();
    });

    it("should update listener when callback changes", () => {
      const callback1 = jest.fn();
      const callback2 = jest.fn();

      const { rerender } = renderHook(
        ({ cb }) => useCollectionInvalidation("keywords" as CollectionName, cb),
        { initialProps: { cb: callback1 } },
      );

      rerender({ cb: callback2 });

      act(() => {
        invalidateCollections(["keywords" as CollectionName]);
      });

      expect(callback1).not.toHaveBeenCalled();
      expect(callback2).toHaveBeenCalledTimes(1);
    });

    it("should update listener when collection changes", () => {
      const callback = jest.fn();

      const { rerender } = renderHook(
        ({ col }) => useCollectionInvalidation(col, callback),
        { initialProps: { col: "keywords" as CollectionName } },
      );

      rerender({ col: "sources" as CollectionName });

      act(() => {
        invalidateCollections(["keywords" as CollectionName]);
      });
      expect(callback).not.toHaveBeenCalled();

      act(() => {
        invalidateCollections(["sources" as CollectionName]);
      });
      expect(callback).toHaveBeenCalledTimes(1);
    });
  });

  describe("useMultiCollectionInvalidation", () => {
    it("should trigger callback for any of the listed collections", () => {
      const callback = jest.fn();
      renderHook(() =>
        useMultiCollectionInvalidation(
          ["keywords" as CollectionName, "sources" as CollectionName],
          callback,
        ),
      );

      act(() => {
        invalidateCollections(["keywords" as CollectionName]);
      });
      expect(callback).toHaveBeenCalledTimes(1);

      act(() => {
        invalidateCollections(["sources" as CollectionName]);
      });
      expect(callback).toHaveBeenCalledTimes(2);
    });

    it("should not trigger callback for unlisted collections", () => {
      const callback = jest.fn();
      renderHook(() =>
        useMultiCollectionInvalidation(
          ["keywords" as CollectionName],
          callback,
        ),
      );

      act(() => {
        invalidateCollections(["sources" as CollectionName]);
      });

      expect(callback).not.toHaveBeenCalled();
    });

    it("should do nothing when collections array is empty", () => {
      const callback = jest.fn();
      renderHook(() => useMultiCollectionInvalidation([], callback));

      act(() => {
        invalidateCollections([
          "keywords" as CollectionName,
          "sources" as CollectionName,
        ]);
      });

      expect(callback).not.toHaveBeenCalled();
    });

    it("should unsubscribe on unmount", () => {
      const callback = jest.fn();
      const { unmount } = renderHook(() =>
        useMultiCollectionInvalidation(
          ["keywords" as CollectionName, "sources" as CollectionName],
          callback,
        ),
      );

      unmount();

      act(() => {
        invalidateCollections(["keywords" as CollectionName]);
      });

      expect(callback).not.toHaveBeenCalled();
    });

    it("should update listener when callback changes", () => {
      const callback1 = jest.fn();
      const callback2 = jest.fn();

      const { rerender } = renderHook(
        ({ cb }) =>
          useMultiCollectionInvalidation(["keywords" as CollectionName], cb),
        { initialProps: { cb: callback1 } },
      );

      rerender({ cb: callback2 });

      act(() => {
        invalidateCollections(["keywords" as CollectionName]);
      });

      expect(callback1).not.toHaveBeenCalled();
      expect(callback2).toHaveBeenCalledTimes(1);
    });

    it("should update listener when collections array changes", () => {
      const callback = jest.fn();

      const { rerender } = renderHook(
        ({ cols }) => useMultiCollectionInvalidation(cols, callback),
        {
          initialProps: {
            cols: ["keywords" as CollectionName] as readonly CollectionName[],
          },
        },
      );

      rerender({ cols: ["sources" as CollectionName] });

      act(() => {
        invalidateCollections(["keywords" as CollectionName]);
      });
      expect(callback).not.toHaveBeenCalled();

      act(() => {
        invalidateCollections(["sources" as CollectionName]);
      });
      expect(callback).toHaveBeenCalledTimes(1);
    });

    it("should handle single invalidation triggering multi-listener once", () => {
      const callback = jest.fn();
      renderHook(() =>
        useMultiCollectionInvalidation(
          ["keywords" as CollectionName, "sources" as CollectionName],
          callback,
        ),
      );

      act(() => {
        invalidateCollections([
          "keywords" as CollectionName,
          "sources" as CollectionName,
        ]);
      });

      expect(callback).toHaveBeenCalledTimes(2);
    });
  });
});
