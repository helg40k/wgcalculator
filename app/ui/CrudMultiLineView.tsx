import {
  Dispatch,
  memo,
  SetStateAction,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  CheckIcon,
  PencilSquareIcon,
  TrashIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import {
  Badge,
  Button,
  Form,
  message,
  Modal,
  Table,
  theme,
  Tooltip,
} from "antd";
import type { Rule } from "antd/es/form";
import type { ColumnsType } from "antd/es/table";
import clsx from "clsx";

import { GameSystemContext } from "@/app/lib/contexts/GameSystemContext";
import { EntityStatus, Playable } from "@/app/lib/definitions";
import { NEW_ENTITY_TEMP_ID } from "@/app/lib/services/firebase/helpers/getDocumentCreationBase";
import errorMessage from "@/app/ui/errorMessage";
import {
  equalDeep,
  getNewEntity,
  mergeDeep,
  ToolbarPosition,
} from "@/app/ui/shared";
import EntityStatusUI from "@/app/ui/shared/EntityStatusUI";
import FilterItems from "@/app/ui/shared/FilterItems";
import SortItems, {
  SortableField,
  SortSelection,
} from "@/app/ui/shared/SortItems";

import "./CrudMultiLineView.css";

const hoverButtonStyle = {
  height: "26px",
  margin: "4px",
  padding: "4px",
  width: "26px",
};

// Reusable ActionButtons component for Edit/Delete actions
interface ActionButtonsProps {
  entityId: string;
  entityName: string;
  singleName: string;
  edit: boolean; // whether edit functionality is available
  isEditing: boolean; // whether any row is currently being edited
  onClickEdit: (id: string) => void;
  onClickDelete: (id: string, name: string) => void;
}

const ActionButtons = ({
  entityId,
  entityName,
  singleName,
  edit,
  isEditing,
  onClickEdit,
  onClickDelete,
}: ActionButtonsProps) => {
  const {
    token: { colorTextDisabled },
  } = theme.useToken();

  const disabled = !edit || isEditing;
  const style = disabled ? { color: colorTextDisabled } : undefined;
  return (
    <div>
      <Tooltip
        title={`Edit ${singleName}`}
        color="darkBlue"
        mouseEnterDelay={1}
      >
        <Button
          style={hoverButtonStyle}
          disabled={disabled}
          onClick={() => onClickEdit(entityId)}
          icon={
            <span className="text-black hover:text-blue-900 transition-colors">
              <PencilSquareIcon className="w-4" style={style} />
            </span>
          }
        />
      </Tooltip>
      <Tooltip
        title={`Delete ${singleName}`}
        color="darkRed"
        mouseEnterDelay={1}
      >
        <Button
          style={hoverButtonStyle}
          disabled={disabled}
          onClick={() => onClickDelete(entityId, entityName)}
          icon={
            <span className="text-black hover:text-red-900 transition-colors">
              <TrashIcon className="w-4" style={style} />
            </span>
          }
        />
      </Tooltip>
    </div>
  );
};

// Reusable EditModeButtons component for editing actions
interface EditModeButtonsProps {
  onClickSave: () => void;
  onClickCancel: () => void;
  isValid: boolean;
  isNew: boolean;
  allowSaveNew?: boolean; // Allow saving new items (for Table), default false (for List)
}

const EditModeButtons = ({
  onClickSave,
  onClickCancel,
  isValid,
  isNew,
  allowSaveNew = false,
}: EditModeButtonsProps) => {
  const {
    token: { colorTextDisabled },
  } = theme.useToken();

  const disabled = !isValid || (isNew && !allowSaveNew);
  const style = disabled ? { color: colorTextDisabled } : undefined;
  return (
    <div>
      <Tooltip title="Save" color="darkBlue" mouseEnterDelay={1}>
        <Button
          style={hoverButtonStyle}
          onClick={onClickSave}
          disabled={disabled}
          icon={
            <span className="text-black hover:text-blue-900 transition-colors">
              <CheckIcon className="w-4" style={style} />
            </span>
          }
        />
      </Tooltip>
      <Tooltip title="Cancel" color="darkRed" mouseEnterDelay={1}>
        <Button
          style={hoverButtonStyle}
          onClick={onClickCancel}
          icon={
            <span className="text-black hover:text-red-900 transition-colors">
              <XMarkIcon className="w-4" />
            </span>
          }
        />
      </Tooltip>
    </div>
  );
};

// Base props shared by both List and Table
interface BaseMultiLineViewProps<T extends Playable = Playable> {
  singleName: string;
  pluralNames: string;
  toolbarPosition?: ToolbarPosition;
  singleToolbarUntil?: number;
  entities: T[];
  setEntities: Dispatch<SetStateAction<T[]>>;
  onSave?: (entity: T) => Promise<T | null>;
  onDelete?: (id: string) => Promise<void>;
  filterableFields?: (keyof T)[];
}

// Props specific to List variant
interface ListProps<T extends Playable = Playable>
  extends BaseMultiLineViewProps<T> {
  edit?: React.ComponentType<{
    entity: T;
    setValues: Dispatch<SetStateAction<Partial<T>>>;
    setValid: Dispatch<SetStateAction<boolean>>;
    setIsNew: Dispatch<SetStateAction<boolean>>;
  }>;
  view: React.ComponentType<{ entity: T }>;
  sortableFields?: SortableField<T>[];
}

// Table column configuration
interface TableColumnConfig<T extends Playable = Playable> {
  field: keyof T | string;
  header: string;
  sortable?: boolean;
  validationRules?: Rule[];
  // View component is mandatory - receives field and value to display
  view: React.ComponentType<{
    entity: T;
    field: keyof T | string;
    value: any;
  }>;
  // Edit component is optional - if not provided, view component is used
  edit?: React.ComponentType<{
    entity: T;
    field: keyof T | string;
    value: any;
    validationRules?: Rule[];
    setValues: Dispatch<SetStateAction<Partial<T>>>;
    setValid: Dispatch<SetStateAction<boolean>>;
    setIsNew: Dispatch<SetStateAction<boolean>>;
  }>;
}

// Props specific to Table variant
interface TableProps<T extends Playable = Playable>
  extends BaseMultiLineViewProps<T> {
  sortableStatus?: boolean;
  table: TableColumnConfig<T>[];
  rowFooter?: (record: T) => React.ReactNode;
}

// Shared logic hook
const useMultiLineViewLogic = <T extends Playable>({
  singleName = "item",
  pluralNames = "items",
  entities,
  setEntities,
  onSave,
  onDelete,
  filterableFields = [],
  sortableFields = [],
}: BaseMultiLineViewProps<T> & {
  sortableFields?: SortableField<T>[];
}) => {
  const [values, setValues] = useState<Partial<T>>({});
  const [edit, setEdit] = useState<string | null>(null);
  const [isValid, setIsValid] = useState<boolean>(true);
  const [isNew, setIsNew] = useState<boolean>(false);
  const [hovered, setHovered] = useState<string | null>(null);
  const [filterText, setFilterText] = useState<string>("");
  const [sortSelection, setSortSelection] = useState<SortSelection<T>[]>([]);
  const [editingStatus, setEditingStatus] = useState<EntityStatus | null>(null);
  const {
    token: {
      colorTextSecondary,
      colorBgContainer,
      colorBgTextHover,
      borderRadiusLG,
    },
  } = theme.useToken();

  // Filter and sort entities
  const filteredAndSortedEntities = useMemo(() => {
    let result = [...entities];

    // Apply filtering
    if (filterText && filterableFields.length > 0) {
      const searchText = filterText.toLowerCase();
      result = result.filter((entity) =>
        filterableFields.some((field) => {
          const value = entity[field];
          return value && String(value).toLowerCase().includes(searchText);
        }),
      );
    }

    // Apply sorting
    if (sortSelection.length > 0) {
      result.sort((a, b) => {
        for (const sort of sortSelection) {
          const aValue = a[sort.field];
          const bValue = b[sort.field];

          let comparison = 0;

          // Handle boolean values specially
          if (typeof aValue === "boolean" && typeof bValue === "boolean") {
            if (aValue === bValue) comparison = 0;
            else if (aValue && !bValue)
              comparison = 1; // true > false
            else comparison = -1; // false < true
          } else if (
            typeof aValue === "boolean" ||
            typeof bValue === "boolean"
          ) {
            // Handle mixed boolean/undefined values
            const aBool = aValue === true;
            const bBool = bValue === true;
            if (aBool === bBool) comparison = 0;
            else if (aBool && !bBool)
              comparison = 1; // true > false
            else comparison = -1; // false < true
          } else if (typeof aValue === "number" || typeof bValue === "number") {
            // Handle number values (including string numbers)
            const aNum = Number(aValue);
            const bNum = Number(bValue);
            if (isNaN(aNum) && isNaN(bNum)) comparison = 0;
            else if (isNaN(aNum))
              comparison = 1; // NaN goes to end
            else if (isNaN(bNum))
              comparison = -1; // NaN goes to end
            else if (aNum < bNum) comparison = -1;
            else if (aNum > bNum) comparison = 1;
          } else {
            // Handle other types (strings, etc.)
            if (aValue < bValue) comparison = -1;
            else if (aValue > bValue) comparison = 1;
          }

          if (comparison !== 0) {
            return sort.direction === "desc" ? -comparison : comparison;
          }
        }
        return 0;
      });
    }

    return result;
  }, [entities, filterText, filterableFields, sortSelection]);

  const itemsCountTotal = useMemo(() => {
    const total = filteredAndSortedEntities.length;
    const originalTotal = entities.length;

    if (total === originalTotal) {
      return total === 1 ? `1 ${singleName}` : `${total} ${pluralNames}`;
    } else {
      return `${total} of ${originalTotal} ${pluralNames}`;
    }
  }, [filteredAndSortedEntities, entities, singleName, pluralNames]);

  const getEntitiesToSave = (id: string) => {
    const filteredEntities = entities.filter((ent) => id === ent._id);
    const oldEntity = filteredEntities[0] || {};

    // Trim string values in form data before merging
    const trimmedValues: Partial<T> = {};
    Object.keys(values).forEach((key) => {
      const value = values[key as keyof T];
      if (typeof value === "string") {
        (trimmedValues as any)[key] = value.trim();
      } else {
        (trimmedValues as any)[key] = value;
      }
    });

    let newEntity = mergeDeep({}, oldEntity, trimmedValues) as T;

    // Include editing status if it was changed during editing
    if (edit === id && editingStatus !== null) {
      newEntity = { ...newEntity, status: editingStatus } as T;
    }

    return [oldEntity, newEntity];
  };

  // Get current status for display (either editing status or entity status)
  const getCurrentStatus = (entity: T): EntityStatus => {
    if (edit === entity._id && editingStatus !== null) {
      return editingStatus;
    }
    return entity.status;
  };

  const resetEditingState = () => {
    setEdit(null);
    setEditingStatus(null);
    setValues({});
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
      onSave(entityToSave)
        .then((saved) => {
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

          resetEditingState();
        })
        .catch((reason) => {
          errorMessage(reason?.message);
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
        resetEditingState();
      } else {
        saveItem(newEntity);
      }
    } else {
      resetEditingState();
      throw new Error(`Unable to save ${singleName}: the ID is lost!`);
    }
  };

  const onChangeStatus = async (id: string, newStatus: EntityStatus) => {
    if (!id || !newStatus) {
      return;
    }

    // Find the entity
    const entity = entities.find((ent) => ent._id === id);
    if (!entity) {
      return;
    }

    // If entity is currently being edited, just update local editing status
    if (edit === id) {
      if (entity.status !== newStatus) {
        setEditingStatus(newStatus);
        message.info(`Status will be saved when you save the ${singleName}`);
      }
      return;
    }

    // If not being edited, save status immediately
    if (!onSave || entity.status === newStatus) {
      return;
    }

    const updatedEntity = { ...entity, status: newStatus };

    try {
      const saved = await onSave(updatedEntity);
      if (saved) {
        message.success(`${singleName} status updated to "${newStatus}"`);
        const index = entities.findIndex((item) => item._id === saved._id);
        if (index >= 0) {
          const updated = [...entities];
          updated[index] = saved;
          setEntities(updated);
        }
      } else {
        message.error(`Failed to update ${singleName} status!`);
      }
    } catch (error: any) {
      errorMessage(error?.message);
    }
  };

  const onClickCancel = () => {
    const id = edit;
    if (id) {
      if (isValid && !isNew) {
        const [oldEntity, newEntity] = getEntitiesToSave(id);

        if (equalDeep(oldEntity, newEntity, false)) {
          resetEditingState();
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
              resetEditingState();
            },
            title: "Ignore changes",
          });
        }
      } else {
        cleanNewItem(id);
        resetEditingState();
      }
    } else {
      setEntities((prev) => [...prev.filter((item) => !!item._id)]);
      /* eslint-disable no-console */
      console.warn(`The current ${singleName} ID is lost!`);
      /* eslint-enable no-console */
      resetEditingState();
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

  const createToolbar = (
    position: ToolbarPosition,
    hasEditComponent: boolean = false,
  ) => {
    const disabled = !!edit || !hasEditComponent;
    return (
      <div
        className={clsx(
          { "mb-3": position === ToolbarPosition.UP },
          { "mt-3": position === ToolbarPosition.DOWN },
        )}
      >
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Button disabled={disabled} onClick={() => onClickAdd(position)}>
              Add new
            </Button>
            <span style={{ color: colorTextSecondary }}>
              {itemsCountTotal} found
            </span>
          </div>
          <div className="flex items-center gap-2">
            <SortItems
              disabled={disabled}
              sortableFields={sortableFields || []}
              sortSelection={sortSelection}
              setSortSelection={setSortSelection}
            />
            <FilterItems
              disabled={disabled}
              filterableFields={filterableFields}
              filterText={filterText}
              setFilterText={setFilterText}
              placeholder={`Filter ${pluralNames}...`}
            />
          </div>
        </div>
      </div>
    );
  };

  // Toolbar specifically for table view (without SortItems)
  const createTableToolbar = (
    position: ToolbarPosition,
    hasEditComponent: boolean = false,
  ) => {
    const disabled = !!edit || !hasEditComponent;
    return (
      <div
        className={clsx(
          { "mb-3": position === ToolbarPosition.UP },
          { "mt-3": position === ToolbarPosition.DOWN },
        )}
      >
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Button disabled={disabled} onClick={() => onClickAdd(position)}>
              Add new
            </Button>
            <span style={{ color: colorTextSecondary }}>
              {itemsCountTotal} found
            </span>
          </div>
          <div className="flex items-center gap-2">
            {/* Only FilterItems for table - sorting handled by table itself */}
            <FilterItems
              disabled={disabled}
              filterableFields={filterableFields}
              filterText={filterText}
              setFilterText={setFilterText}
              placeholder={`Filter ${pluralNames}...`}
            />
          </div>
        </div>
      </div>
    );
  };

  return {
    // Theme
    borderRadiusLG,
    // Methods
    cleanNewItem,
    colorBgContainer,
    colorBgTextHover,
    colorTextSecondary,
    createTableToolbar,
    createToolbar,
    deleteItem,
    // State
    edit,
    editingStatus,
    filterText,
    // Computed values
    filteredAndSortedEntities,
    getCurrentStatus,
    getEntitiesToSave,
    hovered,
    isNew,
    isValid,
    itemsCountTotal,
    onChangeStatus,
    onClickAdd,
    onClickCancel,
    onClickDelete,
    onClickEdit,
    onClickSave,
    resetEditingState,
    saveItem,
    setEdit,
    setEditingStatus,
    setFilterText,
    setHovered,
    setIsNew,
    setIsValid,
    setSortSelection,
    setValues,
    sortSelection,
    values,
  };
};

