"use client";

import React from "react";
import { PieChartOutlined } from "@ant-design/icons";
import { MenuProps } from "antd";
import { redirect } from "next/navigation";
import { SessionProvider } from "next-auth/react";

import TemplatePageLayout, {
  getItem,
  MenuInfo,
} from "@/app/ui/TemplatePageLayout";

type MenuItem = Required<MenuProps>["items"][number];

const items: MenuItem[] = [getItem("Home", "home", <PieChartOutlined />)];

const Page = () => {
  const onClickSiderMenu = (info: MenuInfo) => {
    const key = info?.key;
    if (key === "home") {
      redirect("/");
    }
  };

  return (
    <SessionProvider>
      <TemplatePageLayout
        siderMenuItems={items}
        onClickSiderMenu={onClickSiderMenu}
      >
        <p>Hello Clash of Spears</p>
      </TemplatePageLayout>
    </SessionProvider>
  );
};

export default Page;
