import React, { useState } from "react";
import { Badge, Dropdown, Tag, theme, Tooltip } from "antd";
import clsx from "clsx";
import { capitalize } from "lodash";

import {
  EntityStatus,
  entityStatuses,
  EntityStatusRegistry,
} from "@/app/lib/definitions";

// Reusable styling functions for entity status
const getEntityStatusStyles = () => {
  const {
    token: {
      colorError,
      colorErrorBg,
      colorTextSecondary,
      colorTextTertiary,
      colorWarningBg,
      colorTextDisabled,
    },
  } = theme.useToken();

  const getTextColor = (status: EntityStatus) => {
    switch (status) {
      case EntityStatusRegistry.OBSOLETE:
        return { color: colorTextSecondary };
      case EntityStatusRegistry.DISABLED:
        return { color: colorTextTertiary };
      default:
        return { color: colorTextTertiary };
    }
  };

  const getBackgroundColor = (status: EntityStatus) => {
    switch (status) {
      case EntityStatusRegistry.OBSOLETE:
        return "lightGrey";
      case EntityStatusRegistry.DISABLED:
        return colorWarningBg;
      default:
        return "white";
    }
  };

  const getBorderColorTag = (status: EntityStatus) => {
    switch (status) {
      case EntityStatusRegistry.OBSOLETE:
        return colorTextTertiary;
      default:
        return colorTextDisabled;
    }
  };

  const getBorderColorBadge = (status: EntityStatus) => {
    return status === EntityStatusRegistry.OBSOLETE
      ? "border-gray-400"
      : "border-gray-300";
  };

  return {
    colorError,
    colorErrorBg,
    colorTextDisabled,
    colorTextSecondary,
    colorTextTertiary,
    colorWarningBg,
    getBackgroundColor,
    getBorderColorBadge,
    getBorderColorTag,
    getTextColor,
  };
};

interface EntityStatusProps {
  entityId: string;
  status: EntityStatus;
  editable: boolean;
  hasBrokenReference?: boolean;
  onChange?: (id: string, newStatus: EntityStatus) => Promise<void>;
}

interface EntityStatusBadgeProps extends EntityStatusProps {
  children: React.ReactNode;
  show?: boolean;
}

// Create menu items once outside component to avoid recreation
const createMenuItems = (currentStatus: EntityStatus) => {
  const sortedStatuses = [...entityStatuses].sort();
  return sortedStatuses.map((statusOption) => ({
    key: statusOption,
    label: (
      <span
        className={clsx("font-mono text-xs", {
          "font-bold": statusOption === currentStatus,
        })}
      >
        {statusOption}
      </span>
    ),
  }));
};

// Reusable status view component with tooltip and dropdown
const EntityStatusView: React.FC<EntityStatusProps> = ({
  entityId,
  status,
  editable,
  hasBrokenReference,
  onChange,
}) => {
  const [open, setOpen] = useState(false);
  const { colorError, colorTextSecondary, getTextColor } =
    getEntityStatusStyles();

  if (hasBrokenReference) {
    return (
      <Tooltip
        title="At least one of its references is broken"
        color="white"
        styles={{ body: { color: colorError, minWidth: 265 } }}
        mouseEnterDelay={0.5}
      >
        <span className="font-mono text-xs" style={{ color: colorError }}>
          broken
        </span>
      </Tooltip>
    );
  }

  const menuItems = createMenuItems(status);

  const handleMenuClick = ({ key }: { key: string }) => {
    const newStatus = key as EntityStatus;
    if (newStatus !== status && onChange) {
      onChange(entityId, newStatus);
    }
    setOpen(false);
  };

  const statusView = (
    <Tooltip
      title={`${capitalize(status)} status`}
      color="white"
      styles={{ body: { color: colorTextSecondary } }}
      mouseEnterDelay={1}
      open={editable ? undefined : false}
    >
      <span
        className={clsx("font-mono text-xs", { "cursor-pointer": editable })}
        style={getTextColor(status)}
      >
        {status}
      </span>
    </Tooltip>
  );

  if (editable) {
    return (
      <Dropdown
        menu={{ items: menuItems, onClick: handleMenuClick }}
        open={open}
        onOpenChange={setOpen}
        trigger={["click"]}
        placement="bottomLeft"
      >
        {statusView}
      </Dropdown>
    );
  }

  return statusView;
};

const EntityStatusBadge: React.FC<EntityStatusBadgeProps> = ({
  children,
  entityId,
  status,
  editable,
  hasBrokenReference,
  onChange,
  show,
}) => {
  const { colorErrorBg, colorError, getBackgroundColor, getBorderColorBadge } =
    getEntityStatusStyles();

  if (
    !hasBrokenReference &&
    show === false &&
    status === EntityStatusRegistry.ACTIVE
  ) {
    return <>{children}</>;
  }

  const isBroken = !!hasBrokenReference;

  return (
    <Badge.Ribbon
      className={clsx(
        "border-1",
        isBroken ? "border-red-400" : getBorderColorBadge(status),
      )}
      text={
        <EntityStatusView
          entityId={entityId}
          status={status}
          editable={editable}
          hasBrokenReference={hasBrokenReference}
          onChange={onChange}
        />
      }
      color={isBroken ? colorErrorBg : getBackgroundColor(status)}
      placement="start"
    >
      {children}
    </Badge.Ribbon>
  );
};

const EntityStatusTag: React.FC<EntityStatusProps> = ({
  entityId,
  status,
  editable,
  hasBrokenReference,
  onChange,
}) => {
  const { colorError, colorErrorBg, getBackgroundColor, getBorderColorTag } =
    getEntityStatusStyles();

  const isBroken = !!hasBrokenReference;

  const styles = {
    borderColor: isBroken ? colorError : getBorderColorTag(status),
  };

  return (
    <Tag
      color={isBroken ? colorErrorBg : getBackgroundColor(status)}
      className={clsx({ "cursor-pointer": !isBroken && editable })}
      style={styles}
    >
      <EntityStatusView
        entityId={entityId}
        status={status}
        editable={editable}
        hasBrokenReference={hasBrokenReference}
        onChange={onChange}
      />
    </Tag>
  );
};

const EntityStatusUI = {
  Badge: EntityStatusBadge,
  Tag: EntityStatusTag,
};

export default EntityStatusUI;
