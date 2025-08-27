import { useContext, useEffect, useState } from "react";
import { Spin } from "antd";

import { GameSystemContext } from "@/app/lib/contexts/GameSystemContext";
import { CollectionRegistry, Source } from "@/app/lib/definitions";
import useEntities from "@/app/lib/hooks/useEntities";
import CorsMultiLineView from "@/app/ui/CorsMultiLineView";
import SourceUI from "@/app/ui/shared/Source";

const collectionName = CollectionRegistry.Source;

const CosAdminSources = () => {
  const gameSystem = useContext(GameSystemContext);
  const { deleteEntity, loadEntities, loading, saveEntity } = useEntities();
  const [sources, setSources] = useState<Source[]>([]);

  useEffect(() => {
    loadEntities<Source>(collectionName, {
      filters: [["systemId", "==", gameSystem?._id || ""]],
      sort: ["year", "desc"],
    }).then((value) => setSources(value));
  }, []);

  const onSave = async (source: Source): Promise<Source | null> => {
    if (!source.version) {
      source.version = "1.0";
    }
    return await saveEntity(collectionName, source);
  };

  const onDelete = async (id: string): Promise<void> => {
    await deleteEntity(collectionName, id);
  };

  return (
    <Spin spinning={loading} size="large">
      <CorsMultiLineView
        singleName={"source"}
        pluralNames={"sources"}
        singleToolbarUntil={5}
        entities={sources}
        setEntities={setSources}
        view={SourceUI.View}
        edit={SourceUI.Edit}
        onSave={onSave}
        onDelete={onDelete}
        filterableFields={["name", "authors", "type", "description"]}
        sortableFields={[
          { key: "name", label: "Name" },
          { key: "authors", label: "Authors" },
          { key: "type", label: "Type" },
          { key: "year", label: "Year" },
          { key: "version", label: "Version" },
        ]}
      />
    </Spin>
  );
};

export default CosAdminSources;
