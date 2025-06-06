'use client';

import React, {useMemo, useState} from "react";
import { signIn, signOut } from 'next-auth/react';
import {Menu, MenuProps, Layout, Avatar, Space, Tooltip, Dropdown, Modal, Button} from "antd";
import WgLogo from "@/app/ui/wg-logo";
import { UserOutlined, LoginOutlined, LogoutOutlined, GoogleOutlined } from '@ant-design/icons';
import useUser from '@/app/lib/hooks/use-user';

import { MenuInfo } from "@/app/ui/TemplatePageLayout";
import errorMessage from "@/app/ui/errorMessage";

type MenuItem = Required<MenuProps>['items'][number];

interface TemplateHeaderProps {
  menuItems?: MenuProps['items'];
  onClickMenu?: (info: MenuInfo) => void;
  logoutTooltipMessage?: string;
  avatarMenuItems?: MenuItem[];
  onClickAvatarMenu?: (info: MenuInfo) => void;
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
                          onClickAvatarMenu,
                        }: TemplateHeaderProps) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { isAuthenticated, userName, iconURL } = useUser();

  const loginWithGoogle = () =>
    signIn('google', { callbackUrl: '/' }).catch((error: Error) => errorMessage(error.message));

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

  const onMenuClick = (info: MenuInfo) => {
    if (info?.key === 'logout') {
      signOut({callbackUrl: '/'});
    } else if (onClickAvatarMenu) {
      onClickAvatarMenu(info);
    }
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
      {!isAuthenticated && (
        <Tooltip placement="left" title={logoutTooltipMessage}>
          <Avatar size={64} icon={<UserOutlined />} onClick={showModal} />
        </Tooltip>
      )}
      {isAuthenticated && (
        <Dropdown
          placement="bottomRight"
          arrow={{ pointAtCenter: true }}
          menu={{ items: avatarMenuItems, onClick: onMenuClick }}
          trigger={['click']}

        >
          <div className='flex flex-col justify-center items-center' >
            <Avatar size={userName ? 'large' : 64} src={iconURL} icon={<UserOutlined />} />
            <p className='text-sm text-nowrap text-white'>{userName}</p>
          </div>
        </Dropdown>
      )}
      <Modal
        title={<div><LoginOutlined className='text-xl' />&nbsp;&nbsp;Login:</div>}
        open={isModalOpen}
        onCancel={handleCancel}
        footer={[]}
      >
        <div className='min-h-20 grid content-center'>
          <Button onClick={loginWithGoogle} type='primary' className='w-full'><GoogleOutlined />Login with Google</Button>
        </div>
      </Modal>
    </Layout.Header>
  );
}

export default TemplateHeader;
