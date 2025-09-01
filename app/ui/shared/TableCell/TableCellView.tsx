import React from "react";
import { CheckCircleOutlined, CloseCircleOutlined } from "@ant-design/icons";

import { Playable } from "@/app/lib/definitions";
import TableCellEditWithTypedComponents from "@/app/ui/shared/TableCell/TableCellEdit";

interface TableCellViewProps {
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

const TableCellView = ({ entity, field, value }: TableCellViewProps) => {
  return convertValueForView(value);
};

const TableCellViewBool = ({ entity, field, value }: TableCellViewProps) => {
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

const TableCellViewArea = ({ entity, field, value }: TableCellViewProps) => {
  return <div className="whitespace-pre-wrap">{value}</div>;
};

// Create a typed component
interface TableCellViewComponent {
  (props: TableCellViewProps): React.ReactElement;
  Area: (props: TableCellViewProps) => React.ReactElement;
  Bool: (props: TableCellViewProps) => React.ReactElement;
}

// Attach the typed component as a property to TableCellView
const TableCellViewWithTypedComponents =
  TableCellView as unknown as TableCellViewComponent;
TableCellViewWithTypedComponents.Area = TableCellViewArea;
TableCellViewWithTypedComponents.Bool = TableCellViewBool;

export default TableCellViewWithTypedComponents;
