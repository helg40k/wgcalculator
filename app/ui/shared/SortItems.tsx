import { Dispatch, SetStateAction } from "react";
import { Select } from "antd";

export interface SortableField<T> {
  key: keyof T;
  label: string;
}

export interface SortSelection<T> {
  field: keyof T;
  direction: "asc" | "desc";
}

interface SortItemsProps<T> {
  sortableFields: SortableField<T>[];
  sortSelection: SortSelection<T>[];
  setSortSelection: Dispatch<SetStateAction<SortSelection<T>[]>>;
  placeholder?: string;
  style?: React.CSSProperties;
  disabled?: boolean;
}

const SortItems = <T,>({
  sortableFields,
  sortSelection,
  setSortSelection,
  placeholder = "Sort by...",
  style = { maxWidth: 350, minWidth: 150 },
  disabled = false,
}: SortItemsProps<T>) => {
  // Handle sort field toggle: none -> asc -> desc -> none
  const handleSortToggle = (fieldKey: keyof T) => {
    setSortSelection((prev) => {
      const existingIndex = prev.findIndex((s) => s.field === fieldKey);

      if (existingIndex === -1) {
        // Field not selected, add as asc
        return [...prev, { direction: "asc" as const, field: fieldKey }];
      } else {
        const existing = prev[existingIndex];
        if (existing.direction === "asc") {
          // Change to desc
          const updated = [...prev];
          updated[existingIndex] = {
            direction: "desc" as const,
            field: fieldKey,
          };
          return updated;
        } else {
          // Remove field (desc -> none)
          return prev.filter((s) => s.field !== fieldKey);
        }
      }
    });
  };

  // Get display label for sort field
  const getSortFieldDisplay = (fieldKey: keyof T): string => {
    const sortItem = sortSelection.find((s) => s.field === fieldKey);
    const fieldConfig = sortableFields.find((f) => f.key === fieldKey);
    const baseLabel = fieldConfig?.label || String(fieldKey);

    if (!sortItem) return baseLabel;
    return `${baseLabel} ${sortItem.direction === "asc" ? "↑" : "↓"}`;
  };

  if (sortableFields.length === 0) {
    return null;
  }

  return (
    <Select
      mode="multiple"
      placeholder={placeholder}
      style={style}
      disabled={disabled}
      value={sortSelection.map((s) => String(s.field))}
      allowClear={false}
      removeIcon={null}
      onChange={(values, option) => {
        // Ignore onChange to prevent default deselect behavior
        // All logic handled in onSelect
      }}
      onSelect={(value: string) => {
        handleSortToggle(value as keyof T);
      }}
      onDeselect={(value: string) => {
        // This should never be called now since removeIcon is null
        // But keep it just in case
        handleSortToggle(value as keyof T);
      }}
      options={sortableFields.map((field) => ({
        label: getSortFieldDisplay(field.key),
        value: String(field.key),
      }))}
    />
  );
};

export default SortItems;
