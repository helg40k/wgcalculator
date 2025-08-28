import { useContext, useEffect, useState } from "react";
import { Spin } from "antd";

import { GameSystemContext } from "@/app/lib/contexts/GameSystemContext";
import { CollectionRegistry, Keyword } from "@/app/lib/definitions";
import useEntities from "@/app/lib/hooks/useEntities";
import CorsMultiLineView from "@/app/ui/CorsMultiLineView";
import KeywordUI from "@/app/ui/shared/Keyword";

const collectionName = CollectionRegistry.Keyword;

const CosAdminKeywords = () => {
  const gameSystem = useContext(GameSystemContext);
  const { deleteEntity, loadEntities, loading, saveEntity } = useEntities();
  const [keywords, setKeywords] = useState<Keyword[]>([]);

  useEffect(() => {
    loadEntities<Keyword>(collectionName, {
      filters: [["systemId", "==", gameSystem?._id || ""]],
      sort: ["name", "asc"],
    }).then((value) => setKeywords(value));
  }, []);

  const onSave = async (keyword: Keyword): Promise<Keyword | null> => {
    return await saveEntity(collectionName, keyword);
  };

  const onDelete = async (id: string): Promise<void> => {
    await deleteEntity(collectionName, id);
  };

  const tableData = [
    {
      edit: KeywordUI.Edit,
      field: "name",
      header: "Name",
      sortable: true,
      view: KeywordUI.View,
    },
    {
      edit: KeywordUI.Edit,
      field: "description",
      header: "Description",
      sortable: true,
      view: KeywordUI.View,
    },
  ];

  return (
    <Spin spinning={loading} size="large">
      <CorsMultiLineView.Table
        singleName={"keyword"}
        pluralNames={"keywords"}
        singleToolbarUntil={5}
        entities={keywords}
        setEntities={setKeywords}
        table={tableData}
        onSave={onSave}
        onDelete={onDelete}
        filterableFields={["name", "description"]}
      />
    </Spin>
  );
};

export default CosAdminKeywords;
