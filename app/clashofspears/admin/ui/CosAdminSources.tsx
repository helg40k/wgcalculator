import { useCallback, useContext, useEffect, useMemo, useState } from "react";
import { Spin } from "antd";

import { useCollectionInvalidation } from "@/app/lib/collectionInvalidation";
import { GameSystemContext } from "@/app/lib/contexts/GameSystemContext";
import { MentionsProvider } from "@/app/lib/contexts/MentionsContext";
import { CollectionRegistry, Source } from "@/app/lib/definitions";
import useEntities from "@/app/lib/hooks/useEntities";
import { getPlayableScopeFilters } from "@/app/lib/playableScope";
import CrudMultiLineView from "@/app/ui/CrudMultiLineView";
import SourceUI from "@/app/ui/shared/Source";

const collectionName = CollectionRegistry.Source;

const CosAdminSources = () => {
  const [gameSystem, selectedEdition] = useContext(GameSystemContext);
  const { deleteEntity, loadEntities, loading, saveEntity } = useEntities();
  const [sources, setSources] = useState<Source[]>([]);
  const filters = useMemo(
    () => getPlayableScopeFilters(gameSystem, selectedEdition),
    [gameSystem, selectedEdition],
  );

  const onReload = useCallback(() => {
    if (!filters) {
      setSources([]);
      return;
    }

    loadEntities<Source>(collectionName, {
      filters,
      sort: ["year", "desc"],
    }).then((value) => setSources(value));
  }, [filters, loadEntities]);

  useEffect(() => {
    onReload();
  }, [onReload]);

  const onSave = async (source: Source): Promise<Source | null> => {
    if (!source.version) {
      source.version = "1.0";
    }
    return await saveEntity(collectionName, source);
  };

  const onDelete = async (id: string): Promise<void> => {
    await deleteEntity(collectionName, id);
  };

  useCollectionInvalidation(collectionName, onReload);

  return (
    <Spin spinning={loading} size="large">
      <MentionsProvider collectionName={collectionName}>
        <CrudMultiLineView.List
          collectionName={collectionName}
          singleName={"source"}
          pluralNames={"sources"}
          singleToolbarUntil={5}
          entities={sources}
          setEntities={setSources}
          view={SourceUI.View}
          edit={SourceUI.Edit}
          onSave={onSave}
          onDelete={onDelete}
          filterableFields={[
            "name",
            "authors",
            "type",
            "description",
            "status",
          ]}
          sortableFields={[
            { key: "name", label: "Name" },
            { key: "authors", label: "Authors" },
            { key: "type", label: "Type" },
            { key: "year", label: "Year" },
            { key: "version", label: "Version" },
            { key: "status", label: "Status" },
          ]}
          onReload={onReload}
        />
      </MentionsProvider>
    </Spin>
  );
};

export default CosAdminSources;
