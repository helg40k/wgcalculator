import { Form, Input, Switch } from "antd";
import { Rule } from "antd/es/form";

import { Playable } from "@/app/lib/definitions";

const { TextArea } = Input;

import "./style.css";

interface CrudTableCellEditProps {
  entity: Playable;
  field: keyof Playable | string;
  value: string | number | boolean;
  validationRules?: Rule[];
}

interface CrudTableCellEditFormItemProps extends CrudTableCellEditProps {
  children: React.ReactNode;
}

const CrudTableCellEditFormItem = ({
  children,
  entity,
  field,
  value,
  validationRules,
}: CrudTableCellEditFormItemProps) => {
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

const CrudTableCellEdit = ({
  entity,
  field,
  value,
  validationRules,
}: CrudTableCellEditProps) => {
  return (
    <CrudTableCellEditFormItem
      entity={entity}
      field={field}
      value={value}
      validationRules={validationRules}
    >
      <Input />
    </CrudTableCellEditFormItem>
  );
};

const CrudTableCellEditArea = ({
  entity,
  field,
  value,
  validationRules,
}: CrudTableCellEditProps) => {
  return (
    <CrudTableCellEditFormItem
      entity={entity}
      field={field}
      value={value}
      validationRules={validationRules}
    >
      <TextArea rows={2} />
    </CrudTableCellEditFormItem>
  );
};

const CrudTableCellEditBool = ({
  entity,
  field,
  value,
  validationRules,
}: CrudTableCellEditProps) => {
  return (
    <CrudTableCellEditFormItem
      entity={entity}
      field={field}
      value={value}
      validationRules={validationRules}
    >
      <Switch />
    </CrudTableCellEditFormItem>
  );
};

// Create a typed component
interface CrudTableCellEditComponent {
  (props: CrudTableCellEditProps): React.ReactElement;
  Area: (props: CrudTableCellEditProps) => React.ReactElement;
  Bool: (props: CrudTableCellEditProps) => React.ReactElement;
}

// Attach the typed component as a property to TableCellView
const CrudTableCellEditWithTypedComponents =
  CrudTableCellEdit as unknown as CrudTableCellEditComponent;
CrudTableCellEditWithTypedComponents.Area = CrudTableCellEditArea;
CrudTableCellEditWithTypedComponents.Bool = CrudTableCellEditBool;

export default CrudTableCellEditWithTypedComponents;
