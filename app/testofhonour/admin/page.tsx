"use client";

import React from "react";

import TemplatePageLayout, { MenuInfo } from "@/app/ui/TemplatePageLayout";

const Page = () => {
  const onClickSiderMenu = (info: MenuInfo) => {
    console.log(info);
  };

  return (
    <TemplatePageLayout
      definedHeaderMenuKey="config"
      onClickSiderMenu={onClickSiderMenu}
    >
      <p>Hello Test of Honour Admin</p>
    </TemplatePageLayout>
  );
};

export default Page;
