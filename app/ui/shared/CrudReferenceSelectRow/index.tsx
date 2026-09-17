import React from "react";
import { CheckIcon, XMarkIcon } from "@heroicons/react/24/outline";
import { Button, Input, Select, Tooltip } from "antd";
import clsx from "clsx";

import { EntityStatusRegistry, Playable } from "@/app/lib/definitions";
import EntityStatusUI from "@/app/ui/shared/EntityStatusUI";

interface CrudReferenceSelectRowProps {
  availableEntities: Playable[];
  selectOptions: Array<{ value: string; label: string }>;
  selectedEntityId: string | null;
  linkInput: string;
  placeholder: string;
  onSelect: (entityId: string | null) => void;
  onLinkChange: (link: string) => void;
  onConfirm: () => void;
  onCancel: () => void;
  className?: string;
}

const CrudReferenceSelectRow = ({
  availableEntities,
  selectOptions,
  selectedEntityId,
  linkInput,
  placeholder,
  onSelect,
  onLinkChange,
  onConfirm,
  onCancel,
  className,
}: CrudReferenceSelectRowProps) => {
  const findEntity = (id: string | number | null | undefined) => {
    if (id == null) return undefined;
    return availableEntities.find((ent) => ent._id === String(id));
  };

  const renderEntityLabel = (
    label: React.ReactNode,
    entity: Playable | undefined,
    selected: boolean,
  ) => (
    <div className="relative w-full">
      <span className={selected ? "block truncate pr-16" : undefined}>
        {label}
      </span>
      {entity && entity.status !== EntityStatusRegistry.ACTIVE && (
        <div
          className={selected ? "absolute -right-2" : "absolute -right-1"}
          style={{ top: -1 }}
        >
          <EntityStatusUI.Tag
            entityId={entity._id}
            status={entity.status}
            editable={false}
          />
        </div>
      )}
    </div>
  );

  return (
    <div
      data-testid="crud-reference-select-row"
      className={clsx("flex justify-start py-1 pr-3 w-full gap-1", className)}
    >
      <Select
        placeholder={placeholder}
        options={selectOptions}
        value={selectedEntityId}
        onChange={(value) => onSelect(value)}
        style={{ flex: "1", minWidth: "0" }}
        showSearch
        filterOption={(input, option) =>
          (option?.label ?? "").toLowerCase().includes(input.toLowerCase())
        }
        optionRender={(option) =>
          renderEntityLabel(option.label, findEntity(option.value), false)
        }
        labelRender={(props) =>
          renderEntityLabel(props.label, findEntity(props.value), true)
        }
        autoFocus
      />
      <Tooltip
        title="If you have a precise link (page, paragraph, etc.), type it here"
        mouseEnterDelay={0.5}
      >
        <Input
          allowClear
          className="[&_.ant-input-suffix]:pl !pl-1.5 !pr-1.5"
          placeholder="Ref..."
          value={linkInput}
          onChange={(e) => onLinkChange(e.target.value)}
          onMouseDown={(e) => e.stopPropagation()}
          onKeyDown={(e) => e.stopPropagation()}
          style={{ width: "65px" }}
        />
      </Tooltip>
      <Tooltip
        color="darkGreen"
        title="Confirm selection"
        mouseEnterDelay={0.5}
      >
        <Button
          className="flex-shrink-0"
          style={{
            height: "32px",
            width: "32px",
          }}
          disabled={!selectedEntityId}
          onClick={onConfirm}
          icon={
            <span className="text-gray-500 hover:text-green-900 transition-colors">
              <CheckIcon className="w-5" />
            </span>
          }
        />
      </Tooltip>
      <Tooltip color="darkRed" title="Cancel selection" mouseEnterDelay={0.5}>
        <Button
          className="flex-shrink-0"
          style={{
            height: "32px",
            width: "32px",
          }}
          onClick={onCancel}
          icon={
            <span className="text-gray-500 hover:text-red-900 transition-colors">
              <XMarkIcon className="w-5" />
            </span>
          }
        />
      </Tooltip>
    </div>
  );
};

export default CrudReferenceSelectRow;
