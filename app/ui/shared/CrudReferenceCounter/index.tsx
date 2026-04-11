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
import { SessionProvider, useSession } from "next-auth/react";

import { GameSystemContext } from "@/app/lib/contexts/GameSystemContext";
import {
  CollectionName,
  Mentions,
  Playable,
  References,
} from "@/app/lib/definitions";
import useEntities from "@/app/lib/hooks/useEntities";
import { EntitiesUpdateContext } from "@/app/ui/CrudMultiLineView";
import CrudReferenceModal from "@/app/ui/shared/CrudReferenceCounter/CrudReferenceModal";

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
  const { data: session } = useSession();
  const { getEntity, loadEntities, loading, saveEntity } = useEntities();
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
  }, [entity._id, entityReferencesKey]);

  const [mentions, setMentions] = useState<Mentions>({});
  const [mentionsLoaded, setMentionsLoaded] = useState(false);

  const getPreviousMentNumber = () => {
    const key = `mentNumber_${entity._id}_${collectionName}`;
    const stored = localStorage.getItem(key);
    return stored ? parseInt(stored, 10) : 0;
  };

  const setPreviousMentNumber = (value: number) => {
    const key = `mentNumber_${entity._id}_${collectionName}`;
    localStorage.setItem(key, value.toString());
  };

  const mentionsVersion = entitiesCtx?.mentionsVersion ?? 0;

  const loadMentions = useCallback(async () => {
    const canBeMentionedBy = utils.canBeMentionedBy(collectionName);
    const loadedMentions = {} as Mentions;
    for (const mentionCollectionName of canBeMentionedBy) {
      loadedMentions[mentionCollectionName] = await loadEntities<Playable>(
        mentionCollectionName,
        {
          filters: [[`references.${entity._id}`, "==", collectionName]],
          withoutSort: true,
        },
      );
    }
    setMentions(loadedMentions);
    setMentionsLoaded(true);
  }, [collectionName, entity._id, loadEntities, utils]);

  useEffect(() => {
    loadMentions();
  }, [loadMentions, mentionsVersion]);

  const allowedToRefer = useMemo(() => {
    return utils.getAllowedToRefer(collectionName);
  }, [collectionName, utils]);

  const refNumber = useMemo(() => {
    return Object.keys(currentReferences).length;
  }, [currentReferences]);

  const mentNumber = useMemo(() => {
    const number = Object.values(mentions).reduce(
      (total, array) => total + array.length,
      0,
    );
    if (mentionsLoaded) {
      setPreviousMentNumber(number);
    }
    return number;
  }, [mentions, entity._id, mentionsLoaded]);

  // Before first load completes, show cached value to avoid 0→N flash
  const displayMentNumber =
    !mentionsLoaded && getPreviousMentNumber() > 0
      ? getPreviousMentNumber()
      : mentNumber;

  const refMessage = useMemo(() => {
    return 1 === refNumber ? "1 reference" : `${refNumber} references`;
  }, [refNumber]);

  const mentMessage = useMemo(() => {
    return 1 === displayMentNumber
      ? "1 outer mention"
      : `${displayMentNumber} outer mentions`;
  }, [displayMentNumber]);

  const getCalculatedCollections = useCallback(
    (collectionNames: CollectionName[]) => {
      const result: Record<CollectionName, number> = {} as Record<
        CollectionName,
        number
      >;
      if (collectionNames) {
        collectionNames.forEach((collName) => {
          const previousQuantity = result[collName] || 0;
          result[collName] = previousQuantity + 1;
        });
      }
      return result;
    },
    [],
  );

  const renderTooltipCollectionList = useCallback(
    (collections: CollectionName[]) => {
      return Object.entries(getCalculatedCollections(collections))
        .sort((a, b) => a[0].localeCompare(b[0]))
        .map(([collName, quantity]) => (
          <div key={collName} className="text-xs ml-10">
            {quantity} <span className="font-mono">{collName}</span>
          </div>
        ));
    },
    [getCalculatedCollections],
  );

  const tooltipBody = useMemo(
    () => (
      <div style={{ color: colorText }}>
        <div className="ml-4">{refMessage} added</div>
        {0 < refNumber &&
          renderTooltipCollectionList(Object.values(currentReferences))}
        <div className="ml-4">{mentMessage} found</div>
        {0 < mentNumber &&
          renderTooltipCollectionList(
            Object.entries(mentions).flatMap(([collName, entities]) =>
              entities.map(() => collName as CollectionName),
            ),
          )}
        {!viewOnly && (
          <div className="mt-2 text-xs" style={{ color: colorTextDisabled }}>
            *Click to manage or get know more
          </div>
        )}
      </div>
    ),
    [
      colorText,
      refMessage,
      refNumber,
      mentMessage,
      mentNumber,
      currentReferences,
      mentions,
      getCalculatedCollections,
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
      void loadMentions();
      closeModal();
    };

    root.render(
      <SessionProvider session={session}>
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
        />
      </SessionProvider>,
    );
  };

  return (
    <>
      <div
        className={`flex p-0.5 text-nowrap justify-start ${viewOnly ? "cursor-default" : "cursor-pointer"}`}
        style={{ color: colorTextSecondary }}
        onClick={onClick}
      >
        <Tooltip title={tooltipBody} color="white" mouseEnterDelay={0.5}>
          <div
            className="flex items-center"
            style={0 === refNumber ? { color: colorTextTertiary } : undefined}
          >
            <PaperClipIcon className="h-3.5" />
            <span className="pl-0.5">{refMessage}</span>
          </div>
          {0 < displayMentNumber && (
            <div className="flex items-center">
              <ArrowUturnRightIcon className="h-3.5" />
              <span className="pl-0.5">{mentMessage}</span>
            </div>
          )}
        </Tooltip>
      </div>
    </>
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
