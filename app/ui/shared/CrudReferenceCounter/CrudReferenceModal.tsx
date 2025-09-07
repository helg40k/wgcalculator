import { useMemo, useState } from "react";
import { Collapse, CollapseProps, Divider, Modal, theme } from "antd";

import { CollectionName, Mentions, References } from "@/app/lib/definitions";

interface CrudReferenceModalProps {
  showModal: boolean;
  entityName: string;
  onOk: () => void;
  onCancel: () => void;
  references: References;
  mentions: Mentions;
}

const CrudReferenceModal = ({
  showModal,
  entityName,
  onOk,
  onCancel,
  references: oldReferences,
  mentions,
}: CrudReferenceModalProps) => {
  const {
    token: {
      colorText,
      colorTextSecondary,
      colorTextTertiary,
      colorTextDisabled,
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
    Object.entries(references).forEach(([entId, colName]) => {
      if (!result[colName]) {
        result[colName] = [];
      }
      result[colName]!.push(entId);
    });
    return result;
  }, [references]);

  const referenceCollections: CollapseProps["items"] = Object.entries(
    refObject,
  ).map(([colName, entIds]) => {
    return {
      children: (
        <div>
          {entIds.map((id) => (
            <div key={`${colName}-${id}`}>{id}</div>
          ))}
        </div>
      ),
      key: `reference-${colName}`,
      label: `${entIds.length} ${colName}`,
    };
  });

  const mentionCollections: CollapseProps["items"] = Object.entries(
    mentions,
  ).map(([colName, entities]) => {
    return {
      children: (
        <div>
          {entities.map((ent) => (
            <div key={`${colName}-${ent._id}`}>{ent._id}</div>
          ))}
        </div>
      ),
      key: `mention-${colName}`,
      label: `${entities.length} ${colName}`,
    };
  });

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
      <Collapse items={referenceCollections} />
      <div className="h-6" />
      <div className="font-bold">Mentions ({mentNumber} found)</div>
      <Collapse items={mentionCollections} />
      <Divider />
    </Modal>
  );
};

export default CrudReferenceModal;