// Memoized wrapper for entity rendering to prevent unnecessary rerenders
const EntityRenderer = memo(
  function EntityRenderer({
    entity,
    edit,
    EditComponent,
    ViewComponent,
    getCurrentStatus,
    onChangeStatus,
    onClickCancel,
    onClickDelete,
    onClickEdit,
    onClickSave,
    isNew,
    isValid,
    setIsNew,
    setIsValid,
    setValues,
    singleName,
  }: {
    entity: any;
    edit: string | null;
    EditComponent?: React.ComponentType<any>;
    ViewComponent: React.ComponentType<any>;
    getCurrentStatus: (entity: any) => EntityStatus;
    onChangeStatus: (id: string, newStatus: EntityStatus) => Promise<void>;
    onClickCancel: () => void;
    onClickDelete: (id: string, name: string) => void;
    onClickEdit: (id: string) => void;
    onClickSave: () => void;
    isNew: boolean;
    isValid: boolean;
    setIsNew: Dispatch<SetStateAction<boolean>>;
    setIsValid: Dispatch<SetStateAction<boolean>>;
    setValues: Dispatch<SetStateAction<any>>;
    singleName: string;
  }) {
    const viewElement = <ViewComponent entity={entity} />;

    return (
      <div>
        {(!edit || !EditComponent) && (
          <EntityStatusUI.Badge
            entityId={entity._id}
            status={getCurrentStatus(entity)}
            editable={true}
            show={false}
            onChange={onChangeStatus}
          >
            {viewElement}
          </EntityStatusUI.Badge>
        )}
        {edit && edit !== entity._id && (
          <EntityStatusUI.Badge
            entityId={entity._id}
            status={getCurrentStatus(entity)}
            editable={false}
            show={false}
            onChange={onChangeStatus}
          >
            {viewElement}
          </EntityStatusUI.Badge>
        )}
        {edit === entity._id && EditComponent && (
          <Badge.Ribbon
            className="border-1 border-gray-400"
            text={
              <EditModeButtons
                onClickSave={onClickSave}
                onClickCancel={onClickCancel}
                isValid={isValid}
                isNew={isNew}
              />
            }
            color="lightGrey"
          >
            <EntityStatusUI.Badge
              entityId={entity._id}
              status={getCurrentStatus(entity)}
              editable={NEW_ENTITY_TEMP_ID !== entity._id}
              onChange={onChangeStatus}
            >
              <EditComponent
                entity={entity}
                setValues={setValues}
                setValid={setIsValid}
                setIsNew={setIsNew}
              />
            </EntityStatusUI.Badge>
          </Badge.Ribbon>
        )}
      </div>
    );
  },
  (prevProps, nextProps) => {
    // Only re-render if entity ID or edit state changed
    const entityChanged = prevProps.entity._id !== nextProps.entity._id;
    const editChanged = prevProps.edit !== nextProps.edit;

    return !entityChanged && !editChanged;
  },
);

