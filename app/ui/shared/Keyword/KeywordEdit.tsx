import { Flex, Row, theme, Typography } from "antd";

import { Keyword } from "@/app/lib/definitions";
import ReferenceCounter from "@/app/ui/shared/ReferenceCounter";

const KeywordView = ({ entity }: { entity: Keyword }) => {
  const {
    token: {
      colorTextPlaceholder,
      colorTextSecondary,
      colorTextTertiary,
      borderRadiusLG,
    },
  } = theme.useToken();

  return entity.name;
};

export default KeywordView;
