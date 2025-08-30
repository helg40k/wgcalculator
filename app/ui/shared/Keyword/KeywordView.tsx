import React from "react";

import { Keyword } from "@/app/lib/definitions";

interface KeywordViewProps {
  entity: Keyword;
  field: keyof Keyword | string;
  value: string | number;
}

const KeywordView = ({ entity, field, value }: KeywordViewProps) => {
  return value;
};

const KeywordViewPrewrap = ({ entity, field, value }: KeywordViewProps) => {
  return <div className="whitespace-pre-wrap">{value}</div>;
};

// Create a typed component with Prewrap property
interface KeywordViewComponent {
  (props: KeywordViewProps): React.ReactElement;
  Prewrap: (props: KeywordViewProps) => React.ReactElement;
}

// Attach Prewrap as a property to KeywordView
const KeywordViewWithPrewrap = KeywordView as unknown as KeywordViewComponent;
KeywordViewWithPrewrap.Prewrap = KeywordViewPrewrap;

export default KeywordViewWithPrewrap;
