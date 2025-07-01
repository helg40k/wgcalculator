import {
  ChangeEvent,
  Dispatch,
  SetStateAction,
  useEffect,
  useState,
} from "react";
import { LinkIcon } from "@heroicons/react/24/outline";
import { Button, Input, theme } from "antd";

import { isUrlValid } from "@/app/ui/shared";

interface LinksEditProps {
  formName: string;
  urls: string[] | undefined;
  className?: string | undefined;
  setUrls: Dispatch<SetStateAction<string[]>>;
  setValid: Dispatch<SetStateAction<boolean>>;
}

const LinksEdit = ({
  formName,
  urls,
  className,
  setUrls,
  setValid,
}: LinksEditProps) => {
  const [values, setValues] = useState<string[]>(urls?.length ? urls : [""]);
  const {
    token: { colorErrorText },
  } = theme.useToken();

  useEffect(() => {
    setValid(!values.some((url) => !isUrlValid(url)));
    setUrls(values);
  }, [setUrls, setValid, values]);

  const onChange = (event: ChangeEvent<HTMLInputElement>, index: number) => {
    const updated = [...values];
    updated[index] = event.target.value;
    setValues(updated);
  };

  const addNewLink = (): void => {
    setValues([...values, ""]);
  };

  return (
    <div className={className}>
      {values.map((url, i) => (
        <div key={`${formName}-link-${i}`}>
          <Input
            size="small"
            placeholder="URL"
            prefix={
              <>
                <LinkIcon className="h-3" />
                &nbsp;
              </>
            }
            value={url}
            onChange={(event) => onChange(event, i)}
          />
          {isUrlValid(url) ? (
            <div className="mb-1" />
          ) : (
            <div style={{ color: colorErrorText }}>Invalid URL</div>
          )}
        </div>
      ))}
      <Button size="small" onClick={addNewLink} className="mb-2">
        Add new URL
      </Button>
    </div>
  );
};

export default LinksEdit;
