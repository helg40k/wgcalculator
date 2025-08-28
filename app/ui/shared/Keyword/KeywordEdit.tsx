import { Flex, Row, theme, Typography } from "antd";

import { Keyword } from "@/app/lib/definitions";
import ReferenceCounter from "@/app/ui/shared/ReferenceCounter";

const KeywordEdit = ({
  entity,
  field,
  value,
  setValues,
  setValid,
  setIsNew,
}: {
  entity: Keyword;
  field: keyof Keyword | string;
  value: any;
  setValues: (values: Partial<Keyword>) => void;
  setValid: (valid: boolean) => void;
  setIsNew: (isNew: boolean) => void;
}) => {
  const {
    token: {
      colorTextPlaceholder,
      colorTextSecondary,
      colorTextTertiary,
      borderRadiusLG,
    },
  } = theme.useToken();

  // Display the field value with "Edit" prefix
  return <div>Edit: {value}</div>;
};

export default KeywordEdit;
