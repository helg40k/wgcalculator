import React, { useState } from "react";
import { Badge, Dropdown, theme } from "antd";
import clsx from "clsx";

import {
  EntityStatus,
  entityStatuses,
  EntityStatusRegistry,
} from "@/app/lib/definitions";

interface LineStatusProps {
  children: React.ReactNode;
  entityId: string;
  status: EntityStatus;
  editable: boolean;
  onChange?: (id: string, newStatus: EntityStatus) => Promise<void>;
  show?: boolean;
}

const LineStatus: React.FC<LineStatusProps> = ({
  children,
  entityId,
  status,
  editable,
  onChange,
  show,
}) => {
  const [open, setOpen] = useState(false);
  const {
    token: { colorTextSecondary, colorTextTertiary, colorWarningBg },
  } = theme.useToken();

  if (show === false && status === EntityStatusRegistry.ACTIVE) {
    return <>{children}</>;
  }

  const style = () => {
    switch (status) {
      case EntityStatusRegistry.OBSOLETE:
        return { color: colorTextSecondary };
      case EntityStatusRegistry.DISABLED:
        return { color: colorTextTertiary };
      default:
        return { color: colorTextTertiary };
    }
  };
  const bgColor = () => {
    switch (status) {
      case EntityStatusRegistry.OBSOLETE:
        return "lightGrey";
      case EntityStatusRegistry.DISABLED:
        return colorWarningBg;
      default:
        return "white";
    }
  };

  // Create sorted menu items for status selection
  const sortedStatuses = [...entityStatuses].sort();
  const menuItems = sortedStatuses.map((statusOption) => ({
    key: statusOption,
    label: (
      <span
        className={clsx("font-mono text-xs", {
          "font-bold": statusOption === status,
        })}
      >
        {statusOption}
      </span>
    ),
  }));

  const handleMenuClick = ({ key }: { key: string }) => {
    const newStatus = key as EntityStatus;
    if (newStatus !== status && onChange) {
      onChange(entityId, newStatus);
    }
    setOpen(false);
  };

  const statusView = (
    <span
      className={clsx("font-mono text-xs", { "cursor-pointer": editable })}
      style={style()}
    >
      {status}
    </span>
  );

  return (
    <>
      <Badge.Ribbon
        className={clsx(
          "border-1",
          { "border-gray-300": status !== EntityStatusRegistry.OBSOLETE },
          { "border-gray-400": status === EntityStatusRegistry.OBSOLETE },
        )}
        text={
          <>
            {editable && (
              <Dropdown
                menu={{ items: menuItems, onClick: handleMenuClick }}
                open={open}
                onOpenChange={setOpen}
                trigger={["click"]}
                placement="bottomLeft"
              >
                {statusView}
              </Dropdown>
            )}
            {!editable && statusView}
          </>
        }
        color={bgColor()}
        placement="start"
      >
        {children}
      </Badge.Ribbon>
    </>
  );
};

export default LineStatus;
