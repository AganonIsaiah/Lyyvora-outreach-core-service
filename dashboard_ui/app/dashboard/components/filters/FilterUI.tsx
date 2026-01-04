"use client";

import { useEffect, useRef, useState } from "react";

import ExpandLessIcon from "@mui/icons-material/ExpandLess";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import ArrowUpwardIcon from "@mui/icons-material/ArrowUpward";
import ArrowDownwardIcon from "@mui/icons-material/ArrowDownward";

import { FilterType } from "@/lib/types";

interface FilterUIProps {
  label: string;
  values: string[];
  selected: string[];
  onChange: (value: string) => void;
  type: FilterType;
}

export default function FilterUI({
  label,
  values,
  selected,
  onChange,
  type,
}: FilterUIProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [filteredValues, setFilteredValues] = useState(values);

  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setIsOpen(false);
        setSearch("");
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    setFilteredValues(
      values.filter((v) => v.toLowerCase().includes(search.toLowerCase()))
    );
  }, [search, values]);

  const sortValue = selected[0];

  const handleSortClick = (value: string) => {
    if (value === "None") {
      onChange("None");
      return;
    }

    if (sortValue === value) {
      onChange("None");
    } else {
      onChange(value);
    }
  };

  const buttonLabel =
    type === "sort"
      ? sortValue ?? "Sort by..."
      : selected.length
      ? `${selected.length} selected`
      : `Select ${label.toLowerCase()}...`;

  return (
    <div ref={ref} className="relative">
      <p className="text-sm">{label}</p>

      <button
        className="cursor-pointer text-sm w-50 flex justify-between items-center bg-white border border-gray-200 rounded px-2 py-1"
        onClick={() => setIsOpen((v) => !v)}
      >
        <span className="text-gray-500 truncate">{buttonLabel}</span>
        {isOpen ? (
          <ExpandLessIcon fontSize="small" />
        ) : (
          <ExpandMoreIcon fontSize="small" />
        )}
      </button>

      {isOpen && (
        <div className="absolute z-20 mt-3 w-50 bg-white border border-gray-300 rounded shadow">
          {type === "select" && (
            <input
              className="w-full px-2 py-1 border-b focus:outline-none"
              placeholder="Search..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          )}

          <ul className="max-h-40 overflow-auto">
            {filteredValues.length > 0 ? (
              filteredValues.map((v) => {
                const isSelected =
                  type === "sort" ? sortValue === v : selected.includes(v);

                return (
                  <li
                    key={v}
                    onClick={() =>
                      type === "sort" ? handleSortClick(v) : onChange(v)
                    }
                    className={`px-3 py-1 cursor-pointer flex items-center justify-between
                              hover:bg-gray-100
                              ${isSelected ? "bg-blue-100 text-blue-700 font-medium" : ""}
                            `}
                  >
                    <span className="flex items-center gap-2">
                      {type === "select" && (
                        <input type="checkbox" readOnly checked={isSelected} />
                      )}
                      {v}
                    </span>

                    {type === "sort" && v === "Asc" && (
                      <ArrowUpwardIcon
                        fontSize="small"
                        className="text-gray-400"
                      />
                    )}

                    {type === "sort" && v === "Desc" && (
                      <ArrowDownwardIcon
                        fontSize="small"
                        className="text-gray-400"
                      />
                    )}
                  </li>
                );
              })
            ) : (
              <li className="px-3 py-2 text-gray-400 text-center">
                No results found
              </li>
            )}
          </ul>

        </div>
      )}
    </div>
  );
}
