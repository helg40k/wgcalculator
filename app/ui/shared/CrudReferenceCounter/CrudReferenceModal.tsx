import { useEffect, useMemo, useRef, useState } from "react";
import { CaretRightOutlined } from "@ant-design/icons";
import { TrashIcon } from "@heroicons/react/24/outline";
import { Button, Collapse, CollapseProps, Divider, Modal, theme } from "antd";

import {
  CollectionName,
  Entity,
  Mentions,
  References,
} from "@/app/lib/definitions";
import useLoadReferences from "@/app/lib/hooks/useLoadReferences";
import EntityStatusUI from "@/app/ui/shared/EntityStatusUI";

interface DeleteButtonProps {
  onDelete: () => void;
}

const DeleteButton = ({ onDelete }: DeleteButtonProps) => (
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
  />
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
    Partial<Record<CollectionName, Entity[]>>
  >({});
  const { loadReferences } = useLoadReferences();
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
    Object.entries(groupedRefIds).forEach(async ([colName, entIds]) => {
      if (entIds.length > 0 && !loadingRef.current.has(colName)) {
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
      }
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
                      <span>{ent.name}</span>
                      <div className="flex items-center gap-1">
                        <EntityStatusUI.Tag
                          entityId={ent._id}
                          status={ent.status}
                          editable={false}
                        />
                        <DeleteButton onDelete={() => {}} />
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
  }, [groupedRefIds, loadedEntities]);
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
                    <span>{ent.name}</span>
                    <div className="flex items-center gap-1">
                      <EntityStatusUI.Tag
                        entityId={ent._id}
                        status={ent.status}
                        editable={false}
                      />
                      <DeleteButton onDelete={() => {}} />
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
  }, [mentions]);
  const mentionExpandedKeys = useMemo(() => {
    return Object.entries(mentions)
      .filter(([, entities]) => entities.length)
      .map(([colName]) => `mention-${colName}`);
  }, [mentions]);

  return (
    <Modal
      open={showModal}
      title={`'${entityName}' references`}
      onOk={onOk}
      onCancel={onCancel}
      maskClosable={false}
      keyboard={false}
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
