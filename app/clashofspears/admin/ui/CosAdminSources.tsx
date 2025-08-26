import { useContext, useEffect, useState } from "react";
import { Spin } from "antd";

import { GameSystemContext } from "@/app/lib/contexts/GameSystemContext";
import { CollectionRegistry, Source } from "@/app/lib/definitions";
import useEntities from "@/app/lib/hooks/useEntities";
import MultiLineView from "@/app/ui/MultiLineView";
import SourceEdit from "@/app/ui/shared/SourceEdit";
import SourceView from "@/app/ui/shared/SourceView";

const collectionName = CollectionRegistry.Source;

const CosAdminSources = () => {
  const gameSystem = useContext(GameSystemContext);
  const { deleteEntity, loadEntities, loading, saveEntity } = useEntities();
  const [sources, setSources] = useState<Source[]>([]);

  useEffect(() => {
    loadEntities<Source>(
      collectionName,
      [["systemId", "==", gameSystem?._id || ""]],
      ["year", "desc"],
    ).then((value) => setSources(value));
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
      <MultiLineView
        singleName={"source"}
        pluralNames={"sources"}
        singleToolbarUntil={5}
        entities={sources}
        setEntities={setSources}
        view={SourceView}
        edit={SourceEdit}
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
