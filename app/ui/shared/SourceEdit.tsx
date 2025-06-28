import { useEffect } from "react";
import { BookOpenIcon, LinkIcon } from "@heroicons/react/24/outline";
import { Flex, Form, Input, InputNumber, Select, theme } from "antd";
import Link from "next/link";

import { Source, sourceTypes } from "@/app/lib/definitions";
import { getLinkLabel } from "@/app/ui/shared";

const { TextArea } = Input;

const SourceEdit = ({ entity }: { entity: Source }) => {
  const [form] = Form.useForm();
  const {
    token: { colorTextPlaceholder, borderRadiusLG },
  } = theme.useToken();

  useEffect(() => {
    if (form) {
      form.setFieldsValue(entity);
    }
  }, [form, entity]);

  const onFinish = (values: any) => {
    console.log("form finishing");
  };

  return (
    <Form
      form={form}
      name={`sourceEdit-${entity._id}`}
      className="border-1 border-gray-300"
      style={{ borderRadius: borderRadiusLG }}
      onFinish={onFinish}
    >
      <Flex justify="left" className="w-full items-start">
        <BookOpenIcon
          className="w-36"
          style={{ color: colorTextPlaceholder }}
        />
        <Flex vertical style={{ padding: "0 8px 0 8px" }} className="w-full">
          <div>
            <Form.Item
              name="name"
              className="w-11/12"
              style={{ margin: "8px 0" }}
              rules={[{ required: true }]}
            >
              <Input placeholder="Name" />
            </Form.Item>
            <Form.Item
              name="authors"
              className="w-11/12"
              style={{ margin: "8px 0" }}
            >
              <Input placeholder="Authors" prefix="by" />
            </Form.Item>
          </div>
          <Flex justify="flex-start">
            <div>
              <Flex
                justify="flex-start"
                className="font-mono"
                style={{ margin: "0 0 4px 0" }}
              >
                <Form.Item
                  name="type"
                  className="w-30"
                  style={{ margin: "0" }}
                  rules={[{ required: true }]}
                >
                  <Select
                    placeholder="Source type"
                    options={sourceTypes.map((t) => {
                      return { label: t, value: t };
                    })}
                  />
                </Form.Item>
                <Form.Item
                  name="version"
                  className="ml-3 w-24"
                  style={{ margin: "0 8px" }}
                >
                  <Input placeholder="Version" />
                </Form.Item>
                <Form.Item
                  name="year"
                  className="ml-3 w-24"
                  style={{ margin: "0" }}
                  rules={[{ required: true }]}
                >
                  <InputNumber placeholder="Year" min={1990} />
                </Form.Item>
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
            <Form.Item
              name="description"
              className="w-full"
              style={{ margin: "0 0 8px 2px" }}
            >
              <TextArea placeholder="Description" rows={4} />
            </Form.Item>
          </Flex>
        </Flex>
      </Flex>
    </Form>
  );
};

export default SourceEdit;
