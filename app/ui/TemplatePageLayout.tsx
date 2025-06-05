import React, {useState} from "react";
import {
  MenuUnfoldOutlined,
  MenuFoldOutlined,
} from '@ant-design/icons';
import TemplateHeader from "@/app/ui/TemplateHeader";
import {Button, Breadcrumb, Layout, Menu, MenuProps, theme} from "antd";
import TemplateFooter from "@/app/ui/TemplateFooter";

const { Content, Sider, Header } = Layout;

type MenuItem = Required<MenuProps>['items'][number];

export interface MenuInfo {
  key: string;
  keyPath: string[];
  domEvent: React.MouseEvent<HTMLElement> | React.KeyboardEvent<HTMLElement>;
}

interface PageLayoutProps {
  children: React.ReactNode;
  headerMenuItems?: MenuProps['items'];
  siderMenuItems?: MenuProps['items'];
  onClickHeaderMenu?: (info: MenuInfo) => void;
  onClickSiderMenu?: (info: MenuInfo) => void;
}

const avatarMenuItems: MenuItem[] = [{
  label: 'Test item',
  key: 'test',
}];

const TemplatePageLayout = ({
                              children,
                              headerMenuItems,
                              siderMenuItems,
                              onClickHeaderMenu,
                              onClickSiderMenu
                            }:PageLayoutProps) => {
  const [collapsed, setCollapsed] = useState(false);
  const {
    token: { colorBgContainer, borderRadiusLG },
  } = theme.useToken();

  return (
    <Layout>
      <TemplateHeader
        menuItems={headerMenuItems}
        onClickMenu={onClickHeaderMenu}
        logoutTooltipMessage='Test message'
        avatarMenuItems={avatarMenuItems}
      />
      <div className='py-0 px-6'>
        <Breadcrumb
          style={{ margin: '16px 0' }}
          items={[{ title: 'Home' }, { title: 'List' }, { title: 'App' }]}
        />
        <Layout>
          <Sider style={{ background: colorBgContainer, borderRadius: borderRadiusLG }} width={200} trigger={null} collapsible collapsed={collapsed}>
            <Menu
              mode="inline"
              defaultSelectedKeys={['1']}
              defaultOpenKeys={['sub1']}
              style={{ height: '100%', borderRadius: borderRadiusLG }}
              items={siderMenuItems}
              onClick={(i) => onClickSiderMenu ? onClickSiderMenu(i) : undefined}
            />
          </Sider>
          <Layout>
            <Header style={{ padding: 0, background: colorBgContainer, borderRadius: borderRadiusLG }}>
              <Button
                type="text"
                icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
                onClick={() => setCollapsed(!collapsed)}
                style={{
                  fontSize: '16px',
                  width: 64,
                  height: 64,
                }}
              />
            </Header>
            <Content className='p-6 min-h-72' style={{
              margin: '1px 0 0 0',
              background: colorBgContainer,
              borderRadius: borderRadiusLG,
            }}>{children}</Content>
          </Layout>
        </Layout>
      </div>
      <TemplateFooter />
    </Layout>
  );
}

export default TemplatePageLayout;
