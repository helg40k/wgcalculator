import { ChangeEvent, useState } from "react";
import { LinkIcon } from "@heroicons/react/24/outline";
import { Button, Input } from "antd";

interface LinksEditProps {
  formName: string;
  urls: string[] | undefined;
  className?: string | undefined;
}

const LinksEdit = ({ formName, urls, className }: LinksEditProps) => {
  const [values, setValues] = useState<string[]>(urls ?? []);

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
        <Input
          key={`${formName}-link-${i}`}
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
          className="mb-1"
        />
      ))}
      <Button size="small" onClick={addNewLink} className="mb-2">
        Add new URL
      </Button>
    </div>
  );
};

export default LinksEdit;
