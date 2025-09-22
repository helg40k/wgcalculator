import React, { useEffect, useMemo, useRef, useState } from "react";
import { CaretRightOutlined } from "@ant-design/icons";
import { CheckIcon, TrashIcon, XMarkIcon } from "@heroicons/react/24/outline";
import {
  Button,
  Collapse,
  CollapseProps,
  Divider,
  Modal,
  Select,
  Spin,
  theme,
  Tooltip,
} from "antd";

import {
  CollectionName,
  Mentions,
  Playable,
  References,
} from "@/app/lib/definitions";
import usePlayableReferences from "@/app/lib/hooks/usePlayableReferences";
import EntityStatusUI from "@/app/ui/shared/EntityStatusUI";

// CSS styles for disabling collapse headers but keeping content interactive
if (
  typeof document !== "undefined" &&
  !document.getElementById("collapse-disabled-styles")
) {
  const style = document.createElement("style");
  style.id = "collapse-disabled-styles";
  style.innerHTML = `
    .collapse-disabled .ant-collapse-header {
      cursor: default !important;
      pointer-events: none !important;
    }
    .collapse-disabled .ant-collapse-content {
      pointer-events: auto !important;
    }
    .collapse-disabled .ant-collapse-expand-icon {
      cursor: default !important;
      pointer-events: none !important;
    }
  `;
  document.head.appendChild(style);
}

interface DeleteButtonProps {
  onDelete: () => void;
  name: string;
  disabled: boolean;
}

const DeleteButton = ({ onDelete, name, disabled }: DeleteButtonProps) => (
  <Tooltip
    color="darkRed"
    title={!disabled ? `Remove this ${name}` : undefined}
    mouseEnterDelay={0.5}
  >
    <Button
      style={{
        height: "22px",
        width: "22px",
      }}
      onClick={onDelete}
      icon={
        <span className="text-black hover:text-red-900 transition-colors">
          <TrashIcon className="w-3" />
        </span>
      }
      disabled={disabled}
    />
  </Tooltip>
);

interface DescriptionTooltipProps {
  content?: string;
  colorText: string;
  children: React.ReactNode;
}

const DescriptionTooltip = ({
  content,
  colorText,
  children,
}: DescriptionTooltipProps) => (
  <Tooltip
    title={
      content ? (
        <div
          className="whitespace-pre-wrap"
          style={{
            color: colorText,
            maxHeight: "200px",
            maxWidth: "350px",
            overflow: "auto",
            padding: "8px",
            scrollbarWidth: "thin",
          }}
        >
          {content}
        </div>
      ) : undefined
    }
    placement="right"
    color="white"
    mouseEnterDelay={1.5}
    styles={{
      root: { maxWidth: "none" },
    }}
  >
    {children}
  </Tooltip>
);

interface CrudReferenceModalProps {
  showModal: boolean;
  entityName: string;
  onOk: (references: References) => void;
  onCancel: () => void;
  references: References;
  mentions: Mentions;
  collectionName: CollectionName;
  allowedToRefer: CollectionName[];
}