// Separate hover component that can re-render without affecting EntityRenderer
const HoverBadge = memo(function HoverBadge({
  entity,
  singleName,
  EditComponent,
  edit,
  onClickEdit,
  onClickDelete,
  getCurrentStatus,
  onChangeStatus,
  ViewComponent,
}: {
  entity: any;
  singleName: string;
  EditComponent?: React.ComponentType<any>;
  edit: string | null;
  onClickEdit: (id: string) => void;
  onClickDelete: (id: string, name: string) => void;
  getCurrentStatus: (entity: any) => EntityStatus;
  onChangeStatus: (id: string, newStatus: EntityStatus) => Promise<void>;
  ViewComponent: React.ComponentType<any>;
}) {
  return (
    <Badge.Ribbon
      className="border-1 border-gray-300"
      text={
        <ActionButtons
          entityId={entity._id}
          entityName={entity.name}
          singleName={singleName}
          edit={!!EditComponent}
          isEditing={!!edit}
          onClickEdit={onClickEdit}
          onClickDelete={onClickDelete}
        />
      }
      color="white"
    >
      <EntityStatusUI.Badge
        entityId={entity._id}
        status={getCurrentStatus(entity)}
        editable={true}
        show={true}
        onChange={onChangeStatus}
      >
        <ViewComponent entity={entity} />
      </EntityStatusUI.Badge>
    </Badge.Ribbon>
  );
});

