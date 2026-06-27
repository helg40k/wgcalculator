"use client";

import React from "react";

import TemplatePageLayout, { MenuInfo } from "@/app/ui/TemplatePageLayout";

const Page = () => {
  const onClickSiderMenu = (info: MenuInfo) => {
    console.log(info);
  };

  return (
    <TemplatePageLayout onClickSiderMenu={onClickSiderMenu}>
      <p>Hello Footsore</p>
    </TemplatePageLayout>
  );
};

export default Page;
