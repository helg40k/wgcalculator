import React, { useEffect, useMemo, useRef, useState } from "react";
import { CaretRightOutlined } from "@ant-design/icons";
import { TrashIcon } from "@heroicons/react/24/outline";
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

import {
  CollectionName,
  Mentions,
  Playable,
  References,
} from "@/app/lib/definitions";
import usePlayableReferences from "@/app/lib/hooks/usePlayableReferences";
import EntityStatusUI from "@/app/ui/shared/EntityStatusUI";

interface DeleteButtonProps {
  onDelete: () => void;
  colorText: string;
  name: string;
  disabled: boolean;
}

const DeleteButton = ({
  onDelete,
  colorText,
  name,
  disabled,
}: DeleteButtonProps) => (
  <Tooltip
    title={
      !disabled ? (
        <span style={{ color: colorText }}>Remove this {name}</span>
      ) : undefined
    }
    color="white"
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
  entityName: string;
  onOk: () => void;
  onCancel: () => void;
  references: References;
  mentions: Mentions;
  collectionName: CollectionName;
  allowedToRefer: CollectionName[];
}

const CrudReferenceModal = ({
  showModal,
  entityName,
  onOk,
  onCancel,
  references: oldReferences,
  mentions,
  collectionName,
  allowedToRefer,
}: CrudReferenceModalProps) => {
  const {
    token: {
      colorText,
      colorTextSecondary,
      colorTextTertiary,
      colorTextDisabled,
      colorBgBase,
    },
  } = theme.useToken();
  const [references, setReferences] = useState<References>(oldReferences);
  const [referenceExpandedKeys, setReferenceExpandedKeys] = useState<string[]>(
    [],
  );
  const [hasUserInteracted, setHasUserInteracted] = useState(false);
  const [loadedEntities, setLoadedEntities] = useState<
    Partial<Record<CollectionName, Playable[]>>
  >({});
  const [loading, setLoading] = useState(false);
  const { loadReferences } = usePlayableReferences();
  const loadingRef = useRef<Set<string>>(new Set());

  const refNumber = useMemo(() => {
    return Object.keys(references).length;
  }, [references]);

  const mentNumber = useMemo(() => {
    return Object.values(mentions).reduce(
      (total, array) => total + array.length,
      0,
    );
  }, [mentions]);

  const groupedRefIds = useMemo(() => {
    const results: Partial<Record<CollectionName, string[]>> = {};
    allowedToRefer.forEach((colName) => (results[colName] = []));
    Object.entries(references).forEach(([entId, colName]) => {
      if (!results[colName]) {
        results[colName] = [];
      }
      results[colName]!.push(entId);
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
        setLoadedEntities((prev) => ({
          ...prev,
          [colName as CollectionName]: entities,
        }));
      } finally {
        loadingRef.current.delete(colName);
      }
    });

    Promise.all(loadPromises).finally(() => {
      setLoading(false);
    });
  }, [JSON.stringify(groupedRefIds), loadReferences]);

  const referenceCollections: CollapseProps["items"] = useMemo(() => {
    return Object.entries(groupedRefIds)
      .sort(([colName1], [colName2]) => colName1.localeCompare(colName2))
      .map(([colName, entIds]) => {
        const entities = loadedEntities[colName as CollectionName] || [];
        return {
          children: (
            <div className="-mt-5">
              {entities.length > 0
                ? entities.map((ent) => (
                    <div
                      key={`${colName}-${ent._id}`}
                      className="my-0.5 py-0.5 pl-12 flex items-center justify-between hover:bg-blue-50"
                    >
                      <DescriptionTooltip
                        content={ent.description}
                        colorText={colorTextSecondary}
                      >
                        <span>{ent.name}</span>
                      </DescriptionTooltip>
                      <div className="flex items-center gap-1">
                        <EntityStatusUI.Tag
                          entityId={ent._id}
                          status={ent.status}
                          editable={false}
                        />
                        <DeleteButton
                          onDelete={() => {}}
                          colorText={colorText}
                          name="reference"
                          disabled={loading}
                        />
                        <div className="pr-2" />
                      </div>
                    </div>
                  ))
                : entIds.map((id) => (
                    <div
                      key={`${colName}-${id}`}
                      className="my-0.5 py-0.5 pl-12 flex items-center justify-between"
                    >
                      Loading...
                    </div>
                  ))}
              <div className="flex justify-end py-1 pr-3">
                <Tooltip
                  title={
                    !loading ? (
                      <span style={{ color: colorText }}>
                        Add one more reference
                      </span>
                    ) : undefined
                  }
                  color="white"
                  mouseEnterDelay={0.5}
                >
                  <Button
                    style={{
                      height: "22px",
                    }}
                    onClick={() => {}}
                    disabled={loading}
                  >
                    Add more
                  </Button>
                </Tooltip>
              </div>
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
  }, [groupedRefIds, loadedEntities, loading, colorText, colorTextSecondary]);
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
                .map((ent) => (
                  <div
                    key={`${colName}-${ent._id}`}
                    className="my-0.5 py-0.5 pl-12 flex items-center justify-between hover:bg-blue-50"
                  >
                    <DescriptionTooltip
                      content={ent.description}
                      colorText={colorTextSecondary}
                    >
                      <span>{ent.name}</span>
                    </DescriptionTooltip>
                    <div className="flex items-center gap-1">
                      <EntityStatusUI.Tag
                        entityId={ent._id}
                        status={ent.status}
                        editable={false}
                      />
                      <DeleteButton
                        onDelete={() => {}}
                        colorText={colorText}
                        name="mention"
                        disabled={loading}
                      />
                      <div className="pr-2" />
                    </div>
                  </div>
                ))}
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
  }, [mentions, loading, colorText, colorTextSecondary]);
  const mentionExpandedKeys = useMemo(() => {
    return Object.entries(mentions)
      .filter(([, entities]) => entities.length)
      .map(([colName]) => `mention-${colName}`);
  }, [mentions]);

  return (
    <Modal
      open={showModal}
      title={
        <span>
          {`'${entityName}' references `}
          <Spin spinning={loading} />
        </span>
      }
      onOk={onOk}
      onCancel={onCancel}
      maskClosable={false}
      keyboard={false}
      okButtonProps={{ disabled: loading }}
    >
      <Divider />
      <div className="font-bold">References ({refNumber} added)</div>
      <Collapse
        ghost
        items={referenceCollections}
        expandIcon={({ isActive }) => (
          <CaretRightOutlined rotate={isActive ? 90 : 0} />
        )}
        activeKey={referenceExpandedKeys}
        onChange={(keys) => {
          setHasUserInteracted(true);
          setReferenceExpandedKeys(Array.isArray(keys) ? keys : [keys]);
        }}
      />
      <div className="h-6" />
      <div className="font-bold">Mentions ({mentNumber} found)</div>
      <Collapse
        ghost
        items={mentionCollections}
        expandIcon={({ isActive }) => (
          <CaretRightOutlined rotate={isActive ? 90 : 0} />
        )}
        defaultActiveKey={mentionExpandedKeys}
      />
      <Divider />
    </Modal>
  );
};

export default CrudReferenceModal;