const CrudReferenceModal = ({
  showModal,
  entityName,
  onOk,
  onCancel,
  references: oldReferences,
  mentions,
  collectionName,
  allowedToRefer,
}: CrudReferenceModalProps) => {
  const {
    token: {
      colorText,
      colorTextSecondary,
      colorTextTertiary,
      colorTextDisabled,
      colorBgBase,
    },
  } = theme.useToken();
  const [disableModal, setDisableModal] = useState<boolean>(false);
  const [references, setReferences] = useState<References>(oldReferences);
  const [referenceExpandedKeys, setReferenceExpandedKeys] = useState<string[]>(
    [],
  );
  const [hasUserInteracted, setHasUserInteracted] = useState(false);
  const [loadedEntities, setLoadedEntities] = useState<
    Partial<Record<CollectionName, Playable[]>>
  >({});
  const [loading, setLoading] = useState(false);
  const [showingSelect, setShowingSelect] = useState<CollectionName | null>(
    null,
  );
  const [selectOptions, setSelectOptions] = useState<
    Array<{ value: string; label: string }>
  >([]);
  const [availableEntities, setAvailableEntities] = useState<Playable[]>([]);
  const { loadEntitiesForReferences, loadReferences } = usePlayableReferences();
  const loadingRef = useRef<Set<string>>(new Set());

  const refNumber = useMemo(() => {
    return Object.keys(references).length;
  }, [references]);

  const mentNumber = useMemo(() => {
    return Object.values(mentions).reduce(
      (total, array) => total + array.length,
      0,
    );
  }, [mentions]);

  const groupedRefIds = useMemo(() => {
    const results: Partial<Record<CollectionName, string[]>> = {};
    allowedToRefer.forEach((colName) => (results[colName] = []));
    Object.entries(references).forEach(([entId, colName]) => {
      if (!results[colName]) {
        results[colName] = [];
      }
      results[colName]!.push(entId);
    });
    return results;
  }, [allowedToRefer, references]);

  useEffect(() => {
    const entriesToLoad = Object.entries(groupedRefIds).filter(
      ([colName, entIds]) =>
        entIds.length > 0 && !loadingRef.current.has(colName),
    );

    if (entriesToLoad.length === 0) {
      setLoading(false);
      return;
    }

    setLoading(true);

    const loadPromises = entriesToLoad.map(async ([colName, entIds]) => {
      loadingRef.current.add(colName);
      try {
        const entities = await loadReferences(colName, entIds);
        setLoadedEntities((prev) => ({
          ...prev,
          [colName as CollectionName]: entities,
        }));
      } finally {
        loadingRef.current.delete(colName);
      }
    });

    Promise.all(loadPromises).finally(() => {
      setLoading(false);
    });
  }, [JSON.stringify(groupedRefIds), loadReferences]);

  const referenceCollections: CollapseProps["items"] = useMemo(() => {
    return Object.entries(groupedRefIds)
      .sort(([colName1], [colName2]) => colName1.localeCompare(colName2))
      .map(([colName, entIds]) => {
        const entities = loadedEntities[colName as CollectionName] || [];
        return {
          children: (
            <div className="-mt-5">
              {entities.length > 0
                ? entities.map((ent) => (
                    <div
                      key={`${colName}-${ent._id}`}
                      className="my-0.5 py-0.5 pl-12 flex items-center justify-between hover:bg-blue-50"
                    >
                      <DescriptionTooltip
                        content={ent.description}
                        colorText={colorTextSecondary}
                      >
                        <span>{ent.name}</span>
                      </DescriptionTooltip>
                      <div className="flex items-center gap-1">
                        <EntityStatusUI.Tag
                          entityId={ent._id}
                          status={ent.status}
                          editable={false}
                        />
                        <DeleteButton
                          onDelete={() => {}}
                          name="reference"
                          disabled={loading || disableModal}
                        />
                        <div className="pr-2" />
                      </div>
                    </div>
                  ))
                : entIds.map((id) => (
                    <div
                      key={`${colName}-${id}`}
                      className="my-0.5 py-0.5 pl-12 flex items-center justify-between"
                    >
                      Loading...
                    </div>
                  ))}
              {showingSelect === colName ? (
                <div className="flex justify-start py-1 pr-3 w-full gap-1">
                  <Select
                    placeholder="Select a new reference..."
                    options={selectOptions}
                    style={{ flex: "1", minWidth: "0" }}
                    showSearch
                    filterOption={(input, option) =>
                      (option?.label ?? "")
                        .toLowerCase()
                        .includes(input.toLowerCase())
                    }
                    optionRender={(option) => {
                      const entity = availableEntities.find(
                        (ent) => ent._id === option.value,
                      );
                      return (
                        <div className="relative w-full">
                          <span>{option.label}</span>
                          {entity && (
                            <div
                              className="absolute -right-1"
                              style={{ top: -1 }}
                            >
                              <EntityStatusUI.Tag
                                entityId={entity._id}
                                status={entity.status}
                                editable={false}
                              />
                            </div>
                          )}
                        </div>
                      );
                    }}
                    labelRender={(props) => {
                      const entity = availableEntities.find(
                        (ent) => ent._id === props.value,
                      );
                      return (
                        <div className="relative w-full">
                          <span className="block truncate pr-16">
                            {props.label}
                          </span>
                          {entity && (
                            <div
                              className="absolute -right-2"
                              style={{ top: -1 }}
                            >
                              <EntityStatusUI.Tag
                                entityId={entity._id}
                                status={entity.status}
                                editable={false}
                              />
                            </div>
                          )}
                        </div>
                      );
                    }}
                    autoFocus
                  />
                  <Tooltip
                    color="darkGreen"
                    title="Confirm selection"
                    mouseEnterDelay={0.5}
                  >
                    <Button
                      className="flex-shrink-0"
                      style={{
                        height: "32px",
                        width: "32px",
                      }}
                      onClick={() => {
                        setDisableModal(false);
                      }}
                      icon={
                        <span className="text-gray-500 hover:text-green-900 transition-colors">
                          <CheckIcon className="w-5" />
                        </span>
                      }
                    />
                  </Tooltip>
                  <Tooltip
                    color="darkRed"
                    title="Cancel selection"
                    mouseEnterDelay={0.5}
                  >
                    <Button
                      className="flex-shrink-0"
                      style={{
                        height: "32px",
                        width: "32px",
                      }}
                      onClick={() => {
                        setShowingSelect(null);
                        setSelectOptions([]);
                        setAvailableEntities([]);
                        setDisableModal(false);
                      }}
                      icon={
                        <span className="text-gray-500 hover:text-red-900 transition-colors">
                          <XMarkIcon className="w-5" />
                        </span>
                      }
                    />
                  </Tooltip>
                </div>
              ) : (
                <div className="flex justify-start py-1 pr-3">
                  <Tooltip
                    color="white"
                    title={
                      !loading ? (
                        <span style={{ color: colorText }}>
                          Add one more reference
                        </span>
                      ) : undefined
                    }
                    mouseEnterDelay={0.5}
                  >
                    <Button
                      // style={{
                      //   height: "22px",
                      // }}
                      onClick={async () => {
                        const colNameTyped = colName as CollectionName;
                        const existingIds = groupedRefIds[colNameTyped] || [];
                        const entToRefs = await loadEntitiesForReferences(
                          colNameTyped,
                          existingIds,
                        );
                        const sortedEntities = entToRefs.sort((ent1, ent2) =>
                          ent1.name.localeCompare(ent2.name),
                        );
                        const options = sortedEntities.map((ent) => ({
                          label: ent.name,
                          value: ent._id,
                        }));
                        setAvailableEntities(sortedEntities);
                        setSelectOptions(options);
                        setShowingSelect(colNameTyped);
                        setDisableModal(true);
                      }}
                      disabled={loading || disableModal}
                    >
                      Add more
                    </Button>
                  </Tooltip>
                </div>
              )}
            </div>
          ),
          key: `reference-${colName}`,
          label: (
            <span>
              {entIds.length} <span className="font-mono">{colName}</span>
            </span>
          ),
        };
      });
  }, [
    groupedRefIds,
    loadedEntities,
    loading,
    colorText,
    colorTextSecondary,
    showingSelect,
    selectOptions,
    availableEntities,
  ]);
  useEffect(() => {
    if (!hasUserInteracted) {
      const keys = Object.entries(groupedRefIds)
        .filter(([, entIds]) => entIds.length)
        .map(([colName]) => `reference-${colName}`);
      setReferenceExpandedKeys(keys);
    }
  }, [groupedRefIds, hasUserInteracted]);

  const mentionCollections: CollapseProps["items"] = useMemo(() => {
    return Object.entries(mentions)
      .filter(([, entities]) => entities.length)
      .sort(([colName1], [colName2]) => colName1.localeCompare(colName2))
      .map(([colName, entities]) => {
        return {
          children: (
            <div className="-mt-5">
              {entities
                .sort((ent1, ent2) => ent1.name.localeCompare(ent2.name))
                .map((ent) => (
                  <div
                    key={`${colName}-${ent._id}`}
                    className="my-0.5 py-0.5 pl-12 flex items-center justify-between hover:bg-blue-50"
                  >
                    <DescriptionTooltip
                      content={ent.description}
                      colorText={colorTextSecondary}
                    >
                      <span>{ent.name}</span>
                    </DescriptionTooltip>
                    <div className="flex items-center gap-1">
                      <EntityStatusUI.Tag
                        entityId={ent._id}
                        status={ent.status}
                        editable={false}
                      />
                      <DeleteButton
                        onDelete={() => {}}
                        name="mention"
                        disabled={loading || disableModal}
                      />
                      <div className="pr-2" />
                    </div>
                  </div>
                ))}
            </div>
          ),
          key: `mention-${colName}`,
          label: (
            <span>
              {entities.length} <span className="font-mono">{colName}</span>
            </span>
          ),
        };
      });
  }, [mentions, loading, colorText, colorTextSecondary]);
  const mentionExpandedKeys = useMemo(() => {
    return Object.entries(mentions)
      .filter(([, entities]) => entities.length)
      .map(([colName]) => `mention-${colName}`);
  }, [mentions]);

  return (
    <Modal
      open={showModal}
      title={
        <span>
          {`'${entityName}' references `}
          <Spin spinning={loading} />
        </span>
      }
      onOk={() => onOk(references)}
      onCancel={onCancel}
      maskClosable={false}
      keyboard={false}
      okButtonProps={{ disabled: loading || disableModal }}
    >
      <Divider />
      <div className="font-bold">References ({refNumber} added)</div>
      <div className={disableModal ? "collapse-disabled" : ""}>
        <Collapse
          ghost
          items={referenceCollections}
          expandIcon={({ isActive }) => (
            <CaretRightOutlined rotate={isActive ? 90 : 0} />
          )}
          activeKey={referenceExpandedKeys}
          onChange={(keys) => {
            if (!disableModal) {
              setHasUserInteracted(true);
              setReferenceExpandedKeys(Array.isArray(keys) ? keys : [keys]);
            }
          }}
        />
      </div>
      <div className="h-6" />
      <div className="font-bold">Mentions ({mentNumber} found)</div>
      <div className={disableModal ? "collapse-disabled" : ""}>
        <Collapse
          ghost
          items={mentionCollections}
          expandIcon={({ isActive }) => (
            <CaretRightOutlined rotate={isActive ? 90 : 0} />
          )}
          defaultActiveKey={mentionExpandedKeys}
          onChange={disableModal ? () => {} : undefined}
        />
      </div>
      <Divider />
    </Modal>
  );
};

export default CrudReferenceModal;
