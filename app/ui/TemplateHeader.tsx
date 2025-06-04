'use client';

import React, {useMemo, useState} from "react";
import {Menu, MenuProps, Layout, Avatar, Space, Tooltip, Dropdown, Modal, Button} from "antd";
import WgLogo from "@/app/ui/wg-logo";
import { UserOutlined, LoginOutlined, LogoutOutlined, GoogleOutlined } from '@ant-design/icons';

import { MenuInfo } from "@/app/ui/TemplatePageLayout";

type MenuItem = Required<MenuProps>['items'][number];

interface TemplateHeaderProps {
  menuItems?: MenuProps['items'];
  onClickMenu?: (info: MenuInfo) => void;
  logoutTooltipMessage?: string;
  avatarMenuItems?: MenuItem[];
}

const requiredAvatarMenuItems: MenuItem[] = [{
  label: 'Logout',
  key: 'logout',
  icon: <LogoutOutlined/>
}];

const TemplateHeader = ({
                          menuItems,
                          onClickMenu,
                          logoutTooltipMessage,
                          avatarMenuItems: avatarItems,
                        }: TemplateHeaderProps) => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const avatarMenuItems = useMemo(() => {
    if (avatarItems) {
      return [...avatarItems, { type: 'divider' }, ...requiredAvatarMenuItems] as MenuItem[];
    }
    return requiredAvatarMenuItems;
  }, [avatarItems]);

  const showModal = () => {
    setIsModalOpen(true);
  };

  const handleCancel = () => {
    setIsModalOpen(false);
  };

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
      <Tooltip placement="left" title={logoutTooltipMessage}>
        <Avatar size={64} icon={<UserOutlined />} onClick={showModal} />
      </Tooltip>
      {/*<Dropdown menu={{ items: avatarMenuItems }} placement="bottomRight" arrow={{ pointAtCenter: true }}>*/}
      {/*  <Avatar size={64} icon={<UserOutlined />} />*/}
      {/*</Dropdown>*/}
      <Modal
        title={<div><LoginOutlined className='text-xl' />&nbsp;&nbsp;Login:</div>}
        open={isModalOpen}
        onCancel={handleCancel}
        footer={[]}
      >
        <div className='min-h-20 grid content-center'>
          <Button type='primary' className='w-full'><GoogleOutlined />Login with Google</Button>
        </div>
      </Modal>
    </Layout.Header>
  );
}

export default TemplateHeader;
