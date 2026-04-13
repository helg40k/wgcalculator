import React, { useMemo, useState } from "react";
import { Input, Tag } from "antd";

interface CrudReferenceLinkViewProps {
  link?: string;
  onClick?: () => void;
}

const CrudReferenceLinkView: React.FC<CrudReferenceLinkViewProps> = ({
  link,
  onClick,
}) => {
  const entityLink = useMemo(() => link?.trim(), [link]);
  return (
    <Tag onClick={onClick} style={{ cursor: "pointer" }}>
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
      autoFocus
      placeholder="Ref..."
      value={value}
      onChange={(e) => setValue(e.target.value)}
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
