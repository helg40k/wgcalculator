'use client';

import {MenuProps} from "antd";
import { SessionProvider } from 'next-auth/react';
import TemplatePageLayout, { MenuInfo, getItem } from "@/app/ui/TemplatePageLayout";
import {PieChartOutlined} from "@ant-design/icons";
import React from "react";
import {redirect} from "next/navigation";

type MenuItem = Required<MenuProps>['items'][number];

const items: MenuItem[] = [
  getItem('Home', 'home', <PieChartOutlined />),
];

const Page = () => {

  const onClickSiderMenu = (info: MenuInfo) => {
    const key = info?.key;
    if (key === 'home') {
      redirect('/')
    }
  }

  return (
    <SessionProvider>
      <TemplatePageLayout siderMenuItems={items} onClickSiderMenu={onClickSiderMenu}>
        <p>Hello Footsore</p>
      </TemplatePageLayout>
    </SessionProvider>
  );
}

export default Page
