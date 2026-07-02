import React, { useState } from "react";
import { Input, Tag } from "antd";

interface CrudReferenceLinkViewProps {
  className?: string;
  highlighted?: boolean;
  link?: string;
  onClick?: () => void;
}

const CrudReferenceLinkView: React.FC<CrudReferenceLinkViewProps> = ({
  className,
  highlighted,
  link,
  onClick,
}) => {
  const entityLink = link?.trim();
  return (
    <Tag
      onClick={onClick}
      color={highlighted ? "volcano" : undefined}
      className={className}
      style={{ cursor: onClick ? "pointer" : "default" }}
    >
      {entityLink || "..."}
    </Tag>
  );
};

interface CrudReferenceLinkEditProps {
  link?: string;
  onDone: (newLink: string | undefined) => void;
}

const CrudReferenceLinkEdit: React.FC<CrudReferenceLinkEditProps> = ({
  link,
  onDone,
}) => {
  const [value, setValue] = useState(link || "");

  return (
    <Input
      allowClear
      autoFocus
      className="[&_.ant-input-suffix]:pl !pl-1.5 !pr-1.5"
      placeholder="Ref..."
      value={value}
      onChange={(e) => setValue(e.target.value)}
      onClear={() => onDone("")}
      onBlur={() => onDone(value.trim() || undefined)}
      onKeyDown={(e) => {
        if (e.key === "Enter") {
          onDone(value.trim() || undefined);
        }
        if (e.key === "Escape") {
          onDone(undefined);
        }
        e.stopPropagation();
      }}
      onMouseDown={(e) => e.stopPropagation()}
      style={{ fontSize: "12px", height: "22px", width: "60px" }}
    />
  );
};

const CrudReferenceLink = {
  Edit: CrudReferenceLinkEdit,
  View: CrudReferenceLinkView,
};

export default CrudReferenceLink;
