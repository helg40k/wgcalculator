import { BookOpenIcon } from "@heroicons/react/24/outline";
import { Flex, Row, theme, Typography } from "antd";

import { Source } from "@/app/lib/definitions";
import Links from "@/app/ui/shared/Links";
import ReferenceCounter from "@/app/ui/shared/ReferenceCounter";

const SourceView = ({ entity }: { entity: Source }) => {
  const {
    token: {
      colorTextPlaceholder,
      colorTextSecondary,
      colorTextTertiary,
      borderRadiusLG,
    },
  } = theme.useToken();

  return (
    <Row style={{ borderRadius: borderRadiusLG }}>
      <Flex justify="left" className="w-full">
        <Flex vertical>
          <BookOpenIcon
            className="w-30"
            style={{ color: colorTextPlaceholder }}
          />
          <ReferenceCounter references={entity.references} />
        </Flex>
        <Flex vertical style={{ padding: "0 8px 0 8px" }} className="w-full">
          <div className="mb-3">
            <Typography.Title level={3} style={{ margin: 0 }}>
              {entity.name}
            </Typography.Title>
            {entity.authors && (
              <div
                className="text-xs ml-3"
                style={{ color: colorTextTertiary }}
              >
                by {entity.authors}
              </div>
            )}
          </div>
          <Flex justify="flex-start">
            <div>
              <Flex
                justify="flex-start"
                className="font-mono"
                style={{ margin: "0 0 4px 0" }}
              >
                <div className="font-semibold">{entity.type}</div>
                <div className="ml-3">v{entity.version}</div>
                <div className="ml-3">{entity.year}</div>
              </Flex>
              <Links.View urls={entity.urls} />
            </div>
            {entity.description && (
              <div
                className="ml-10 whitespace-pre-wrap"
                style={{
                  color: colorTextSecondary,
                }}
              >
                {entity.description}
              </div>
            )}
          </Flex>
        </Flex>
      </Flex>
    </Row>
  );
};

export default SourceView;
