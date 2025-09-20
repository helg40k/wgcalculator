import React from "react";
import { MenuProps } from "antd";
import { Timestamp } from "firebase/firestore";
import { mergeWith } from "lodash";

import { Entity } from "@/app/lib/definitions";
import getDocumentCreationBase, {
  NEW_ENTITY_TEMP_ID,
} from "@/app/lib/services/firebase/helpers/getDocumentCreationBase";

export const enum ToolbarPosition {
  UP,
  DOWN,
}

export type MenuItem = Required<MenuProps>["items"][number];

export const getItem = (
  label: React.ReactNode,
  key: React.Key,
  icon?: React.ReactNode,
  children?: MenuItem[],
): MenuItem => {
  return {
    children,
    icon,
    key,
    label,
  } as MenuItem;
};

export interface MenuItemConst {
  index: number;
  label?: React.ReactNode;
  key: string;
  icon?: React.ReactNode;
  children?: Record<string, MenuItemConst>;
}

export const getMenuItems = (
  menuItemsObject: Record<any, MenuItemConst> | undefined,
): MenuItem[] | undefined => {
  if (!menuItemsObject || !Object.keys(menuItemsObject).length) {
    return undefined;
  }
  return Object.values(menuItemsObject)
    .filter((item) => item.label)
    .sort((a, b) => a.index - b.index)
    .map((item) =>
      getItem(item.label, item.key, item.icon, getMenuItems(item.children)),
    );
};

export const getLinkLabel = (url: string) => {
  if (!url) {
    return "unknown";
  }
  try {
    const link = new URL(url);
    return link.hostname;
  } catch (e) {
    /* eslint-disable no-console */
    console.warn(`Cannot parse URL: ${url}`, e);
    /* eslint-enable no-console */
    return url;
  }
};

export const isUrlValid = (url: string | null | undefined): boolean => {
  if (!url) {
    return true;
  }
  try {
    new URL(url);
    return true;
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
  } catch (err) {
    return false;
  }
};

export const isTimestamp = (obj: any): obj is Timestamp => {
  if (obj instanceof Timestamp) {
    return true;
  }
  // duck typing
  return (
    obj &&
    typeof obj === "object" &&
    typeof obj.seconds === "number" &&
    typeof obj.nanoseconds === "number" &&
    typeof obj.toDate === "function" &&
    typeof obj.toMillis === "function"
  );
};

export const mergeDeep = (object: any, ...sources: any[]): any => {
  return mergeWith(object, ...sources, (objValue: any, srcValue: any) => {
    if (Array.isArray(srcValue)) {
      return srcValue;
    }
  });
};

export const equalDeep = (
  a: any,
  b: any,
  strict = true,
  params: {
    falseToUndefined?: boolean;
    emptyStringToNull?: boolean;
    emptyStringToUndefined?: boolean;
    undefinedToNull?: boolean;
    nullToUndefined?: boolean;
  } = {},
): boolean => {
  const falseToUndefined = (x: boolean): true | undefined => {
    return !x ? undefined : x;
  };

  const emptyStringToNull = (x: string): string | null => {
    return x === "" ? null : x;
  };

  const emptyStringToUndefined = (x: string): string | undefined => {
    return x === "" ? undefined : x;
  };

  const undefinedToNull = (x: any): any | null => {
    return x === undefined ? null : x;
  };

  const nullToUndefined = (x: any): any | undefined => {
    return x === null ? undefined : x;
  };

  if (typeof a === "object" && a !== null) {
    if (typeof b !== "object") {
      return false;
    }
    if (Array.isArray(a)) {
      if (!Array.isArray(b)) {
        return false;
      }
    }

    if (
      (isTimestamp(a) && !isTimestamp(b)) ||
      (isTimestamp(b) && !isTimestamp(a))
    ) {
      return false;
    }
    if (isTimestamp(a) && isTimestamp(b)) {
      return (
        (a as Timestamp).seconds === (b as Timestamp).seconds &&
        (a as Timestamp).nanoseconds === (b as Timestamp).nanoseconds
      );
    }

    if (
      (strict || Array.isArray(a)) &&
      Object.keys(a).length !== Object.keys(b).length
    ) {
      return false;
    }
    const keysA = Object.keys(a);
    for (let i = 0; i < keysA.length; i++) {
      const key = keysA[i];
      // eslint-disable-next-line no-prototype-builtins
      if (strict && !b.hasOwnProperty(key)) {
        return false;
      }
      if (!equalDeep(a[key], b[key], strict, params)) {
        return false;
      }
    }
    const keysB = Object.keys(b);
    for (let i = 0; i < keysB.length; i++) {
      const key = keysB[i];
      // eslint-disable-next-line no-prototype-builtins
      if (strict && !b.hasOwnProperty(key)) {
        return false;
      }
      if (!equalDeep(a[key], b[key], strict, params)) {
        return false;
      }
    }
    return true;
  }
  if (params.falseToUndefined) {
    a = falseToUndefined(a);
    b = falseToUndefined(b);
  }
  if (params.emptyStringToNull && params.emptyStringToUndefined) {
    throw new Error(
      "Impossible criteria combining: emptyStringToNull + emptyStringToUndefined",
    );
  } else if (params.emptyStringToNull) {
    a = emptyStringToNull(a);
    b = emptyStringToNull(b);
  } else if (params.emptyStringToUndefined) {
    a = emptyStringToUndefined(a);
    b = emptyStringToUndefined(b);
  }
  if (params.undefinedToNull && params.nullToUndefined) {
    throw new Error(
      "Impossible criteria combining: undefinedToNull + nullToUndefined",
    );
  } else if (params.undefinedToNull) {
    a = undefinedToNull(a);
    b = undefinedToNull(b);
  } else if (params.nullToUndefined) {
    a = nullToUndefined(a);
    b = nullToUndefined(b);
  }
  return a === b;
};

export const getNewEntity = <T extends Entity>(): T => {
  return getDocumentCreationBase(NEW_ENTITY_TEMP_ID) as T;
};
