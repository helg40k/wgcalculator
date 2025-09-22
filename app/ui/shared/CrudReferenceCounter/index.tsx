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

import { GameSystemContext } from "@/app/lib/contexts/GameSystemContext";
import {
  CollectionName,
  Mentions,
  Playable,
  References,
} from "@/app/lib/definitions";
import useEntities from "@/app/lib/hooks/useEntities";
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
  const { getEntity, loadEntities, loading, saveEntity } = useEntities();
  const [mentions, setMentions] = useState<Mentions>({});

  // Save the previous value in localStorage
  const getPreviousMentNumber = () => {
    const key = `mentNumber_${entity._id}_${collectionName}`;
    const stored = localStorage.getItem(key);
    return stored ? parseInt(stored, 10) : 0;
  };

  const setPreviousMentNumber = (value: number) => {
    const key = `mentNumber_${entity._id}_${collectionName}`;
    localStorage.setItem(key, value.toString());
  };

  // Only run once when component mounts
  useEffect(() => {
    const loadMentions = async () => {
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
    };

    loadMentions();
  }, []); // Empty dependency array - only run once

  const allowedToRefer = useMemo(() => {
    return utils.getAllowedToRefer(collectionName);
  }, [collectionName, utils]);

  const refNumber = useMemo(() => {
    return !entity.references ? 0 : Object.keys(entity.references).length;
  }, [entity]);

  const mentNumber = useMemo(() => {
    // Calculate the total number of elements in all arrays, not the number of keys
    const number = Object.values(mentions).reduce(
      (total, array) => total + array.length,
      0,
    );
    // Save the previous value if the current one is greater than 0
    if (number > 0) {
      setPreviousMentNumber(number);
    }
    return number;
  }, [mentions, entity._id]);

  // Use previous number if current is 0 and we have a previous value
  const displayMentNumber =
    mentNumber === 0 && getPreviousMentNumber() > 0
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
          renderTooltipCollectionList(Object.values(entity.references || {}))}
        <div className="ml-4">{mentMessage} found</div>
        {0 < mentNumber &&
          renderTooltipCollectionList(
            Object.keys(mentions || {}) as CollectionName[],
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
      entity.references,
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

    const saveReferences = async (references: References) => {
      // compare entity.references and references
      // if they are not equal, save entity with the new references
      // than replace the old entity by new one (maybe the entity should be in the state for it)
      closeModal();
    };

    root.render(
      <CrudReferenceModal
        showModal={true}
        entityName={entity.name}
        onOk={saveReferences}
        onCancel={closeModal}
        references={entity.references || {}}
        mentions={mentions}
        collectionName={collectionName}
        allowedToRefer={allowedToRefer}
      />,
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
  // Only re-render if entity ID or collection name actually changed
  return (
    prevProps.entity._id === nextProps.entity._id &&
    prevProps.collectionName === nextProps.collectionName
  );
});
