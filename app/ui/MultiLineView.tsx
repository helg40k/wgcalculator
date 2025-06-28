import { useState } from "react";
import {
  CheckIcon,
  PencilSquareIcon,
  TrashIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import { Badge, Button, Modal, theme, Tooltip } from "antd";

import { Entity } from "@/app/lib/definitions";

const hoverButtonStyle = { height: "26px", margin: "4px", padding: "4px" };

interface MultiLineViewProps<T extends Entity = Entity> {
  entities: T[];
  edit?: React.ComponentType<{ entity: T }>;
  view: React.ComponentType<{ entity: T }>;
}

const MultiLineView = <T extends Entity>({
  entities,
  edit: EditComponent,
  view: ViewComponent,
}: MultiLineViewProps<T>) => {
  const [edit, setEdit] = useState<string | null>(null);
  const [hovered, setHovered] = useState(false);
  const {
    token: { colorBgContainer, colorBgTextHover, borderRadiusLG },
  } = theme.useToken();

  const onClickEdit = (id: string) => {
    console.log("edit", id);
    setEdit(id);
  };

  const onClickDelete = (id: string, name: string) => {
    Modal.confirm({
      content: (
        <>
          The item <b>&#39;{name}&#39;</b> will be deleted.
          <br />
          Are you sure?
        </>
      ),
      okText: "Delete",
      title: "Delete item",
    });
  };

  const onClickSave = (id: string) => {
    console.log("save", id);
    setEdit(null);
  };

  const onClickCancel = (id: string) => {
    console.log("cancel", id);
    setEdit(null);
  };

  return (
    <>
      {entities?.map((entity) => (
        <div
          key={`multi-line-key-${entity._id}`}
          onMouseEnter={() => setHovered(true)}
          onMouseLeave={() => setHovered(false)}
          style={{
            backgroundColor:
              hovered && edit !== entity._id
                ? colorBgTextHover
                : colorBgContainer,
            borderRadius: borderRadiusLG,
          }}
        >
          {(edit !== entity._id || !EditComponent) && (
            <>
              {hovered && (
                <Badge.Ribbon
                  className="border-1 border-gray-300"
                  text={
                    <>
                      <Tooltip
                        title="Edit item"
                        color="darkBlue"
                        mouseEnterDelay={1}
                      >
                        <Button
                          style={hoverButtonStyle}
                          onClick={() => onClickEdit(entity._id)}
                        >
                          <PencilSquareIcon className="w-4 text-black hover:text-blue-900" />
                        </Button>
                      </Tooltip>
                      <Tooltip
                        title="Delete item"
                        color="darkRed"
                        mouseEnterDelay={1}
                      >
                        <Button
                          style={hoverButtonStyle}
                          onClick={() => onClickDelete(entity._id, entity.name)}
                        >
                          <TrashIcon className="w-4 text-black hover:text-red-900" />
                        </Button>
                      </Tooltip>
                    </>
                  }
                  color="white"
                >
                  <ViewComponent key={entity._id} entity={entity} />
                </Badge.Ribbon>
              )}
              {!hovered && <ViewComponent key={entity._id} entity={entity} />}
            </>
          )}
          {edit === entity._id && EditComponent && (
            <Badge.Ribbon
              className="border-1 border-gray-400"
              text={
                <>
                  <Tooltip title="Save" color="darkBlue" mouseEnterDelay={1}>
                    <Button
                      style={hoverButtonStyle}
                      onClick={() => onClickSave(entity._id)}
                    >
                      <CheckIcon className="w-4 text-black hover:text-blue-900" />
                    </Button>
                  </Tooltip>
                  <Tooltip title="Cancel" color="darkRed" mouseEnterDelay={1}>
                    <Button
                      style={hoverButtonStyle}
                      onClick={() => onClickCancel(entity._id)}
                    >
                      <XMarkIcon className="w-4 text-black hover:text-red-900" />
                    </Button>
                  </Tooltip>
                </>
              }
              color="lightGrey"
            >
              <EditComponent key={entity._id} entity={entity} />
            </Badge.Ribbon>
          )}
        </div>
      ))}
    </>
  );
};

export default MultiLineView;