// List Component
const CrudMultiLineViewList = <T extends Playable>({
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
  filterableFields = [],
  sortableFields = [],
}: ListProps<T>) => {
  const {
    borderRadiusLG,
    colorBgContainer,
    colorBgTextHover,
    createToolbar,
    edit,
    filteredAndSortedEntities,
    getCurrentStatus,
    hovered,
    isNew,
    isValid,
    onChangeStatus,
    onClickCancel,
    onClickDelete,
    onClickEdit,
    onClickSave,
    setHovered,
    setIsNew,
    setIsValid,
    setValues,
  } = useMultiLineViewLogic({
    entities,
    filterableFields,
    onDelete,
    onSave,
    pluralNames,
    setEntities,
    singleName,
    sortableFields,
  });

  return (
    <>
      {(toolbarPosition === ToolbarPosition.UP ||
        singleToolbarUntil <= entities.length) &&
        createToolbar(ToolbarPosition.UP, !!EditComponent)}
      {filteredAndSortedEntities?.map((entity) => {
        const isHovered = hovered === entity._id;
        return (
          <div
            key={`multi-line-key-${entity._id}`}
            onMouseEnter={() => !edit && setHovered(entity._id)}
            onMouseLeave={() => setHovered(null)}
            style={{
              backgroundColor:
                isHovered && !edit ? colorBgTextHover : colorBgContainer,
              borderRadius: borderRadiusLG,
              position: "relative",
            }}
          >
            <EntityRenderer
              entity={entity}
              edit={edit}
              EditComponent={EditComponent}
              ViewComponent={ViewComponent}
              getCurrentStatus={getCurrentStatus}
              onChangeStatus={onChangeStatus}
              onClickCancel={onClickCancel}
              onClickDelete={onClickDelete}
              onClickEdit={onClickEdit}
              onClickSave={onClickSave}
              isNew={isNew}
              isValid={isValid}
              setIsNew={setIsNew}
              setIsValid={setIsValid}
              setValues={setValues}
              singleName={singleName}
            />
            {isHovered && !edit && EditComponent && (
              <div
                style={{
                  left: 0,
                  position: "absolute",
                  right: 0,
                  top: 0,
                  zIndex: 10,
                }}
              >
                <HoverBadge
                  entity={entity}
                  singleName={singleName}
                  EditComponent={EditComponent}
                  edit={edit}
                  onClickEdit={onClickEdit}
                  onClickDelete={onClickDelete}
                  getCurrentStatus={getCurrentStatus}
                  onChangeStatus={onChangeStatus}
                  ViewComponent={ViewComponent}
                />
              </div>
            )}
          </div>
        );
      })}
      {(toolbarPosition === ToolbarPosition.DOWN ||
        singleToolbarUntil <= entities.length) &&
        createToolbar(ToolbarPosition.DOWN, !!EditComponent)}
    </>
  );
};

