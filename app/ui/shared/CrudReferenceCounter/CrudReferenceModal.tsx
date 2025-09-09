import { useMemo, useState } from "react";
import { CaretRightOutlined } from "@ant-design/icons";
import { Collapse, CollapseProps, Divider, Modal, theme } from "antd";

import { CollectionName, Mentions, References } from "@/app/lib/definitions";

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

  const refNumber = useMemo(() => {
    return Object.keys(references).length;
  }, [references]);

  const mentNumber = useMemo(() => {
    return Object.values(mentions).reduce(
      (total, array) => total + array.length,
      0,
    );
  }, [mentions]);

  const refObject = useMemo(() => {
    const result: Partial<Record<CollectionName, string[]>> = {};
    allowedToRefer.forEach((colName) => (result[colName] = []));
    Object.entries(references).forEach(([entId, colName]) => {
      if (!result[colName]) {
        result[colName] = [];
      }
      result[colName]!.push(entId);
    });
    return result;
  }, [allowedToRefer, references]);

  const referenceCollections: CollapseProps["items"] = Object.entries(refObject)
    .sort(([colName1], [colName2]) => colName1.localeCompare(colName2))
    .map(([colName, entIds]) => {
      return {
        children: (
          <div className="-mt-5">
            {entIds.map((id) => (
              <div key={`${colName}-${id}`} className="my-0.5 pl-12">
                {id}
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
  const referenceExpandedKeys = Object.entries(refObject)
    .filter(([, entIds]) => entIds.length)
    .map(([colName]) => `reference-${colName}`);

  const mentionCollections: CollapseProps["items"] = Object.entries(mentions)
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
  const mentionExpandedKeys = Object.entries(mentions)
    .filter(([, entities]) => entities.length)
    .map(([colName]) => `mention-${colName}`);

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
        defaultActiveKey={referenceExpandedKeys}
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
