import { Dispatch, SetStateAction, useState } from "react";
import {
  CheckIcon,
  PencilSquareIcon,
  TrashIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import { Badge, Button, Modal, theme, Tooltip } from "antd";

import { Entity } from "@/app/lib/definitions";
import { equalDeep, mergeDeep } from "@/app/ui/shared";

const hoverButtonStyle = { height: "26px", margin: "4px", padding: "4px" };

interface MultiLineViewProps<T extends Entity = Entity> {
  entities: T[];
  edit?: React.ComponentType<{
    entity: T;
    setValues: Dispatch<SetStateAction<any>>;
    setValid: Dispatch<SetStateAction<boolean>>;
  }>;
  view: React.ComponentType<{ entity: T }>;
  onSave?: (entity: T) => Promise<void>;
}

const MultiLineView = <T extends Entity>({
  entities,
  edit: EditComponent,
  view: ViewComponent,
  onSave,
}: MultiLineViewProps<T>) => {
  const [values, setValues] = useState({});
  const [edit, setEdit] = useState<string | null>(null);
  const [isValid, setIsValid] = useState<boolean>(true);
  const [hovered, setHovered] = useState<string | null>(null);
  const {
    token: { colorBgContainer, colorBgTextHover, borderRadiusLG },
  } = theme.useToken();

  const getEntitiesToSave = (id: string) => {
    const filteredEntities = entities.filter((ent) => id === ent._id);
    const oldEntity = filteredEntities[0] || {};
    const newEntity = mergeDeep({}, oldEntity, values);
    return [oldEntity, newEntity];
  };

  const onClickEdit = (id: string) => {
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

  const onClickSave = () => {
    const id = edit;
    if (id) {
      const [oldEntity, newEntity] = getEntitiesToSave(id);

      if (equalDeep(oldEntity, newEntity, false)) {
        setEdit(null);
      } else if (onSave) {
        onSave(newEntity).then(() => setEdit(null));
      } else {
        setEdit(null);
        throw new Error("Unable to save item: the save function is undefined!");
      }
    } else {
      setEdit(null);
      throw new Error("Unable to save item: the ID is lost!");
    }
  };

  const onClickCancel = () => {
    const id = edit;
    if (id) {
      if (isValid) {
        const [oldEntity, newEntity] = getEntitiesToSave(id);

        if (equalDeep(oldEntity, newEntity, false)) {
          setEdit(null);
        } else {
          Modal.confirm({
            content: (
              <>
                The item was changed!
                <br />
                Would you like to ignore changes?
              </>
            ),
            okText: "Ignore",
            onOk: () => setEdit(null),
            title: "Ignore changes",
          });
        }
      } else {
        setEdit(null);
      }
    } else {
      /* eslint-disable no-console */
      console.warn("The current item ID is lost!");
      /* eslint-enable no-console */
      setEdit(null);
    }
  };

  return (
    <>
      {entities?.map((entity) => (
        <div
          key={`multi-line-key-${entity._id}`}
          onMouseEnter={() => setHovered(entity._id)}
          onMouseLeave={() => setHovered(null)}
          style={{
            backgroundColor:
              hovered === entity._id && edit !== entity._id
                ? colorBgTextHover
                : colorBgContainer,
            borderRadius: borderRadiusLG,
          }}
        >
          {(edit !== entity._id || !EditComponent) && (
            <>
              {hovered === entity._id && (
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
              {hovered !== entity._id && (
                <ViewComponent key={entity._id} entity={entity} />
              )}
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
                      onClick={onClickSave}
                      disabled={!isValid}
                    >
                      <CheckIcon className="w-4 text-black hover:text-blue-900" />
                    </Button>
                  </Tooltip>
                  <Tooltip title="Cancel" color="darkRed" mouseEnterDelay={1}>
                    <Button style={hoverButtonStyle} onClick={onClickCancel}>
                      <XMarkIcon className="w-4 text-black hover:text-red-900" />
                    </Button>
                  </Tooltip>
                </>
              }
              color="lightGrey"
            >
              <EditComponent
                key={entity._id}
                entity={entity}
                setValues={setValues}
                setValid={setIsValid}
              />
            </Badge.Ribbon>
          )}
        </div>
      ))}
    </>
  );
};

export default MultiLineView;
