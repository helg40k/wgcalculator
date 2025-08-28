import { Dispatch, SetStateAction } from "react";
import { SearchOutlined } from "@ant-design/icons";
import { Input, theme } from "antd";

interface FilterItemsProps<T> {
  filterableFields: (keyof T)[];
  filterText: string;
  setFilterText: Dispatch<SetStateAction<string>>;
  placeholder?: string;
  style?: React.CSSProperties;
  disabled?: boolean;
}

const FilterItems = <T,>({
  filterableFields,
  filterText,
  setFilterText,
  placeholder,
  style = { width: 200 },
  disabled = false,
}: FilterItemsProps<T>) => {
  const {
    token: { colorTextSecondary },
  } = theme.useToken();

  if (filterableFields.length === 0) {
    return null;
  }

  const defaultPlaceholder = placeholder || "Filter items...";

  return (
    <Input
      prefix={<SearchOutlined style={{ color: colorTextSecondary }} />}
      placeholder={defaultPlaceholder}
      value={filterText}
      onChange={(e) => setFilterText(e.target.value)}
      style={style}
      allowClear
      disabled={disabled}
    />
  );
};

export default FilterItems;
