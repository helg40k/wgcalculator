import { useEffect, useMemo, useState } from "react";
import { CaretRightOutlined } from "@ant-design/icons";
import { Collapse, CollapseProps, Divider, Modal, theme } from "antd";

import {
  CollectionName,
  Entity,
  Mentions,
  References,
} from "@/app/lib/definitions";
import useLoadReferences from "@/app/lib/hooks/useLoadReferences";

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
  const [refObject, setRefObject] = useState<
    Partial<Record<CollectionName, Entity[]>>
  >({});
  const [referenceExpandedKeys, setReferenceExpandedKeys] = useState<string[]>(
    [],
  );
  const [hasUserInteracted, setHasUserInteracted] = useState(false);
  const { loadReferences, loading } = useLoadReferences();

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
    const loadAllReferences = async () => {
      const results: Partial<Record<CollectionName, Entity[]>> = {};
      await Promise.all(
        Object.entries(groupedRefIds).map(async ([colName, entIds]) => {
          if (entIds.length) {
            results[colName as CollectionName] = await loadReferences(
              colName,
              entIds,
            );
          } else {
            results[colName as CollectionName] = [];
          }
        }),
      );
      setRefObject(results);
    };

    loadAllReferences();
  }, [groupedRefIds, loadReferences]);

  const referenceCollections: CollapseProps["items"] = useMemo(() => {
    return Object.entries(refObject)
      .sort(([colName1], [colName2]) => colName1.localeCompare(colName2))
      .map(([colName, entities]) => {
        return {
          children: (
            <div className="-mt-5">
              {entities.map((ent) => (
                <div key={`${colName}-${ent._id}`} className="my-0.5 pl-12">
                  {ent.name}
                </div>
              ))}
            </div>
          ),
          key: `reference-${colName}`,
          label: (
            <span>
              {entities.length} <span className="font-mono">{colName}</span>
            </span>
          ),
        };
      });
  }, [refObject]);
  useEffect(() => {
    if (!hasUserInteracted) {
      const keys = Object.entries(refObject)
        .filter(([, entities]) => entities.length)
        .map(([colName]) => `reference-${colName}`);
      setReferenceExpandedKeys(keys);
    }
  }, [refObject, hasUserInteracted]);

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
                  <div key={`${colName}-${ent._id}`} className="my-0.5 pl-12">
                    {ent.name}
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
