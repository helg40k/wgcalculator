import {
  Dispatch,
  SetStateAction,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { BookOpenIcon } from "@heroicons/react/24/outline";
import { Flex, Form, Input, InputNumber, Select, theme } from "antd";

import { GameSystemContext } from "@/app/lib/contexts/GameSystemContext";
import { Source, sourceTypes } from "@/app/lib/definitions";
import LinksEdit from "@/app/ui/shared/LinksEdit";

const { TextArea } = Input;

interface SourceEditProps {
  entity: Source;
  setValues: Dispatch<SetStateAction<any>>;
  setValid: Dispatch<SetStateAction<boolean>>;
}

const SourceEdit = ({ entity, setValues, setValid }: SourceEditProps) => {
  const gameSystem = useContext(GameSystemContext);
  const [urls, setUrls] = useState<string[]>(entity.urls || []);
  const [areUrlsValid, setAreUrlsValid] = useState<boolean>(true);
  const [form] = Form.useForm();
  const {
    token: { colorTextPlaceholder, borderRadiusLG },
  } = theme.useToken();

  useEffect(() => {
    if (form) {
      form.setFieldsValue({
        ...entity,
        systemId: gameSystem?._id || entity.systemId,
      });
    }
  }, [form, entity, gameSystem?._id]);

  const formName = useMemo(() => {
    return `sourceEdit-${entity._id}`;
  }, [entity]);

  const onChange = useCallback(() => {
    const filteredUrls = urls
      .map((url: string) => url.trim())
      .filter((url: string) => url);

    form
      .validateFields()
      .then(() => setValid(areUrlsValid))
      .catch((errObj) =>
        setValid(!errObj?.errorFields?.length && areUrlsValid),
      );

    const fieldValues = form.getFieldsValue();
    fieldValues["urls"] = filteredUrls;
    setValues(fieldValues);
  }, [form, setValues, setValid, urls, areUrlsValid]);

  useEffect(() => {
    onChange();
  }, [onChange]);

  return (
    <Form
      form={form}
      name={formName}
      className="border-1 border-gray-300"
      style={{ borderRadius: borderRadiusLG }}
      onChange={onChange}
    >
      <Form.Item name="systemId" hidden>
        <Input />
      </Form.Item>
      <Flex justify="left" className="w-full items-start">
        <BookOpenIcon
          className="w-36"
          style={{ color: colorTextPlaceholder }}
        />
        <Flex vertical style={{ padding: "0 8px 0 8px" }} className="w-full">
          <div className="pr-19">
            <Form.Item
              name="name"
              style={{ margin: "8px 0" }}
              rules={[{ message: "Name is required", required: true }]}
            >
              <Input placeholder="Name" />
            </Form.Item>
            <Form.Item name="authors" style={{ margin: "8px 0" }}>
              <Input placeholder="Authors" prefix="by" />
            </Form.Item>
          </div>
          <Flex justify="flex-start">
            <div>
              <Flex
                justify="flex-start"
                className="font-mono"
                style={{ margin: "0 0 8px 0" }}
              >
                <Form.Item
                  name="type"
                  className="w-30"
                  style={{ margin: "0" }}
                  rules={[{ message: "Type is required", required: true }]}
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
                  rules={[{ message: "Year is required", required: true }]}
                >
                  <InputNumber placeholder="Year" min={1990} />
                </Form.Item>
              </Flex>
              <LinksEdit
                formName={formName}
                urls={entity.urls}
                setUrls={setUrls}
                setValid={setAreUrlsValid}
                className="mr-1.5"
              />
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
