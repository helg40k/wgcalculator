import React from "react";
import { MenuProps } from "antd";

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
    .sort((item) => item.index)
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
