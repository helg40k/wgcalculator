import {
  memo,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { createRoot } from "react-dom/client";
import {
  ArrowUturnRightIcon,
  PaperClipIcon,
} from "@heroicons/react/24/outline";
import { theme, Tooltip } from "antd";

import { invalidateCollections } from "@/app/lib/collectionInvalidation";
import { GameSystemContext } from "@/app/lib/contexts/GameSystemContext";
import { MentionsContext } from "@/app/lib/contexts/MentionsContext";
import {
  CollectionName,
  Mentions,
  Playable,
  References,
} from "@/app/lib/definitions";
import useEntities from "@/app/lib/hooks/useEntities";
import { EntitiesUpdateContext } from "@/app/ui/CrudMultiLineView";
import CrudReferenceModal from "@/app/ui/shared/CrudReferenceCounter/CrudReferenceModal";

const getCalculatedCollections = (collectionNames: CollectionName[]) => {
  const result: Partial<Record<CollectionName, number>> = {};
  for (const collName of collectionNames) {
    result[collName] = (result[collName] || 0) + 1;
  }
  return result;
};

interface ReferenceCounterProps<T extends Playable = Playable> {
  entity: T;
  collectionName: CollectionName;
  viewOnly?: boolean;
}

const ReferenceCounter = ({
  entity,
  collectionName,
  viewOnly = false,
}: ReferenceCounterProps) => {
  const {
    token: {
      colorText,
      colorTextSecondary,
      colorTextTertiary,
      colorTextDisabled,
    },
  } = theme.useToken();
  const [, utils] = useContext(GameSystemContext);
  const mentionsCtx = useContext(MentionsContext);
  const { loadEntities } = useEntities();
  const entitiesCtx = useContext(EntitiesUpdateContext);
  const [currentReferences, setCurrentReferences] = useState<References>(
    entity.references || {},
  );

  const entityReferencesKey = useMemo(
    () => JSON.stringify(entity.references ?? {}),
    [entity.references],
  );

  useEffect(() => {
    setCurrentReferences(entity.references || {});
    // eslint-disable-next-line react-hooks/exhaustive-deps -- entity.references is compared via entityReferencesKey for deep equality
  }, [entity._id, entityReferencesKey]);

  const [mentions, setMentions] = useState<Mentions>({});
  const [mentionsLoaded, setMentionsLoaded] = useState(false);

  const mentNumberCacheKey = `mentNumber_${entity._id}_${collectionName}`;

  const mentionsVersion = entitiesCtx?.mentionsVersion ?? 0;

  const loadMentions = useCallback(async () => {
    const canBeMentionedBy = utils.canBeMentionedBy(collectionName);
    const loadedMentions = {} as Mentions;
    for (const mentionCollectionName of canBeMentionedBy) {
      loadedMentions[mentionCollectionName] = await loadEntities<Playable>(
        mentionCollectionName,
        {
          filters: [[`references.${entity._id}.name`, "==", collectionName]],
          withoutSort: true,
        },
      );
    }
    setMentions(loadedMentions);
    setMentionsLoaded(true);
  }, [collectionName, entity._id, loadEntities, utils]);

  useEffect(() => {
    if (mentionsCtx) {
      setMentions(mentionsCtx.getMentions(entity._id));
      if (mentionsCtx.mentionsLoaded) {
        setMentionsLoaded(true);
      }
    } else {
      loadMentions();
    }
  }, [mentionsCtx, entity._id, loadMentions, mentionsVersion]);

  const allowedToRefer = useMemo(() => {
    return utils.getAllowedToRefer(collectionName);
  }, [collectionName, utils]);

  const refNumber = useMemo(() => {
    return Object.keys(currentReferences).length;
  }, [currentReferences]);

  const mentNumber = useMemo(() => {
    return Object.values(mentions).reduce(
      (total, array) => total + array.length,
      0,
    );
  }, [mentions]);

  useEffect(() => {
    if (mentionsLoaded) {
      localStorage.setItem(mentNumberCacheKey, mentNumber.toString());
    }
  }, [mentNumber, mentionsLoaded, mentNumberCacheKey]);

  // Before first load completes, show cached value to avoid 0→N flash
  const cachedStr = localStorage.getItem(mentNumberCacheKey);
  const cachedMentNumber = cachedStr ? parseInt(cachedStr, 10) : 0;
  const displayMentNumber =
    !mentionsLoaded && cachedMentNumber > 0 ? cachedMentNumber : mentNumber;

  const refMessage = useMemo(() => {
    return refNumber === 1 ? "1 reference" : `${refNumber} references`;
  }, [refNumber]);

  const mentMessage = useMemo(() => {
    return displayMentNumber === 1
      ? "1 outer mention"
      : `${displayMentNumber} outer mentions`;
  }, [displayMentNumber]);

  const renderTooltipCollectionList = (collections: CollectionName[]) => {
    return Object.entries(getCalculatedCollections(collections))
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([collName, quantity]) => (
        <div key={collName} className="text-xs ml-10">
          {quantity} <span className="font-mono">{collName}</span>
        </div>
      ));
  };

  const tooltipBody = useMemo(
    () => (
      <div style={{ color: colorText }}>
        <div className="ml-4">{refMessage} added</div>
        {refNumber > 0 &&
          renderTooltipCollectionList(
            Object.values(currentReferences).map((ref) => ref.name),
          )}
        <div className="ml-4">{mentMessage} found</div>
        {mentNumber > 0 &&
          renderTooltipCollectionList(
            Object.entries(mentions).flatMap(([collName, entities]) =>
              entities.map(() => collName as CollectionName),
            ),
          )}
        {!viewOnly && (
          <div className="mt-2 text-xs" style={{ color: colorTextDisabled }}>
            *Click to manage or get to know more
          </div>
        )}
      </div>
    ),
    [
      colorText,
      colorTextDisabled,
      refMessage,
      refNumber,
      mentMessage,
      mentNumber,
      currentReferences,
      mentions,
      viewOnly,
    ],
  );

  const onClick = () => {
    // Don't open modal if in viewOnly mode
    if (viewOnly) {
      return;
    }

    const modalContainer = document.createElement("div");
    document.body.appendChild(modalContainer);

    const root = createRoot(modalContainer);

    const closeModal = () => {
      root.unmount();
      document.body.removeChild(modalContainer);
    };

    const handleSaved = (references: References) => {
      setCurrentReferences(references);
      entitiesCtx?.updateEntity(entity._id, { references });
      void entitiesCtx?.reloadEntities?.();
      if (mentionsCtx) {
        mentionsCtx.reloadMentions();
      } else {
        void loadMentions();
      }

      const oldCollNames = Object.values(currentReferences).map((r) => r.name);
      const newCollNames = Object.values(references).map((r) => r.name);
      const affected = [...new Set([...oldCollNames, ...newCollNames])];
      if (affected.length > 0) {
        invalidateCollections(affected);
      }

      closeModal();
    };

    root.render(
      <CrudReferenceModal
        showModal={true}
        entityId={entity._id}
        entityName={entity.name}
        onOk={handleSaved}
        onCancel={closeModal}
        references={currentReferences}
        mentions={mentions}
        collectionName={collectionName}
        allowedToRefer={allowedToRefer}
      />,
    );
  };

  return (
    <div
      className={`flex p-0.5 text-nowrap justify-start w-fit ${viewOnly ? "cursor-default" : "cursor-pointer"}`}
      style={{ color: colorTextSecondary }}
      onClick={onClick}
    >
      <Tooltip title={tooltipBody} color="white" mouseEnterDelay={0.5}>
        <div
          className="flex items-center"
          style={refNumber === 0 ? { color: colorTextTertiary } : undefined}
        >
          <PaperClipIcon className="h-3.5" />
          <span className="pl-0.5">{refMessage}</span>
        </div>
        {displayMentNumber > 0 && (
          <div className="flex items-center">
            <ArrowUturnRightIcon className="h-3.5" />
            <span className="pl-0.5">{mentMessage}</span>
          </div>
        )}
      </Tooltip>
    </div>
  );
};

export default memo(ReferenceCounter, (prevProps, nextProps) => {
  return (
    prevProps.entity._id === nextProps.entity._id &&
    prevProps.collectionName === nextProps.collectionName &&
    prevProps.viewOnly === nextProps.viewOnly &&
    JSON.stringify(prevProps.entity.references) ===
      JSON.stringify(nextProps.entity.references)
  );
});
