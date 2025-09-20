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
  Space,
  Tooltip,
} from "antd";
import { redirect, usePathname } from "next/navigation";
import { signIn, signOut } from "next-auth/react";

import errorMessage from "@/app/lib/errorMessage";
import useUser from "@/app/lib/hooks/useUser";
import Logo from "@/app/ui/Logo";
import { getMenuItems, MenuItemConst } from "@/app/ui/shared";
import { MenuInfo } from "@/app/ui/TemplatePageLayout";

type MenuItem = Required<MenuProps>["items"][number];

interface TemplateHeaderProps {
  version?: string;
  menuItems?: MenuProps["items"];
  definedMenuKey?: string;
  onClickMenu?: (info: MenuInfo) => void;
  logoutTooltipMessage?: string;
  avatarMenuItems?: MenuItem[];
  onClickAvatarMenu?: (info: MenuInfo) => void;
}

type MenuKey = "PLAY" | "CONFIG";

/* eslint-disable sort-keys-fix/sort-keys-fix */
const HEADER_MENU_ITEMS: Record<MenuKey, MenuItemConst> = {
  PLAY: {
    index: 1,
    key: "play",
    label: "Play",
  },
  CONFIG: {
    index: 2,
    key: "config",
    label: "Config",
  },
};
/* eslint-enable sort-keys-fix/sort-keys-fix */

const requiredAvatarMenuItems: MenuItem[] = [
  {
    icon: <LogoutOutlined />,
    key: "logout",
    label: "Logout",
  },
];

const TemplateHeader = ({
  version = "",
  menuItems,
  definedMenuKey,
  onClickMenu,
  logoutTooltipMessage,
  avatarMenuItems: avatarItems,
  onClickAvatarMenu,
}: TemplateHeaderProps) => {
  const pathname = usePathname();
  const { isAuthenticated, userName, iconURL, isAdmin } = useUser();
  const [menuKey, setMenuKey] = useState<string[]>([
    (menuItems ? (menuItems[0]?.key as string) : definedMenuKey) || "",
  ]);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const loginWithGoogle = () =>
    signIn("google", { callbackUrl: pathname || "/" }).catch((error: Error) =>
      errorMessage(error.message),
    );

  const headerMenuItems = useMemo(
    () => getMenuItems(HEADER_MENU_ITEMS) || [],
    [],
  );

  const onClickHeaderMenu = (info: MenuInfo) => {
    const key = info?.key;
    setMenuKey([key]);
    if (onClickMenu) {
      onClickMenu(info);
    } else {
      switch (key) {
        case HEADER_MENU_ITEMS.PLAY.key: {
          redirect(pathname?.replace("/admin", "") || "/");
          break;
        }
        case HEADER_MENU_ITEMS.CONFIG.key: {
          if (!pathname?.includes("/admin")) {
            redirect(`${pathname}/admin`);
          }
          break;
        }
      }
    }
  };

  const avatarMenuItems = useMemo(() => {
    let result = requiredAvatarMenuItems;
    if (avatarItems) {
      result = [
        ...avatarItems,
        { type: "divider" },
        ...requiredAvatarMenuItems,
      ] as MenuItem[];
    }
    if (version) {
      result = [
        ...result,
        { type: "divider" },
        {
          disabled: true,
          key: "version",
          label: `v${version}`,
          style: { cursor: "default" },
        },
      ] as MenuItem[];
    }
    return result;
  }, [avatarItems, version]);

  const showModal = () => {
    setIsModalOpen(true);
  };

  const handleCancel = () => {
    setIsModalOpen(false);
  };

  const onMenuClick = (info: MenuInfo) => {
    if (info?.key === "logout") {
      signOut({ callbackUrl: pathname?.replace("/admin", "") || "/" }).catch(
        (error: Error) => errorMessage(error.message),
      );
    } else if (onClickAvatarMenu) {
      onClickAvatarMenu(info);
    }
  };

  return (
    <Layout.Header
      className="flex items-center justify-between"
      style={{ padding: 0 }}
    >
      <Space>
        <Logo />
        {(isAdmin || menuItems) && (
          <Menu
            theme="dark"
            mode="horizontal"
            selectedKeys={menuKey}
            items={menuItems || (isAdmin ? headerMenuItems : undefined)}
            onClick={onClickHeaderMenu}
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
