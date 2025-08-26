import { useContext, useEffect, useState } from "react";
import { Spin } from "antd";

import { GameSystemContext } from "@/app/lib/contexts/GameSystemContext";
import { CollectionRegistry, Keyword } from "@/app/lib/definitions";
import useEntities from "@/app/lib/hooks/useEntities";
import MultiLineView from "@/app/ui/MultiLineView";
import KeywordView from "@/app/ui/shared/KeywordView";

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

  return (
    <Spin spinning={loading} size="large">
      <MultiLineView
        singleName={"keyword"}
        pluralNames={"keywords"}
        singleToolbarUntil={5}
        entities={keywords}
        setEntities={setKeywords}
        view={KeywordView}
        // edit={SourceEdit}
        onSave={onSave}
        onDelete={onDelete}
        filterableFields={["name", "description"]}
        sortableFields={[{ key: "name", label: "Name" }]}
      />
    </Spin>
  );
};

export default CosAdminKeywords;
