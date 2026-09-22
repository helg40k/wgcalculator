"use client";

import React, { useMemo, useState } from "react";
import { faChartPie, faSpellCheck } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon as Icon } from "@fortawesome/react-fontawesome";
import { Badge, Tabs } from "antd";

import {
  BrokenReferencesManagerValue,
  BrokenReferencesProvider,
  useBrokenReferencesState,
} from "@/app/lib/contexts/BrokenReferencesContext";
import { CollectionName, CollectionRegistry } from "@/app/lib/definitions";
import useBrokenReferencesManager from "@/app/lib/hooks/useBrokenReferencesManager";
import TohAdminStart from "@/app/testofhonour/admin/ui/TohAdminStart";
import { getMenuItems, MenuItem, MenuItemConst } from "@/app/ui/shared";
import CrudAdminKeywords from "@/app/ui/shared/CrudAdminKeywords";
import CrudAdminSources from "@/app/ui/shared/CrudAdminSources";
import TemplatePageLayout, { MenuInfo } from "@/app/ui/TemplatePageLayout";

type MenuKey = "START" | "SOURCES" | "KEYWORDS";

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
};
/* eslint-enable sort-keys-fix/sort-keys-fix */

const MONITORED_COLLECTIONS: readonly CollectionName[] = [
  CollectionRegistry.Source,
  CollectionRegistry.Keyword,
] as const;

const BrokenReferencesLoader = ({
  collections,
  manager,
}: {
  collections: readonly CollectionName[];
  manager: BrokenReferencesManagerValue;
}) => {
  useBrokenReferencesManager(collections, manager);
  return null;
};

const PageContent = () => {
  const [activeTabContent, setActiveTabContent] = useState<string>(
    MENU_ITEMS.START.key,
  );

  const brokenState = useBrokenReferencesState();

  const counts = brokenState.getCounts();

  const adminSiderMenuItems: MenuItem[] = useMemo(() => {
    const baseItems = getMenuItems(MENU_ITEMS) || [];
    return baseItems.map((item) => {
      if (!item || typeof item !== "object" || !("key" in item)) return item;
      const count = counts[item.key as string] ?? 0;
      if (count > 0) {
        return {
          ...item,
          label: (
            <span className="flex items-center justify-between">
              {(item as any).label}
              <Badge count={count} size="default" title="" />
            </span>
          ),
        };
      }
      return item;
    });
  }, [counts]);

  const onClickSiderMenu = (info: MenuInfo) => {
    setActiveTabContent(info.key);
  };

  const tabsContent = useMemo(() => {
    return [
      {
        children: <TohAdminStart />,
        key: MENU_ITEMS.START.key,
        label: "",
      },
      {
        children: <CrudAdminSources />,
        key: MENU_ITEMS.SOURCES.key,
        label: MENU_ITEMS.SOURCES.label,
      },
      {
        children: <CrudAdminKeywords />,
        key: MENU_ITEMS.KEYWORDS.key,
        label: MENU_ITEMS.KEYWORDS.label,
      },
    ];
  }, []);

  const contentHeader = useMemo(() => {
    return Object.values(MENU_ITEMS)
      .filter((item: MenuItemConst) => item.key === activeTabContent)
      .map((item: MenuItemConst) => item.label);
  }, [activeTabContent]);

  return (
    <BrokenReferencesProvider value={brokenState}>
      <TemplatePageLayout
        definedHeaderMenuKey="config"
        siderMenuItems={adminSiderMenuItems}
        onClickSiderMenu={onClickSiderMenu}
        contentHeader={contentHeader}
      >
        <BrokenReferencesLoader
          collections={MONITORED_COLLECTIONS}
          manager={brokenState}
        />
        <Tabs
          tabPosition="top"
          animated={false}
          activeKey={activeTabContent}
          renderTabBar={() => <></>}
          items={tabsContent}
        />
      </TemplatePageLayout>
    </BrokenReferencesProvider>
  );
};

const Page = () => {
  return <PageContent />;
};

export default Page;
