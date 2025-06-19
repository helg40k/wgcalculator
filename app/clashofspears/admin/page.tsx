"use client";

import React from "react";
import { SessionProvider } from "next-auth/react";

import { getItem, MenuItem } from "@/app/clashofspears/ui/shared";
import TemplatePageLayout, { MenuInfo } from "@/app/ui/TemplatePageLayout";

const adminSiderMenuItems: MenuItem[] = [
  getItem("Sources", "sources"),
  getItem("Profiles", "profiles"),
  getItem("Armors", "armors"),
  getItem("Weapons", "weapons"),
  getItem("Traits", "traits"),
];

const Page = () => {
  const onClickSiderMenu = (info: MenuInfo) => {
    console.log(info);
  };

  return (
    <SessionProvider>
      <TemplatePageLayout
        definedHeaderMenuKey="config"
        siderMenuItems={adminSiderMenuItems}
        onClickSiderMenu={onClickSiderMenu}
      >
        <p>Hello Clash of Spears Admin</p>
      </TemplatePageLayout>
    </SessionProvider>
  );
};

export default Page;
