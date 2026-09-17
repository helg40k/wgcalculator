import React, {
  useCallback,
  useContext,
  useEffect,
  useInsertionEffect,
  useMemo,
  useState,
} from "react";
import { CaretRightOutlined, ExclamationCircleFilled } from "@ant-design/icons";
import {
  ArrowPathIcon,
  PencilSquareIcon,
  TrashIcon,
} from "@heroicons/react/24/outline";
import {
  Button,
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
import CrudReferenceSelectRow from "@/app/ui/shared/CrudReferenceCounter/CrudReferenceSelectRow";
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

const MENTION_ERROR = "Sorry, something went wrong. Please try again";

interface PendingReassignment {
  collectionName: CollectionName;
  selectedEntityId: string;
  selectedName: string;
  link: string;
}

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
      style={{ height: "22px", width: "22px" }}
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

interface CancelMentionActionButtonProps {
  onCancelAction: () => void;
  name: string;
  disabled: boolean;
}

const CancelMentionActionButton = ({
  onCancelAction,
  name,
  disabled,
}: CancelMentionActionButtonProps) => (
  <Tooltip
    color="blue"
    title={!disabled ? `Cancel this ${name} action` : undefined}
    mouseEnterDelay={0.5}
  >
    <Button
      className="cancel-mention-action-btn"
      style={{ height: "22px", width: "22px" }}
      onClick={onCancelAction}
      icon={
        <span className="text-black hover:text-blue-900 transition-colors">
          <ArrowPathIcon className="w-3" />
        </span>
      }
      disabled={disabled}
    />
  </Tooltip>
);

interface ReassignButtonProps {
  disabled: boolean;
  name: string;
  onReassign: () => void;
}

const ReassignButton = ({
  disabled,
  name,
  onReassign,
}: ReassignButtonProps) => (
  <Tooltip
    color="blue"
    title={!disabled ? `Reassign this ${name}` : undefined}
    mouseEnterDelay={0.5}
  >
    <Button
      style={{ height: "22px", width: "22px" }}
      onClick={onReassign}
      icon={
        <span className="text-black hover:text-blue-900 transition-colors">
          <PencilSquareIcon className="w-3" />
        </span>
      }
      disabled={disabled}
    />
  </Tooltip>
);

interface EditReassignButtonProps {
  disabled: boolean;
  name: string;
  onEdit: () => void;
}

const EditReassignButton = ({
  disabled,
  name,
  onEdit,
}: EditReassignButtonProps) => (
  <Tooltip
    color="blue"
    title={!disabled ? `Edit this ${name}` : undefined}
    mouseEnterDelay={0.5}
  >
    <Button
      className="edit-reassign-btn"
      style={{ height: "22px", width: "22px" }}
      onClick={onEdit}
      icon={
        <span className="text-black hover:text-blue-900 transition-colors">
          <PencilSquareIcon className="w-3" />
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
    token: { colorWarning, colorError, colorTextSecondary },
  } = theme.useToken();
  const [, utils] = useContext(GameSystemContext);
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

  useInsertionEffect(() => {
    if (document.getElementById(COLLAPSE_DISABLED_STYLE_ID)) return;
    const style = document.createElement("style");
    style.id = COLLAPSE_DISABLED_STYLE_ID;
    style.textContent = COLLAPSE_DISABLED_CSS;
    document.head.appendChild(style);
  }, []);

  const loadMentionsFallback = useCallback(async () => {
    if (!entityId || !collectionName) return {};
    const canBeMentionedBy = utils.canBeMentionedBy(collectionName);
    const loaded = {} as Mentions;
    for (const mentionCollectionName of canBeMentionedBy) {
      loaded[mentionCollectionName] = await loadEntities<Playable>(
        mentionCollectionName,
        {
          filters: [[`references.${entityId}.name`, "==", collectionName]],
          withoutSort: true,
        },
      );
    }
    return loaded;
  }, [collectionName, entityId, loadEntities, utils]);

  const resetReassignState = useCallback(() => {
    setReassigningMentionId(null);
    setReassigningMentionCollection(null);
    setAvailableEntities([]);
    setSelectOptions([]);
    setSelectedEntityId(null);
    setLinkInput("");
  }, []);

  useEffect(() => {
    setRemovedMentionIds(new Set());
    setReassignedMentions({});
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

  const mentNumber = useMemo(
    () =>
      Object.values(mentions).reduce((total, array) => total + array.length, 0),
    [mentions],
  );
  const removedMentionCount = removedMentionIds.size;
  const hasMentions = mentionsReady && mentNumber > 0;
  const areControlsLocked = isSubmitting || !!reassigningMentionId;

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
      if (!collectionName || !entityId || isSubmitting) return;
      const sorted = await loadReplacementOptions(mention, mentionCollection);
      setAvailableEntities(sorted);
      setSelectOptions(
        sorted.map((ent) => ({ label: ent.name, value: ent._id })),
      );
      setSelectedEntityId(existing?.selectedEntityId ?? null);
      setLinkInput(existing?.link ?? "");
      setReassigningMentionCollection(mentionCollection);
      setReassigningMentionId(mention._id);
    },
    [collectionName, entityId, isSubmitting, loadReplacementOptions],
  );

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
            {entities
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
                    className={`my-0.5 py-0.5 pl-12 flex items-center justify-between ${mentionRowClassName(isRemoved, !!reassignment)}`}
                  >
                    <DescriptionTooltip
                      content={ent.description}
                      colorText={colorTextSecondary}
                    >
                      <span>{formatMentionLabel(ent.name, reassignment)}</span>
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
                        <CancelMentionActionButton
                          onCancelAction={() => cancelMentionAction(ent._id)}
                          name="mention"
                          disabled={areControlsLocked}
                        />
                      ) : reassignment ? (
                        <>
                          <EditReassignButton
                            disabled={areControlsLocked}
                            name="mention"
                            onEdit={() =>
                              startReassign(
                                ent,
                                colName as CollectionName,
                                reassignment,
                              )
                            }
                          />
                          <CancelMentionActionButton
                            onCancelAction={() => cancelMentionAction(ent._id)}
                            name="mention"
                            disabled={areControlsLocked}
                          />
                        </>
                      ) : (
                        <>
                          <ReassignButton
                            disabled={areControlsLocked}
                            name="mention"
                            onReassign={() =>
                              startReassign(ent, colName as CollectionName)
                            }
                          />
                          <DeleteButton
                            onDelete={() => markMentionRemoved(ent._id)}
                            name="mention"
                            disabled={areControlsLocked}
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
    reassignedMentions,
    reassigningMentionId,
    removedMentionIds,
    resetReassignState,
    selectOptions,
    selectedEntityId,
    startReassign,
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
    if (reassigningMentionId) return;
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
      okButtonProps={{ disabled: areControlsLocked }}
      cancelButtonProps={{ disabled: areControlsLocked }}
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
            {mentNumber} {mentNumber === 1 ? "mention is" : "mentions are"}{" "}
            found
            {removedMentionCount > 0 && ` (${removedMentionCount} removed)`}
          </div>
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
