import React from "react";

import { Playable } from "@/app/lib/definitions";

interface TableCellViewProps {
  entity: Playable;
  field: keyof Playable | string;
  value: string | number;
}

const TableCellView = ({ entity, field, value }: TableCellViewProps) => {
  return value;
};

const TableCellViewPrewrap = ({ entity, field, value }: TableCellViewProps) => {
  return <div className="whitespace-pre-wrap">{value}</div>;
};

// Create a typed component with Prewrap property
interface TableCellViewComponent {
  (props: TableCellViewProps): React.ReactElement;
  Prewrap: (props: TableCellViewProps) => React.ReactElement;
}

// Attach Prewrap as a property to TableCellView
const TableCellViewWithPrewrap =
  TableCellView as unknown as TableCellViewComponent;
TableCellViewWithPrewrap.Prewrap = TableCellViewPrewrap;

export default TableCellViewWithPrewrap;
