import { ExclamationCircleFilled } from "@ant-design/icons";
import { Modal, theme } from "antd";

interface CrudDeleteConfirmModalProps {
  open: boolean;
  singleName: string;
  entityName: string;
  onOk: () => void;
  onCancel: () => void;
}

const CrudDeleteConfirmModal = ({
  open,
  singleName,
  entityName,
  onOk,
  onCancel,
}: CrudDeleteConfirmModalProps) => {
  const {
    token: { colorWarning },
  } = theme.useToken();

  return (
    <Modal
      open={open}
      closable={false}
      title={null}
      okText="Delete"
      onOk={onOk}
      onCancel={onCancel}
    >
      <div className="flex items-start gap-4">
        <ExclamationCircleFilled
          className="mt-0.5 shrink-0 text-[22px] leading-none"
          style={{ color: colorWarning }}
        />
        <div>
          <div className="text-base font-semibold">Delete {singleName}</div>
          <div className="mt-2">
            The item <b>&#39;{entityName}&#39;</b> will be deleted.
            <br />
            Are you sure?
          </div>
        </div>
      </div>
    </Modal>
  );
};

export default CrudDeleteConfirmModal;
