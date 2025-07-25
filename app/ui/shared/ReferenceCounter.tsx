import { useMemo } from "react";
import { theme, Tooltip } from "antd";

import { References } from "@/app/lib/definitions";

interface ReferenceCounterProps {
  references: References | null | undefined;
}

const ReferenceCounter = ({ references }: ReferenceCounterProps) => {
  const {
    token: { colorText, colorTextSecondary },
  } = theme.useToken();

  const refNumber = useMemo(() => {
    return !references ? 0 : Object.keys(references).length;
  }, [references]);

  const refMessage = useMemo(() => {
    return 1 === refNumber ? "1 reference" : `${refNumber} references`;
  }, [refNumber]);

  return (
    <div
      className="p-0.5 pl-1 text-nowrap"
      style={{ color: colorTextSecondary }}
    >
      <Tooltip
        title={<span style={{ color: colorText }}>Found {refMessage}</span>}
        color="white"
        mouseEnterDelay={0.5}
      >
        {refMessage}
      </Tooltip>
    </div>
  );
};

export default ReferenceCounter;
