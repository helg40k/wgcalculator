'use client';

import '@ant-design/v5-patch-for-react-19';
import React from 'react';
import { redirect } from 'next/navigation'
import { SessionProvider } from 'next-auth/react';
import {
  DesktopOutlined,
  FileOutlined,
  PieChartOutlined,
  TeamOutlined,
  UserOutlined,
} from '@ant-design/icons';
import {theme, MenuProps} from 'antd';
import TemplatePageLayout, { MenuInfo, getItem } from "@/app/ui/TemplatePageLayout";

type MenuItem = Required<MenuProps>['items'][number];

const items1: MenuProps['items'] = ['1', '2', '3'].map((key) => ({
  key,
  label: `nav ${key}`,
}));

const items2: MenuItem[] = [
  getItem('Footsore', 'footsore', <PieChartOutlined />),
  getItem('Option 2', '2', <DesktopOutlined />),
  getItem('User', 'sub1', <UserOutlined />, [
    getItem('Tom', '3'),
    getItem('Bill', '4'),
    getItem('Alex', '5'),
  ]),
  getItem('Team', 'sub2', <TeamOutlined />, [getItem('Team 1', '6'), getItem('Team 2', '8')]),
  getItem('Files', '9', <FileOutlined />),
];

const Home = () => {
  const {
    token: { colorBgContainer, borderRadiusLG },
  } = theme.useToken();

  const onClickSiderMenu = (info: MenuInfo) => {
    console.log(info);
    const key = info?.key;
    if (key === 'footsore') {
      redirect(`/${key}`)
    }
  }

  return (
    <SessionProvider>
      <TemplatePageLayout headerMenuItems={items1} siderMenuItems={items2} onClickSiderMenu={onClickSiderMenu}>
        Home
      </TemplatePageLayout>
    </SessionProvider>
  );
}

export default Home
