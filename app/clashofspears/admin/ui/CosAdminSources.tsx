import { useContext, useEffect, useState } from "react";
import { Spin } from "antd";

import { GameSystemContext } from "@/app/lib/contexts/GameSystemContext";
import { CollectionRegistry, Source } from "@/app/lib/definitions";
import useEntities from "@/app/lib/hooks/useEntities";
import CrudMultiLineView from "@/app/ui/CrudMultiLineView";
import SourceUI from "@/app/ui/shared/Source";

const collectionName = CollectionRegistry.Source;

const CosAdminSources = () => {
  const [gameSystem, utils] = useContext(GameSystemContext);
  const { deleteEntity, loadEntities, loading, saveEntity } = useEntities();
  const [sources, setSources] = useState<Source[]>([]);

  useEffect(() => {
    loadEntities<Source>(collectionName, {
      filters: [["systemId", "==", gameSystem?._id || ""]],
      sort: ["year", "desc"],
    }).then((value) => setSources(value));
  }, []);

  // example how to use
  useEffect(() => {
    console.log(
      `Allowed to Refer ("${collectionName}")`,
      utils.getAllowedToRefer(collectionName),
    );
  }, [gameSystem]);

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
      <CrudMultiLineView.List
        singleName={"source"}
        pluralNames={"sources"}
        singleToolbarUntil={5}
        entities={sources}
        setEntities={setSources}
        view={SourceUI.View}
        edit={SourceUI.Edit}
        onSave={onSave}
        onDelete={onDelete}
        filterableFields={["name", "authors", "type", "description", "status"]}
        sortableFields={[
          { key: "name", label: "Name" },
          { key: "authors", label: "Authors" },
          { key: "type", label: "Type" },
          { key: "year", label: "Year" },
          { key: "version", label: "Version" },
          { key: "status", label: "Status" },
        ]}
      />
    </Spin>
  );
};

export default CosAdminSources;
