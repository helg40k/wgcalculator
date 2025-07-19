"use client";

import React, { useMemo, useState } from "react";
import {
  faAddressCard,
  faBolt,
  faChartPie,
  faSeedling,
  faShieldHalved,
  faSpellCheck,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon as Icon } from "@fortawesome/react-fontawesome";
import { Tabs } from "antd";
import { SessionProvider } from "next-auth/react";

import CosAdminArmors from "@/app/clashofspears/admin/ui/CosAdminArmors";
import CosAdminKeywords from "@/app/clashofspears/admin/ui/CosAdminKeywords";
import CosAdminProfiles from "@/app/clashofspears/admin/ui/CosAdminProfiles";
import CosAdminSources from "@/app/clashofspears/admin/ui/CosAdminSources";
import CosAdminStart from "@/app/clashofspears/admin/ui/CosAdminStart";
import CosAdminTraits from "@/app/clashofspears/admin/ui/CosAdminTraits";
import CosAdminWeapons from "@/app/clashofspears/admin/ui/CosAdminWeapons";
import { getMenuItems, MenuItemConst } from "@/app/ui/shared";
import TemplatePageLayout, { MenuInfo } from "@/app/ui/TemplatePageLayout";

type MenuKey =
  | "START"
  | "SOURCES"
  | "KEYWORDS"
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
  KEYWORDS: {
    icon: <Icon icon={faSpellCheck} />,
    index: 2,
    key: "keywords",
    label: "Keywords",
  },
  PROFILES: {
    icon: <Icon icon={faAddressCard} />,
    index: 3,
    key: "profiles",
    label: "Profiles",
  },
  ARMORS: {
    icon: <Icon icon={faShieldHalved} />,
    index: 4,
    key: "armors",
    label: "Armors",
  },
  WEAPONS: {
    icon: <Icon icon={faBolt} />,
    index: 5,
    key: "weapons",
    label: "Weapons",
  },
  TRAITS: {
    icon: <Icon icon={faSeedling} />,
    index: 6,
    key: "traits",
    label: "Traits",
  },
};
/* eslint-enable sort-keys-fix/sort-keys-fix */

const Page = () => {
  const [activeTabContent, setActiveTabContent] = useState<string>(
    MENU_ITEMS.START.key,
  );

  const adminSiderMenuItems = useMemo(() => getMenuItems(MENU_ITEMS) || [], []);

  const onClickSiderMenu = (info: MenuInfo) => {
    setActiveTabContent(info.key);
  };

  const tabsContent = useMemo(() => {
    return [
      {
        children: <CosAdminStart />,
        key: MENU_ITEMS.START.key,
        label: "",
      },
      {
        children: <CosAdminSources />,
        key: MENU_ITEMS.SOURCES.key,
        label: MENU_ITEMS.SOURCES.label,
      },
      {
        children: <CosAdminKeywords />,
        key: MENU_ITEMS.KEYWORDS.key,
        label: MENU_ITEMS.KEYWORDS.label,
      },
      {
        children: <CosAdminProfiles />,
        key: MENU_ITEMS.PROFILES.key,
        label: MENU_ITEMS.PROFILES.label,
      },
      {
        children: <CosAdminArmors />,
        key: MENU_ITEMS.ARMORS.key,
        label: MENU_ITEMS.ARMORS.label,
      },
      {
        children: <CosAdminWeapons />,
        key: MENU_ITEMS.WEAPONS.key,
        label: MENU_ITEMS.WEAPONS.label,
      },
      {
        children: <CosAdminTraits />,
        key: MENU_ITEMS.TRAITS.key,
        label: MENU_ITEMS.TRAITS.label,
      },
    ];
  }, []);

  const contentHeader = useMemo(() => {
    return Object.values(MENU_ITEMS)
      .filter((item: MenuItemConst) => item.key === activeTabContent)
      .map((item: MenuItemConst) => item.label);
  }, [activeTabContent]);

  return (
    <SessionProvider>
      <TemplatePageLayout
        definedHeaderMenuKey="config"
        siderMenuItems={adminSiderMenuItems}
        onClickSiderMenu={onClickSiderMenu}
        contentHeader={contentHeader}
      >
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
