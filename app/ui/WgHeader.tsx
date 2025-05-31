'use client';

import React from "react";
import {Menu, MenuProps, Layout} from "antd";
import WgLogo from "@/app/ui/wg-logo";

const WgHeader = ({items}: {items:MenuProps['items']}) => {
  return (
    <Layout.Header style={{ display: 'flex', alignItems: 'center', padding: 0 }}>
      <WgLogo/>
      <Menu
        theme="dark"
        mode="horizontal"
        defaultSelectedKeys={['2']}
        items={items}
        style={{ flex: 1, minWidth: 0 }}
      />
    </Layout.Header>
  );
}

export default WgHeader;
