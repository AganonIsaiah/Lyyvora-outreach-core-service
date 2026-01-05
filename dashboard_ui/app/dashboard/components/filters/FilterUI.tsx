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
  const [tempSelected, setTempSelected] = useState<string[]>(selected);

  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setIsOpen(false);
        setTempSelected(selected);
        setSearch("");
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [selected]);

  useEffect(() => {
    if (isOpen) {
      setTempSelected(selected);
    }
  }, [isOpen, selected]);

  useEffect(() => {
    setFilteredValues(
      values.filter((v) => v.toLowerCase().includes(search.toLowerCase()))
    );
  }, [search, values]);

  const toggleTempSelect = (value: string) => {
    setTempSelected((prev) =>
      prev.includes(value) ? prev.filter((v) => v !== value) : [...prev, value]
    );
  };

  const handleTempSort = (value: string) => {
    setTempSelected(value === "None" ? [] : [value]);
  };

  const applyFilters = () => {
    tempSelected.forEach(onChange);
    setIsOpen(false);
    setSearch("");
  };

  const closeUI = () => {
    setTempSelected(selected);
    setIsOpen(false);
    setSearch("");
  };

  const sortValue = selected[0];

  const buttonLabel =
    type === "sort"
      ? sortValue ?? "Sort by..."
      : selected.length
      ? `${selected.length} selected`
      : `Select ${label.toLowerCase()}...`;

  return (
    <div ref={ref} className="relative">
      <p className="text-xs font-semibold mb-1">{label}</p>

      <button
        className="cursor-pointer text-sm w-33 flex justify-between items-center bg-white border border-gray-200 rounded px-2 py-1 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200"
        onClick={() => setIsOpen((v) => !v)}
      >
        <span className="text-gray-400 truncate text-xs font-semibold">{buttonLabel}</span>
        {isOpen ? (
          <ExpandLessIcon fontSize="small" />
        ) : (
          <ExpandMoreIcon fontSize="small" />
        )}
      </button>

      {isOpen && (
        <div className="absolute z-20 mt-2 w-33 bg-white border border-gray-300 rounded-lg shadow">
          <div className="rounded-t-lg text-xs! font-semibold text-white flex items-center justify-between py-1.5 px-1 border-b border-gray-500">
            <button
              onClick={applyFilters}
              className="w-9 bg-blue-500 p-0.5! rounded-full cursor-pointer hover:bg-blue-600 transition-all duration-200"
            >
              OK
            </button>
            <button
              onClick={closeUI}
              className="w-12 bg-blue-500 p-0.5! rounded-full cursor-pointer hover:bg-blue-600 transition-all duration-200"
            >
              Close
            </button>
          </div>

          {type === "select" && (
            <input
              className="w-full px-2 py-1 border-b border-gray-500 focus:outline-none text-sm"
              placeholder="Search..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          )}

          <ul className="max-h-40 overflow-auto">
            {filteredValues.length > 0 ? (
              filteredValues.map((v) => {
                const isSelected = tempSelected.includes(v);

                return (
                  <li
                    key={v}
                    onClick={() =>
                      type === "sort" ? handleTempSort(v) : toggleTempSelect(v)
                    }
                    className={`
                      border-b border-gray-300
                      px-3 py-1 cursor-pointer flex items-center justify-between
                      hover:bg-gray-100
                      ${
                        isSelected
                          ? "bg-blue-100 text-blue-700 font-medium"
                          : ""
                      }
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
