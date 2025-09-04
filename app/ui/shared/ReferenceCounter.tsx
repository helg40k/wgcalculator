import { memo, useContext, useEffect, useMemo, useState } from "react";
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
    return [...Object.values(mentions)].length;
  }, [mentions]);

  const refMessage = useMemo(() => {
    return 1 === refNumber ? "1 reference" : `${refNumber} references`;
  }, [refNumber]);

  const mentMessage = useMemo(() => {
    return 1 === mentNumber
      ? "1 outer mention"
      : `${mentNumber} outer mentions`;
  }, [mentNumber]);

  return (
    <div
      className="flex p-0.5 text-nowrap justify-start"
      style={{ color: colorTextSecondary }}
    >
      <Tooltip
        title={
          <div style={{ color: colorText }}>
            <div>{refMessage} added</div>
            <div>{mentMessage} found</div>
          </div>
        }
        color="white"
        mouseEnterDelay={0.5}
      >
        <div className="flex items-center">
          <PaperClipIcon className="h-3.5" />
          <span className="pl-0.5">{refMessage}</span>
        </div>
        <div className="flex items-center">
          <ArrowUturnRightIcon className="h-3.5" />
          <span className="pl-0.5">{mentMessage}</span>
        </div>
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
