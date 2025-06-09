"use client";

import React, { useMemo, useState } from "react";
import {
  GoogleOutlined,
  LoginOutlined,
  LogoutOutlined,
  UserOutlined,
} from "@ant-design/icons";
import {
  Avatar,
  Button,
  Dropdown,
  Layout,
  Menu,
  MenuProps,
  Modal,
  notification,
  Space,
  Tooltip,
} from "antd";
import Link from "next/link";
import { signIn, signOut } from "next-auth/react";

import useUser from "@/app/lib/hooks/use-user";
import errorMessage from "@/app/ui/errorMessage";
import { MenuInfo } from "@/app/ui/TemplatePageLayout";
import WgLogo from "@/app/ui/wg-logo";

type MenuItem = Required<MenuProps>["items"][number];

interface TemplateHeaderProps {
  menuItems?: MenuProps["items"];
  onClickMenu?: (info: MenuInfo) => void;
  logoutTooltipMessage?: string;
  avatarMenuItems?: MenuItem[];
  onClickAvatarMenu?: (info: MenuInfo) => void;
}

const requiredAvatarMenuItems: MenuItem[] = [
  {
    icon: <LogoutOutlined />,
    key: "logout",
    label: "Logout",
  },
];

const TemplateHeader = ({
  menuItems,
  onClickMenu,
  logoutTooltipMessage,
  avatarMenuItems: avatarItems,
  onClickAvatarMenu,
}: TemplateHeaderProps) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { isAuthenticated, userName, iconURL, isAdmin } = useUser();

  const reloadPage = () => {
    window.location.reload();
  };

  const loginWithGoogle = () =>
    signIn("google", { callbackUrl: "/" }).catch((error: Error) =>
      errorMessage(error.message),
    );

  const avatarMenuItems = useMemo(() => {
    if (avatarItems) {
      return [
        ...avatarItems,
        { type: "divider" },
        ...requiredAvatarMenuItems,
      ] as MenuItem[];
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
    if (info?.key === "logout") {
      signOut({ callbackUrl: "/" });
    } else if (onClickAvatarMenu) {
      onClickAvatarMenu(info);
    }
  };

  const checkVersion = () => {
    notification.warning({
      description: (
        <>
          <div>We have updated the Calculator.</div>
          <Link href="#" onClick={reloadPage} className="p-0">
            Refresh now
          </Link>
          &nbsp;for a better experience.
        </>
      ),
      duration: 0,
      message: "Refresh to update the Calculator",
    });
  };

  return (
    <Layout.Header
      className="flex items-center justify-between"
      style={{ padding: 0 }}
    >
      <Space>
        <WgLogo />
        {menuItems && (
          <Menu
            theme="dark"
            mode="horizontal"
            defaultSelectedKeys={[menuItems[0]?.key?.toString() || ""]}
            items={menuItems}
            onClick={(i) => (onClickMenu ? onClickMenu(i) : undefined)}
          />
        )}
      </Space>
      <div className="m-2">
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
            trigger={["click"]}
          >
            <div className="flex flex-col justify-center items-center">
              <Avatar
                size={userName ? "large" : 64}
                src={iconURL}
                icon={<UserOutlined />}
              />
              <p className="text-sm text-nowrap text-white">{userName}</p>
            </div>
          </Dropdown>
        )}
      </div>
      <Modal
        title={
          <div>
            <LoginOutlined className="text-xl" />
            &nbsp;&nbsp;Login:
          </div>
        }
        open={isModalOpen}
        onCancel={handleCancel}
        footer={[]}
      >
        <div className="min-h-20 grid content-center">
          <Button onClick={loginWithGoogle} type="primary" className="w-full">
            <GoogleOutlined />
            Login with Google
          </Button>
        </div>
      </Modal>
    </Layout.Header>
  );
};

export default TemplateHeader;