// Table Component
const CrudMultiLineViewTable = <T extends Playable>({
  singleName = "item",
  pluralNames = "items",
  toolbarPosition = ToolbarPosition.UP,
  singleToolbarUntil = 20,
  entities,
  setEntities,
  sortableStatus = true,
  table,
  onSave,
  onDelete,
  filterableFields = [],
  rowFooter,
}: TableProps<T>) => {
  const {
    borderRadiusLG,
    cleanNewItem,
    colorBgContainer,
    createTableToolbar,
    edit,
    editingStatus,
    filteredAndSortedEntities,
    getCurrentStatus,
    getEntitiesToSave,
    hovered,
    isNew,
    isValid,
    onChangeStatus,
    onClickCancel,
    onClickDelete,
    onClickEdit,
    onClickSave,
    resetEditingState,
    setHovered,
    setIsNew,
    setIsValid,
    setSortSelection,
    setValues,
    values,
  } = useMultiLineViewLogic({
    entities,
    filterableFields,
    onDelete,
    onSave,
    pluralNames,
    setEntities,
    singleName,
    sortableFields: table
      .filter((col) => col.sortable)
      .map((col) => ({ key: col.field as keyof T, label: col.header })),
  });

  // Game system context for setting systemId
  const [gameSystem] = useContext(GameSystemContext);

  // Form instance for table editing
  const [form] = Form.useForm();

  // Function to validate only required fields
  const validateRequiredFields = useCallback(() => {
    const fieldsWithRules = table
      .filter((col) => col.validationRules && col.validationRules.length > 0)
      .map((col) => col.field as string);

    if (fieldsWithRules.length > 0) {
      return form
        .validateFields(fieldsWithRules)
        .then(() => {
          setIsValid(true);
          return true;
        })
        .catch((errorInfo) => {
          // Check if there are actual errors or just outOfDate status
          const hasActualErrors =
            errorInfo.errorFields && errorInfo.errorFields.length > 0;
          setIsValid(!hasActualErrors);
          return !hasActualErrors;
        });
    } else {
      setIsValid(true);
      return Promise.resolve(true);
    }
  }, [table, form, setIsValid]);

  // Custom cancel logic for Table with form validation
  const onClickCancelTable = useCallback(() => {
    const id = edit;
    if (id) {
      // For new items: if form is invalid (has validation errors), cancel without confirmation
      if (isNew && !isValid) {
        cleanNewItem(id);
        resetEditingState();
        return;
      }

      // For all other cases: check if there are actual changes
      const [oldEntity, newEntity] = getEntitiesToSave(id);
      const hasChanges = !equalDeep(oldEntity, newEntity, false);

      if (!hasChanges) {
        // No changes, cancel without confirmation
        resetEditingState();
      } else {
        // Has changes, show confirmation dialog
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
            resetEditingState();
          },
          title: "Ignore changes",
        });
      }
    } else {
      setEntities((prev) => [...prev.filter((item) => !!item._id)]);
      resetEditingState();
    }
  }, [
    edit,
    isNew,
    isValid,
    cleanNewItem,
    resetEditingState,
    getEntitiesToSave,
    singleName,
    setEntities,
  ]);

  // Set form values when editing starts
  useEffect(() => {
    if (edit) {
      const record = entities.find((e) => e._id === edit);
      if (record) {
        form.resetFields();
        // Clear form for new items, set values for existing items
        if (edit === NEW_ENTITY_TEMP_ID) {
          // For new items, set systemId from gameSystem context if available
          // This mimics the behavior in SourceEdit.tsx
          if (gameSystem?._id) {
            form.setFieldsValue({ systemId: gameSystem._id });
          }
          // Validate after a short delay to ensure form is ready
          setTimeout(() => validateRequiredFields(), 0);
        } else {
          form.setFieldsValue(record);
          // Validate after setting values
          setTimeout(() => validateRequiredFields(), 0);
        }
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [edit, gameSystem?._id]); // Depend on edit state and gameSystem changes

  // Custom row component for editing
  const EditableRow = useCallback(
    ({ className, style, ...restProps }: any) => {
      const record = restProps["data-row-key"]
        ? entities.find((e) => e._id === restProps["data-row-key"])
        : null;
      const isEditing = edit === record?._id;

      if (isEditing && record) {
        return (
          <Form
            form={form}
            component="tr"
            className={className}
            style={style}
            validateTrigger={["onChange", "onBlur"]}
            onValuesChange={(_, allValues) => {
              // Ensure systemId is always set for new items
              if (edit === NEW_ENTITY_TEMP_ID && gameSystem?._id) {
                allValues.systemId = gameSystem._id;
              }
              setValues(allValues);
              // Validate required fields on each change
              validateRequiredFields();
            }}
            {...restProps}
          />
        );
      }

      return <tr className={className} style={style} {...restProps} />;
    },
    [edit, entities, form, setValues, validateRequiredFields, gameSystem?._id],
  );

  const isEditable = useMemo(() => {
    return table.some((col) => !!col.edit);
  }, [table]);

  // Convert table config to Ant Design columns
  const columns: ColumnsType<T> = useMemo(() => {
    const assembleValidationRules = (
      validationRules: Rule[] | undefined,
      record: T,
    ) => {
      const rules = validationRules || [];
      const uniqueRule: any = rules.find((r: any) => r.unique);
      if (uniqueRule) {
        return [
          ...rules.filter((r: any) => !r.unique),
          () => ({
            validator(_: any, fieldValue: string) {
              if (
                entities.some(
                  (ent: T) =>
                    ent.name === fieldValue?.trim() && ent._id !== record._id,
                )
              ) {
                return Promise.reject(new Error(uniqueRule.message));
              }
              return Promise.resolve();
            },
          }),
        ];
      }
      return rules.length > 0 ? rules : undefined;
    };

    return table.map((colConfig) => ({
      dataIndex: colConfig.field as string,
      key: colConfig.field as string,
      render: (value: any, record: T) => {
        const isEditing = edit === record._id;

        const rules = assembleValidationRules(
          colConfig.validationRules,
          record,
        );
        if (isEditing && colConfig.edit) {
          // Use edit component if available and in edit mode
          const EditComponent = colConfig.edit;
          return (
            <EditComponent
              entity={record}
              field={colConfig.field}
              value={value}
              validationRules={rules}
              setValues={setValues}
              setValid={setIsValid}
              setIsNew={setIsNew}
            />
          );
        }

        // Always use view component (mandatory)
        const ViewComponent = colConfig.view;
        return (
          <ViewComponent
            entity={record}
            field={colConfig.field}
            value={value}
          />
        );
      },
      showSorterTooltip: false,
      sorter: edit ? false : !!colConfig.sortable,
      title: colConfig.header,
    }));
  }, [table, edit, setValues, setIsValid, setIsNew]);

  // Add status column
  const statusColumn: ColumnsType<T>[0] = useMemo(
    () => ({
      dataIndex: "status",
      key: "status",
      render: (value, record: T) => {
        // Logic same as List component:
        // 1. View mode (no editing) → editable=true
        // 2. Editing other row → editable=false
        // 3. Editing current row (existing) → editable=true, but not for new items
        let editable = true;

        if (edit && edit !== record._id) {
          // Editing other row → disable
          editable = false;
        } else if (edit === record._id) {
          // Editing current row → allow only for existing items (not new)
          editable = NEW_ENTITY_TEMP_ID !== record._id;
        }

        // Show current status (handles editing status automatically)
        const currentStatus = getCurrentStatus(record);

        return (
          <EntityStatusUI.Tag
            entityId={record._id}
            status={currentStatus}
            editable={editable}
            onChange={onChangeStatus}
          />
        );
      },
      showSorterTooltip: false,
      sorter: edit ? false : sortableStatus,
      title: "Status",
      width: 80,
    }),
    [edit, getCurrentStatus, onChangeStatus, sortableStatus],
  );

  // Add actions column
  const actionsColumn: ColumnsType<T>[0] = useMemo(
    () => ({
      key: "actions",
      render: (_, record: T) => {
        const isEditing = edit === record._id;

        if (isEditing) {
          return (
            <EditModeButtons
              onClickSave={onClickSave}
              onClickCancel={onClickCancelTable}
              isValid={isValid}
              isNew={isNew}
              allowSaveNew={true}
            />
          );
        }

        return (
          <ActionButtons
            entityId={record._id}
            entityName={record.name}
            singleName={singleName}
            edit={isEditable}
            isEditing={!!edit}
            onClickEdit={onClickEdit}
            onClickDelete={onClickDelete}
          />
        );
      },
      title: <div className="ml-1">Actions</div>,
      width: 90,
    }),
    [
      edit,
      isValid,
      isNew,
      onClickSave,
      onClickCancelTable,
      isEditable,
      singleName,
      onClickEdit,
      onClickDelete,
    ],
  );

  const finalColumns = useMemo(
    () => [statusColumn, ...columns, actionsColumn],
    [statusColumn, columns, actionsColumn],
  );

  // Get all row keys for always expanded rows
  const expandedRowKeys = useMemo(() => {
    return rowFooter
      ? filteredAndSortedEntities.map((entity) => entity._id)
      : [];
  }, [rowFooter, filteredAndSortedEntities]);

  // Handle table sorting changes
  const handleTableChange = useCallback(
    (pagination: any, filters: any, sorter: any) => {
      // Disable sorting when in edit mode
      if (edit) {
        return;
      }

      if (sorter && sorter.field) {
        const direction =
          sorter.order === "ascend"
            ? "asc"
            : sorter.order === "descend"
              ? "desc"
              : null;

        if (direction) {
          setSortSelection([
            {
              direction,
              field: sorter.field as keyof T,
            },
          ]);
        } else {
          setSortSelection([]);
        }
      } else {
        setSortSelection([]);
      }
    },
    [setSortSelection, edit],
  );

  return (
    <>
      {(toolbarPosition === ToolbarPosition.UP ||
        singleToolbarUntil <= entities.length) &&
        createTableToolbar(ToolbarPosition.UP, isEditable)}

      <Table<T>
        columns={finalColumns}
        dataSource={filteredAndSortedEntities}
        rowKey="_id"
        pagination={false}
        size="small"
        style={{
          backgroundColor: colorBgContainer,
          borderRadius: borderRadiusLG,
        }}
        className={rowFooter ? "hide-expand-column" : ""}
        expandable={
          rowFooter
            ? {
                expandedRowKeys: expandedRowKeys,
                expandedRowRender: (record: T) => (
                  <div 
                    className={clsx({
                      "bg-blue-50": edit === record._id,
                    })}
                    style={{ 
                      margin: '-8px -8px',
                      padding: '8px 8px'
                    }}
                  >
                    {rowFooter(record)}
                  </div>
                ),
                showExpandColumn: false, // Hide expand column
              }
            : undefined
        }
        components={{
          body: {
            row: EditableRow,
          },
        }}
        onChange={handleTableChange}
        onRow={useCallback((record: T) => ({}), [])}
        rowClassName={useCallback(
          (record: T) => {
            return clsx({
              "bg-blue-50": edit === record._id,
            });
          },
          [edit],
        )}
      />

      {(toolbarPosition === ToolbarPosition.DOWN ||
        singleToolbarUntil <= entities.length) &&
        createTableToolbar(ToolbarPosition.DOWN, isEditable)}
    </>
  );
};

// Main component object with variants
const CrudMultiLineView = {
  List: CrudMultiLineViewList,
  Table: CrudMultiLineViewTable,
};

export default CrudMultiLineView;
