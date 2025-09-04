import React from "react";
import { CheckCircleOutlined, CloseCircleOutlined } from "@ant-design/icons";

import { Playable } from "@/app/lib/definitions";

interface CrudTableCellViewProps {
  entity: Playable;
  field: keyof Playable | string;
  value: string | number | boolean;
}

const convertValueForView = (value: string | number | boolean) => {
  if (!value || typeof value === "string" || typeof value === "number") {
    return value || "";
  }
  return value.toString();
};

const CrudTableCellView = ({
  entity,
  field,
  value,
}: CrudTableCellViewProps) => {
  return convertValueForView(value);
};

const CrudTableCellViewBool = ({
  entity,
  field,
  value,
}: CrudTableCellViewProps) => {
  return value ? (
    <span className="text-green-700">
      <CheckCircleOutlined className="text-lg" />
    </span>
  ) : (
    <span className="text-red-700">
      <CloseCircleOutlined className="text-lg" />
    </span>
  );
};

const CrudTableCellViewArea = ({
  entity,
  field,
  value,
}: CrudTableCellViewProps) => {
  return <div className="whitespace-pre-wrap">{value}</div>;
};

// Create a typed component
interface CrudTableCellViewComponent {
  (props: CrudTableCellViewProps): React.ReactElement;
  Area: (props: CrudTableCellViewProps) => React.ReactElement;
  Bool: (props: CrudTableCellViewProps) => React.ReactElement;
}

// Attach the typed component as a property to TableCellView
const CrudTableCellViewWithTypedComponents =
  CrudTableCellView as unknown as CrudTableCellViewComponent;
CrudTableCellViewWithTypedComponents.Area = CrudTableCellViewArea;
CrudTableCellViewWithTypedComponents.Bool = CrudTableCellViewBool;

export default CrudTableCellViewWithTypedComponents;
