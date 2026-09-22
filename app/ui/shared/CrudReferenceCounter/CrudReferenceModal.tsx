import React, {
  useContext,
  useEffect,
  useInsertionEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { CaretRightOutlined } from "@ant-design/icons";
import {
  ArrowPathIcon,
  PencilSquareIcon,
  TrashIcon,
} from "@heroicons/react/24/outline";
import {
  Button,
  Collapse,
  CollapseProps,
  Divider,
  Modal,
  Spin,
  theme,
  Tooltip,
} from "antd";

import { invalidateCollections } from "@/app/lib/collectionInvalidation";
import { GameSystemContext } from "@/app/lib/contexts/GameSystemContext";
import {
  CollectionName,
  CollectionRegistry,
  EntityStatusRegistry,
  Mentions,
  Playable,
  Reference,
  References,
} from "@/app/lib/definitions";
import usePlayableReferences from "@/app/lib/hooks/usePlayableReferences";
import { getPlayableScopeFilters } from "@/app/lib/playableScope";
import CrudReferenceLink from "@/app/ui/shared/CrudReferenceCounter/CrudReferenceLink";
import CrudReferenceSelectRow from "@/app/ui/shared/CrudReferenceSelectRow";
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

interface RepairButtonProps {
  disabled: boolean;
  onRepair: () => void;
}

const RepairButton = ({ disabled, onRepair }: RepairButtonProps) => (
  <Tooltip
    color="blue"
    title={!disabled ? "Repair this reference" : undefined}
    mouseEnterDelay={0.5}
  >
    <Button
      style={{
        height: "22px",
        width: "22px",
      }}
      onClick={onRepair}
      icon={
        <span className="text-black hover:text-blue-900 transition-colors">
          <PencilSquareIcon className="w-3" />
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

const getBrokenRefTitle = (ref?: Reference): string =>
  ref?.title || "Broken reference...";

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
    token: { colorError, colorText, colorTextSecondary },
  } = theme.useToken();
  const [gameSystem, selectedEdition] = useContext(GameSystemContext);

  const isKnownCollection = (colName: string): boolean =>
    (Object.values(CollectionRegistry) as string[]).includes(colName) ||
    allowedToRefer.includes(colName as CollectionName);

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
  const [repairingRefId, setRepairingRefId] = useState<string | null>(null);
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

  const resetSelectUi = () => {
    setSelectedEntityId(null);
    setLinkInput("");
    setShowingSelect(null);
    setRepairingRefId(null);
    setSelectOptions([]);
    setAvailableEntities([]);
    setDisableModal(false);
  };

  const applyLoadedSelectOptions = (entities: Playable[]) => {
    const sortedOptions = [...entities].sort((ent1, ent2) =>
      ent1.name.localeCompare(ent2.name),
    );
    setAvailableEntities(sortedOptions);
    setSelectOptions(
      sortedOptions.map((ent) => ({
        label: ent.name,
        value: ent._id,
      })),
    );
    setDisableModal(true);
  };

  const loadAvailableEntities = async (
    colName: CollectionName,
    excludeIds: string[],
  ): Promise<Playable[]> => {
    const excluded = excludeIds.includes(entityId)
      ? excludeIds
      : [...excludeIds, entityId];
    const entToRefs = await loadEntitiesForReferences(colName, excluded);
    return entToRefs.filter(
      (ent) => ent._id !== entityId && !references[ent._id],
    );
  };

  const markCollectionExhaustedIfEmpty = (
    colName: CollectionName,
    entities: Playable[],
  ) => {
    if (entities.length > 0) return false;
    if (!getPlayableScopeFilters(gameSystem, selectedEdition)) return true;
    setExhaustedCollections((prev) => new Set(prev).add(colName));
    return true;
  };

  const buildSelectedReference = (colName: CollectionName): Reference => {
    const selectedEntity = availableEntities.find(
      (ent) => ent._id === selectedEntityId,
    );
    return {
      name: colName,
      ...(linkInput.trim() && { link: linkInput.trim() }),
      ...(selectedEntity && { title: selectedEntity.name }),
    };
  };

  const appendLoadedEntity = (colName: CollectionName) => {
    const selectedEntity = availableEntities.find(
      (ent) => ent._id === selectedEntityId,
    );
    if (!selectedEntity) return;
    setLoadedEntities((prev) => ({
      ...prev,
      [colName]: [...(prev[colName] || []), selectedEntity],
    }));
  };

  const confirmSelect = (colName: CollectionName) => {
    if (!selectedEntityId) return;
    setReferences((prev) => {
      const next = { ...prev };
      if (repairingRefId) delete next[repairingRefId];
      next[selectedEntityId] = buildSelectedReference(colName);
      return next;
    });
    appendLoadedEntity(colName);
    const remaining = availableEntities.filter(
      (ent) => ent._id !== selectedEntityId,
    );
    markCollectionExhaustedIfEmpty(colName, remaining);
    if (!repairingRefId) setScrollToBottom(true);
    resetSelectUi();
  };

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

  const brokenRefCount = useMemo(() => {
    if (loading) return 0;

    let count = 0;
    for (const [colName, entIds] of Object.entries(groupedRefIds)) {
      if (loadingRef.current.has(colName) || entIds.length === 0) continue;

      const loadedIds = new Set(
        (loadedEntities[colName as CollectionName] || []).map((e) => e._id),
      );
      count += entIds.filter((id) => !loadedIds.has(id)).length;
    }
    return count;
  }, [groupedRefIds, loadedEntities, loading]);

  useEffect(() => {
    const entriesToLoad = Object.entries(groupedRefIds).filter(
      ([colName, entIds]) =>
        entIds.length > 0 &&
        isKnownCollection(colName) &&
        !loadingRef.current.has(colName),
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

        const loadedIds = new Set(entities.map((e) => e._id));
        const isUnknownCollection = !isKnownCollection(colName);
        const isCollectionLoaded =
          isUnknownCollection || (!loadingRef.current.has(colName) && !loading);
        const brokenIds = isCollectionLoaded
          ? entIds
              .filter((id) => !loadedIds.has(id))
              .sort((a, b) => {
                return getBrokenRefTitle(references[a]).localeCompare(
                  getBrokenRefTitle(references[b]),
                );
              })
          : [];

        const unknownCollectionTooltip = (
          <span>
            <span className="font-mono">{colName}</span>
            {" does not exist, please delete all entities"}
          </span>
        );
        const wrapUnknownCollection = (node: React.ReactNode) =>
          isUnknownCollection ? (
            <Tooltip
              color="white"
              title={unknownCollectionTooltip}
              styles={{ body: { color: colorError } }}
              mouseEnterDelay={0.5}
            >
              <div className="block w-full">{node}</div>
            </Tooltip>
          ) : (
            node
          );

        return {
          children: wrapUnknownCollection(
            <div className="-mt-5">
              {brokenIds.map((brokenId) => {
                const ref = references[brokenId];
                const title = getBrokenRefTitle(ref);
                if (repairingRefId === brokenId) {
                  return (
                    <CrudReferenceSelectRow
                      key={`${colName}-repair-${brokenId}`}
                      availableEntities={availableEntities}
                      selectOptions={selectOptions}
                      selectedEntityId={selectedEntityId}
                      linkInput={linkInput}
                      placeholder={title}
                      onSelect={setSelectedEntityId}
                      onLinkChange={setLinkInput}
                      onConfirm={() => confirmSelect(colName as CollectionName)}
                      onCancel={resetSelectUi}
                      className="pl-1 bg-red-200"
                    />
                  );
                }
                return (
                  <div
                    key={`${colName}-broken-${brokenId}`}
                    className="my-0.5 py-0.5 pl-12 flex items-center justify-between bg-red-200 hover:bg-red-400"
                  >
                    <span style={{ color: colorText }}>{title}</span>
                    <div className="flex items-center gap-1">
                      {ref?.link && (
                        <CrudReferenceLink.View
                          link={ref.link}
                          className="!bg-red-50 !mr-0"
                        />
                      )}
                      {isKnownCollection(colName) && (
                        <RepairButton
                          disabled={loading || disableModal}
                          onRepair={async () => {
                            const colNameTyped = colName as CollectionName;
                            const existingIds = (
                              groupedRefIds[colNameTyped] || []
                            ).filter((id) => id !== brokenId);
                            const filtered = await loadAvailableEntities(
                              colNameTyped,
                              existingIds,
                            );
                            if (
                              markCollectionExhaustedIfEmpty(
                                colNameTyped,
                                filtered,
                              )
                            ) {
                              return;
                            }
                            applyLoadedSelectOptions(filtered);
                            setRepairingRefId(brokenId);
                            setLinkInput(ref?.link ?? "");
                          }}
                        />
                      )}
                      <DeleteButton
                        onDelete={() => {
                          setReferences((prev) => {
                            const updated = { ...prev };
                            delete updated[brokenId];
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
              })}
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
                              onClick={
                                loading || disableModal
                                  ? undefined
                                  : () => {
                                      setEditingLinkId(ent._id);
                                      setDisableModal(true);
                                    }
                              }
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
                : !isCollectionLoaded
                  ? entIds.map((id) => (
                      <div
                        key={`${colName}-${id}`}
                        className="my-0.5 py-0.5 pl-12 flex items-center justify-between"
                      >
                        Loading...
                      </div>
                    ))
                  : null}
              {showingSelect === colName ? (
                <CrudReferenceSelectRow
                  availableEntities={availableEntities}
                  selectOptions={selectOptions}
                  selectedEntityId={selectedEntityId}
                  linkInput={linkInput}
                  placeholder="Select a new reference..."
                  onSelect={setSelectedEntityId}
                  onLinkChange={setLinkInput}
                  onConfirm={() => confirmSelect(colName as CollectionName)}
                  onCancel={resetSelectUi}
                />
              ) : (
                !exhaustedCollections.has(colName as CollectionName) &&
                !isUnknownCollection && (
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
                          const filtered = await loadAvailableEntities(
                            colNameTyped,
                            existingIds,
                          );
                          if (
                            markCollectionExhaustedIfEmpty(
                              colNameTyped,
                              filtered,
                            )
                          ) {
                            return;
                          }
                          applyLoadedSelectOptions(filtered);
                          setShowingSelect(colNameTyped);
                        }}
                        disabled={loading || disableModal}
                      >
                        Add more
                      </Button>
                    </Tooltip>
                  </div>
                )
              )}
            </div>,
          ),
          key: `reference-${colName}`,
          label: wrapUnknownCollection(
            <span>
              {entIds.length} <span className="font-mono">{colName}</span>
            </span>,
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
    colorError,
    colorText,
    colorTextSecondary,
    showingSelect,
    selectOptions,
    availableEntities,
    selectedEntityId,
    repairingRefId,
    exhaustedCollections,
    loadAvailableEntities,
    applyLoadedSelectOptions,
    markCollectionExhaustedIfEmpty,
    confirmSelect,
    resetSelectUi,
    oldReferences,
    references,
    allowedToRefer,
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
        <div>
          <span>
            {`'${entityName}' references `}
            <Spin spinning={loading} />
          </span>
          {brokenRefCount > 0 && (
            <div className="text-red-600 text-sm font-normal mt-1 pl-2">
              {brokenRefCount === 1
                ? "1 reference is broken"
                : `${brokenRefCount} references are broken`}
            </div>
          )}
        </div>
      }
      onOk={async () => {
        setLoading(true);
        try {
          const referencesWithTitles = { ...references };
          for (const [entId, ref] of Object.entries(referencesWithTitles)) {
            const entities = loadedEntities[ref.name] || [];
            const entity = entities.find((e) => e._id === entId);
            if (entity) {
              referencesWithTitles[entId] = { ...ref, title: entity.name };
            }
          }
          const result = await saveReferences(
            collectionName,
            entityId,
            referencesWithTitles,
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
          onOk(referencesWithTitles);
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
