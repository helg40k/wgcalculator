"use client";

import React from "react";
import { SessionProvider } from "next-auth/react";

import TemplatePageLayout, { MenuInfo } from "@/app/ui/TemplatePageLayout";

const Page = () => {
  const onClickSiderMenu = (info: MenuInfo) => {
    console.log(info);
  };

  return (
    <SessionProvider>
      <TemplatePageLayout onClickSiderMenu={onClickSiderMenu}>
        <p>Hello Footsore</p>
      </TemplatePageLayout>
    </SessionProvider>
  );
};

export default Page;
