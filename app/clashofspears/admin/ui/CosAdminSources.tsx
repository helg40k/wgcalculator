import { useEffect, useState } from "react";

import { CollectionRegistry, Source } from "@/app/lib/definitions";
import useEntities from "@/app/lib/hooks/useEntities";
import MultiLineView from "@/app/ui/MultiLineView";
import SourceEdit from "@/app/ui/shared/SourceEdit";
import SourceView from "@/app/ui/shared/SourceView";

const CosAdminSources = () => {
  const { loadEntities, loading, saveEntity } = useEntities();
  const [sources, setSources] = useState<Source[]>([]);

  useEffect(() => {
    loadEntities<Source>(CollectionRegistry.Source).then((value) =>
      setSources(value),
    );
  }, []);

  return (
    <>
      SOURCES:
      <MultiLineView entities={sources} view={SourceView} edit={SourceEdit} />
    </>
  );
};

export default CosAdminSources;
