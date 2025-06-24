import { Source } from "@/app/lib/definitions";

const SourceView = ({ entity }: { entity: Source }) => {
  return (
    <div>
      <div>View Source: {entity._id}</div>
      <div>{entity.name}</div>
      <div>{entity.authors}</div>
    </div>
  );
};

export default SourceView;
