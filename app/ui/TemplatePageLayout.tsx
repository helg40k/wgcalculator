import React, { useEffect, useMemo, useState } from "react";
import {
  HomeFilled,
  HomeOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
} from "@ant-design/icons";
import {
  Breadcrumb,
  Button,
  Layout,
  Menu,
  MenuProps,
  notification,
  Row,
  theme,
} from "antd";
import Link from "next/link";
import { redirect, usePathname } from "next/navigation";

import { GameSystemProvider } from "@/app/lib/contexts/GameSystemContext";
import { getItem, MenuItem } from "@/app/ui/shared";
import TemplateFooter from "@/app/ui/TemplateFooter";
import TemplateHeader from "@/app/ui/TemplateHeader";

import packageJson from "../../package.json";

const { Content, Sider, Header } = Layout;

export interface MenuInfo {
  key: string;
  keyPath: string[];
  domEvent: React.MouseEvent<HTMLElement> | React.KeyboardEvent<HTMLElement>;
}

interface PageLayoutProps {
  children: React.ReactNode;
  headerMenuItems?: MenuProps["items"];
  definedHeaderMenuKey?: string;
  siderMenuItems?: MenuProps["items"];
  onClickHeaderMenu?: (info: MenuInfo) => void;
  onClickSiderMenu?: (info: MenuInfo) => void;
  contentHeader?: React.ReactNode | string;
}

const defaultSiderMenuItems: MenuItem[] = [
  getItem("Home", "home", <HomeOutlined />),
];

const avatarMenuItems: MenuItem[] = [
  {
    key: "test",
    label: "Test item",
  },
];

const TemplatePageLayout = ({
  children,
  headerMenuItems,
  definedHeaderMenuKey,
  siderMenuItems,
  onClickHeaderMenu,
  onClickSiderMenu,
  contentHeader = "",
}: PageLayoutProps) => {
  const [collapsed, setCollapsed] = useState(false);
  const pathname = usePathname();
  const {
    token: { colorBgContainer, borderRadiusLG },
  } = theme.useToken();

  const version = packageJson.version;

  const breadcrumbList = useMemo(() => {
    const homeItem =
      pathname === "/"
        ? { title: <HomeFilled /> }
        : { href: "/", title: <HomeFilled /> };
    const splitPath = pathname?.split("/") || [];
    const filteredSplitPath = splitPath.filter((i) => !!i);
    const pathList = filteredSplitPath.map((i, index) => {
      if (index === filteredSplitPath.length - 1) {
        return { title: i };
      }
      const paths = pathname?.split(`/${i}`) || [];
      if (paths[0]) {
        return { href: `/${paths[0]}`, title: i };
      } else {
        return { href: `/${i}`, title: i };
      }
    });
    return [homeItem, ...pathList];
  }, [pathname]);

  const reloadPage = () => {
    window.location.reload();
  };

  useEffect(() => {
    const checkVersion = () => {
      fetch("/api/version").then((resp) => {
        resp.json().then((value) => {
          const latestVersion = value.version;

          if (version !== latestVersion) {
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
          }
        });
      });
    };

    const interval = setInterval(checkVersion, 1000 * 60 * 10); // 10 minutes
    return () => clearInterval(interval);
  }, []);

  const resultSiderMenuItems = useMemo(() => {
    let result = pathname === "/" ? [] : defaultSiderMenuItems;
    if (siderMenuItems) {
      result = [
        ...result,
        { type: "divider" },
        ...siderMenuItems,
      ] as MenuItem[];
    }
    return result;
  }, [siderMenuItems, pathname]);

  const onClickResultSiderMenu = (info: MenuInfo) => {
    const key = info?.key;
    if (key === "home") {
      redirect("/");
    }
    if (onClickSiderMenu) {
      onClickSiderMenu(info);
    }
  };

  return (
    <Layout>
      <TemplateHeader
        version={version}
        menuItems={headerMenuItems}
        definedMenuKey={definedHeaderMenuKey}
        onClickMenu={onClickHeaderMenu}
        logoutTooltipMessage="Test message"
        avatarMenuItems={avatarMenuItems}
      />
      <div className="py-0 px-6">
        <GameSystemProvider>
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
                items={resultSiderMenuItems}
                onClick={onClickResultSiderMenu}
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
                <Row>
                  <Button
                    type="text"
                    icon={
                      collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />
                    }
                    onClick={() => setCollapsed(!collapsed)}
                    style={{
                      fontSize: "16px",
                      height: 64,
                      width: 64,
                    }}
                  />
                  <div className="ml-4 font-black">{contentHeader}</div>
                </Row>
              </Header>
              <Content
                className="p-6"
                style={{
                  background: colorBgContainer,
                  borderRadius: borderRadiusLG,
                  margin: "1px 0 0 0",
                  minHeight: "300px",
                }}
              >
                {children}
              </Content>
            </Layout>
          </Layout>
        </GameSystemProvider>
      </div>
      <TemplateFooter />
    </Layout>
  );
};

export default TemplatePageLayout;
