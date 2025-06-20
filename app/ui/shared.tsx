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
  children?: MenuItem[];
}
