import { useEffect, useState } from "react";
import { Spin } from "antd";

import { CollectionRegistry, Source } from "@/app/lib/definitions";
import useEntities from "@/app/lib/hooks/useEntities";
import MultiLineView from "@/app/ui/MultiLineView";
import SourceEdit from "@/app/ui/shared/SourceEdit";
import SourceView from "@/app/ui/shared/SourceView";

const collectionName = CollectionRegistry.Source;

const CosAdminSources = () => {
  const { deleteEntity, loadEntities, loading, saveEntity } = useEntities();
  const [sources, setSources] = useState<Source[]>([]);

  useEffect(() => {
    loadEntities<Source>(collectionName).then((value) => setSources(value));
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
      />
    </Spin>
  );
};

export default CosAdminSources;
