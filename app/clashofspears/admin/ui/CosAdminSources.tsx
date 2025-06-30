import { useEffect, useState } from "react";
import { message, Spin } from "antd";

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

  const onSave = async (source: Source): Promise<void> => {
    const savedSource = await saveEntity(collectionName, source);
    if (savedSource) {
      message.success("The source has been saved");
      const index = sources.findIndex((item) => item._id === savedSource._id);
      if (index >= 0) {
        const updated = [...sources];
        updated[index] = savedSource;
        setSources(updated);
      } else {
        setSources((prev) => [...prev, savedSource]);
      }
    } else {
      message.error("The source has not been saved!");
    }
  };

  return (
    <Spin spinning={loading} size="large">
      SOURCES:
      <MultiLineView
        entities={sources}
        view={SourceView}
        edit={SourceEdit}
        onSave={onSave}
      />
    </Spin>
  );
};

export default CosAdminSources;
