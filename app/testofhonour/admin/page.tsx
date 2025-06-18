"use client";

import React from "react";
import { SessionProvider } from "next-auth/react";

import {
  adminSiderMenuItems,
  onClickAdminSiderMenu,
} from "@/app/clashofspears/ui/shared";
import TemplatePageLayout from "@/app/ui/TemplatePageLayout";

const Page = () => {
  return (
    <SessionProvider>
      <TemplatePageLayout
        definedHeaderMenuKey="config"
        siderMenuItems={adminSiderMenuItems}
        onClickSiderMenu={onClickAdminSiderMenu}
      >
        <p>Hello Test of Honour Admin</p>
      </TemplatePageLayout>
    </SessionProvider>
  );
};

export default Page;
