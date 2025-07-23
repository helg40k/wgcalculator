import { Dispatch, SetStateAction, useState } from "react";
import {
  CheckIcon,
  PencilSquareIcon,
  TrashIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import { Badge, Button, message, Modal, theme, Tooltip } from "antd";

import { Entity } from "@/app/lib/definitions";
import { NEW_ENTITY_TEMP_ID } from "@/app/lib/services/firebase/helpers/getDocumentCreationBase";
import { equalDeep, getNewEntity, mergeDeep } from "@/app/ui/shared";

const hoverButtonStyle = { height: "26px", margin: "4px", padding: "4px" };

const enum AddPosition {
  UP,
  DOWN,
}

interface MultiLineViewProps<T extends Entity = Entity> {
  singleName: string;
  pluralNames: string;
  entities: T[];
  setEntities: Dispatch<SetStateAction<T[]>>;
  edit?: React.ComponentType<{
    entity: T;
    setValues: Dispatch<SetStateAction<any>>;
    setValid: Dispatch<SetStateAction<boolean>>;
    setIsNew: Dispatch<SetStateAction<boolean>>;
  }>;
  view: React.ComponentType<{ entity: T }>;
  onSave?: (entity: T) => Promise<T | null>;
  onDelete?: (id: string) => Promise<void>;
}

const MultiLineView = <T extends Entity>({
  singleName = "item",
  pluralNames = "items",
  entities,
  setEntities,
  edit: EditComponent,
  view: ViewComponent,
  onSave,
  onDelete,
}: MultiLineViewProps<T>) => {
  const [values, setValues] = useState({});
  const [edit, setEdit] = useState<string | null>(null);
  const [isValid, setIsValid] = useState<boolean>(true);
  const [isNew, setIsNew] = useState<boolean>(false);
  const [hovered, setHovered] = useState<string | null>(null);
  const {
    token: { colorBgContainer, colorBgTextHover, borderRadiusLG },
  } = theme.useToken();

  const getEntitiesToSave = (id: string) => {
    const filteredEntities = entities.filter((ent) => id === ent._id);
    const oldEntity = filteredEntities[0] || {};
    const newEntity = mergeDeep({}, oldEntity, values) as T;
    return [oldEntity, newEntity];
  };

  const deleteItem = (id: string, negativeCallback: () => void) => {
    if (onDelete) {
      onDelete(id).then(() => {
        message.success(`The ${singleName} has been deleted`);
        setEntities((prev) => [...prev.filter((item) => item._id !== id)]);
      });
    } else {
      negativeCallback();
    }
  };

  const saveItem = (entityToSave: T) => {
    const id = entityToSave._id;
    if (onSave) {
      onSave(entityToSave).then((saved) => {
        if (saved) {
          message.success(`The ${singleName} has been saved`);
          const isNewItem = NEW_ENTITY_TEMP_ID === id || !id;
          const index = entities.findIndex((item) =>
            isNewItem
              ? NEW_ENTITY_TEMP_ID === item._id || !item._id
              : item._id === saved._id,
          );
          if (index >= 0) {
            const updated = [...entities];
            updated[index] = saved;
            setEntities(updated);
          } else {
            setEntities((prev) => [...prev, saved]);
          }
        } else {
          message.error(`The ${singleName} has not been saved!`);
        }

        setEdit(null);
      });
    } else {
      throw new Error(
        `Unable to save ${singleName}: the save function is undefined!`,
      );
    }
  };

  const cleanNewItem = (id: string) => {
    if (NEW_ENTITY_TEMP_ID === id || !id) {
      setEntities((prev) => [
        ...prev.filter((item) => !!item._id && item._id !== NEW_ENTITY_TEMP_ID),
      ]);
    }
  };

  const onClickEdit = (id: string) => {
    setEdit(id);
  };

  const onClickDelete = (id: string, name: string) => {
    if (id) {
      if (NEW_ENTITY_TEMP_ID !== id) {
        Modal.confirm({
          content: (
            <>
              The item <b>&#39;{name}&#39;</b> will be deleted.
              <br />
              Are you sure?
            </>
          ),
          okText: "Delete",
          onOk: () => {
            deleteItem(id, () => {
              throw new Error(
                `Unable to save ${singleName}: the save function is undefined!`,
              );
            });
          },
          title: `Delete ${singleName}`,
        });
      } else {
        cleanNewItem(id);
      }
    } else {
      throw new Error(`Unable to delete ${singleName}: the ID is lost!`);
    }
  };

  const onClickSave = () => {
    const id = edit;
    if (id) {
      const [oldEntity, newEntity] = getEntitiesToSave(id);

      if (NEW_ENTITY_TEMP_ID !== id && equalDeep(oldEntity, newEntity, false)) {
        setEdit(null);
      } else {
        saveItem(newEntity);
      }
    } else {
      setEdit(null);
      throw new Error(`Unable to save ${singleName}: the ID is lost!`);
    }
  };

  const onClickCancel = () => {
    const id = edit;
    if (id) {
      if (isValid && !isNew) {
        const [oldEntity, newEntity] = getEntitiesToSave(id);

        if (equalDeep(oldEntity, newEntity, false)) {
          setEdit(null);
        } else if (
          NEW_ENTITY_TEMP_ID !== id &&
          (oldEntity as any)["systemId"] !== (newEntity as any)["systemId"]
        ) {
          Modal.confirm({
            cancelText: "Ignore",
            content: (
              <>
                Invalid data in &#34;systemId&#34; was found!
                <br />
                Would you like to save corrected data?
              </>
            ),
            okText: "Save",
            onCancel: () => setEdit(null),
            onOk: () => saveItem(newEntity),
            title: "Invalid data found",
          });
        } else {
          Modal.confirm({
            content: (
              <>
                The {singleName} was changed!
                <br />
                Would you like to ignore changes?
              </>
            ),
            okText: "Ignore",
            onOk: () => {
              cleanNewItem(id);
              setEdit(null);
            },
            title: "Ignore changes",
          });
        }
      } else {
        cleanNewItem(id);
        setEdit(null);
      }
    } else {
      setEntities((prev) => [...prev.filter((item) => !!item._id)]);
      /* eslint-disable no-console */
      console.warn(`The current ${singleName} ID is lost!`);
      /* eslint-enable no-console */
      setEdit(null);
    }
  };

  const onClickAdd = (position: AddPosition) => {
    const newEntity = getNewEntity<T>();
    if (AddPosition.UP === position) {
      setEntities((prev) => [newEntity, ...prev]);
    } else {
      setEntities((prev) => [...prev, newEntity]);
    }
    setIsNew(true);
    onClickEdit(newEntity._id);
  };

  return (
    <>
      <div className="mb-3">
        <Button disabled={!!edit} onClick={() => onClickAdd(AddPosition.UP)}>
          Add new
        </Button>
      </div>
      {entities?.map((entity) => (
        <div
          key={`multi-line-key-${entity._id}`}
          onMouseEnter={() => setHovered(entity._id)}
          onMouseLeave={() => setHovered(null)}
          style={{
            backgroundColor:
              hovered === entity._id && !edit
                ? colorBgTextHover
                : colorBgContainer,
            borderRadius: borderRadiusLG,
          }}
        >
          {(!edit || !EditComponent) && (
            <>
              {hovered === entity._id && (
                <Badge.Ribbon
                  className="border-1 border-gray-300"
                  text={
                    <>
                      <Tooltip
                        title={`Edit ${singleName}`}
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
                        title={`Delete ${singleName}`}
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
          {edit && edit !== entity._id && (
            <ViewComponent key={entity._id} entity={entity} />
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
                      disabled={!isValid || isNew}
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
                setIsNew={setIsNew}
              />
            </Badge.Ribbon>
          )}
        </div>
      ))}
      <div className="mt-3">
        <Button disabled={!!edit} onClick={() => onClickAdd(AddPosition.DOWN)}>
          Add new
        </Button>
      </div>
    </>
  );
};

export default MultiLineView;
