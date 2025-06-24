import { useEffect, useState } from "react";

import SourceEdit from "@/app/clashofspears/admin/ui/edit/SourceEdit";
import SourceView from "@/app/clashofspears/admin/ui/view/SourceView";
import { CollectionRegistry, Source } from "@/app/lib/definitions";
import useEntities from "@/app/lib/hooks/useEntities";
import MultiLineView from "@/app/ui/MultiLineView";

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
