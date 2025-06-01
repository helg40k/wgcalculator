'use client';

import React from "react";
import {Menu, MenuProps, Layout} from "antd";
import WgLogo from "@/app/ui/wg-logo";

const TemplateHeader = ({items}: {items:MenuProps['items']}) => {
  return (
    <Layout.Header style={{ display: 'flex', alignItems: 'center', padding: 0 }}>
      <WgLogo/>
      {items && (
        <Menu
              theme="dark"
              mode="horizontal"
              defaultSelectedKeys={[items[0]?.key?.toString() || '']}
              items={items}
        />
      )}
    </Layout.Header>
  );
}

export default TemplateHeader;
