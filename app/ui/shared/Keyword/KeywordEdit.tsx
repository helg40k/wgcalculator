import { Form, Input } from "antd";
import { Rule } from "antd/es/form";

import { Keyword } from "@/app/lib/definitions";

interface KeywordEditProps {
  entity: Keyword;
  field: keyof Keyword | string;
  value: string | number;
  validationRules?: Rule[];
}

const KeywordEdit = ({
  entity,
  field,
  value,
  validationRules,
}: KeywordEditProps) => {
  return (
    <Form.Item
      name={field}
      rules={validationRules}
      style={{ margin: 0 }}
      validateTrigger={["onChange", "onBlur"]}
    >
      <Input />
    </Form.Item>
  );
};

export default KeywordEdit;
