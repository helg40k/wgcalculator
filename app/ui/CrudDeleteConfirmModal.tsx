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
} from "@/app/lib/definitions";
import useEntities from "@/app/lib/hooks/useEntities";
import usePlayableReferences from "@/app/lib/hooks/usePlayableReferences";
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

interface ReasignButtonProps {
  disabled: boolean;
  name: string;
}

const ReasignButton = ({ disabled, name }: ReasignButtonProps) => (
  <Tooltip
    color="blue"
    title={!disabled ? `Reassign this ${name}` : undefined}
    mouseEnterDelay={0.5}
  >
    <Button
      style={{ height: "22px", width: "22px" }}
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
  const { removeIncomingReferences } = usePlayableReferences();

  const [mentions, setMentions] = useState<Mentions>({});
  const [mentionsReady, setMentionsReady] = useState(false);
  const [removedMentionIds, setRemovedMentionIds] = useState<Set<string>>(
    new Set(),
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(false);

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

  useEffect(() => {
    setRemovedMentionIds(new Set());
    setSubmitError(false);
  }, [open, entityId]);

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

  const cancelMentionAction = (id: string) => {
    setRemovedMentionIds((prev) => {
      const updated = new Set(prev);
      updated.delete(id);
      return updated;
    });
  };

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
                return (
                  <div
                    key={`${colName}-${ent._id}`}
                    className={`my-0.5 py-0.5 pl-12 flex items-center justify-between ${isRemoved ? "bg-red-200 hover:bg-red-100 has-[.cancel-mention-action-btn:hover]:bg-blue-100" : "hover:bg-blue-50"}`}
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
                        <CancelMentionActionButton
                          onCancelAction={() => cancelMentionAction(ent._id)}
                          name="mention"
                          disabled={isSubmitting}
                        />
                      ) : (
                        <>
                          <ReasignButton
                            disabled={isSubmitting}
                            name="mention"
                          />
                          <DeleteButton
                            onDelete={() => markMentionRemoved(ent._id)}
                            name="mention"
                            disabled={isSubmitting}
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
  }, [mentions, colorTextSecondary, removedMentionIds, isSubmitting]);

  const applyMentionRemovals = async (): Promise<boolean> => {
    if (!entityId || removedMentionUpdates.length === 0) return true;
    const ok = await removeIncomingReferences(entityId, removedMentionUpdates);
    if (!ok) return false;
    const affected = [
      ...new Set(removedMentionUpdates.map((u) => u.collectionName)),
    ];
    if (affected.length > 0) invalidateCollections(affected);
    mentionsCtx?.reloadMentions();
    return true;
  };

  const handleOk = async () => {
    setSubmitError(false);
    setIsSubmitting(true);
    try {
      const mentionsOk = await applyMentionRemovals();
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
    if (isSubmitting) return;
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
      okButtonProps={{ disabled: isSubmitting }}
      cancelButtonProps={{ disabled: isSubmitting }}
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
          <div className="mt-2">
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
            <div className={isSubmitting ? "collapse-disabled" : ""}>
              <Collapse
                ghost
                items={mentionCollections}
                expandIcon={({ isActive }) => (
                  <CaretRightOutlined rotate={isActive ? 90 : 0} />
                )}
                defaultActiveKey={mentionExpandedKeys}
                onChange={isSubmitting ? () => {} : undefined}
              />
            </div>
          </div>
        </div>
      )}
    </Modal>
  );
};

export default CrudDeleteConfirmModal;
