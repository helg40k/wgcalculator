import { Button, Col, Row } from "antd";

import { Source } from "@/app/lib/definitions";

const SourceView = ({ entity }: { entity: Source }) => {
  return (
    <Row>
      <Col>IMAGE</Col>
      <Col>
        <div>View Source: {entity._id}</div>
        <div>{entity.year}</div>
        <div>{entity.name}</div>
        <div>{entity.version}</div>
        <div>{entity.authors}</div>
        <div>{entity.description}</div>
        <div>{entity.type}</div>
        <div>{entity.url}</div>
      </Col>
    </Row>
  );
};

export default SourceView;
