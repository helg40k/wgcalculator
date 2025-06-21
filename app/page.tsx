"use client";

import React, { useMemo } from "react";
import {
  DesktopOutlined,
  FileOutlined,
  PieChartOutlined,
  TeamOutlined,
  UserOutlined,
} from "@ant-design/icons";
import { theme } from "antd";
import Link from "next/link";
import { SessionProvider } from "next-auth/react";

import { getMenuItems, MenuItemConst } from "@/app/ui/shared";
import TemplatePageLayout, { MenuInfo } from "@/app/ui/TemplatePageLayout";

import "@ant-design/v5-patch-for-react-19";

type MenuKey =
  | "START"
  | "CLASHOFSPEARS"
  | "TESTOFHONOUR"
  | "OPTION_2"
  | "SUB1"
  | "SUB2"
  | "FILES";

/* eslint-disable sort-keys-fix/sort-keys-fix */
const HEADER_MENU_ITEMS: Record<string, MenuItemConst> = {
  START: {
    index: 0,
    key: "head_start",
  },
  HEAD_1: {
    index: 1,
    key: "head_1",
    label: "nav 1",
  },
  HEAD_2: {
    index: 2,
    key: "head_2",
    label: "nav 2",
  },
  HEAD_3: {
    index: 3,
    key: "head_3",
    label: "nav 3",
  },
};

const MENU_ITEMS: Record<MenuKey, MenuItemConst> = {
  START: {
    index: 0,
    key: "start",
  },
  CLASHOFSPEARS: {
    icon: <PieChartOutlined />,
    index: 1,
    key: "clashofspears",
    label: <Link href="/clashofspears">Clash of Spears</Link>,
  },
  TESTOFHONOUR: {
    icon: <PieChartOutlined />,
    index: 2,
    key: "testofhonour",
    label: <Link href="/testofhonour">Test of Honour</Link>,
  },
  OPTION_2: {
    icon: <DesktopOutlined />,
    index: 3,
    key: "2",
    label: "Option 2",
  },
  SUB1: {
    icon: <UserOutlined />,
    index: 4,
    key: "sub1",
    label: "User",
    children: {
      TOM: {
        index: 1,
        key: "3",
        label: "Tom",
      },
      BILL: {
        index: 2,
        key: "4",
        label: "Bill",
      },
      ALEX: {
        index: 3,
        key: "5",
        label: "Alex",
      },
    },
  },
  SUB2: {
    icon: <TeamOutlined />,
    index: 5,
    key: "sub2",
    label: "Team",
    children: {
      TEAM_1: {
        index: 1,
        key: "6",
        label: "Team 1",
      },
      TEAM_2: {
        index: 2,
        key: "8",
        label: "Team 2",
      },
    },
  },
  FILES: {
    icon: <FileOutlined />,
    index: 6,
    key: "9",
    label: "Files",
  },
};
/* eslint-enable sort-keys-fix/sort-keys-fix */

const Home = () => {
  const {
    token: { colorBgContainer, borderRadiusLG },
  } = theme.useToken();

  const headerMenuItems = useMemo(
    () => getMenuItems(HEADER_MENU_ITEMS) || [],
    [],
  );
  const siderMenuItems = useMemo(() => getMenuItems(MENU_ITEMS) || [], []);

  const onClickHeaderMenu = (info: MenuInfo) => {
    console.log(info);
  };
  const onClickSiderMenu = (info: MenuInfo) => {
    console.log(info);
  };

  return (
    <SessionProvider>
      <TemplatePageLayout
        headerMenuItems={headerMenuItems}
        onClickHeaderMenu={onClickHeaderMenu}
        siderMenuItems={siderMenuItems}
        onClickSiderMenu={onClickSiderMenu}
      >
        Home
      </TemplatePageLayout>
    </SessionProvider>
  );
};

export default Home;
