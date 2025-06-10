"use client";

import { cloneElement, ReactElement, useState } from "react";
import clsx from "clsx";

import { lusitana } from "@/app/ui/fonts";

const RowSelector = ({
  rows,
  content,
  onSelected,
}: {
  rows: {
    key: string;
    selected: boolean;
  }[];
  content: ReactElement;
  onSelected: ({ key: string, selected: boolean }) => void;
}) => {
  const [selected, setSelected] = useState(rows.find((p) => p.selected)?.key);
  const isSelected = !!selected;

  const handleClick = (row: { key: string; selected: boolean }) => {
    row.selected = true;
    rows.filter((r) => r.key !== row.key).forEach((r) => (r.selected = false));
    setSelected(isSelected ? undefined : row.key);
  };

  return (
    <>
      {rows
        .filter((row) => (isSelected ? row.selected : true))
        .map((row) => {
          return (
            <div
              key={row.key}
              onClick={() => {
                if (!selected) {
                  onSelected(row);
                }
                handleClick(row);
              }}
              className={clsx(
                `${lusitana.className} 
              truncate rounded-xl px-4 py-3 text-xl hover:bg-sky-100 active:bg-sky-300`,
                {
                  "bg-white ": !row.selected || selected,
                },
                {
                  "bg-sky-200": row.selected && !selected,
                },
              )}
            >
              {/* uncomment me and fix types */}
              {/*{ cloneElement(content, {data: row}) }*/}
            </div>
          );
        })}
    </>
  );
};

export default RowSelector;
