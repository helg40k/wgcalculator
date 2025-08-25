import { Dispatch, SetStateAction, useMemo, useState } from "react";
import {
  CheckIcon,
  PencilSquareIcon,
  TrashIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import { Badge, Button, message, Modal, theme, Tooltip } from "antd";
import clsx from "clsx";

import { Playable } from "@/app/lib/definitions";
import { NEW_ENTITY_TEMP_ID } from "@/app/lib/services/firebase/helpers/getDocumentCreationBase";
import {
  equalDeep,
  getNewEntity,
  mergeDeep,
  ToolbarPosition,
} from "@/app/ui/shared";

const hoverButtonStyle = { height: "26px", margin: "4px", padding: "4px" };

interface MultiLineViewProps<T extends Playable = Playable> {
  singleName: string;
  pluralNames: string;
  toolbarPosition?: ToolbarPosition;
  singleToolbarUntil?: number;
  entities: T[];
  setEntities: Dispatch<SetStateAction<T[]>>;
  edit?: React.ComponentType<{
    entity: T;
    setValues: Dispatch<SetStateAction<Partial<T>>>;
    setValid: Dispatch<SetStateAction<boolean>>;
    setIsNew: Dispatch<SetStateAction<boolean>>;
  }>;
  view: React.ComponentType<{ entity: T }>;
  onSave?: (entity: T) => Promise<T | null>;
  onDelete?: (id: string) => Promise<void>;
}

const MultiLineView = <T extends Playable>({
  singleName = "item",
  pluralNames = "items",
  toolbarPosition = ToolbarPosition.UP,
  singleToolbarUntil = 20,
  entities,
  setEntities,
  edit: EditComponent,
  view: ViewComponent,
  onSave,
  onDelete,
}: MultiLineViewProps<T>) => {
  const [values, setValues] = useState<Partial<T>>({});
  const [edit, setEdit] = useState<string | null>(null);
  const [isValid, setIsValid] = useState<boolean>(true);
  const [isNew, setIsNew] = useState<boolean>(false);
  const [hovered, setHovered] = useState<string | null>(null);
  const {
    token: {
      colorTextSecondary,
      colorBgContainer,
      colorBgTextHover,
      borderRadiusLG,
    },
  } = theme.useToken();

  const itemsCountTotal = useMemo(() => {
    return entities && 1 === entities.length
      ? `1 ${singleName}`
      : `${entities.length} ${pluralNames}`;
  }, [entities]);

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
          oldEntity.systemId !== newEntity.systemId
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

  const onClickAdd = (position: ToolbarPosition) => {
    const newEntity = getNewEntity<T>();
    if (ToolbarPosition.UP === position) {
      setEntities((prev) => [newEntity, ...prev]);
    } else {
      setEntities((prev) => [...prev, newEntity]);
    }
    setIsNew(true);
    onClickEdit(newEntity._id);
  };

  const toolbar = (position: ToolbarPosition) => {
    return (
      <div
        className={clsx(
          { "mb-3": position === ToolbarPosition.UP },
          { "mt-3": position === ToolbarPosition.DOWN },
        )}
      >
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Button disabled={!!edit} onClick={() => onClickAdd(position)}>
              Add new
            </Button>
            <span style={{ color: colorTextSecondary }}>
              {itemsCountTotal} found
            </span>
          </div>
          <span className="hidden">right block here!</span>
        </div>
      </div>
    );
  };

  return (
    <>
      {(toolbarPosition === ToolbarPosition.UP ||
        singleToolbarUntil <= entities.length) &&
        toolbar(ToolbarPosition.UP)}
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
      {(toolbarPosition === ToolbarPosition.DOWN ||
        singleToolbarUntil <= entities.length) &&
        toolbar(ToolbarPosition.DOWN)}
    </>
  );
};

export default MultiLineView;
