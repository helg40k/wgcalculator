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
  onChange?: (id: string, newStatus: EntityStatus) => Promise<void>;
  show?: boolean;
}

const LineStatus: React.FC<LineStatusProps> = ({
  children,
  entityId,
  status,
  onChange,
  show,
}) => {
  const [open, setOpen] = useState(false);
  const {
    token: { colorTextSecondary, colorTextTertiary },
  } = theme.useToken();

  const isActive = status === EntityStatusRegistry.ACTIVE;
  const isDisabled = status === EntityStatusRegistry.DISABLED;

  if (show === false && isActive) {
    return <>{children}</>;
  }

  const style = isDisabled
    ? { color: colorTextSecondary }
    : { color: colorTextTertiary };
  const bgColor = isActive ? "white" : "lightGrey";

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

  return (
    <>
      <Badge.Ribbon
        className={clsx(
          "border-1",
          { "border-gray-300": isActive },
          { "border-gray-400": !isActive },
        )}
        text={
          <Dropdown
            menu={{ items: menuItems, onClick: handleMenuClick }}
            open={open}
            onOpenChange={setOpen}
            trigger={["click"]}
            placement="bottomLeft"
          >
            <span className="font-mono text-xs cursor-pointer" style={style}>
              {status}
            </span>
          </Dropdown>
        }
        color={bgColor}
        placement="start"
      >
        {children}
      </Badge.Ribbon>
    </>
  );
};

export default LineStatus;
