import { Form, Input, Switch } from "antd";
import { Rule } from "antd/es/form";

import { Playable } from "@/app/lib/definitions";

const { TextArea } = Input;

import "./style.css";

interface TableCellEditProps {
  entity: Playable;
  field: keyof Playable | string;
  value: string | number | boolean;
  validationRules?: Rule[];
}

interface TableCellEditFormItemProps extends TableCellEditProps {
  children: React.ReactNode;
}

const TableCellEditFormItem = ({
  children,
  entity,
  field,
  value,
  validationRules,
}: TableCellEditFormItemProps) => {
  return (
    <Form.Item
      name={field}
      rules={validationRules}
      style={{ margin: 0 }}
      validateTrigger={["onChange", "onBlur"]}
      className="table-edit-form-item"
    >
      {children}
    </Form.Item>
  );
};

const TableCellEdit = ({
  entity,
  field,
  value,
  validationRules,
}: TableCellEditProps) => {
  return (
    <TableCellEditFormItem
      entity={entity}
      field={field}
      value={value}
      validationRules={validationRules}
    >
      <Input />
    </TableCellEditFormItem>
  );
};

const TableCellEditArea = ({
  entity,
  field,
  value,
  validationRules,
}: TableCellEditProps) => {
  return (
    <TableCellEditFormItem
      entity={entity}
      field={field}
      value={value}
      validationRules={validationRules}
    >
      <TextArea rows={2} />
    </TableCellEditFormItem>
  );
};

const TableCellEditBool = ({
  entity,
  field,
  value,
  validationRules,
}: TableCellEditProps) => {
  return (
    <TableCellEditFormItem
      entity={entity}
      field={field}
      value={value}
      validationRules={validationRules}
    >
      <Switch />
    </TableCellEditFormItem>
  );
};

// Create a typed component
interface TableCellEditComponent {
  (props: TableCellEditProps): React.ReactElement;
  Area: (props: TableCellEditProps) => React.ReactElement;
  Bool: (props: TableCellEditProps) => React.ReactElement;
}

// Attach the typed component as a property to TableCellView
const TableCellEditWithTypedComponents =
  TableCellEdit as unknown as TableCellEditComponent;
TableCellEditWithTypedComponents.Area = TableCellEditArea;
TableCellEditWithTypedComponents.Bool = TableCellEditBool;

export default TableCellEditWithTypedComponents;
