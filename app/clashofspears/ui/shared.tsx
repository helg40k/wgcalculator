import React from "react";
import { PieChartOutlined } from "@ant-design/icons";
import { MenuProps } from "antd";
import { redirect } from "next/navigation";

import { getItem, MenuInfo } from "@/app/ui/TemplatePageLayout";

type MenuItem = Required<MenuProps>["items"][number];

export const siderMenuItems: MenuItem[] = [
  getItem("Home", "home", <PieChartOutlined />),
];

export const onClickSiderMenu = (info: MenuInfo) => {
  const key = info?.key;
  if (key === "home") {
    redirect("/");
  }
};

export const adminSiderMenuItems: MenuItem[] = [
  getItem("Home", "home", <PieChartOutlined />),
];

export const onClickAdminSiderMenu = (info: MenuInfo) => {
  const key = info?.key;
  if (key === "home") {
    redirect("/");
  }
};
