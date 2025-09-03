import { useContext, useEffect, useState } from "react";
import { Spin } from "antd";

import { GameSystemContext } from "@/app/lib/contexts/GameSystemContext";
import { CollectionRegistry, Keyword } from "@/app/lib/definitions";
import useEntities from "@/app/lib/hooks/useEntities";
import CrudMultiLineView from "@/app/ui/CrudMultiLineView";
import ReferenceCounter from "@/app/ui/shared/ReferenceCounter";
import TableCell from "@/app/ui/shared/TableCell";

const collectionName = CollectionRegistry.Keyword;

const CosAdminKeywords = () => {
  const [gameSystem, utils] = useContext(GameSystemContext);
  const { deleteEntity, loadEntities, loading, saveEntity } = useEntities();
  const [keywords, setKeywords] = useState<Keyword[]>([]);

  useEffect(() => {
    loadEntities<Keyword>(collectionName, {
      filters: [["systemId", "==", gameSystem?._id || ""]],
      sort: ["name", "asc"],
    }).then((value) => setKeywords(value));
  }, []);

  // example how to use
  useEffect(() => {
    console.log(
      `Allowed to Refer ("${collectionName}")`,
      utils.getAllowedToRefer(collectionName),
    );
  }, [gameSystem]);

  const onSave = async (keyword: Keyword): Promise<Keyword | null> => {
    if (
      keywords.some(
        (k) => k.name === keyword.name.trim() && k._id !== keyword._id,
      )
    ) {
      throw new Error("Name must be unique!");
    }
    return await saveEntity(collectionName, keyword);
  };

  const onDelete = async (id: string): Promise<void> => {
    await deleteEntity(collectionName, id);
  };

  const tableData = [
    {
      edit: TableCell.Edit,
      field: "name",
      header: "Name",
      sortable: true,
      validationRules: [
        { message: "Name is required", required: true },
        { message: "Name is unique", unique: true },
      ],
      view: TableCell.View,
    },
    {
      edit: TableCell.Edit,
      field: "description",
      header: "Description",
      sortable: true,
      view: TableCell.View.Area,
    },
  ];

  return (
    <Spin spinning={loading} size="large">
      <CrudMultiLineView.Table
        singleName={"keyword"}
        pluralNames={"keywords"}
        singleToolbarUntil={10}
        entities={keywords}
        rowFooter={(record: Keyword) => (
          <ReferenceCounter references={record.references} />
        )}
        setEntities={setKeywords}
        sortableStatus={true}
        table={tableData}
        onSave={onSave}
        onDelete={onDelete}
        filterableFields={["name", "description", "status"]}
      />
    </Spin>
  );
};

export default CosAdminKeywords;
