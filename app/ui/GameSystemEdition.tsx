"use client";

import { useContext } from "react";
import { Modal, Select, Typography } from "antd";

import { GameSystemContext } from "@/app/lib/contexts/GameSystemContext";

const GameSystemEdition = () => {
  const [, selectedEdition, utils] = useContext(GameSystemContext);
  const editions = utils.getActiveEditions();

  if (editions.length === 0) {
    return null;
  }

  if (editions.length === 1) {
    return <Typography.Text>{editions[0].name}</Typography.Text>;
  }

  const handleChange = (editionId: string) => {
    if (editionId === selectedEdition?._id) {
      return;
    }

    const nextEdition = editions.find((edition) => edition._id === editionId);
    if (!nextEdition) {
      return;
    }

    Modal.confirm({
      content: (
        <>
          All data will update according to the selected edition.
          <br />
          Are you sure?
        </>
      ),
      onOk: () => utils.setSelectedEdition(editionId),
      title: `Switching to the ${nextEdition.name}`,
    });
  };

  return (
    <Select
      allowClear={false}
      onChange={handleChange}
      options={editions.map((edition) => ({
        label: edition.name,
        value: edition._id,
      }))}
      value={selectedEdition?._id}
    />
  );
};

export default GameSystemEdition;
