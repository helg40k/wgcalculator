import { Dispatch, SetStateAction, useMemo, useState } from "react";
import {
  CheckIcon,
  PencilSquareIcon,
  TrashIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import { Badge, Button, message, Modal, Table, theme, Tooltip } from "antd";
import type { ColumnsType } from "antd/es/table";
import clsx from "clsx";

import { EntityStatus, Playable } from "@/app/lib/definitions";
import { NEW_ENTITY_TEMP_ID } from "@/app/lib/services/firebase/helpers/getDocumentCreationBase";
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
}

const EditModeButtons = ({
  onClickSave,
  onClickCancel,
  isValid,
  isNew,
}: EditModeButtonsProps) => {
  const {
    token: { colorTextDisabled },
  } = theme.useToken();

  const disabled = !isValid || isNew;
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
          if (aValue < bValue) comparison = -1;
          else if (aValue > bValue) comparison = 1;

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
    let newEntity = mergeDeep({}, oldEntity, values) as T;

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

        resetEditingState();
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
    } catch {
      message.error(`Error updating ${singleName} status!`);
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

// List Component
const CorsMultiLineViewList = <T extends Playable>({
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
      {filteredAndSortedEntities?.map((entity) => (
        <div
          key={`multi-line-key-${entity._id}`}
          onMouseEnter={() => !edit && setHovered(entity._id)}
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
              {hovered === entity._id && !edit && (
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
                    <ViewComponent key={entity._id} entity={entity} />
                  </EntityStatusUI.Badge>
                </Badge.Ribbon>
              )}
              {hovered !== entity._id && (
                <EntityStatusUI.Badge
                  entityId={entity._id}
                  status={getCurrentStatus(entity)}
                  editable={true}
                  show={false}
                  onChange={onChangeStatus}
                >
                  <ViewComponent key={entity._id} entity={entity} />
                </EntityStatusUI.Badge>
              )}
            </>
          )}
          {edit && edit !== entity._id && (
            <EntityStatusUI.Badge
              entityId={entity._id}
              status={getCurrentStatus(entity)}
              editable={false}
              show={false}
              onChange={onChangeStatus}
            >
              <ViewComponent key={entity._id} entity={entity} />
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
                  key={entity._id}
                  entity={entity}
                  setValues={setValues}
                  setValid={setIsValid}
                  setIsNew={setIsNew}
                />
              </EntityStatusUI.Badge>
            </Badge.Ribbon>
          )}
        </div>
      ))}
      {(toolbarPosition === ToolbarPosition.DOWN ||
        singleToolbarUntil <= entities.length) &&
        createToolbar(ToolbarPosition.DOWN, !!EditComponent)}
    </>
  );
};

// Table Component
const CorsMultiLineViewTable = <T extends Playable>({
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
}: TableProps<T>) => {
  const {
    borderRadiusLG,
    colorBgContainer,
    createTableToolbar,
    edit,
    editingStatus,
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

  const isEditable = useMemo(() => {
    return table.some((col) => !!col.edit);
  }, [table]);

  // Convert table config to Ant Design columns
  const columns: ColumnsType<T> = table.map((colConfig) => ({
    dataIndex: colConfig.field as string,
    key: colConfig.field as string,
    render: (value: any, record: T) => {
      const isEditing = edit === record._id;

      if (isEditing && colConfig.edit) {
        // Use edit component if available and in edit mode
        const EditComponent = colConfig.edit;
        return (
          <EditComponent
            entity={record}
            field={colConfig.field}
            value={value}
            setValues={setValues}
            setValid={setIsValid}
            setIsNew={setIsNew}
          />
        );
      }

      // Always use view component (mandatory)
      const ViewComponent = colConfig.view;
      return (
        <ViewComponent entity={record} field={colConfig.field} value={value} />
      );
    },
    showSorterTooltip: false,
    sorter: !!colConfig.sortable,
    title: colConfig.header,
  }));

  // Add status column
  const statusColumn: ColumnsType<T>[0] = {
    dataIndex: "status",
    key: "status",
    render: (value, record: T) => (
      <EntityStatusUI.Tag
        entityId={record._id}
        status={value}
        editable={(!edit || edit === record._id) && !isNew}
        onChange={onChangeStatus}
      />
    ),
    showSorterTooltip: false,
    sorter: sortableStatus,
    title: "Status",
    width: 80,
  };

  // Add actions column
  const actionsColumn: ColumnsType<T>[0] = {
    key: "actions",
    render: (_, record: T) => {
      const isEditing = edit === record._id;

      if (isEditing) {
        return (
          <EditModeButtons
            onClickSave={onClickSave}
            onClickCancel={onClickCancel}
            isValid={isValid}
            isNew={isNew}
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
  };

  const finalColumns = [statusColumn, ...columns, actionsColumn];

  // Handle table sorting changes
  const handleTableChange = (pagination: any, filters: any, sorter: any) => {
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
  };

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
        onChange={handleTableChange}
        onRow={(record) => ({
          onMouseEnter: () => !edit && setHovered(record._id),
          onMouseLeave: () => setHovered(null),
        })}
        rowClassName={(record) => {
          const status = getCurrentStatus(record);
          const isEditing = edit === record._id;
          const isHovered = hovered === record._id;

          return clsx({
            "bg-blue-50": isEditing,
            "bg-gray-50": !isEditing && isHovered,
            // "opacity-60": status === EntityStatusRegistry.DISABLED,
          });
        }}
      />

      {(toolbarPosition === ToolbarPosition.DOWN ||
        singleToolbarUntil <= entities.length) &&
        createTableToolbar(ToolbarPosition.DOWN, isEditable)}
    </>
  );
};

// Main component object with variants
const CorsMultiLineView = {
  List: CorsMultiLineViewList,
  Table: CorsMultiLineViewTable,
};

export default CorsMultiLineView;
