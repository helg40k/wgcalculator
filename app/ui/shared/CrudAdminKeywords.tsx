import { useCallback, useContext, useEffect, useMemo, useState } from "react";
import { Spin } from "antd";

import { useCollectionInvalidation } from "@/app/lib/collectionInvalidation";
import { GameSystemContext } from "@/app/lib/contexts/GameSystemContext";
import { MentionsProvider } from "@/app/lib/contexts/MentionsContext";
import { CollectionRegistry, Keyword } from "@/app/lib/definitions";
import useEntities from "@/app/lib/hooks/useEntities";
import { getPlayableScopeFilters } from "@/app/lib/playableScope";
import CrudMultiLineView from "@/app/ui/CrudMultiLineView";
import ReferenceCounter from "@/app/ui/shared/CrudReferenceCounter";
import CrudTableCell from "@/app/ui/shared/CrudTableCell";

const collectionName = CollectionRegistry.Keyword;

const CrudAdminKeywords = () => {
  const [gameSystem, selectedEdition] = useContext(GameSystemContext);
  const { deleteEntity, loadEntities, loading, saveEntity } = useEntities();
  const [keywords, setKeywords] = useState<Keyword[]>([]);
  const filters = useMemo(
    () => getPlayableScopeFilters(gameSystem, selectedEdition),
    [gameSystem, selectedEdition],
  );

  const onReload = useCallback(() => {
    if (!filters) {
      setKeywords([]);
      return;
    }

    loadEntities<Keyword>(collectionName, {
      filters,
      sort: ["name", "asc"],
    }).then((value) => setKeywords(value));
  }, [filters, loadEntities]);

  useEffect(() => {
    onReload();
  }, [onReload]);

  const onSave = async (keyword: Keyword): Promise<Keyword | null> => {
    if (
      keywords.some(
        (k) => k.name === keyword.name.trim() && k._id !== keyword._id,
      )
    ) {
      throw new Error("Name must be unique!");
    }
    return await saveEntity(collectionName, keyword);
  };

  const onDelete = async (id: string): Promise<void> => {
    await deleteEntity(collectionName, id);
  };

  useCollectionInvalidation(collectionName, onReload);

  const tableData = [
    {
      edit: CrudTableCell.Edit,
      field: "name",
      header: "Name",
      sortable: true,
      validationRules: [
        { message: "Name is required", required: true },
        { message: "Name is unique", unique: true },
      ],
      view: CrudTableCell.View,
    },
    {
      edit: CrudTableCell.Edit,
      field: "description",
      header: "Description",
      sortable: true,
      view: CrudTableCell.View.Area,
    },
  ];

  return (
    <Spin spinning={loading} size="large">
      <MentionsProvider collectionName={collectionName}>
        <CrudMultiLineView.Table
          collectionName={collectionName}
          singleName={"keyword"}
          pluralNames={"keywords"}
          singleToolbarUntil={10}
          entities={keywords}
          rowFooter={(record: Keyword, editMode: boolean) => (
            <ReferenceCounter
              entity={record}
              collectionName={collectionName}
              viewOnly={editMode}
            />
          )}
          setEntities={setKeywords}
          sortableStatus={true}
          table={tableData}
          onSave={onSave}
          onDelete={onDelete}
          filterableFields={["name", "description", "status"]}
          onReload={onReload}
        />
      </MentionsProvider>
    </Spin>
  );
};

export default CrudAdminKeywords;
