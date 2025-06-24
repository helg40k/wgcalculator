import { Source } from "@/app/lib/definitions";

const SourceEdit = ({ entity }: { entity: Source }) => {
  return (
    <div>
      <div>Edit Source: {entity._id}</div>
      <div>{entity.name}</div>
      <div>{entity.authors}</div>
    </div>
  );
};

export default SourceEdit;
