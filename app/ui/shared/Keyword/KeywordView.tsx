import { Flex, Row, theme, Typography } from "antd";

import { Keyword } from "@/app/lib/definitions";
import ReferenceCounter from "@/app/ui/shared/ReferenceCounter";

const KeywordView = ({
  entity,
  field,
  value,
}: {
  entity: Keyword;
  field: keyof Keyword | string;
  value: any;
}) => {
  const {
    token: {
      colorTextPlaceholder,
      colorTextSecondary,
      colorTextTertiary,
      borderRadiusLG,
    },
  } = theme.useToken();

  // Display the field value passed from the table
  return <div>{value}</div>;
};

export default KeywordView;
