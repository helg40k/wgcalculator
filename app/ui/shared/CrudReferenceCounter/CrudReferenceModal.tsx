import React, {
  useEffect,
  useInsertionEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { CaretRightOutlined } from "@ant-design/icons";
import {
  ArrowPathIcon,
  CheckIcon,
  TrashIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import {
  Button,
  Collapse,
  CollapseProps,
  Divider,
  Input,
  Modal,
  Select,
  Spin,
  theme,
  Tooltip,
} from "antd";

import { invalidateCollections } from "@/app/lib/collectionInvalidation";
import {
  CollectionName,
  EntityStatusRegistry,
  Mentions,
  Playable,
  References,
} from "@/app/lib/definitions";
import usePlayableReferences from "@/app/lib/hooks/usePlayableReferences";
import CrudReferenceLink from "@/app/ui/shared/CrudReferenceCounter/CrudReferenceLink";
import EntityStatusUI from "@/app/ui/shared/EntityStatusUI";

const COLLAPSE_DISABLED_STYLE_ID = "collapse-disabled-styles";
const COLLAPSE_DISABLED_CSS = `
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

interface RestoreButtonProps {
  onRestore: () => void;
  name: string;
  disabled: boolean;
}

const RestoreButton = ({ onRestore, name, disabled }: RestoreButtonProps) => (
  <Tooltip
    color="darkGreen"
    title={!disabled ? `Restore this ${name}` : undefined}
    mouseEnterDelay={0.5}
  >
    <Button
      className="restore-btn"
      style={{
        height: "22px",
        width: "22px",
      }}
      onClick={onRestore}
      icon={
        <span className="text-black hover:text-green-900 transition-colors">
          <ArrowPathIcon className="w-3" />
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
  entityId: string;
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
  entityId,
  entityName,
  onOk,
  onCancel,
  references: oldReferences,
  mentions,
  collectionName,
  allowedToRefer,
}: CrudReferenceModalProps) => {
  const {
    token: { colorText, colorTextSecondary },
  } = theme.useToken();

  useInsertionEffect(() => {
    if (document.getElementById(COLLAPSE_DISABLED_STYLE_ID)) return;
    const style = document.createElement("style");
    style.id = COLLAPSE_DISABLED_STYLE_ID;
    style.textContent = COLLAPSE_DISABLED_CSS;
    document.head.appendChild(style);
  }, []);

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
  const [selectedEntityId, setSelectedEntityId] = useState<string | null>(null);
  const [linkInput, setLinkInput] = useState("");
  const [editingLinkId, setEditingLinkId] = useState<string | null>(null);
  const [exhaustedCollections, setExhaustedCollections] = useState<
    Set<CollectionName>
  >(new Set());
  const [removedMentionIds, setRemovedMentionIds] = useState<Set<string>>(
    new Set(),
  );
  const [scrollToBottom, setScrollToBottom] = useState(false);
  const {
    loadEntitiesForReferences,
    loadReferences,
    removeIncomingReferences,
    saveReferences,
  } = usePlayableReferences();
  const loadingRef = useRef<Set<string>>(new Set());
  const referencesScrollRef = useRef<HTMLDivElement | null>(null);

  const refNumber = useMemo(() => {
    return Object.keys(references).filter((id) => oldReferences[id]).length;
  }, [references, oldReferences]);

  const unsavedCount = useMemo(() => {
    return Object.keys(references).filter((id) => !oldReferences[id]).length;
  }, [references, oldReferences]);

  const removedCount = useMemo(() => {
    return Object.keys(oldReferences).filter((id) => !references[id]).length;
  }, [references, oldReferences]);

  const mentNumber = useMemo(() => {
    return Object.values(mentions).reduce(
      (total, array) => total + array.length,
      0,
    );
  }, [mentions]);

  const removedMentionCount = useMemo(
    () => removedMentionIds.size,
    [removedMentionIds],
  );

  const modifiedLinkCount = useMemo(() => {
    const normalize = (link?: string) => link?.trim() ?? "";
    return Object.keys(references).filter(
      (id) =>
        oldReferences[id] &&
        normalize(references[id]?.link) !== normalize(oldReferences[id]?.link),
    ).length;
  }, [references, oldReferences]);

  const hasChanges =
    unsavedCount > 0 ||
    removedCount > 0 ||
    removedMentionCount > 0 ||
    modifiedLinkCount > 0;

  const removedMentionUpdates = useMemo(() => {
    const list: Array<{ collectionName: CollectionName; documentId: string }> =
      [];
    for (const [colName, entities] of Object.entries(mentions)) {
      if (!entities?.length) continue;
      for (const ent of entities) {
        if (removedMentionIds.has(ent._id)) {
          list.push({
            collectionName: colName as CollectionName,
            documentId: ent._id,
          });
        }
      }
    }
    return list;
  }, [mentions, removedMentionIds]);

  const groupedRefIds = useMemo(() => {
    const results: Partial<Record<CollectionName, string[]>> = {};
    allowedToRefer.forEach((colName) => (results[colName] = []));
    Object.entries(references).forEach(([entId, ref]) => {
      if (!results[ref.name]) {
        results[ref.name] = [];
      }
      results[ref.name]!.push(entId);
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
        setLoadedEntities((prev) => {
          const colKey = colName as CollectionName;
          const prevList = prev[colKey] || [];
          const entById = new Map(entities.map((e) => [e._id, e]));
          const existingUpdated = prevList
            .map((e) => entById.get(e._id))
            .filter((e): e is Playable => e != null);
          const existingIds = new Set(prevList.map((e) => e._id));
          const brandNew = entities.filter((e) => !existingIds.has(e._id));
          return {
            ...prev,
            [colKey]: [...existingUpdated, ...brandNew],
          };
        });
      } finally {
        loadingRef.current.delete(colName);
      }
    });

    Promise.all(loadPromises).finally(() => {
      setLoading(false);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- groupedRefIds is compared via JSON.stringify in the dependency array for deep equality
  }, [JSON.stringify(groupedRefIds), loadReferences]);

  useEffect(() => {
    if (scrollToBottom) {
      const el = referencesScrollRef.current;
      if (el) {
        el.scrollTop = el.scrollHeight;
      }
      setScrollToBottom(false);
    }
  }, [scrollToBottom]);

  const referenceCollections: CollapseProps["items"] = useMemo(() => {
    return Object.entries(groupedRefIds)
      .sort(([colName1], [colName2]) => colName1.localeCompare(colName2))
      .map(([colName, entIds]) => {
        const entities = loadedEntities[colName as CollectionName] || [];
        const savedEntities = entities
          .filter((ent) => oldReferences[ent._id])
          .sort((a, b) => a.name.localeCompare(b.name));
        const unsavedEntities = entities.filter(
          (ent) => !oldReferences[ent._id],
        );
        const sortedEntities = [...savedEntities, ...unsavedEntities];
        return {
          children: (
            <div className="-mt-5">
              {sortedEntities.length > 0
                ? sortedEntities.map((ent) => {
                    const isUnsaved = !oldReferences[ent._id];
                    return (
                      <div
                        key={`${colName}-${ent._id}`}
                        className={`my-0.5 py-0.5 pl-12 flex items-center justify-between hover:bg-blue-50 ${isUnsaved ? "bg-red-50" : ""}`}
                      >
                        <DescriptionTooltip
                          content={ent.description}
                          colorText={colorTextSecondary}
                        >
                          <span>{ent.name}</span>
                        </DescriptionTooltip>
                        <div className="flex items-center gap-1">
                          {ent.status !== EntityStatusRegistry.ACTIVE && (
                            <EntityStatusUI.Tag
                              entityId={ent._id}
                              status={ent.status}
                              editable={false}
                            />
                          )}
                          {editingLinkId === ent._id ? (
                            <CrudReferenceLink.Edit
                              link={references[ent._id]?.link}
                              onDone={(newLink) => {
                                if (newLink !== undefined) {
                                  setReferences((prev) => {
                                    const ref = { ...prev[ent._id] };
                                    if (newLink) {
                                      ref.link = newLink;
                                    } else {
                                      delete ref.link;
                                    }
                                    return { ...prev, [ent._id]: ref };
                                  });
                                }
                                setEditingLinkId(null);
                                setDisableModal(false);
                              }}
                            />
                          ) : (
                            <CrudReferenceLink.View
                              link={references[ent._id]?.link}
                              highlighted={
                                (references[ent._id]?.link?.trim() ?? "") !==
                                (oldReferences[ent._id]?.link?.trim() ?? "")
                              }
                              onClick={() => {
                                setEditingLinkId(ent._id);
                                setDisableModal(true);
                              }}
                            />
                          )}
                          <DeleteButton
                            onDelete={() => {
                              const colNameTyped = colName as CollectionName;
                              setReferences((prev) => {
                                const updated = { ...prev };
                                delete updated[ent._id];
                                return updated;
                              });
                              setLoadedEntities((prev) => ({
                                ...prev,
                                [colNameTyped]: (
                                  prev[colNameTyped] || []
                                ).filter((e) => e._id !== ent._id),
                              }));
                              setExhaustedCollections((prev) => {
                                const updated = new Set(prev);
                                updated.delete(colNameTyped);
                                return updated;
                              });
                            }}
                            name="reference"
                            disabled={loading || disableModal}
                          />
                          <div className="pr-2" />
                        </div>
                      </div>
                    );
                  })
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
                    value={selectedEntityId}
                    onChange={(value) => setSelectedEntityId(value)}
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
                          {entity &&
                            entity.status !== EntityStatusRegistry.ACTIVE && (
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
                          {entity &&
                            entity.status !== EntityStatusRegistry.ACTIVE && (
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
                    title="If you have a precise link (page, paragraph, etc.), type it here"
                    mouseEnterDelay={0.5}
                  >
                    <Input
                      allowClear
                      className="[&_.ant-input-suffix]:pl !pl-1.5 !pr-1.5"
                      placeholder="Ref..."
                      value={linkInput}
                      onChange={(e) => setLinkInput(e.target.value)}
                      onMouseDown={(e) => e.stopPropagation()}
                      onKeyDown={(e) => e.stopPropagation()}
                      style={{ width: "65px" }}
                    />
                  </Tooltip>
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
                        if (selectedEntityId) {
                          const colNameTyped = colName as CollectionName;
                          setReferences((prev) => ({
                            ...prev,
                            [selectedEntityId]: {
                              name: colNameTyped,
                              ...(linkInput.trim() && {
                                link: linkInput.trim(),
                              }),
                            },
                          }));
                          const selectedEntity = availableEntities.find(
                            (ent) => ent._id === selectedEntityId,
                          );
                          if (selectedEntity) {
                            setLoadedEntities((prev) => ({
                              ...prev,
                              [colNameTyped]: [
                                ...(prev[colNameTyped] || []),
                                selectedEntity,
                              ],
                            }));
                          }
                          const remaining = availableEntities.filter(
                            (ent) => ent._id !== selectedEntityId,
                          );
                          if (remaining.length === 0) {
                            setExhaustedCollections((prev) =>
                              new Set(prev).add(colNameTyped),
                            );
                          }
                          setScrollToBottom(true);
                        }
                        setSelectedEntityId(null);
                        setLinkInput("");
                        setShowingSelect(null);
                        setSelectOptions([]);
                        setAvailableEntities([]);
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
                        setSelectedEntityId(null);
                        setLinkInput("");
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
                !exhaustedCollections.has(colName as CollectionName) && (
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
                        onClick={async () => {
                          const colNameTyped = colName as CollectionName;
                          const existingIds = groupedRefIds[colNameTyped] || [];
                          const entToRefs = await loadEntitiesForReferences(
                            colNameTyped,
                            existingIds,
                          );
                          const filtered = entToRefs.filter(
                            (ent) => !references[ent._id],
                          );
                          if (filtered.length === 0) {
                            setExhaustedCollections((prev) =>
                              new Set(prev).add(colNameTyped),
                            );
                            return;
                          }
                          const sortedOptions = filtered.sort((ent1, ent2) =>
                            ent1.name.localeCompare(ent2.name),
                          );
                          const options = sortedOptions.map((ent) => ({
                            label: ent.name,
                            value: ent._id,
                          }));
                          setAvailableEntities(sortedOptions);
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
                )
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
    editingLinkId,
    linkInput,
    loadedEntities,
    loading,
    disableModal,
    colorText,
    colorTextSecondary,
    showingSelect,
    selectOptions,
    availableEntities,
    selectedEntityId,
    exhaustedCollections,
    loadEntitiesForReferences,
    oldReferences,
    references,
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
                .map((ent) => {
                  const isRemoved = removedMentionIds.has(ent._id);
                  return (
                    <div
                      key={`${colName}-${ent._id}`}
                      className={`my-0.5 py-0.5 pl-12 flex items-center justify-between ${isRemoved ? "bg-red-200 hover:bg-red-100 has-[.restore-btn:hover]:bg-green-100" : "hover:bg-blue-50"}`}
                    >
                      <DescriptionTooltip
                        content={ent.description}
                        colorText={colorTextSecondary}
                      >
                        <span>{ent.name}</span>
                      </DescriptionTooltip>
                      <div className="flex items-center gap-1">
                        {ent.status !== EntityStatusRegistry.ACTIVE && (
                          <EntityStatusUI.Tag
                            entityId={ent._id}
                            status={ent.status}
                            editable={false}
                          />
                        )}
                        {isRemoved ? (
                          <RestoreButton
                            onRestore={() => {
                              setRemovedMentionIds((prev) => {
                                const updated = new Set(prev);
                                updated.delete(ent._id);
                                return updated;
                              });
                            }}
                            name="mention"
                            disabled={loading || disableModal}
                          />
                        ) : (
                          <DeleteButton
                            onDelete={() => {
                              setRemovedMentionIds((prev) =>
                                new Set(prev).add(ent._id),
                              );
                            }}
                            name="mention"
                            disabled={loading || disableModal}
                          />
                        )}
                        <div className="pr-2" />
                      </div>
                    </div>
                  );
                })}
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
  }, [mentions, loading, colorTextSecondary, removedMentionIds, disableModal]);
  const mentionExpandedKeys = useMemo(() => {
    return Object.entries(mentions)
      .filter(([, entities]) => entities.length)
      .map(([colName]) => `mention-${colName}`);
  }, [mentions]);

  const handleCancel = () => {
    if (!hasChanges) {
      onCancel();
      return;
    }
    const refParts: string[] = [];
    if (unsavedCount > 0) refParts.push(`${unsavedCount} added`);
    if (removedCount > 0) refParts.push(`${removedCount} removed`);
    if (modifiedLinkCount > 0) refParts.push(`${modifiedLinkCount} modified`);
    Modal.confirm({
      cancelText: "Cancel",
      content: (
        <>
          {refParts.length > 0 && (
            <>
              References were changed: {refParts.join(", ")}.
              <br />
            </>
          )}
          {removedMentionCount > 0 && (
            <>
              Mentions were changed: {removedMentionCount} removed.
              <br />
            </>
          )}
          Would you like to ignore changes?
        </>
      ),
      okText: "Ignore",
      onOk: onCancel,
      title: "Ignore changes",
    });
  };

  return (
    <Modal
      open={showModal}
      title={
        <span>
          {`'${entityName}' references `}
          <Spin spinning={loading} />
        </span>
      }
      onOk={async () => {
        setLoading(true);
        try {
          const result = await saveReferences(
            collectionName,
            entityId,
            references,
          );
          if (!result) {
            return;
          }
          const removalsOk = await removeIncomingReferences(
            entityId,
            removedMentionUpdates,
          );
          if (!removalsOk) {
            return;
          }
          const affectedCollections = [
            ...new Set(removedMentionUpdates.map((u) => u.collectionName)),
          ];
          if (affectedCollections.length > 0) {
            invalidateCollections(affectedCollections);
          }
          onOk(references);
        } finally {
          setLoading(false);
        }
      }}
      onCancel={handleCancel}
      width={580}
      maskClosable={false}
      keyboard={false}
      okButtonProps={{ disabled: loading || disableModal || !hasChanges }}
    >
      <Divider />
      <div className="font-bold">
        References ({refNumber} added
        {unsavedCount > 0 && `, ${unsavedCount} unsaved`}
        {removedCount > 0 && `, ${removedCount} removed`}
        {modifiedLinkCount > 0 && `, ${modifiedLinkCount} modified`})
      </div>
      <div
        ref={referencesScrollRef}
        style={{ maxHeight: "224px", overflowY: "auto" }}
      >
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
      </div>
      <div className="h-6" />
      <div className="font-bold">
        Mentions ({mentNumber} found
        {removedMentionCount > 0 && `, ${removedMentionCount} removed`})
      </div>
      <div style={{ maxHeight: "224px", overflowY: "auto" }}>
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
      </div>
      <Divider />
    </Modal>
  );
};

export default CrudReferenceModal;
