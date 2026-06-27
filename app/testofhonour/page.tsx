"use client";

import React from "react";

import TemplatePageLayout, { MenuInfo } from "@/app/ui/TemplatePageLayout";

const Page = () => {
  const onClickSiderMenu = (info: MenuInfo) => {
    console.log(info);
  };

  return (
    <TemplatePageLayout
      definedHeaderMenuKey="play"
      onClickSiderMenu={onClickSiderMenu}
    >
      <p>Hello Test of Honour</p>
    </TemplatePageLayout>
  );
};

export default Page;
