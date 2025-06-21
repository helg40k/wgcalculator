"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
  faAddressCard,
  faBolt,
  faChartPie,
  faSeedling,
  faShieldHalved,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon as Icon } from "@fortawesome/react-fontawesome";
import { Tabs } from "antd";
import { SessionProvider } from "next-auth/react";

import { CollectionRegistry, Source } from "@/app/lib/definitions";
import useEntities from "@/app/lib/hooks/useEntities";
import { getMenuItems, MenuItemConst } from "@/app/ui/shared";
import TemplatePageLayout, { MenuInfo } from "@/app/ui/TemplatePageLayout";

type MenuKey =
  | "START"
  | "SOURCES"
  | "PROFILES"
  | "ARMORS"
  | "WEAPONS"
  | "TRAITS";

/* eslint-disable sort-keys-fix/sort-keys-fix */
const MENU_ITEMS: Record<MenuKey, MenuItemConst> = {
  START: {
    index: 0,
    key: "start",
  },
  SOURCES: {
    icon: <Icon icon={faChartPie} />,
    index: 1,
    key: "sources",
    label: "Sources",
  },
  PROFILES: {
    icon: <Icon icon={faAddressCard} />,
    index: 2,
    key: "profiles",
    label: "Profiles",
  },
  ARMORS: {
    icon: <Icon icon={faShieldHalved} />,
    index: 3,
    key: "armors",
    label: "Armors",
  },
  WEAPONS: {
    icon: <Icon icon={faBolt} />,
    index: 4,
    key: "weapons",
    label: "Weapons",
  },
  TRAITS: {
    icon: <Icon icon={faSeedling} />,
    index: 5,
    key: "traits",
    label: "Traits",
  },
};
/* eslint-enable sort-keys-fix/sort-keys-fix */

const Page = () => {
  const [activeTabContent, setActiveTabContent] = useState<string>(
    MENU_ITEMS.START.key,
  );
  const { loadEntities, loading, saveEntity } = useEntities();

  const adminSiderMenuItems = useMemo(() => getMenuItems(MENU_ITEMS) || [], []);

  const onClickSiderMenu = (info: MenuInfo) => {
    setActiveTabContent(info.key);
  };

  useEffect(() => {
    loadEntities<Source>(CollectionRegistry.Source).then((value) =>
      console.log(value),
    );
  }, []);

  const tabsContent = useMemo(() => {
    return [
      {
        children: "Clash of Spears Admin - START",
        key: MENU_ITEMS.START.key,
        label: "",
      },
      {
        children: "Clash of Spears Admin - SOURCES",
        key: MENU_ITEMS.SOURCES.key,
        label: MENU_ITEMS.SOURCES.label,
      },
      {
        children: "Clash of Spears Admin - PROFILES",
        key: MENU_ITEMS.PROFILES.key,
        label: MENU_ITEMS.PROFILES.label,
      },
      {
        children: "Clash of Spears Admin - ARMORS",
        key: MENU_ITEMS.ARMORS.key,
        label: MENU_ITEMS.ARMORS.label,
      },
      {
        children: "Clash of Spears Admin - WEAPONS",
        key: MENU_ITEMS.WEAPONS.key,
        label: MENU_ITEMS.WEAPONS.label,
      },
      {
        children: "Clash of Spears Admin - TRAITS",
        key: MENU_ITEMS.TRAITS.key,
        label: MENU_ITEMS.TRAITS.label,
      },
    ];
  }, []);

  return (
    <SessionProvider>
      <TemplatePageLayout
        definedHeaderMenuKey="config"
        siderMenuItems={adminSiderMenuItems}
        onClickSiderMenu={onClickSiderMenu}
      >
        <p>Hello Clash of Spears Admin</p>
        <Tabs
          tabPosition="top"
          animated={false}
          activeKey={activeTabContent}
          renderTabBar={() => <></>}
          items={tabsContent}
        />
      </TemplatePageLayout>
    </SessionProvider>
  );
};

export default Page;
