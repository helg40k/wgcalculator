import { BookOpenIcon, LinkIcon } from "@heroicons/react/24/outline";
import { Flex, Row, theme, Typography } from "antd";
import Link from "next/link";

import { Source } from "@/app/lib/definitions";

const SourceView = ({ entity }: { entity: Source }) => {
  const {
    token: { colorTextPlaceholder, colorTextSecondary, colorTextTertiary },
  } = theme.useToken();

  const getLinkLabel = (url: string) => {
    if (!url) {
      return "unknown";
    }
    try {
      const link = new URL(url);
      return link.hostname;
    } catch (e) {
      console.warn(`Cannot parse URL: ${url}`, e);
      return url;
    }
  };

  return (
    <Row>
      <Flex justify="left" className="w-full">
        <BookOpenIcon
          className="w-36"
          style={{ color: colorTextPlaceholder }}
        />
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
              {entity.urls?.length &&
                entity.urls.map((url, i) => (
                  <Link
                    key={`url${i}`}
                    href={url}
                    className="flex items-center"
                    rel="noopener noreferrer"
                    target="_blank"
                  >
                    <LinkIcon className="h-3" />
                    <div className="ml-1">{getLinkLabel(url)}</div>
                  </Link>
                ))}
            </div>
            {entity.description && (
              <div className="ml-10" style={{ color: colorTextSecondary }}>
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
