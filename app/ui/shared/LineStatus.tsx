import React from "react";
import { Badge, theme } from "antd";
import clsx from "clsx";

import { EntityStatus, EntityStatusRegistry } from "@/app/lib/definitions";

interface LineStatusProps {
  children: React.ReactNode;
  status: EntityStatus;
  show?: boolean;
}

const LineStatus: React.FC<LineStatusProps> = ({ children, status, show }) => {
  const {
    token: { colorTextSecondary, colorTextTertiary },
  } = theme.useToken();

  const isActive = status === EntityStatusRegistry.ACTIVE;
  const isDisabled = status === EntityStatusRegistry.DISABLED;

  if (show === false && isActive) {
    return children;
  }

  const style = isDisabled
    ? { color: colorTextSecondary }
    : { color: colorTextTertiary };
  const bgColor = isActive ? "white" : "lightGrey";

  return (
    <Badge.Ribbon
      className={clsx(
        "border-1",
        { "border-gray-300": isActive },
        { "border-gray-400": !isActive },
      )}
      text={
        <span className="font-mono text-xs" style={style}>
          {status}
        </span>
      }
      color={bgColor}
      placement="start"
    >
      {children}
    </Badge.Ribbon>
  );
};

export default LineStatus;
