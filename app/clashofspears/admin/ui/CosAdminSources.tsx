import { useEffect, useState } from "react";
import { message, Spin } from "antd";

import { CollectionRegistry, Source } from "@/app/lib/definitions";
import useEntities from "@/app/lib/hooks/useEntities";
import { NEW_ENTITY_TEMP_ID } from "@/app/lib/services/firebase/helpers/getDocumentCreationBase";
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
    const isNew = NEW_ENTITY_TEMP_ID === source._id || !source._id;
    const savedSource = await saveEntity(collectionName, source);
    if (savedSource) {
      message.success("The source has been saved");
      const index = sources.findIndex((item) =>
        isNew
          ? NEW_ENTITY_TEMP_ID === item._id || !item._id
          : item._id === savedSource._id,
      );
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

  const onDelete = async (id: string): Promise<void> => {
    await deleteEntity(collectionName, id);
    message.success("The source has been deleted");
    setSources((prev) => [...prev.filter((item) => item._id !== id)]);
  };

  return (
    <Spin spinning={loading} size="large">
      <MultiLineView
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
