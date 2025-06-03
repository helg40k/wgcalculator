'use client';

import React from "react";
import {Menu, MenuProps, Layout, Avatar, Space} from "antd";
import WgLogo from "@/app/ui/wg-logo";
import { UserOutlined } from '@ant-design/icons';

import { MenuInfo } from "@/app/ui/TemplatePageLayout";

interface TemplateHeaderProps {
  menuItems?: MenuProps['items'];
  onClickMenu?: (info: MenuInfo) => void;
}

const TemplateHeader = ({
                          menuItems,
                          onClickMenu
                        }: TemplateHeaderProps) => {
  return (
    <Layout.Header className='flex items-center justify-between' style={{ padding: 0 }}>
      <Space>
        <WgLogo/>
        {menuItems && (
          <Menu
                theme="dark"
                mode="horizontal"
                defaultSelectedKeys={[menuItems[0]?.key?.toString() || '']}
                items={menuItems}
                onClick={(i) => onClickMenu ? onClickMenu(i) : undefined}
          />
        )}
      </Space>
      <Avatar size={64} icon={<UserOutlined />} />
    </Layout.Header>
  );
}

export default TemplateHeader;
