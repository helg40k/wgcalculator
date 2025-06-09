import React, { useEffect, useMemo, useState } from "react";
import {
  HomeOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
} from "@ant-design/icons";
import { Breadcrumb, Button, Layout, Menu, MenuProps, theme } from "antd";
import { usePathname } from "next/navigation";

import TemplateFooter from "@/app/ui/TemplateFooter";
import TemplateHeader from "@/app/ui/TemplateHeader";

const { Content, Sider, Header } = Layout;

type MenuItem = Required<MenuProps>["items"][number];

export interface MenuInfo {
  key: string;
  keyPath: string[];
  domEvent: React.MouseEvent<HTMLElement> | React.KeyboardEvent<HTMLElement>;
}

export const getItem = (
  label: React.ReactNode,
  key: React.Key,
  icon?: React.ReactNode,
  children?: MenuItem[],
): MenuItem => {
  return {
    children,
    icon,
    key,
    label,
  } as MenuItem;
};

interface PageLayoutProps {
  children: React.ReactNode;
  headerMenuItems?: MenuProps["items"];
  siderMenuItems?: MenuProps["items"];
  onClickHeaderMenu?: (info: MenuInfo) => void;
  onClickSiderMenu?: (info: MenuInfo) => void;
}

const avatarMenuItems: MenuItem[] = [
  {
    key: "test",
    label: "Test item",
  },
];

const TemplatePageLayout = ({
  children,
  headerMenuItems,
  siderMenuItems,
  onClickHeaderMenu,
  onClickSiderMenu,
}: PageLayoutProps) => {
  const [collapsed, setCollapsed] = useState(false);
  const pathname = usePathname();
  const {
    token: { colorBgContainer, borderRadiusLG },
  } = theme.useToken();

  const breadcrumbList = useMemo(() => {
    const homeItem = { href: "/", title: <HomeOutlined /> };
    const splitPath = pathname?.split("/") || [];
    const pathList = splitPath
      .filter((i) => !!i)
      .map((i) => {
        return { title: i };
      });
    return [homeItem, ...pathList];
  }, [pathname]);

  return (
    <Layout>
      <TemplateHeader
        menuItems={headerMenuItems}
        onClickMenu={onClickHeaderMenu}
        logoutTooltipMessage="Test message"
        avatarMenuItems={avatarMenuItems}
      />
      <div className="py-0 px-6">
        <div className="my-4">
          <Breadcrumb items={breadcrumbList} />
        </div>
        <Layout>
          <Sider
            style={{
              background: colorBgContainer,
              borderRadius: borderRadiusLG,
            }}
            width={200}
            trigger={null}
            collapsible
            collapsed={collapsed}
          >
            <Menu
              mode="inline"
              defaultSelectedKeys={["1"]}
              defaultOpenKeys={["sub1"]}
              style={{ borderRadius: borderRadiusLG, height: "100%" }}
              items={siderMenuItems}
              onClick={(i) =>
                onClickSiderMenu ? onClickSiderMenu(i) : undefined
              }
            />
          </Sider>
          <Layout>
            <Header
              style={{
                background: colorBgContainer,
                borderRadius: borderRadiusLG,
                padding: 0,
              }}
            >
              <Button
                type="text"
                icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
                onClick={() => setCollapsed(!collapsed)}
                style={{
                  fontSize: "16px",
                  height: 64,
                  width: 64,
                }}
              />
            </Header>
            <Content
              className="p-6 min-h-72"
              style={{
                background: colorBgContainer,
                borderRadius: borderRadiusLG,
                margin: "1px 0 0 0",
              }}
            >
              {children}
            </Content>
          </Layout>
        </Layout>
      </div>
      <TemplateFooter />
    </Layout>
  );
};

export default TemplatePageLayout;
