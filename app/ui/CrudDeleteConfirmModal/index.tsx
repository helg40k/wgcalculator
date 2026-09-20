import React, {
  useCallback,
  useContext,
  useEffect,
  useInsertionEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { CaretRightOutlined, ExclamationCircleFilled } from "@ant-design/icons";
import {
  ArrowPathIcon,
  PencilSquareIcon,
  TrashIcon,
} from "@heroicons/react/24/outline";
import type { CheckboxProps } from "antd";
import {
  Button,
  Checkbox,
  Collapse,
  CollapseProps,
  Modal,
  Spin,
  theme,
  Tooltip,
} from "antd";

import { invalidateCollections } from "@/app/lib/collectionInvalidation";
import { GameSystemContext } from "@/app/lib/contexts/GameSystemContext";
import { MentionsContext } from "@/app/lib/contexts/MentionsContext";
import {
  CollectionName,
  EntityStatusRegistry,
  Mentions,
  Playable,
  Reference,
} from "@/app/lib/definitions";
import useEntities from "@/app/lib/hooks/useEntities";
import usePlayableReferences from "@/app/lib/hooks/usePlayableReferences";
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
const MENTION_CHECK_ALL_STYLE_ID = "mention-check-all-styles";
const MENTION_CHECK_ALL_CSS = `
  .mention-check-all:not(.ant-checkbox-wrapper-disabled) > span:not(.ant-checkbox) {
    color: var(--mention-check-all-color);
    transition: color 0.2s;
  }
  .mention-check-all:not(.ant-checkbox-wrapper-disabled):hover > span:not(.ant-checkbox) {
    color: var(--mention-check-all-hover);
  }
`;

const injectStyle = (id: string, css: string) => {
  if (document.getElementById(id)) return;
  const style = document.createElement("style");
  style.id = id;
  style.textContent = css;
  document.head.appendChild(style);
};

const MENTION_ERROR = "Sorry, something went wrong. Please try again";

interface PendingReassignment {
  collectionName: CollectionName;
  selectedEntityId: string;
  selectedName: string;
  link: string;
}

const mentionNoun = (count: number) => (count === 1 ? "mention" : "mentions");

const formatMentionActionSummary = (
  removedCount: number,
  reassignedCount: number,
) => {
  const parts: string[] = [];
  if (removedCount > 0) parts.push(`${removedCount} removed`);
  if (reassignedCount > 0) parts.push(`${reassignedCount} reassigned`);
  if (parts.length === 0) return "";
  return ` (${parts.join(", ")})`;
};

const formatMentionLabel = (
  mentionName: string,
  reassignment?: PendingReassignment,
) => {
  if (!reassignment) return mentionName;
  const details = reassignment.link
    ? `${reassignment.selectedName}, ${reassignment.link}`
    : reassignment.selectedName;
  return `${mentionName} (${details})`;
};

const mentionRowClassName = (isRemoved: boolean, isReassigned: boolean) => {
  if (isRemoved) {
    return "bg-red-200 hover:bg-red-100 has-[.cancel-mention-action-btn:hover]:bg-blue-100";
  }
  if (isReassigned) {
    return "bg-green-200 hover:bg-green-100 has-[.cancel-mention-action-btn:hover]:bg-blue-100";
  }
  return "hover:bg-blue-50";
};

const canApplyBulkReassignment = (mention: Playable, replacementId: string) => {
  if (mention._id === replacementId) return false;
  if (mention.references?.[replacementId]) return false;
  return true;
};

const buildBulkReassignments = (
  mentions: Mentions,
  selectedIds: Set<string>,
  replacementId: string,
  selectedName: string,
  link: string,
) => {
  const updates: Record<string, PendingReassignment> = {};
  for (const [colName, entities] of Object.entries(mentions)) {
    if (!entities?.length) continue;
    for (const ent of entities) {
      if (!selectedIds.has(ent._id)) continue;
      if (!canApplyBulkReassignment(ent, replacementId)) continue;
      updates[ent._id] = {
        collectionName: colName as CollectionName,
        link,
        selectedEntityId: replacementId,
        selectedName,
      };
    }
  }
  return updates;
};

interface MentionIconButtonProps {
  className?: string;
  color: string;
  disabled: boolean;
  hoverClassName: string;
  icon: React.ReactNode;
  onClick: () => void;
  title: string;
}

const MentionIconButton = ({
  className,
  color,
  disabled,
  hoverClassName,
  icon,
  onClick,
  title,
}: MentionIconButtonProps) => (
  <Tooltip
    color={color}
    mouseEnterDelay={0.5}
    title={!disabled ? title : undefined}
  >
    <Button
      className={className}
      disabled={disabled}
      icon={
        <span className={`text-black ${hoverClassName} transition-colors`}>
          {icon}
        </span>
      }
      onClick={onClick}
      style={{ height: "22px", width: "22px" }}
    />
  </Tooltip>
);

interface BulkActionLinkProps {
  children: React.ReactNode;
  color: string;
  disabled: boolean;
  onClick: () => void;
  title: string;
}

const BulkActionLink = ({
  children,
  color,
  disabled,
  onClick,
  title,
}: BulkActionLinkProps) => (
  <Tooltip
    color={color}
    mouseEnterDelay={0.5}
    title={!disabled ? title : undefined}
  >
    <Button
      className="h-auto px-0"
      disabled={disabled}
      onClick={onClick}
      size="small"
      style={{ height: "auto" }}
      type="link"
    >
      {children}
    </Button>
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
    styles={{ root: { maxWidth: "none" } }}
  >
    {children}
  </Tooltip>
);

interface CrudDeleteConfirmModalProps {
  open: boolean;
  singleName: string;
  entityName: string;
  entityId: string | null;
  collectionName?: CollectionName;
  onOk: () => void | Promise<void>;
  onCancel: () => void;
}

const CrudDeleteConfirmModal = ({
  open,
  singleName,
  entityName,
  entityId,
  collectionName,
  onOk,
  onCancel,
}: CrudDeleteConfirmModalProps) => {
  const {
    token: {
      colorError,
      colorLink,
      colorLinkHover,
      colorTextSecondary,
      colorWarning,
    },
  } = theme.useToken();
  const [, , utils] = useContext(GameSystemContext);
  const mentionsCtx = useContext(MentionsContext);
  const { loadEntities } = useEntities();
  const {
    loadEntitiesForReferences,
    reassignIncomingReferences,
    removeIncomingReferences,
  } = usePlayableReferences();

  const [mentions, setMentions] = useState<Mentions>({});
  const [mentionsReady, setMentionsReady] = useState(false);
  const [removedMentionIds, setRemovedMentionIds] = useState<Set<string>>(
    new Set(),
  );
  const [reassignedMentions, setReassignedMentions] = useState<
    Record<string, PendingReassignment>
  >({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(false);
  const [reassigningMentionId, setReassigningMentionId] = useState<
    string | null
  >(null);
  const [reassigningMentionCollection, setReassigningMentionCollection] =
    useState<CollectionName | null>(null);
  const [availableEntities, setAvailableEntities] = useState<Playable[]>([]);
  const [selectOptions, setSelectOptions] = useState<
    Array<{ label: string; value: string }>
  >([]);
  const [selectedEntityId, setSelectedEntityId] = useState<string | null>(null);
  const [linkInput, setLinkInput] = useState("");
  const [selectedMentionIds, setSelectedMentionIds] = useState<Set<string>>(
    new Set(),
  );
  const [isBulkReassigning, setIsBulkReassigning] = useState(false);
  const replacementLoadIdRef = useRef(0);

  const nextReplacementLoadId = () => {
    replacementLoadIdRef.current += 1;
    return replacementLoadIdRef.current;
  };

  const isCurrentReplacementLoad = (loadId: number) =>
    loadId === replacementLoadIdRef.current;

  useInsertionEffect(() => {
    injectStyle(COLLAPSE_DISABLED_STYLE_ID, COLLAPSE_DISABLED_CSS);
    injectStyle(MENTION_CHECK_ALL_STYLE_ID, MENTION_CHECK_ALL_CSS);
  }, []);

  const loadMentionsFallback = useCallback(async () => {
    if (!entityId || !collectionName) return {};
    const canBeMentionedBy = utils.canBeMentionedBy(collectionName);
    const entries = await Promise.all(
      canBeMentionedBy.map(async (mentionCollectionName) => {
        const entities = await loadEntities<Playable>(mentionCollectionName, {
          filters: [[`references.${entityId}.name`, "==", collectionName]],
          withoutSort: true,
        });
        return [mentionCollectionName, entities] as const;
      }),
    );
    return Object.fromEntries(entries) as Mentions;
  }, [collectionName, entityId, loadEntities, utils]);

  const resetReassignState = useCallback(() => {
    replacementLoadIdRef.current += 1;
    setReassigningMentionId(null);
    setReassigningMentionCollection(null);
    setAvailableEntities([]);
    setSelectOptions([]);
    setSelectedEntityId(null);
    setLinkInput("");
    setIsBulkReassigning(false);
  }, []);

  const setReplacementOptions = (sorted: Playable[]) => {
    setAvailableEntities(sorted);
    setSelectOptions(
      sorted.map((ent) => ({ label: ent.name, value: ent._id })),
    );
  };

  useEffect(() => {
    setRemovedMentionIds(new Set());
    setReassignedMentions({});
    setSelectedMentionIds(new Set());
    setSubmitError(false);
    resetReassignState();
  }, [open, entityId, resetReassignState]);

  const getMentions = mentionsCtx?.getMentions;
  const contextMentionsLoaded = mentionsCtx?.mentionsLoaded;

  useEffect(() => {
    if (!open || !entityId || !collectionName) {
      setMentions({});
      setMentionsReady(false);
    }
  }, [open, entityId, collectionName]);

  useEffect(() => {
    if (!open || !entityId || !collectionName) return;
    if (getMentions) {
      setMentions(getMentions(entityId));
      setMentionsReady(!!contextMentionsLoaded);
      return;
    }
    let cancelled = false;
    setMentionsReady(false);
    loadMentionsFallback().then((loaded) => {
      if (!cancelled) {
        setMentions(loaded);
        setMentionsReady(true);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [
    open,
    entityId,
    collectionName,
    getMentions,
    contextMentionsLoaded,
    loadMentionsFallback,
  ]);

  const mentionIds = useMemo(
    () =>
      Object.values(mentions).flatMap((entities) =>
        entities.map((ent) => ent._id),
      ),
    [mentions],
  );

  useEffect(() => {
    const validIds = new Set(mentionIds);
    setSelectedMentionIds((prev) => {
      const next = new Set([...prev].filter((id) => validIds.has(id)));
      if (next.size === prev.size && [...next].every((id) => prev.has(id))) {
        return prev;
      }
      return next;
    });
  }, [mentionIds]);
  const mentNumber = mentionIds.length;
  const removedMentionCount = removedMentionIds.size;
  const reassignedMentionCount = Object.keys(reassignedMentions).length;
  const unreviewedMentionCount =
    mentNumber - removedMentionCount - reassignedMentionCount;
  const hasMentions = mentionsReady && mentNumber > 0;
  const areControlsLocked =
    isSubmitting || !!reassigningMentionId || isBulkReassigning;
  const isOkDisabled = areControlsLocked || unreviewedMentionCount > 0;
  const isAllMentionsSelected =
    mentionIds.length > 0 && selectedMentionIds.size === mentionIds.length;
  const isSomeMentionsSelected =
    selectedMentionIds.size > 0 && !isAllMentionsSelected;
  const hasSelectedNotRemovedMention = [...selectedMentionIds].some(
    (id) => !removedMentionIds.has(id),
  );
  const hasSelectedNonDefaultMention = [...selectedMentionIds].some(
    (id) => removedMentionIds.has(id) || id in reassignedMentions,
  );
  const isDeleteAllDisabled =
    areControlsLocked || !hasSelectedNotRemovedMention;
  const isCancelAllDisabled =
    areControlsLocked || !hasSelectedNonDefaultMention;
  const isReassignAllDisabled =
    areControlsLocked || selectedMentionIds.size === 0;

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

  const reassignedMentionUpdates = useMemo(() => {
    if (!collectionName) return [];
    return Object.entries(reassignedMentions).map(
      ([documentId, assignment]) => {
        const reference: Reference = {
          name: collectionName,
          title: assignment.selectedName,
          ...(assignment.link ? { link: assignment.link } : {}),
        };
        return {
          collectionName: assignment.collectionName,
          documentId,
          newReferencedId: assignment.selectedEntityId,
          reference,
        };
      },
    );
  }, [collectionName, reassignedMentions]);

  const mentionExpandedKeys = useMemo(
    () =>
      Object.entries(mentions)
        .filter(([, entities]) => entities.length)
        .map(([colName]) => `mention-${colName}`),
    [mentions],
  );

  const markMentionRemoved = (id: string) => {
    setRemovedMentionIds((prev) => new Set(prev).add(id));
  };

  const toggleMentionSelected = useCallback((id: string) => {
    setSelectedMentionIds((prev) => {
      if (prev.has(id)) {
        const updated = new Set(prev);
        updated.delete(id);
        return updated;
      }
      return new Set(prev).add(id);
    });
  }, []);

  const onCheckAllMentions: CheckboxProps["onChange"] = (event) => {
    setSelectedMentionIds(
      event.target.checked ? new Set(mentionIds) : new Set(),
    );
  };

  const deleteSelectedMentions = () => {
    const ids = [...selectedMentionIds];
    if (ids.length === 0) return;
    setRemovedMentionIds((prev) => {
      const updated = new Set(prev);
      ids.forEach((id) => updated.add(id));
      return updated;
    });
    setReassignedMentions((prev) => {
      if (!ids.some((id) => id in prev)) return prev;
      const next = { ...prev };
      ids.forEach((id) => {
        delete next[id];
      });
      return next;
    });
  };

  const cancelSelectedMentionActions = () => {
    const ids = [...selectedMentionIds];
    if (ids.length === 0) return;
    setRemovedMentionIds((prev) => {
      const updated = new Set(prev);
      ids.forEach((id) => updated.delete(id));
      return updated;
    });
    setReassignedMentions((prev) => {
      if (!ids.some((id) => id in prev)) return prev;
      const next = { ...prev };
      ids.forEach((id) => {
        delete next[id];
      });
      return next;
    });
  };

  const cancelMentionAction = useCallback((id: string) => {
    setRemovedMentionIds((prev) => {
      const updated = new Set(prev);
      updated.delete(id);
      return updated;
    });
    setReassignedMentions((prev) => {
      if (!(id in prev)) return prev;
      const next = { ...prev };
      delete next[id];
      return next;
    });
  }, []);

  const loadReplacementOptions = useCallback(
    async (mention: Playable, mentionCollection: CollectionName) => {
      if (!collectionName || !entityId) return [];
      const excluded = new Set<string>([entityId]);
      if (mentionCollection === collectionName) excluded.add(mention._id);
      Object.keys(mention.references ?? {}).forEach((id) => excluded.add(id));
      const excludedIds = [...excluded];
      const loaded = await loadEntitiesForReferences<Playable>(
        collectionName,
        excludedIds,
      );
      return loaded
        .filter((ent) => !excluded.has(ent._id))
        .sort((ent1, ent2) => ent1.name.localeCompare(ent2.name));
    },
    [collectionName, entityId, loadEntitiesForReferences],
  );

  const startReassign = useCallback(
    async (
      mention: Playable,
      mentionCollection: CollectionName,
      existing?: PendingReassignment,
    ) => {
      if (!collectionName || !entityId || isSubmitting || isBulkReassigning) {
        return;
      }
      const loadId = nextReplacementLoadId();
      setReassigningMentionCollection(mentionCollection);
      setReassigningMentionId(mention._id);
      setSelectedEntityId(existing?.selectedEntityId ?? null);
      setLinkInput(existing?.link ?? "");
      setReplacementOptions([]);
      try {
        const sorted = await loadReplacementOptions(mention, mentionCollection);
        if (!isCurrentReplacementLoad(loadId)) return;
        setReplacementOptions(sorted);
      } catch {
        if (!isCurrentReplacementLoad(loadId)) return;
        resetReassignState();
      }
    },
    [
      collectionName,
      entityId,
      isBulkReassigning,
      isSubmitting,
      loadReplacementOptions,
      resetReassignState,
    ],
  );

  const startBulkReassign = useCallback(async () => {
    if (!collectionName || !entityId || isSubmitting) return;
    if (reassigningMentionId || isBulkReassigning) return;
    const loadId = nextReplacementLoadId();
    setIsBulkReassigning(true);
    setSelectedEntityId(null);
    setLinkInput("");
    setReplacementOptions([]);
    try {
      const excluded = [entityId];
      const loaded = await loadEntitiesForReferences<Playable>(
        collectionName,
        excluded,
      );
      if (!isCurrentReplacementLoad(loadId)) return;
      const sorted = loaded
        .filter((ent) => ent._id !== entityId)
        .sort((ent1, ent2) => ent1.name.localeCompare(ent2.name));
      setReplacementOptions(sorted);
    } catch {
      if (!isCurrentReplacementLoad(loadId)) return;
      resetReassignState();
    }
  }, [
    collectionName,
    entityId,
    isBulkReassigning,
    isSubmitting,
    loadEntitiesForReferences,
    reassigningMentionId,
    resetReassignState,
  ]);

  const confirmBulkReassign = () => {
    if (!isBulkReassigning || !selectedEntityId) return;
    const selected = availableEntities.find(
      (ent) => ent._id === selectedEntityId,
    );
    if (!selected) return;
    const updates = buildBulkReassignments(
      mentions,
      selectedMentionIds,
      selectedEntityId,
      selected.name,
      linkInput.trim(),
    );
    const appliedIds = Object.keys(updates);
    if (appliedIds.length > 0) {
      setReassignedMentions((prev) => ({ ...prev, ...updates }));
      setRemovedMentionIds((prev) => {
        const updated = new Set(prev);
        appliedIds.forEach((id) => updated.delete(id));
        return updated;
      });
    }
    resetReassignState();
  };

  const confirmReassign = useCallback(() => {
    if (!reassigningMentionId || !selectedEntityId) return;
    if (!reassigningMentionCollection) return;
    const selected = availableEntities.find(
      (ent) => ent._id === selectedEntityId,
    );
    if (!selected) return;
    setReassignedMentions((prev) => ({
      ...prev,
      [reassigningMentionId]: {
        collectionName: reassigningMentionCollection,
        link: linkInput.trim(),
        selectedEntityId,
        selectedName: selected.name,
      },
    }));
    setRemovedMentionIds((prev) => {
      if (!prev.has(reassigningMentionId)) return prev;
      const updated = new Set(prev);
      updated.delete(reassigningMentionId);
      return updated;
    });
    resetReassignState();
  }, [
    availableEntities,
    linkInput,
    reassigningMentionCollection,
    reassigningMentionId,
    resetReassignState,
    selectedEntityId,
  ]);

  const mentionCollections: CollapseProps["items"] = useMemo(() => {
    return Object.entries(mentions)
      .filter(([, entities]) => entities.length)
      .sort(([colName1], [colName2]) => colName1.localeCompare(colName2))
      .map(([colName, entities]) => ({
        children: (
          <div className="-mt-5">
            {[...entities]
              .sort((ent1, ent2) => ent1.name.localeCompare(ent2.name))
              .map((ent) => {
                const isRemoved = removedMentionIds.has(ent._id);
                const reassignment = reassignedMentions[ent._id];
                if (reassigningMentionId === ent._id) {
                  return (
                    <CrudReferenceSelectRow
                      key={`${colName}-${ent._id}`}
                      availableEntities={availableEntities}
                      className="pl-1"
                      linkInput={linkInput}
                      onCancel={resetReassignState}
                      onConfirm={confirmReassign}
                      onLinkChange={setLinkInput}
                      onSelect={setSelectedEntityId}
                      placeholder="Select a replacement..."
                      selectOptions={selectOptions}
                      selectedEntityId={selectedEntityId}
                    />
                  );
                }
                return (
                  <div
                    key={`${colName}-${ent._id}`}
                    className={`my-0.5 py-0.5 ${mentNumber > 1 ? "pl-6" : "pl-12"} flex items-center justify-between ${mentionRowClassName(isRemoved, !!reassignment)}`}
                  >
                    <div className="flex items-start gap-3">
                      {mentNumber > 1 && (
                        <Checkbox
                          checked={selectedMentionIds.has(ent._id)}
                          data-testid="mention-checkbox"
                          disabled={areControlsLocked}
                          onChange={() => toggleMentionSelected(ent._id)}
                        />
                      )}
                      <DescriptionTooltip
                        content={ent.description}
                        colorText={colorTextSecondary}
                      >
                        <span>
                          {formatMentionLabel(ent.name, reassignment)}
                        </span>
                      </DescriptionTooltip>
                    </div>
                    <div className="flex items-center gap-1">
                      {ent.status !== EntityStatusRegistry.ACTIVE && (
                        <EntityStatusUI.Tag
                          entityId={ent._id}
                          status={ent.status}
                          editable={false}
                        />
                      )}
                      {isRemoved ? (
                        <MentionIconButton
                          className="cancel-mention-action-btn"
                          color="blue"
                          disabled={areControlsLocked}
                          hoverClassName="hover:text-blue-900"
                          icon={<ArrowPathIcon className="w-3" />}
                          onClick={() => cancelMentionAction(ent._id)}
                          title="Cancel removing"
                        />
                      ) : reassignment ? (
                        <>
                          <MentionIconButton
                            className="edit-reassign-btn"
                            color="blue"
                            disabled={areControlsLocked}
                            hoverClassName="hover:text-blue-900"
                            icon={<PencilSquareIcon className="w-3" />}
                            onClick={() => {
                              void startReassign(
                                ent,
                                colName as CollectionName,
                                reassignment,
                              );
                            }}
                            title="Edit reassigned mention"
                          />
                          <MentionIconButton
                            className="cancel-mention-action-btn"
                            color="blue"
                            disabled={areControlsLocked}
                            hoverClassName="hover:text-blue-900"
                            icon={<ArrowPathIcon className="w-3" />}
                            onClick={() => cancelMentionAction(ent._id)}
                            title="Cancel reassigning"
                          />
                        </>
                      ) : (
                        <>
                          <MentionIconButton
                            color="blue"
                            disabled={areControlsLocked}
                            hoverClassName="hover:text-blue-900"
                            icon={<PencilSquareIcon className="w-3" />}
                            onClick={() => {
                              void startReassign(
                                ent,
                                colName as CollectionName,
                              );
                            }}
                            title="Reassign mention"
                          />
                          <MentionIconButton
                            color="darkRed"
                            disabled={areControlsLocked}
                            hoverClassName="hover:text-red-900"
                            icon={<TrashIcon className="w-3" />}
                            onClick={() => markMentionRemoved(ent._id)}
                            title="Remove mention"
                          />
                        </>
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
      }));
  }, [
    availableEntities,
    cancelMentionAction,
    colorTextSecondary,
    confirmReassign,
    areControlsLocked,
    linkInput,
    mentions,
    mentNumber,
    reassignedMentions,
    reassigningMentionId,
    removedMentionIds,
    resetReassignState,
    selectOptions,
    selectedEntityId,
    selectedMentionIds,
    startReassign,
    toggleMentionSelected,
  ]);

  const applyMentionRemovals = async (): Promise<boolean> => {
    if (!entityId || removedMentionUpdates.length === 0) return true;
    return removeIncomingReferences(entityId, removedMentionUpdates);
  };

  const applyMentionReassignments = async (): Promise<boolean> => {
    if (!entityId || reassignedMentionUpdates.length === 0) return true;
    return reassignIncomingReferences(entityId, reassignedMentionUpdates);
  };

  const invalidateMentionCollections = () => {
    const affected = [
      ...new Set([
        ...removedMentionUpdates.map((u) => u.collectionName),
        ...reassignedMentionUpdates.map((u) => u.collectionName),
      ]),
    ];
    if (affected.length > 0) invalidateCollections(affected);
    mentionsCtx?.reloadMentions();
  };

  const applyMentionOps = async (): Promise<boolean> => {
    if (!(await applyMentionRemovals())) return false;
    if (!(await applyMentionReassignments())) return false;
    if (
      removedMentionUpdates.length > 0 ||
      reassignedMentionUpdates.length > 0
    ) {
      invalidateMentionCollections();
    }
    return true;
  };

  const handleOk = async () => {
    if (reassigningMentionId || isBulkReassigning || unreviewedMentionCount > 0)
      return;
    setSubmitError(false);
    setIsSubmitting(true);
    try {
      const mentionsOk = await applyMentionOps();
      if (!mentionsOk) {
        setSubmitError(true);
        return;
      }
      await onOk();
      onCancel();
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    if (areControlsLocked) return;
    onCancel();
  };

  return (
    <Modal
      open={open}
      closable={false}
      title={null}
      okText="Delete"
      onOk={handleOk}
      onCancel={handleCancel}
      width={580}
      maskClosable={false}
      keyboard={false}
      okButtonProps={{ disabled: isOkDisabled }}
      cancelButtonProps={{ disabled: areControlsLocked }}
      footer={(_, { OkBtn, CancelBtn }) => (
        <div className="flex items-center justify-between gap-4">
          <div style={{ color: colorError }}>
            {unreviewedMentionCount > 0 && (
              <>
                Unreviewed {mentionNoun(unreviewedMentionCount)}:{" "}
                {unreviewedMentionCount}
              </>
            )}
          </div>
          <div className="flex gap-2">
            <CancelBtn />
            <OkBtn />
          </div>
        </div>
      )}
    >
      <div className="flex items-start gap-4">
        <ExclamationCircleFilled
          className="mt-0.5 shrink-0 text-[22px] leading-none"
          style={{ color: colorWarning }}
        />
        <div>
          <div className="text-base font-semibold">
            Delete {singleName} <Spin spinning={isSubmitting} />
          </div>
          <div className="mt-6">
            The item <b>&#39;{entityName}&#39;</b> will be deleted.
            <br />
            Are you sure?
          </div>
          {hasMentions && (
            <div className="mt-2">
              {mentNumber === 1
                ? "The item is mentioned once. "
                : `The item is mentioned ${mentNumber} times. `}
              Please address the mentions before deleting.
            </div>
          )}
        </div>
      </div>
      {hasMentions && (
        <div className="mt-6">
          {submitError && (
            <div className="mb-2" style={{ color: colorError }}>
              {MENTION_ERROR}
            </div>
          )}
          <div className="font-bold">
            {mentNumber} {mentionNoun(mentNumber)}
            {formatMentionActionSummary(
              removedMentionCount,
              reassignedMentionCount,
            )}
          </div>
          {mentNumber > 1 && (
            <>
              <div className="mt-2 pl-10 flex items-center gap-4">
                <Checkbox
                  checked={isAllMentionsSelected}
                  className="mention-check-all"
                  data-testid="mention-check-all"
                  disabled={areControlsLocked}
                  indeterminate={isSomeMentionsSelected}
                  onChange={onCheckAllMentions}
                  style={
                    {
                      // Link tokens; custom properties are not on CSSProperties
                      "--mention-check-all-color": colorLink,
                      "--mention-check-all-hover": colorLinkHover,
                    } as React.CSSProperties
                  }
                >
                  Check all
                </Checkbox>
                <BulkActionLink
                  color="blue"
                  disabled={isReassignAllDisabled}
                  onClick={() => {
                    void startBulkReassign();
                  }}
                  title="Reassign all selected mentions"
                >
                  Reassign all
                </BulkActionLink>
                <BulkActionLink
                  color="darkRed"
                  disabled={isDeleteAllDisabled}
                  onClick={deleteSelectedMentions}
                  title="Remove all selected mentions"
                >
                  Delete all
                </BulkActionLink>
                <BulkActionLink
                  color="blue"
                  disabled={isCancelAllDisabled}
                  onClick={cancelSelectedMentionActions}
                  title="Cancel for all selected mentions"
                >
                  Cancel all
                </BulkActionLink>
              </div>
              {isBulkReassigning && (
                <CrudReferenceSelectRow
                  availableEntities={availableEntities}
                  className="mt-2 pl-10"
                  linkInput={linkInput}
                  onCancel={resetReassignState}
                  onConfirm={confirmBulkReassign}
                  onLinkChange={setLinkInput}
                  onSelect={setSelectedEntityId}
                  placeholder="Select a replacement..."
                  selectOptions={selectOptions}
                  selectedEntityId={selectedEntityId}
                />
              )}
            </>
          )}
          <div style={{ maxHeight: "224px", overflowY: "auto" }}>
            <div className={areControlsLocked ? "collapse-disabled" : ""}>
              <Collapse
                ghost
                items={mentionCollections}
                expandIcon={({ isActive }) => (
                  <CaretRightOutlined rotate={isActive ? 90 : 0} />
                )}
                defaultActiveKey={mentionExpandedKeys}
                onChange={areControlsLocked ? () => {} : undefined}
              />
            </div>
          </div>
        </div>
      )}
    </Modal>
  );
};

export default CrudDeleteConfirmModal;
