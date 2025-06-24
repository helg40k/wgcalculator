import { Entity } from "@/app/lib/definitions";

interface MultiLineViewProps<T extends Entity = Entity> {
  entities: T[];
  edit?: React.ComponentType<{ entity: T }>;
  view: React.ComponentType<{ entity: T }>;
}

const MultiLineView = <T extends Entity>({
  entities,
  edit: EditComponent,
  view: ViewComponent,
}: MultiLineViewProps<T>) => {
  return (
    <>
      {entities?.map((entity) => (
        <ViewComponent key={entity._id} entity={entity} />
      ))}
    </>
  );
};

export default MultiLineView;
