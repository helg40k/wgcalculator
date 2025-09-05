import {
  memo,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  ArrowUturnRightIcon,
  PaperClipIcon,
} from "@heroicons/react/24/outline";
import { theme, Tooltip } from "antd";

import { GameSystemContext } from "@/app/lib/contexts/GameSystemContext";
import { CollectionName, Mentions, Playable } from "@/app/lib/definitions";
import useEntities from "@/app/lib/hooks/useEntities";

interface ReferenceCounterProps<T extends Playable = Playable> {
  entity: T;
  collectionName: CollectionName;
}

const ReferenceCounter = ({
  entity,
  collectionName,
}: ReferenceCounterProps) => {
  const {
    token: { colorText, colorTextSecondary },
  } = theme.useToken();
  const [, utils] = useContext(GameSystemContext);
  const { loadEntities, loading, saveEntity } = useEntities();
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
          collectionName,
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
  const displayNumber =
    mentNumber === 0 && getPreviousMentNumber() > 0
      ? getPreviousMentNumber()
      : mentNumber;

  const refMessage = useMemo(() => {
    return 1 === refNumber ? "1 reference" : `${refNumber} references`;
  }, [refNumber]);

  const mentMessage = useMemo(() => {
    return 1 === displayNumber
      ? "1 outer mention"
      : `${displayNumber} outer mentions`;
  }, [displayNumber]);

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

  const tooltipBody = useMemo(
    () => (
      <div style={{ color: colorText }}>
        <div>{refMessage} added</div>
        {0 < refNumber &&
          Object.entries(
            getCalculatedCollections(Object.values(entity.references || {})),
          ).map(([collName, quantity]) => (
            <div key={collName}>{`${quantity} ${collName}`}</div>
          ))}
        <div>{mentMessage} found</div>
        {0 < mentNumber &&
          Object.entries(
            getCalculatedCollections(
              Object.keys(mentions || {}) as CollectionName[],
            ),
          ).map(([collName, quantity]) => (
            <div key={collName}>{`${quantity} ${collName}`}</div>
          ))}
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

  return (
    <div
      className="flex p-0.5 text-nowrap justify-start"
      style={{ color: colorTextSecondary }}
    >
      <Tooltip title={tooltipBody} color="white" mouseEnterDelay={0.5}>
        <div className="flex items-center">
          <PaperClipIcon className="h-3.5" />
          <span className="pl-0.5">{refMessage}</span>
        </div>
        {0 < mentNumber && (
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
  // Only re-render if entity ID or collection name actually changed
  return (
    prevProps.entity._id === nextProps.entity._id &&
    prevProps.collectionName === nextProps.collectionName
  );
});
