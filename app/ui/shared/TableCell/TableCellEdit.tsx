import { Form, Input } from "antd";
import { Rule } from "antd/es/form";

import { Playable } from "@/app/lib/definitions";

import "./style.css";

interface TableCellEditProps {
  entity: Playable;
  field: keyof Playable | string;
  value: string | number;
  validationRules?: Rule[];
}

const TableCellEdit = ({
  entity,
  field,
  value,
  validationRules,
}: TableCellEditProps) => {
  return (
    <Form.Item
      name={field}
      rules={validationRules}
      style={{ margin: 0 }}
      validateTrigger={["onChange", "onBlur"]}
      className="table-edit-form-item"
    >
      <Input />
    </Form.Item>
  );
};

export default TableCellEdit;
