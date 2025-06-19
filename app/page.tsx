"use client";

import React from "react";
import {
  DesktopOutlined,
  FileOutlined,
  PieChartOutlined,
  TeamOutlined,
  UserOutlined,
} from "@ant-design/icons";
import { MenuProps, theme } from "antd";
import Link from "next/link";
import { SessionProvider } from "next-auth/react";

import { getItem } from "@/app/clashofspears/ui/shared";
import TemplatePageLayout, { MenuInfo } from "@/app/ui/TemplatePageLayout";

import "@ant-design/v5-patch-for-react-19";

type MenuItem = Required<MenuProps>["items"][number];

const items1: MenuProps["items"] = ["1", "2", "3"].map((key) => ({
  key,
  label: `nav ${key}`,
}));

const items2: MenuItem[] = [
  getItem(
    <Link href="/clashofspears">Clash of Spears</Link>,
    "clashofspears",
    <PieChartOutlined />,
  ),
  getItem(
    <Link href="/testofhonour">Test of Honour</Link>,
    "testofhonour",
    <PieChartOutlined />,
  ),
  getItem("Option 2", "2", <DesktopOutlined />),
  getItem("User", "sub1", <UserOutlined />, [
    getItem("Tom", "3"),
    getItem("Bill", "4"),
    getItem("Alex", "5"),
  ]),
  getItem("Team", "sub2", <TeamOutlined />, [
    getItem("Team 1", "6"),
    getItem("Team 2", "8"),
  ]),
  getItem("Files", "9", <FileOutlined />),
];

const Home = () => {
  const {
    token: { colorBgContainer, borderRadiusLG },
  } = theme.useToken();

  const onClickSiderMenu = (info: MenuInfo) => {
    console.log(info);
  };

  return (
    <SessionProvider>
      <TemplatePageLayout
        headerMenuItems={items1}
        siderMenuItems={items2}
        onClickSiderMenu={onClickSiderMenu}
      >
        Home
      </TemplatePageLayout>
    </SessionProvider>
  );
};

export default Home;
